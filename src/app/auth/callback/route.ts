import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { accessDestination, getAccountAccess } from "@/lib/auth/access";
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code && getSupabaseConfig()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const access = await getAccountAccess(supabase);
      const response = NextResponse.redirect(
        new URL(accessDestination(access), request.url),
      );
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }
  }
  return NextResponse.redirect(new URL("/login?error=auth", request.url));
}
