import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  readLimitedJson,
  InvalidRequestBody,
} from "../src/lib/http/limited-json.ts";

test("JSON reader accepts a bounded request and rejects invalid payloads", async () => {
  const request = (body) =>
    new Request("http://localhost/", { method: "POST", body });
  assert.deepEqual(await readLimitedJson(request('{"seconds":12}'), 512), {
    seconds: 12,
  });
  for (const body of ["{", "x".repeat(513), '"' + "ә".repeat(260) + '"'])
    await assert.rejects(
      () => readLimitedJson(request(body), 512),
      InvalidRequestBody,
    );
});
test("oversized chunked requests are cancelled before the entire body is buffered", async () => {
  let cancelled = false;
  const stream = new ReadableStream({
    pull(controller) {
      controller.enqueue(new Uint8Array(256));
    },
    cancel() {
      cancelled = true;
    },
  });
  const request = new Request("http://localhost/", {
    method: "POST",
    body: stream,
    duplex: "half",
  });
  await assert.rejects(() => readLimitedJson(request, 512), InvalidRequestBody);
  assert.equal(cancelled, true);
});
test("declared excessive Content-Length is rejected without reading", async () => {
  const request = new Request("http://localhost/", {
    method: "POST",
    body: "{}",
    headers: { "content-length": "1000000" },
  });
  await assert.rejects(() => readLimitedJson(request, 512), InvalidRequestBody);
  assert.equal(request.bodyUsed, false);
});
test("Next configuration rejects public service credentials without printing their values", () => {
  const jwt = `e30.${Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url")}.signature`;
  for (const key of ["sb_secret_TEST_ONLY_DO_NOT_USE", jwt]) {
    const result = spawnSync(
      process.execPath,
      ["--experimental-strip-types", "next.config.ts"],
      {
        cwd: new URL("..", import.meta.url),
        env: { ...process.env, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key },
        encoding: "utf8",
      },
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Remove private credential/);
    assert.equal(result.stderr.includes(key), false);
  }
});
