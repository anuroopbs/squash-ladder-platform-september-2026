import { createClient } from "@/lib/supabase/client";
import type { Match } from "@/lib/types/database";

// A disputed match, resolved with enough player/club/city context for an
// admin to review and act on it without opening the ladder page itself.
// Read via the same "matches are publicly readable" RLS policy every
// other match query already uses — no new policy needed here; only the
// /admin/disputes page itself is gated to admins, at the page level.
export interface DisputedMatch {
  id: string;
  ladder_id: string;
  ladder_name: string;
  club_name: string;
  club_slug: string;
  city_slug: string;
  player1_id: string;
  player1_name: string;
  player2_id: string;
  player2_name: string;
  winner_id: string;
  winner_name: string;
  score: string;
  reported_by_name: string;
  played_at: string;
  created_at: string;
}

export async function getDisputedMatches(): Promise<DisputedMatch[]> {
  const supabase = createClient();

  const { data: matchRows } = await supabase
    .from("matches")
    .select("*")
    .eq("status", "disputed")
    .order("created_at", { ascending: false });

  const matches = (matchRows ?? []) as Match[];
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
    .select("id, slug")
    .in("id", cityIds.length > 0 ? cityIds : [""]);
  const cities = cityRows ?? [];

  const playerIds = Array.from(
    new Set(matches.flatMap((m) => [m.player1_id, m.player2_id, m.winner_id, m.reported_by]))
  );
  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", playerIds.length > 0 ? playerIds : [""]);
  const profiles = profileRows ?? [];

  function nameFor(id: string) {
    return profiles.find((p) => p.id === id)?.display_name ?? "A player";
  }

  return matches
    .map((m) => {
      const ladder = ladders.find((l) => l.id === m.ladder_id);
      const club = ladder ? clubs.find((c) => c.id === ladder.club_id) : undefined;
      const city = club ? cities.find((ci) => ci.id === club.city_id) : undefined;
      if (!ladder || !club || !city) return null;

      return {
        id: m.id,
        ladder_id: m.ladder_id,
        ladder_name: ladder.name,
        club_name: club.name,
        club_slug: club.slug,
        city_slug: city.slug,
        player1_id: m.player1_id,
        player1_name: nameFor(m.player1_id),
        player2_id: m.player2_id,
        player2_name: nameFor(m.player2_id),
        winner_id: m.winner_id,
        winner_name: nameFor(m.winner_id),
        score: m.score,
        reported_by_name: nameFor(m.reported_by),
        played_at: m.played_at,
        created_at: m.created_at,
      };
    })
    .filter((m): m is DisputedMatch => m !== null);
}

// Both actions below rely entirely on the existing RLS policy
// "participants and admins can update a match" (auth.uid() in
// (player1_id, player2_id) OR profiles.is_admin) — no new SQL needed.
// If a non-admin somehow calls these, Supabase/Postgres simply rejects
// the update and an error is returned, same as any other RLS denial.

export async function confirmDisputedMatch(matchId: string, adminUserId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("matches")
    .update({ status: "confirmed", confirmed_by: adminUserId })
    .eq("id", matchId);
  if (error) throw error;
}

export async function resetDisputedMatch(matchId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("matches")
    .update({ status: "pending_confirmation", confirmed_by: null })
    .eq("id", matchId);
  if (error) throw error;
}
