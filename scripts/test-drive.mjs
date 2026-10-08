import { test } from "node:test";
import assert from "node:assert/strict";
import { driveDownloadUrl, importDrivePdf } from "../src/lib/homework/drive.ts";
const input = "https://drive.google.com/file/d/abcdefghijklmnop/view?usp=sharing";
test("Drive parser accepts file links and rejects arbitrary hosts, credentials and folders", () => {
  assert.equal(driveDownloadUrl(input).searchParams.get("id"), "abcdefghijklmnop");
  assert.equal(driveDownloadUrl("https://drive.google.com/open?id=abcdefghijklmnop").searchParams.get("export"), "download");
  for (const url of ["http://drive.google.com/file/d/abcdefghijklmnop/view", "https://drive.google.com.evil.test/file/d/abcdefghijklmnop/view", "https://user:password@drive.google.com/file/d/abcdefghijklmnop/view", "https://drive.google.com/drive/folders/abcdefghijklmnop", "http://127.0.0.1/file.pdf", "javascript:alert(1)"]) assert.equal(driveDownloadUrl(url), null);
});
test("imports PDF bytes through a Google download redirect without credentials", async () => {
  let calls = 0;
  const pdf = await importDrivePdf(input, async (url, options) => {
    assert.equal(options.redirect, "manual");
    assert.equal(options.credentials, "omit");
    assert.ok(options.signal);
    calls++;
    return calls === 1 ? new Response(null, {status: 302, headers: {location: "https://drive.usercontent.google.com/download?id=abcdefghijklmnop"}}) : new Response("%PDF-1.7\nexample");
  });
  assert.equal(calls, 2);
  assert.equal(new TextDecoder().decode(pdf), "%PDF-1.7\nexample");
});
test("rejects redirect SSRF before sending a request to the destination", async () => {
  for (const location of ["http://127.0.0.1", "https://evil.test", "https://googleusercontent.com.evil.test", "https://user:pass@drive.google.com", "http://drive.google.com"]) {
    let calls = 0;
    await assert.rejects(importDrivePdf(input, async () => { calls++; return new Response(null, {status:302,headers:{location}}); }));
    assert.equal(calls, 1);
  }
});
test("rejects login/confirmation HTML, errors, redirect loops and oversized responses", async () => {
  for (const response of [new Response("<html>Sign in</html>"), new Response("no", {status:403}), new Response("%PDF-1.7", {headers:{"content-length":"10485761"}}), new Response(new Uint8Array(10485761))]) await assert.rejects(importDrivePdf(input, async () => response));
  let calls = 0;
  await assert.rejects(importDrivePdf(input, async () => {calls++; return new Response(null,{status:302,headers:{location:input}});}));
  assert.equal(calls, 5);
});
