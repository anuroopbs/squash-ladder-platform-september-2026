import { createClient } from "@/lib/supabase/server";
import type { LadderStandingRow } from "@/lib/types/database";

// Get all active ladder standings for the home page sidebar
export async function getAllLadderStandings(): Promise<LadderStandingRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ladder_standings")
    .select("*")
    .order("rank")
    .limit(50);

  if (error) throw error;
  return data ?? [];
}

// Get top players per city for the home page
export async function getCityLadderPreviews() {
  const supabase = createClient();
  const { data: cities } = await supabase
    .from("cities")
    .select("*, clubs(*, ladders(*, ladder_players(*, profiles(*))))")
    .order("name");

  return cities ?? [];
}
