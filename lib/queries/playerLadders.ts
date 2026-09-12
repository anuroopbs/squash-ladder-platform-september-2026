import { createClient } from "@/lib/supabase/server";

// One row per ladder a player belongs to, with enough club/city context to
// link straight back to that club's page and enough standings context to
// show "#N of M" without a second round trip per ladder.
export interface PlayerLadderEntry {
  ladder_id: string;
  ladder_name: string;
  rank: number;
  total_players: number;
  club_id: string;
  club_name: string;
  club_slug: string;
  city_name: string;
  city_slug: string;
}

// Before this, a player could only see their own status by revisiting each
// club page individually — there was no single place listing every ladder
// they're on across different clubs/cities. Used by /profile.
export async function getLaddersForPlayer(userId: string): Promise<PlayerLadderEntry[]> {
  const supabase = createClient();

  const { data: membershipRows } = await supabase
    .from("ladder_players")
    .select("ladder_id, rank")
    .eq("player_id", userId);

  const memberships = membershipRows ?? [];
  if (memberships.length === 0) return [];

  const ladderIds = memberships.map((m) => m.ladder_id);

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

  const { data: allMemberRows } = await supabase
    .from("ladder_players")
    .select("ladder_id")
    .in("ladder_id", ladderIds);
  const totalsByLadder = new Map<string, number>();
  (allMemberRows ?? []).forEach((row) => {
    totalsByLadder.set(row.ladder_id, (totalsByLadder.get(row.ladder_id) ?? 0) + 1);
  });

  const entries: PlayerLadderEntry[] = [];
  for (const membership of memberships) {
    const ladder = ladders.find((l) => l.id === membership.ladder_id);
    const club = ladder ? clubs.find((c) => c.id === ladder.club_id) : undefined;
    const city = club ? cities.find((ci) => ci.id === club.city_id) : undefined;
    if (!ladder || !club || !city) continue;

    entries.push({
      ladder_id: ladder.id,
      ladder_name: ladder.name,
      rank: membership.rank,
      total_players: totalsByLadder.get(ladder.id) ?? 0,
      club_id: club.id,
      club_name: club.name,
      club_slug: club.slug,
      city_name: city.name,
      city_slug: city.slug,
    });
  }

  return entries.sort(
    (a, b) => a.city_name.localeCompare(b.city_name) || a.club_name.localeCompare(b.club_name)
  );
}
