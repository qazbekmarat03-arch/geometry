import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatPlaybackTime,
  playbackSeconds,
  SAVE_INTERVAL_MS,
} from "../src/lib/video/playback-position.ts";
test("resume labels display seconds and hours accurately", () => {
  assert.equal(formatPlaybackTime(1123), "18:43");
  assert.equal(formatPlaybackTime(3605), "1:00:05");
  assert.equal(formatPlaybackTime(0), "0:00");
});
test("playback samples are bounded integers and saving is throttled", () => {
  assert.equal(playbackSeconds(1123.8), 1123);
  assert.equal(playbackSeconds(-1), null);
  assert.equal(playbackSeconds(NaN), null);
  assert.equal(playbackSeconds(Infinity), null);
  assert.equal(playbackSeconds(3e9), 2147483646);
  assert.ok(SAVE_INTERVAL_MS >= 15000 && SAVE_INTERVAL_MS <= 30000);
});
