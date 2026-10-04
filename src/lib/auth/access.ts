import type { SupabaseClient, User } from "@supabase/supabase-js";

export type AccountAccess =
  | { status: "signed-out" }
  | { status: "denied"; user: User }
  | { status: "student" | "admin"; user: User };

// Always verify identity with Supabase, then read permissions from the database.
// Never trust browser state, URL parameters, or Google/user metadata for access.
export async function getAccountAccess(
  supabase: SupabaseClient,
): Promise<AccountAccess> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { status: "signed-out" };
  const denied: AccountAccess = { status: "denied", user };
  if (!user.email?.trim() || !user.email_confirmed_at) return denied;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("email, role, is_active")
    .eq("id", user.id)
    .maybeSingle();
  if (
    profileError ||
    !profile?.is_active ||
    profile.email?.trim().toLowerCase() !== user.email.trim().toLowerCase()
  )
    return denied;
  if (profile.role === "admin") return { status: "admin", user };
  if (profile.role !== "student") return denied;

  // The database claims only this verified identity's single-use invitations.
  const { error: invitationError } = await supabase.rpc(
    "claim_student_invitations",
  );
  if (invitationError) return denied;

  const { data: grants, error: accessError } = await supabase
    .from("course_access")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .limit(1);
  if (accessError || !grants?.length) return denied;
  return { status: "student", user };
}

export function accessDestination(access: AccountAccess) {
  switch (access.status) {
    case "admin":
      return "/admin";
    case "student":
      return "/dashboard";
    case "denied":
      return "/access-denied";
    case "signed-out":
      return "/login";
  }
}
