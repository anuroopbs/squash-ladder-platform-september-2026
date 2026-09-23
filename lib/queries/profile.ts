import { createClient } from "@/lib/supabase/server";

// Returns the signed-in player's auth user + their profiles row, or null
// if nobody's signed in. Used by the site header and (later) /profile.
export async function getCurrentPlayer() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // email/phone are no longer readable via a plain select (sql/029), so the
  // user's own full row comes from a security-definer function.
  const { data } = await supabase.rpc("get_my_profile");
  const profile = (Array.isArray(data) ? data[0] : data) ?? null;

  return { user, profile };
}
