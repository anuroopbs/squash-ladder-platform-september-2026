import { createClient } from "@/lib/supabase/client";

// Player-supplied phone numbers, scoped by RLS so a number is only ever
// returned to the player themselves or to someone who shares a ladder with
// them (see the "player_contacts" table and its policies in sql/schema.sql).

export async function getMyPhone(userId: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("player_contacts")
    .select("phone")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data?.phone ?? null;
}

export async function saveMyPhone(userId: string, phone: string | null) {
  const supabase = createClient();
  const { error } = await supabase.from("player_contacts").upsert({
    user_id: userId,
    phone,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}

// Looks up phone numbers for a set of players. RLS does the actual privacy
// enforcement here: this returns a number only for the caller's own row, or
// for a player who shares at least one ladder with the caller. Anyone else
// in the list is simply omitted from the result, not shown as blank.
export async function getLadderMatePhones(
  playerIds: string[]
): Promise<Record<string, string>> {
  if (playerIds.length === 0) return {};

  const supabase = createClient();
  const { data, error } = await supabase
    .from("player_contacts")
    .select("user_id, phone")
    .in("user_id", playerIds);

  if (error) throw error;

  const result: Record<string, string> = {};
  for (const row of data ?? []) {
    if (row.phone) result[row.user_id] = row.phone;
  }
  return result;
}
