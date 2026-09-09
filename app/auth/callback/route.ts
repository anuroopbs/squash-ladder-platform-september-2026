import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Handles the redirect from a Supabase email-confirmation link (used if
// "Confirm email" is ever turned back on for the project). Exchanges the
// one-time code for a real session, then sends the player home.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
