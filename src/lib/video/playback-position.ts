export const SAVE_INTERVAL_MS = 20_000;
export function playbackSeconds(value: number) {
  return Number.isFinite(value) && value >= 0
    ? Math.min(2147483646, Math.floor(value))
    : null;
}
export function formatPlaybackTime(value: number) {
  const seconds = playbackSeconds(value) ?? 0;
  const hours = Math.floor(seconds / 3600);
  return `${hours ? `${hours}:` : ""}${hours ? String(Math.floor(seconds / 60) % 60).padStart(2, "0") : Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
