import { test } from "node:test";
import assert from "node:assert/strict";
import { summarizeStudentLearning } from "../src/lib/admin/learning-progress-model.ts";
const courses = [
  { id: "a", title: "Geometry", is_published: true },
  { id: "b", title: "Other", is_published: true },
];
const lesson = (id, course = "a") => ({ id, modules: { course_id: course } });
const activity = (id, values = {}) => ({
  lesson_id: id,
  completed: false,
  video_progress: 0,
  updated_at: "2026-10-01T10:00:00Z",
  playback_saved_at: "-infinity",
  lessons: { title: id, modules: { course_id: "a" } },
  ...values,
});
test("published course completion uses 21/31 = 68 percent", () => {
  const lessons = Array.from({ length: 31 }, (_, i) => lesson(String(i)));
  const rows = lessons
    .slice(0, 21)
    .map((item) => activity(item.id, { completed: true }));
  rows.push(activity("draft", { completed: true }));
  const [result] = summarizeStudentLearning(courses, ["a"], lessons, rows);
  assert.equal(result.percent, 68);
  assert.equal(result.completed, 21);
  assert.equal(result.total, 31);
});
test("last viewing uses playback time rather than later manual completion", () => {
  const [result] = summarizeStudentLearning(
    courses,
    ["a"],
    [lesson("old"), lesson("new")],
    [
      activity("old", {
        completed: true,
        video_progress: 40,
        playback_saved_at: "2026-09-29T10:00:00Z",
        updated_at: "2026-10-01T12:00:00Z",
      }),
      activity("new", {
        video_progress: 1123,
        playback_saved_at: "2026-10-01T11:00:00Z",
        updated_at: "2026-10-01T11:00:00Z",
      }),
    ],
  );
  assert.equal(result.lastWatched.title, "new");
  assert.equal(result.lastActivity, "2026-10-01T12:00:00.000Z");
});
test("manual completion alone is activity but is not a video viewing", () => {
  const [result] = summarizeStudentLearning(
    courses,
    ["a"],
    [lesson("manual")],
    [activity("manual", { completed: true })],
  );
  assert.ok(result.lastActivity);
  assert.equal(result.lastWatched, null);
});
test("no activity and empty course show zero and no dates", () => {
  const [result] = summarizeStudentLearning(
    courses,
    ["a"],
    [],
    [activity("zero")],
  );
  assert.equal(result.percent, 0);
  assert.equal(result.lastActivity, null);
  assert.equal(result.lastWatched, null);
});
test("retained learning is shown after grant removal; unrelated courses excluded", () => {
  const result = summarizeStudentLearning(
    courses,
    [],
    [lesson("legacy")],
    [activity("legacy", { video_progress: 30 })],
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "a");
  assert.equal(result[0].lastWatched.title, "legacy");
});
test("saved backward seek to zero still counts as watched", () => {
  const [result] = summarizeStudentLearning(
    courses,
    ["a"],
    [lesson("restarted")],
    [activity("restarted", { playback_saved_at: "2026-10-01T10:00:00Z" })],
  );
  assert.equal(result.lastWatched.title, "restarted");
});
