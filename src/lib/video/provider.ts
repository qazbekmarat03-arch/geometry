import "server-only";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Playback } from "./types";
import { youtubeId } from "./youtube.ts";

export class VideoUnavailable extends Error {}
type ProviderContext = {
  reference: string;
  expiresAt: number;
  ttl: number;
  signingClient: () => SupabaseClient;
  env: NodeJS.ProcessEnv;
};
// Future Vimeo integration implements this contract with provider-enforced expiry.
export type VideoProvider = {
  createPlayback(context: ProviderContext): Promise<Playback>;
};

const supabaseProvider: VideoProvider = {
  async createPlayback({ reference, expiresAt, ttl, signingClient }) {
    const prefix = "storage://course-media/";
    if (!reference.startsWith(prefix)) throw new VideoUnavailable();
    const path = reference.slice(prefix.length);
    if (
      !path ||
      path.includes("\\") ||
      path.includes("%") ||
      path.split("/").some((p) => !p || p === "." || p === "..")
    )
      throw new VideoUnavailable();
    const { data, error } = await signingClient()
      .storage.from("course-media")
      .createSignedUrl(path, ttl);
    if (error || !data?.signedUrl) throw new VideoUnavailable();
    return {
      provider: "supabase",
      kind: "file",
      url: data.signedUrl,
      expiresAt,
    };
  },
};
const bunnyProvider: VideoProvider = {
  async createPlayback({ reference, expiresAt, env }) {
    const videoId = reference.match(
      /^bunny:\/\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i,
    )?.[1];
    const libraryId = env.BUNNY_STREAM_LIBRARY_ID;
    const key = env.BUNNY_STREAM_TOKEN_KEY;
    if (!videoId || !libraryId || !/^[1-9]\d*$/.test(libraryId) || !key)
      throw new VideoUnavailable();
    // Bunny Embed View Token Authentication (not a CDN/upload API token).
    const token = createHash("sha256")
      .update(key + videoId + expiresAt)
      .digest("hex");
    const url = new URL(
      `https://player.mediadelivery.net/embed/${libraryId}/${videoId}`,
    );
    url.searchParams.set("token", token);
    url.searchParams.set("expires", String(expiresAt));
    url.searchParams.set("autoplay", "false");
    return { provider: "bunny", kind: "embed", url: url.href, expiresAt };
  },
};
const providers: Record<string, VideoProvider> = {
  supabase: supabaseProvider,
  bunny: bunnyProvider,
};

export async function createVideoPlayback(
  reference: string | null,
  signingClient: () => SupabaseClient,
  grantExpiresAt: string | null,
  env: NodeJS.ProcessEnv = process.env,
  now = Math.floor(Date.now() / 1000),
): Promise<Playback> {
  const youtube = reference?.startsWith("youtube://") ? youtubeId(reference) : null;
  const provider = providers[env.VIDEO_PROVIDER || "supabase"];
  const configuredTTL = Number(env.VIDEO_PLAYBACK_TTL_SECONDS || 300);
  if (
    !reference ||
    (!provider && !youtube) ||
    !Number.isInteger(configuredTTL) ||
    configuredTTL < 30 ||
    configuredTTL > 900
  )
    throw new VideoUnavailable();
  // Never issue a URL beyond the current enrollment's expiration.
  const expiresAt = Math.min(
    now + configuredTTL,
    grantExpiresAt ? Math.floor(Date.parse(grantExpiresAt) / 1000) : Infinity,
  );
  const ttl = expiresAt - now;
  if (!Number.isFinite(ttl) || ttl < 1) throw new VideoUnavailable();
  // expiresAt is the platform authorization window, NOT YouTube URL expiry.
  // YouTube links remain shareable outside this platform.
  if (youtube) return {
    provider: "youtube", kind: "embed",
    url: `https://www.youtube-nocookie.com/embed/${youtube}?enablejsapi=1&playsinline=1&rel=0`,
    expiresAt,
  };
  return provider.createPlayback({
    reference,
    expiresAt,
    ttl,
    signingClient,
    env,
  });
}
