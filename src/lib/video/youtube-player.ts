"use client";

type Player = {
  getCurrentTime(): number;
  getDuration(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  destroy(): void;
};
type SDK = { Player: new (frame: HTMLElement, options: {
  videoId: string; host: string; width: string; height: string;
  playerVars: { origin: string; playsinline: number; rel: number };
  events: { onReady(): void; onStateChange(event: { data: number }): void; onError(): void };
}) => Player };
declare global {
  interface Window { YT?: SDK; onYouTubeIframeAPIReady?: () => void }
}
let loading: Promise<SDK> | undefined;
export function loadYouTube(): Promise<SDK> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (loading) return loading;
  loading = new Promise<SDK>((resolve, reject) => {
    const script = document.createElement("script");
    const previous = window.onYouTubeIframeAPIReady;
    const timeout = window.setTimeout(() => reject(new Error("YouTube timeout")), 15000);
    window.onYouTubeIframeAPIReady = () => {
      window.clearTimeout(timeout);
      previous?.();
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error("YouTube unavailable"));
    };
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = () => { window.clearTimeout(timeout); reject(new Error("YouTube unavailable")); };
    document.head.appendChild(script);
  }).catch((error) => { loading = undefined; throw error; });
  return loading;
}
