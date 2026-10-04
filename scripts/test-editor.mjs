import { test } from "node:test";
import assert from "node:assert/strict";
import { videoReference } from "../src/lib/admin/editor-validation.ts";
test("editor accepts private references and normalizes a Bunny ID", () => {
  const id = "00000000-0000-4000-8000-000000000001";
  assert.equal(videoReference(id), `bunny://${id}`);
  assert.equal(
    videoReference(" storage://course-media/course/lesson.mp4 "),
    "storage://course-media/course/lesson.mp4",
  );
  assert.equal(videoReference("vimeo://123"), "vimeo://123");
  assert.equal(videoReference(""), null);
});
test("editor rejects public URLs, credentials, and unsafe storage paths", () => {
  for (const value of [
    "https://example.com/public.mp4",
    "https://example.com/video?token=secret",
    "storage://course-media/../video.mp4",
    "storage://course-media/a%2fb",
    "storage://course-media/a\\b",
    "storage://course-media//file",
    "bunny://not-an-id",
  ])
    assert.throws(() => videoReference(value));
});
