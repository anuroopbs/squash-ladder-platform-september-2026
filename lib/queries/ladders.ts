import { createClient } from "@/lib/supabase/server";

export interface LadderStanding {
    ladder_id: string;
    rank: number;
    player_id: string;
    display_name: string;
    avatar_url: string | null;
    joined_at: string;
}

// The single active ladder for a club. v1 shows one ladder per club, so this
// just grabs the oldest active one rather than requiring a ladder slug.
export async function getMainLadderForClub(clubId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("ladders")
      .select("*")
      .eq("club_id", clubId)
      .eq("is_active", true)
      .order("created_at")
      .limit(1)
      .maybeSingle();

  if (error) throw error;
    return data;
}

export async function getLadderStandings(
    ladderId: string
  ): Promise<LadderStanding[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("ladder_standings")
      .select("*")
      .eq("ladder_id", ladderId)
      .order("rank");

  if (error) throw error;
    return (data ?? []) as LadderStanding[];
}
