import { test } from "node:test";
import assert from "node:assert/strict";
import { validId } from "../src/lib/course/media.ts";

test("UUID inputs reject malformed identifiers and parameter manipulation", () => {
  assert.equal(validId("00000000-0000-4000-8000-000000000001"), true);
  for (const value of [
    "../admin",
    "bad",
    [],
    null,
    undefined,
    "00000000-0000-4000-8000-000000000001?admin=true",
  ])
    assert.equal(validId(value), false);
});
