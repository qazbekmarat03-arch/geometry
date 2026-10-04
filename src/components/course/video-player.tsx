"use client";
import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle, RefreshCw, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Playback } from "@/lib/video/types";
import {
  formatPlaybackTime,
  playbackSeconds,
  SAVE_INTERVAL_MS,
} from "@/lib/video/playback-position";

type EmbedPlayer = {
  on: (event: string, callback: (data?: unknown) => void) => void;
  off: (event: string) => void;
  setCurrentTime: (seconds: number) => void;
};
declare global {
  interface Window {
    playerjs?: { Player: new (frame: HTMLIFrameElement) => EmbedPlayer };
  }
}

export function VideoPlayer({
  lessonId,
  position,
}: {
  lessonId: string;
  position: number;
}) {
  const [playback, setPlayback] = useState<Playback | null>(null);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  const [offerResume, setOfferResume] = useState(position > 0);
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState(false);
  const [savedPosition] = useState(playbackSeconds(position) ?? 0);
  const latest = useRef(savedPosition);
  const touched = useRef(false);
  const lastSent = useRef<number | null>(savedPosition);
  const lastObserved = useRef(0);
  const duration = useRef(Infinity);
  const video = useRef<HTMLVideoElement>(null);
  const iframe = useRef<HTMLIFrameElement>(null);
  const embed = useRef<EmbedPlayer | null>(null);

  const persist = useCallback(() => {
    if (!touched.current) return;
    const seconds = playbackSeconds(latest.current);
    if (seconds === null || seconds === lastSent.current) return;
    lastSent.current = seconds;
    const observed = Math.max(Date.now(), lastObserved.current + 1);
    lastObserved.current = observed;
    // All requests are tiny keepalive requests, including an already in-flight
    // periodic save when the user navigates away. SQL ignores older snapshots.
    void fetch(`/api/lessons/${encodeURIComponent(lessonId)}/progress`, {
      method: "POST",
      credentials: "same-origin",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seconds,
        observedAt: new Date(observed).toISOString(),
      }),
    })
      .then((response) => {
        if (!response.ok) throw new Error("save");
        setSaveError(false);
      })
      .catch(() => {
        if (lastObserved.current === observed) lastSent.current = null;
        setSaveError(true);
      });
  }, [lessonId]);

  useEffect(() => {
    const timer = window.setInterval(persist, SAVE_INTERVAL_MS);
    const hidden = () => {
      if (document.visibilityState === "hidden") persist();
    };
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("pagehide", persist);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("pagehide", persist);
      persist();
    };
  }, [persist]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/lessons/${encodeURIComponent(lessonId)}/video`, {
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(
            response.status === 401
              ? "Аккаунтыңызға қайта кіріңіз."
              : response.status === 403 || response.status === 404
                ? "Бұл сабаққа рұқсат жоқ."
                : "Видео әзірге қолжетімсіз.",
          );
        const data = (await response.json()) as Playback;
        if (
          !data.url ||
          !["file", "embed"].includes(data.kind) ||
          !Number.isFinite(data.expiresAt) ||
          data.expiresAt <= Date.now() / 1000
        )
          throw new Error("Видео сілтемесі жарамсыз.");
        if (!controller.signal.aborted) {
          setPlayback(data);
          setError("");
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setPlayback(null);
          setError(err instanceof Error ? err.message : "Видео жүктелмеді.");
        }
      });
    return () => controller.abort();
  }, [lessonId, attempt]);

  function detachEmbed() {
    if (embed.current) {
      for (const event of ["ready", "play", "timeupdate", "pause", "ended"])
        embed.current.off(event);
      embed.current = null;
    }
  }
  useEffect(
    () => () => {
      if (embed.current) {
        for (const event of ["ready", "play", "timeupdate", "pause", "ended"])
          embed.current.off(event);
        embed.current = null;
      }
    },
    [],
  );
  function connectEmbed() {
    detachEmbed();
    if (!iframe.current || !window.playerjs) return;
    const player = new window.playerjs.Player(iframe.current);
    embed.current = player;
    player.on("ready", () => {
      setReady(true);
      if (touched.current) player.setCurrentTime(latest.current);
    });
    player.on("play", () => {
      touched.current = true;
      setOfferResume(false);
    });
    player.on("timeupdate", (event) => {
      try {
        const data = typeof event === "string" ? JSON.parse(event) : event;
        if (!data || typeof data !== "object") return;
        const timing = data as { seconds?: unknown; duration?: unknown };
        if (
          typeof timing.duration === "number" &&
          Number.isFinite(timing.duration) &&
          timing.duration > 0
        )
          duration.current = timing.duration;
        if (
          touched.current &&
          typeof timing.seconds === "number" &&
          playbackSeconds(timing.seconds) !== null
        )
          latest.current = timing.seconds;
      } catch {
        /* Ignore malformed provider events. */
      }
    });
    player.on("pause", persist);
    player.on("ended", persist);
  }
  function chooseResume(resume: boolean) {
    const target = resume
      ? Math.min(savedPosition, Math.max(0, duration.current - 1))
      : 0;
    latest.current = target;
    touched.current = true;
    if (video.current) video.current.currentTime = target;
    embed.current?.setCurrentTime(target);
    setOfferResume(false);
    persist();
  }
  function reload() {
    persist();
    detachEmbed();
    setPlayback(null);
    setReady(false);
    setError("");
    setAttempt((value) => value + 1);
  }
  return (
    <div>
      {offerResume && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-brand-light p-4">
          <p className="text-sm text-brand">
            Соңғы тоқтаған жеріңіз:{" "}
            <strong>{formatPlaybackTime(savedPosition)}</strong>
          </p>
          <div className="flex flex-wrap gap-2">
            <Button disabled={!ready} onClick={() => chooseResume(true)}>
              {formatPlaybackTime(savedPosition)} жерінен жалғастыру
            </Button>
            <Button
              variant="secondary"
              disabled={!ready}
              onClick={() => chooseResume(false)}
            >
              Басынан бастау
            </Button>
          </div>
        </div>
      )}
      {playback?.provider === "bunny" && (
        <Script
          src="https://assets.mediadelivery.net/playerjs/player-0.1.0.min.js"
          strategy="afterInteractive"
          onReady={() => setSdkReady(true)}
          onError={() => setSdkError(true)}
        />
      )}
      <div className="lesson-frame overflow-hidden rounded-[24px] bg-[#101d17]">
        {error ? (
          <div
            role="alert"
            className="flex aspect-video flex-col items-center justify-center gap-3 p-6 text-center text-white/80"
          >
            <VideoOff size={30} />
            <p className="text-sm">{error}</p>
            <Button variant="secondary" onClick={reload}>
              Қайта жүктеу
            </Button>
          </div>
        ) : !playback ||
          (playback.provider === "bunny" && !sdkReady && !sdkError) ? (
          <div
            role="status"
            className="flex aspect-video items-center justify-center gap-3 text-sm text-white/80"
          >
            <LoaderCircle size={22} className="animate-spin" />
            Видео жүктелуде…
          </div>
        ) : playback.kind === "embed" ? (
          <iframe
            ref={iframe}
            src={playback.url}
            onLoad={connectEmbed}
            title="Сабақ видеосы"
            className="aspect-video w-full border-0"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin"
          />
        ) : (
          <video
            ref={video}
            key={playback.url}
            controls
            playsInline
            preload="metadata"
            className="aspect-video w-full"
            aria-label="Сабақ видеосы"
            src={playback.url}
            onLoadedMetadata={(event) => {
              const el = event.currentTarget;
              duration.current = Number.isFinite(el.duration)
                ? el.duration
                : Infinity;
              if (touched.current)
                el.currentTime = Math.min(
                  latest.current,
                  Math.max(0, duration.current - 1),
                );
              setReady(true);
            }}
            onPlay={() => {
              touched.current = true;
              setOfferResume(false);
            }}
            onTimeUpdate={(event) => {
              if (touched.current)
                latest.current = event.currentTarget.currentTime;
            }}
            onPause={(event) => {
              if (touched.current)
                latest.current = event.currentTarget.currentTime;
              persist();
            }}
            onEnded={(event) => {
              latest.current = event.currentTarget.currentTime;
              persist();
            }}
            onError={() =>
              setError("Видео жүктелмеді немесе сілтеменің мерзімі аяқталды.")
            }
          />
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted">
          {sdkError
            ? "Видео орнын сақтау құралы жүктелмеді. Бетті жаңартып көріңіз."
            : "Қаралған орын әр 20 секунд сайын және үзілісте сақталады."}
        </p>
        <Button
          variant="ghost"
          className="min-h-9 px-2 py-1 text-xs"
          onClick={reload}
        >
          <RefreshCw size={13} />
          Видеоны жаңарту
        </Button>
      </div>
      {saveError && (
        <div
          role="alert"
          className="mt-3 flex flex-wrap items-center gap-2 text-sm text-red-700"
        >
          <p>Видео орны сақталмады. Байланысты тексеріңіз.</p>
          <Button variant="ghost" onClick={persist}>
            Қайта сақтау
          </Button>
        </div>
      )}
    </div>
  );
}
