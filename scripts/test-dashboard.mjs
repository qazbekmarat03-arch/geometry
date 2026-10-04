import assert from "node:assert/strict";
import { test } from "node:test";
import { buildDashboard, lessonHref } from "../src/lib/dashboard/model.ts";

const lesson = (id, position = 0, is_published = true) => ({
  id,
  title: id,
  description: null,
  duration: 90,
  position,
  is_published,
});
const course = (id, modules) => ({
  id,
  title: id,
  description: null,
  thumbnail_url: null,
  modules,
});
const progress = (
  lesson_id,
  completed,
  video_progress,
  updated_at = "2026-09-01T00:00:00Z",
) => ({ lesson_id, completed, video_progress, updated_at });
const fixture = [
  course("course-a", [
    {
      id: "module-2",
      title: "Second",
      position: 2,
      lessons: [lesson("a3", 0), lesson("hidden", 1, false)],
    },
    {
      id: "module-1",
      title: "First",
      position: 1,
      lessons: [lesson("a2", 2), lesson("a1", 1)],
    },
  ]),
  course("course-b", [
    { id: "module-3", title: "Third", position: 0, lessons: [lesson("b1")] },
  ]),
];

test("empty data has no invented courses, lesson, or progress", () => {
  const result = buildDashboard([], []);
  assert.equal(result.percent, 0);
  assert.equal(result.total, 0);
  assert.equal(result.latest, undefined);
  assert.deepEqual(result.recent, []);
});
test("published lessons are ordered by module and position", () => {
  const result = buildDashboard(fixture, []);
  assert.deepEqual(
    result.courses[0].lessons.map((l) => l.id),
    ["a1", "a2", "a3"],
  );
  assert.equal(result.courses[0].resume.id, "a1");
  assert.equal(result.total, 4);
});
test("overall progress is lesson-weighted rather than averaging course percentages", () => {
  const result = buildDashboard(fixture, [progress("b1", true, 90)]);
  assert.equal(result.courses[1].percent, 100);
  assert.equal(result.percent, 25);
  assert.equal(result.completed, 1);
  assert.equal(result.courses[0].percent, 0);
});
test("hidden and inaccessible lessons never affect counts or recent lists", () => {
  const result = buildDashboard(fixture, [
    progress("hidden", true, 90),
    progress("not-enrolled", true, 90),
  ]);
  assert.equal(result.completed, 0);
  assert.deepEqual(result.recent, []);
  assert.equal(result.latest, undefined);
});
test("continue selects the latest watched lesson; course resume favors unfinished work", () => {
  const result = buildDashboard(fixture, [
    progress("a2", false, 30, "2026-09-03T00:00:00Z"),
    progress("b1", true, 90, "2026-09-04T00:00:00Z"),
    progress("a1", true, 90),
  ]);
  assert.equal(result.latest.id, "b1");
  assert.equal(result.courses[0].resume.id, "a2");
  assert.deepEqual(
    result.recent.map((l) => l.id),
    ["b1", "a1"],
  );
});
test("zero playback records are not treated as watched", () => {
  assert.equal(
    buildDashboard(fixture, [progress("a1", false, 0)]).latest,
    undefined,
  );
});
test("completed course can be revisited and zero-lesson course stays at zero", () => {
  const result = buildDashboard(
    [fixture[1], course("empty", [])],
    [progress("b1", true, 90)],
  );
  assert.equal(result.courses[0].resume.id, "b1");
  assert.equal(result.courses[0].percent, 100);
  assert.equal(result.courses[1].percent, 0);
  assert.equal(result.courses[1].resume, undefined);
});
test("recent completed lessons are capped at five", () => {
  const lessons = Array.from({ length: 7 }, (_, i) => lesson(`lesson-${i}`, i));
  const result = buildDashboard(
    [
      course("course", [
        { id: "module", title: "Module", position: 0, lessons },
      ]),
    ],
    lessons.map((l, i) =>
      progress(l.id, true, 90, `2026-09-0${i + 1}T00:00:00Z`),
    ),
  );
  assert.equal(result.recent.length, 5);
  assert.equal(result.recent[0].id, "lesson-6");
});
test("lesson destinations stay within the protected course route", () => {
  assert.equal(
    lessonHref("course-id", "lesson-id"),
    "/dashboard/courses/course-id?lesson=lesson-id",
  );
});

test("12 completed published lessons out of 30 display 40 percent", () => {
  const lessons = Array.from({ length: 30 }, (_, i) =>
    lesson(`lesson-${i}`, i),
  );
  lessons.push(lesson("draft", 30, false));
  const result = buildDashboard(
    [
      course("geometry", [
        { id: "module", title: "Module", position: 0, lessons },
      ]),
    ],
    [
      ...lessons.slice(0, 12).map((l) => progress(l.id, true, 0)),
      progress("draft", true, 90),
      progress("ungranted", true, 90),
    ],
  );
  assert.equal(result.courses[0].completed, 12);
  assert.equal(result.courses[0].total, 30);
  assert.equal(result.courses[0].percent, 40);
  assert.equal(result.percent, 40);
});

test("manual completion without a player timestamp appears in recent learning", () => {
  const result = buildDashboard(fixture, [
    progress("a1", false, 30),
    progress("a2", true, 0, "2026-09-05T00:00:00Z"),
  ]);
  assert.equal(result.latest.id, "a2");
  assert.equal(result.recent[0].id, "a2");
  assert.equal(result.courses[0].completed, 1);
});

test("locked lessons remain in curriculum counts but are never resume destinations", () => {
  const input = [
    course("sequential", [
      {
        id: "module",
        title: "Module",
        position: 0,
        lessons: [
          lesson("first"),
          {
            ...lesson("locked", 1),
            is_locked: true,
            progress: progress("locked", true, 80, "2026-10-01T00:00:00Z"),
          },
        ],
      },
    ]),
  ];
  const result = buildDashboard(input, []);
  assert.equal(result.courses[0].lessons[1].locked, true);
  assert.equal(result.courses[0].total, 2);
  assert.equal(result.courses[0].completed, 1);
  assert.equal(result.courses[0].resume.id, "first");
  assert.equal(result.latest, undefined);
  assert.equal(result.recent.length, 0);
});

test("module progress follows module order and excludes drafts", () => {
  const result = buildDashboard(fixture, [
    progress("a1", true, 90),
    progress("a3", true, 90),
    progress("hidden", true, 90),
  ]);
  assert.deepEqual(result.courses[0].moduleProgress, [
    {
      id: "module-1",
      title: "First",
      total: 2,
      completed: 1,
      remaining: 1,
      percent: 50,
    },
    {
      id: "module-2",
      title: "Second",
      total: 1,
      completed: 1,
      remaining: 0,
      percent: 100,
    },
  ]);
  assert.equal(result.courses[0].remaining, 1);
  assert.equal(
    result.courses[0].moduleProgress.reduce(
      (sum, module) => sum + module.completed,
      0,
    ),
    result.courses[0].completed,
  );
});
test("empty modules and matching module titles keep separate counts", () => {
  const result = buildDashboard(
    [
      course("one", [
        { id: "empty", title: "Same title", position: 0, lessons: [] },
        {
          id: "full",
          title: "Same title",
          position: 1,
          lessons: [lesson("one")],
        },
      ]),
    ],
    [progress("one", true, 0)],
  );
  assert.equal(result.courses[0].moduleProgress[0].percent, 0);
  assert.equal(result.courses[0].moduleProgress[0].remaining, 0);
  assert.equal(result.courses[0].moduleProgress[1].percent, 100);
  assert.equal(result.courses[0].remaining, 0);
});
