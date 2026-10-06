import assert from "node:assert/strict";
import { test } from "node:test";
import { getAccountAccess, accessDestination } from "../src/lib/auth/access.ts";

const user = {
  id: "student-id",
  email: "student@example.test",
  email_confirmed_at: "2026-01-01T00:00:00Z",
  user_metadata: { role: "admin" },
  app_metadata: { role: "admin" },
};
const profile = { email: user.email, role: "student", is_active: true };
const owner = {
  ...user,
  email: "qazbek03@gmail.com",
  identities: [
    {
      provider: "google",
      identity_data: { email: "qazbek03@gmail.com", email_verified: true },
    },
  ],
};
const ownerProfile = { ...profile, email: owner.email, role: "admin" };
function client({
  identity = user,
  profileRow = profile,
  grants = [],
  authError = null,
  profileError = null,
  grantError = null,
  invitationError = null,
  ownerError = null,
} = {}) {
  return {
    rpc: async (name) => {
      if (name === "claim_owner_admin") return { error: ownerError };
      assert.equal(name, "claim_student_invitations");
      return { error: invitationError };
    },
    auth: {
      getUser: async () => ({ data: { user: identity }, error: authError }),
    },
    from(table) {
      assert.ok(["profiles", "course_access"].includes(table));
      const filters = {};
      let expiry;
      const query = {
        select() {
          return query;
        },
        eq(column, value) {
          filters[column] = value;
          return query;
        },
        or(value) {
          assert.match(value, /^expires_at\.is\.null,expires_at\.gt\./);
          expiry = value.split("expires_at.gt.")[1];
          return query;
        },
        async maybeSingle() {
          assert.equal(table, "profiles");
          assert.equal(filters.id, identity.id);
          return { data: profileRow, error: profileError };
        },
        async limit(n) {
          assert.equal(table, "course_access");
          assert.equal(filters.user_id, identity.id);
          assert.equal(filters.is_active, true);
          assert.ok(Number.isFinite(Date.parse(expiry)));
          assert.ok(Math.abs(Date.now() - Date.parse(expiry)) < 5000);
          return {
            data: grants
              .filter(
                (g) =>
                  g.user_id === filters.user_id &&
                  g.is_active &&
                  (g.expires_at === null ||
                    Date.parse(g.expires_at) > Date.parse(expiry)),
              )
              .slice(0, n),
            error: grantError,
          };
        },
      };
      return query;
    },
  };
}
const grant = {
  id: "grant",
  user_id: user.id,
  is_active: true,
  expires_at: null,
};
for (const [name, options, status] of [
  ["anonymous", { identity: null }, "signed-out"],
  ["invalid session", { authError: new Error("invalid") }, "signed-out"],
  ["missing email", { identity: { ...user, email: undefined } }, "denied"],
  [
    "unverified email",
    { identity: { ...user, email_confirmed_at: undefined } },
    "denied",
  ],
  ["missing profile", { profileRow: null }, "denied"],
  [
    "profile lookup failure",
    { profileError: new Error("unavailable") },
    "denied",
  ],
  [
    "profile email mismatch",
    { profileRow: { ...profile, email: "different@example.test" } },
    "denied",
  ],
  [
    "inactive profile",
    { profileRow: { ...profile, is_active: false }, grants: [grant] },
    "denied",
  ],
  ["no grant and forged metadata admin", {}, "denied"],
  ["inactive grant", { grants: [{ ...grant, is_active: false }] }, "denied"],
  [
    "expired grant",
    { grants: [{ ...grant, expires_at: "2020-01-01T00:00:00Z" }] },
    "denied",
  ],
  [
    "another user grant",
    { grants: [{ ...grant, user_id: "other" }] },
    "denied",
  ],
  [
    "grant lookup failure",
    { grants: [grant], grantError: new Error("unavailable") },
    "denied",
  ],
  ["indefinite active grant", { grants: [grant] }, "student"],
  [
    "invitation claim fails closed",
    { grants: [grant], invitationError: new Error("unavailable") },
    "denied",
  ],
  [
    "future expiry",
    { grants: [{ ...grant, expires_at: "2099-01-01T00:00:00Z" }] },
    "student",
  ],
  [
    "case-insensitive email match",
    {
      profileRow: { ...profile, email: "STUDENT@example.test" },
      grants: [grant],
    },
    "student",
  ],
  [
    "a different database admin is denied",
    { profileRow: { ...profile, role: "admin" } },
    "denied",
  ],
  [
    "verified Google owner without enrollment",
    { identity: owner, profileRow: ownerProfile },
    "admin",
  ],
  [
    "owner email alone is insufficient",
    { identity: { ...owner, identities: [] }, profileRow: ownerProfile },
    "denied",
  ],
  [
    "unverified Google identity is insufficient",
    {
      identity: {
        ...owner,
        identities: [
          {
            provider: "google",
            identity_data: { email: owner.email, email_verified: false },
          },
        ],
      },
      profileRow: ownerProfile,
    },
    "denied",
  ],
  [
    "owner claim failure closes access",
    {
      identity: owner,
      profileRow: ownerProfile,
      ownerError: new Error("migration missing"),
    },
    "denied",
  ],
  [
    "inactive owner stays denied",
    { identity: owner, profileRow: { ...ownerProfile, is_active: false } },
    "denied",
  ],
  [
    "inactive admin",
    { profileRow: { ...profile, role: "admin", is_active: false } },
    "denied",
  ],
  [
    "unknown role",
    { profileRow: { ...profile, role: "owner" }, grants: [grant] },
    "denied",
  ],
]) {
  test(name, async () => {
    const access = await getAccountAccess(client(options));
    assert.equal(access.status, status);
    assert.equal(
      accessDestination(access),
      {
        "signed-out": "/login",
        denied: "/access-denied",
        student: "/dashboard",
        admin: "/admin",
      }[status],
    );
    if (status !== "signed-out") assert.equal(access.user.id, user.id);
  });
}
