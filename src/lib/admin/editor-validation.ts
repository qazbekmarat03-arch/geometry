export function videoReference(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
    return `bunny://${value}`;
  if (
    /^bunny:\/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    ) ||
    /^vimeo:\/\/[0-9]+$/.test(value)
  )
    return value;
  if (value.startsWith("storage://course-media/")) {
    const path = value.slice("storage://course-media/".length);
    if (
      path &&
      !/[\\%?#]/.test(path) &&
      !path.split("/").some((part) => !part || part === "." || part === "..")
    )
      return value;
  }
  throw new Error("Use a private video reference");
}
