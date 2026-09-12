import { createClient } from "@/lib/supabase/server";

export interface DisputedMatch {
  id: string;
  ladder_id: string;
  ladder_name: string;
  club_name: string;
  club_slug: string;
  city_slug: string;
  city_name: string;
  player1_id: string;
  player1_name: string;
  player2_id: string;
  player2_name: string;
  winner_id: string;
  score: string;
  reported_by: string;
  reported_by_name: string;
  played_at: string;
  created_at: string;
}

// Every match currently sitting in 'disputed' status, with enough
// ladder/club/city and player-name context to resolve it without a second
// round trip. There is no admin UI for this today — a disputed match can
// only be resolved by hand in the database. Used by /admin/disputes.
export async function getDisputedMatches(): Promise<DisputedMatch[]> {
  const supabase = createClient();

  const { data: matchRows } = await supabase
    .from("matches")
    .select("*")
    .eq("status", "disputed")
    .order("created_at", { ascending: false });

  const matches = matchRows ?? [];
  if (matches.length === 0) return [];

  const ladderIds = Array.from(new Set(matches.map((m) => m.ladder_id)));
  const { data: ladderRows } = await supabase
    .from("ladders")
    .select("id, name, club_id")
    .in("id", ladderIds);
  const ladders = ladderRows ?? [];

  const clubIds = Array.from(new Set(ladders.map((l) => l.club_id)));
  const { data: clubRows } = await supabase
    .from("clubs")
    .select("id, name, slug, city_id")
    .in("id", clubIds.length > 0 ? clubIds : [""]);
  const clubs = clubRows ?? [];

  const cityIds = Array.from(new Set(clubs.map((c) => c.city_id)));
  const { data: cityRows } = await supabase
    .from("cities")
    .select("id, name, slug")
    .in("id", cityIds.length > 0 ? cityIds : [""]);
  const cities = cityRows ?? [];

  const playerIds = Array.from(
    new Set(matches.flatMap((m) => [m.player1_id, m.player2_id, m.reported_by]))
  );
  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", playerIds.length > 0 ? playerIds : [""]);
  const profiles = profileRows ?? [];
  const nameFor = (id: string) =>
    profiles.find((p) => p.id === id)?.display_name ?? "Unknown player";

  const results: DisputedMatch[] = [];
  for (const m of matches) {
    const ladder = ladders.find((l) => l.id === m.ladder_id);
    const club = ladder ? clubs.find((c) => c.id === ladder.club_id) : undefined;
    const city = club ? cities.find((ci) => ci.id === club.city_id) : undefined;
    if (!ladder || !club || !city) continue;

    results.push({
      id: m.id,
      ladder_id: m.ladder_id,
      ladder_name: ladder.name,
      club_name: club.name,
      club_slug: club.slug,
      city_slug: city.slug,
      city_name: city.name,
      player1_id: m.player1_id,
      player1_name: nameFor(m.player1_id),
      player2_id: m.player2_id,
      player2_name: nameFor(m.player2_id),
      winner_id: m.winner_id,
      score: m.score,
      reported_by: m.reported_by,
      reported_by_name: nameFor(m.reported_by),
      played_at: m.played_at,
      created_at: m.created_at,
    });
  }

  return results;
}
