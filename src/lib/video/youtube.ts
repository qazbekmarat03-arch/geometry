/** Strict allowlist; never embed an arbitrary admin-supplied URL. */
export function youtubeId(input: string): string | null {
  const value = input.trim();
  const valid = (id: string | null) => id && /^[\w-]{11}$/.test(id) ? id : null;
  if (value.startsWith("youtube://")) return valid(value.slice(10));
  if (/^[\w-]{11}$/.test(value)) return value;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
    if (url.hostname === "youtu.be") return valid(url.pathname.slice(1));
    if (!["youtube.com", "www.youtube.com", "m.youtube.com", "www.youtube-nocookie.com"].includes(url.hostname)) return null;
    if (url.pathname === "/watch") return valid(url.searchParams.get("v"));
    return valid(url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})$/)?.[1] ?? null);
  } catch { return null; }
}
