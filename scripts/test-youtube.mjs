import { test } from "node:test";
import assert from "node:assert/strict";
import { videoReference } from "../src/lib/admin/editor-validation.ts";
import { createVideoPlayback } from "../src/lib/video/provider.ts";
const id = "M7lc1UVf-VE";
test("YouTube URLs normalize without carrying query tokens into playback", () => {
  for (const input of [id, `https://youtu.be/${id}?si=token`, `https://www.youtube.com/watch?v=${id}&t=90`, `https://youtube.com/shorts/${id}`, `youtube://${id}`])
    assert.equal(videoReference(input), `youtube://${id}`);
  for (const input of [`https://youtube.com.evil.test/watch?v=${id}`, `https://evil.test/${id}`, `https://user:pass@youtube.com/watch?v=${id}`, "youtube://bad", "javascript:alert(1)"])
    assert.throws(() => videoReference(input));
});
test("YouTube uses no private credentials and rejects expired course grants", async () => {
  const noSigning = () => { throw Error("must not use signing credentials"); };
  const result = await createVideoPlayback(`youtube://${id}`, noSigning, null, {}, 1000);
  assert.equal(result.provider, "youtube");
  assert.equal(new URL(result.url).hostname, "www.youtube-nocookie.com");
  await assert.rejects(createVideoPlayback(`youtube://${id}`, noSigning, new Date(999000).toISOString(), {}, 1000));
});
