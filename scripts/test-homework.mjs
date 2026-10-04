import { test } from "node:test";
import assert from "node:assert/strict";
import {
  pdfName,
  homeworkReference,
  validPdfHeader,
  MAX_PDF_SIZE,
} from "../src/lib/homework/files.ts";
test("homework rejects public URLs, other buckets, and traversal", () => {
  assert.deepEqual(
    homeworkReference("storage://homework/course/lesson/file.pdf"),
    { bucket: "homework", path: "course/lesson/file.pdf" },
  );
  assert.equal(
    homeworkReference("storage://course-media/lesson/legacy.pdf").bucket,
    "course-media",
  );
  for (const value of [
    "https://example.com/file.pdf",
    "storage://homework/../file.pdf",
    "storage://homework/%2e%2e/file.pdf",
    "storage://homework/video.mp4",
    "storage://other/file.pdf",
    null,
  ])
    assert.equal(homeworkReference(value), null);
});
test("download name is sanitized without losing Kazakh text", () => {
  assert.equal(pdfName("../../Үшбұрыштар.PDF"), "Үшбұрыштар.pdf");
  assert.equal(pdfName("bad\r\nname.pdf"), "bad__name.pdf");
  assert.equal(pdfName("unsafe.exe"), "homework.pdf");
});
test("upload validates PDF header and defines a 10 MiB cap", () => {
  assert.equal(validPdfHeader(new TextEncoder().encode("%PDF-1.7")), true);
  assert.equal(validPdfHeader(new TextEncoder().encode("<html>")), false);
  assert.equal(validPdfHeader(new Uint8Array()), false);
  assert.equal(MAX_PDF_SIZE, 10485760);
});
