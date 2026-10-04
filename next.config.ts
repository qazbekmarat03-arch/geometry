import type { NextConfig } from "next";
// Fail before Next can inline an accidentally public privileged credential.
for (const [name, value] of Object.entries(process.env)) {
  if (!name.startsWith("NEXT_PUBLIC_") || !value) continue;
  let privileged = value.startsWith("sb_secret_");
  try {
    const claims = JSON.parse(
      Buffer.from(value.split(".")[1] ?? "", "base64url").toString(),
    );
    privileged ||= claims.role === "service_role";
  } catch {
    /* Publishable keys are not JWTs. */
  }
  if (privileged || /SERVICE.*KEY|SECRET|TOKEN_KEY/.test(name))
    throw new Error(
      `Remove private credential from public environment variable: ${name}`,
    );
}
const config: NextConfig = {
  reactStrictMode: true,
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
  turbopack: { root: process.cwd() },
};
export default config;
