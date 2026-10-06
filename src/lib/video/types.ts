// Only this public DTO crosses the server/browser boundary. Never include keys.
export type Playback = {
  provider: "supabase" | "bunny" | "vimeo" | "youtube";
  kind: "file" | "embed";
  url: string;
  expiresAt: number; // Unix seconds
};
