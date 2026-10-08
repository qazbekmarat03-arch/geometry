import { MAX_PDF_SIZE, validPdfHeader } from "./files.ts";

export function driveDownloadUrl(input: string): URL | null {
  try {
    const url = new URL(input.trim());
    if (
      url.protocol !== "https:" ||
      url.hostname !== "drive.google.com" ||
      url.port ||
      url.username ||
      url.password
    )
      return null;
    const id =
      url.pathname.match(
        /^\/file\/d\/([\w-]+)(?:\/view|\/preview)?\/?$/,
      )?.[1] ??
      (["/open", "/uc"].includes(url.pathname)
        ? url.searchParams.get("id")
        : null);
    if (!id || !/^[\w-]{10,200}$/.test(id)) return null;
    const target = new URL("https://drive.google.com/uc");
    target.searchParams.set("export", "download");
    target.searchParams.set("id", id);
    const key = url.searchParams.get("resourcekey");
    if (key) {
      if (!/^[\w-]{1,200}$/.test(key)) return null;
      target.searchParams.set("resourcekey", key);
    }
    return target;
  } catch {
    return null;
  }
}

function allowedDownload(url: URL) {
  return (
    url.protocol === "https:" &&
    !url.port &&
    !url.username &&
    !url.password &&
    (url.hostname === "drive.google.com" ||
      url.hostname === "drive.usercontent.google.com" ||
      url.hostname.endsWith(".googleusercontent.com"))
  );
}

// No credentials are forwarded. Every redirect is checked before fetching.
// Imported files subsequently use private Storage and the existing lesson RLS.
export async function importDrivePdf(
  input: string,
  fetcher: typeof fetch = fetch,
): Promise<Uint8Array> {
  const initialUrl = driveDownloadUrl(input);
  if (!initialUrl)
    throw new Error("Google Drive-тағы PDF файлының сілтемесін енгізіңіз.");
  let url: URL = initialUrl;
  const signal = AbortSignal.timeout(20_000);
  for (let redirects = 0; redirects <= 4; redirects++) {
    const response = await fetcher(url, {
      redirect: "manual",
      credentials: "omit",
      cache: "no-store",
      signal,
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      await response.body?.cancel();
      const location = response.headers.get("location");
      if (!location) break;
      const next = new URL(location, url);
      if (!allowedDownload(next)) break;
      url = next;
      continue;
    }
    if (!response.ok || !response.body) break;
    if (Number(response.headers.get("content-length")) > MAX_PDF_SIZE) {
      await response.body.cancel();
      throw new Error("PDF файлы 10 МБ-тан аспауы керек.");
    }
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let length = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > MAX_PDF_SIZE)
          throw new Error("PDF файлы 10 МБ-тан аспауы керек.");
        chunks.push(value);
      }
    } finally {
      await reader.cancel();
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    if (!validPdfHeader(bytes)) break;
    return bytes;
  }
  throw new Error(
    "PDF ашылмады. Drive-та «Сілтемесі бар кез келген адам — оқырман» рұқсатын және файлды жүктеу мүмкіндігін қосыңыз.",
  );
}
