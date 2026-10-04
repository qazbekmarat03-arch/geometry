import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createVideoPlayback } from "../src/lib/video/provider.ts";
import { authorizeLessonVideo } from "../src/lib/video/authorize.ts";
const lessonId = "00000000-0000-4000-8000-000000000030";
const user = {
  id: "user-1",
  email: "student@example.test",
  email_confirmed_at: "2026-01-01",
};
const now = 1800000000;
test("Bunny uses documented SHA256 signature and does not expose its secret", async () => {
  const key = "server-only-test-secret";
  const result = await createVideoPlayback(
    `bunny://${lessonId}`,
    {},
    null,
    {
      VIDEO_PROVIDER: "bunny",
      BUNNY_STREAM_LIBRARY_ID: "123",
      BUNNY_STREAM_TOKEN_KEY: key,
    },
    now,
  );
  const url = new URL(result.url);
  assert.equal(url.origin, "https://player.mediadelivery.net");
  assert.equal(url.pathname, `/embed/123/${lessonId}`);
  assert.equal(
    url.searchParams.get("token"),
    createHash("sha256")
      .update(key + lessonId + (now + 300))
      .digest("hex"),
  );
  assert.equal(result.expiresAt, now + 300);
  assert.equal(JSON.stringify(result).includes(key), false);
});
test("private storage signing is scoped to the bucket, path, and enrollment expiry", async () => {
  const supabase = {
    storage: {
      from(bucket) {
        assert.equal(bucket, "course-media");
        return {
          async createSignedUrl(path, ttl) {
            assert.equal(path, "course/lesson/video.mp4");
            assert.equal(ttl, 60);
            return {
              data: {
                signedUrl: "https://project.example/signed?token=short-lived",
              },
              error: null,
            };
          },
        };
      },
    },
  };
  const result = await createVideoPlayback(
    "storage://course-media/course/lesson/video.mp4",
    () => supabase,
    new Date((now + 60) * 1000).toISOString(),
    {},
    now,
  );
  assert.equal(result.expiresAt, now + 60);
  assert.equal(result.kind, "file");
});
test("reject public URLs, path traversal, missing credentials, unsupported providers and unsafe TTL", async () => {
  for (const [reference, env] of [
    ["https://example.com/public.mp4", {}],
    ["https://example.com/signed.mp4?token=x", {}],
    ["storage://course-media/../private", {}],
    ["storage://course-media/%2e%2e/private", {}],
    [`bunny://${lessonId}`, { VIDEO_PROVIDER: "bunny" }],
    ["vimeo://123", { VIDEO_PROVIDER: "vimeo" }],
    [
      "storage://course-media/video.mp4",
      { VIDEO_PLAYBACK_TTL_SECONDS: "999999" },
    ],
    ["storage://course-media/video.mp4", { VIDEO_PROVIDER: "disabled" }],
  ])
    await assert.rejects(() =>
      createVideoPlayback(reference, {}, null, env, now),
    );
  await assert.rejects(() =>
    createVideoPlayback(
      "storage://course-media/video.mp4",
      {},
      new Date(now * 1000).toISOString(),
      {},
      now,
    ),
  );
});
function client({
  identity = user,
  active = true,
  profileEmail = user.email,
  lessonExists = true,
  grantExists = true,
  unlocked = true,
  errorTable = null,
} = {}) {
  return {
    rpc: async (name) => {
      assert.equal(name, "can_access_lesson");
      return { data: unlocked, error: null };
    },
    auth: { getUser: async () => ({ data: { user: identity }, error: null }) },
    from(table) {
      const filters = {};
      let expiration = false;
      const query = {
        select() {
          return query;
        },
        eq(key, value) {
          filters[key] = value;
          return query;
        },
        or(value) {
          assert.match(value, /expires_at\.gt\./);
          expiration = true;
          return query;
        },
        async maybeSingle() {
          if (table === "profiles") {
            assert.equal(filters.id, user.id);
            return {
              data: { email: profileEmail, is_active: active },
              error: errorTable === table ? {} : null,
            };
          }
          if (table === "lessons") {
            assert.equal(filters.id, lessonId);
            assert.equal(filters.is_published, true);
            assert.equal(filters["modules.courses.is_published"], true);
            return {
              data: lessonExists
                ? {
                    video_url: `bunny://${lessonId}`,
                    modules: { course_id: "database-course" },
                  }
                : null,
              error: errorTable === table ? {} : null,
            };
          }
          assert.equal(table, "course_access");
          assert.equal(filters.user_id, user.id);
          assert.equal(filters.course_id, "database-course");
          assert.equal(filters.is_active, true);
          assert.ok(expiration);
          return {
            data: grantExists ? { expires_at: null } : null,
            error: errorTable === table ? {} : null,
          };
        },
      };
      return query;
    },
  };
}
for (const [name, options, status] of [
  ["anonymous", { identity: null }, 401],
  ["sequentially locked lesson", { unlocked: false }, 403],
  ["inactive account", { active: false }, 403],
  ["email mismatch", { profileEmail: "different@example.test" }, 403],
  ["hidden or ungranted lesson", { lessonExists: false }, 404],
  ["missing/expired/inactive grant", { grantExists: false }, 403],
  ["database error", { errorTable: "course_access" }, 503],
])
  test(`API authorization denies ${name}`, async () => {
    await assert.rejects(
      () => authorizeLessonVideo(client(options), lessonId),
      (error) => error.status === status,
    );
  });
test("authorization derives course from database and returns reference only after grant check", async () => {
  assert.deepEqual(await authorizeLessonVideo(client(), lessonId), {
    reference: `bunny://${lessonId}`,
    grantExpiresAt: null,
  });
  await assert.rejects(
    () => authorizeLessonVideo(client(), "../admin"),
    (error) => error.status === 400,
  );
});
