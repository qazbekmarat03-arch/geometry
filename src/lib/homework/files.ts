export const MAX_PDF_SIZE = 10 * 1024 * 1024;
export function pdfName(name: string) {
  const base = name.split(/[\\/]/).pop() || "homework.pdf";
  const cleaned = base.replace(/[\x00-\x1f\x7f<>:"|?*]/g, "_").slice(0, 150);
  return /\.pdf$/i.test(cleaned)
    ? cleaned.replace(/\.pdf$/i, ".pdf")
    : "homework.pdf";
}
export function homeworkReference(value: string | null) {
  const match = value?.match(
    /^storage:\/\/(homework|course-media)\/(.+\.pdf)$/i,
  );
  if (
    !match ||
    match[2].includes("\\") ||
    match[2].includes("%") ||
    match[2].split("/").some((p) => !p || p === "." || p === "..")
  )
    return null;
  return { bucket: match[1], path: match[2] };
}
export function validPdfHeader(bytes: Uint8Array) {
  return (
    bytes.length >= 5 &&
    [37, 80, 68, 70, 45].every((value, index) => bytes[index] === value)
  );
}
