import { createClient } from "@/lib/supabase/server";

// Returns the signed-in player's auth user + their profiles row, or null
// if nobody's signed in. Used by the site header and (later) /profile.
export async function getCurrentPlayer() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile };
}
