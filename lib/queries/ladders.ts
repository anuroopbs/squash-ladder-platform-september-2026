import { createClient } from "@/lib/supabase/server";
import type {
  Ladder,
  LadderStandingRow,
  ClubWithCity,
} from "@/lib/types/database";

// ----------------------------------------------------------------------------
// Ladders
// ----------------------------------------------------------------------------

export async function getLaddersByClubSlug(
  citySlug: string,
  clubSlug: string
): Promise<Ladder[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ladders")
    .select("*")
    .eq("club_id", (
      await supabase
        .from("clubs")
        .select("id")
        .eq("slug", clubSlug)
        .single()
    ).data?.id ?? "")
    .eq("is_active", true)
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export async function getLadderById(ladderId: string): Promise<Ladder | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ladders")
    .select("*")
    .eq("id", ladderId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// ----------------------------------------------------------------------------
// Ladder Standings (the view)
// ----------------------------------------------------------------------------

export async function getLadderStandings(
  ladderId: string
): Promise<LadderStandingRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ladder_standings")
    .select("*")
    .eq("ladder_id", ladderId)
    .order("rank");

  if (error) throw error;
  return data ?? [];
}

// ----------------------------------------------------------------------------
// Club with city (replaces the old getClubBySlug that used `as any`)
// ----------------------------------------------------------------------------

export interface PlayerMatchStats {
  player_id: string;
  wins: number;
  losses: number;
  last_match_at: string | null;
}

/**
 * Aggregates confirmed-match outcomes per player within one ladder:
 * wins (this player is winner_id), losses (this player participated
 * but someone else won), and the date of their most recent match.
 * Only status='confirmed' matches count -- pending/disputed results
 * haven't been validated and shouldn't count toward a record yet.
 */
export async function getPlayerMatchStats(
  ladderId: string
): Promise<PlayerMatchStats[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("matches")
    .select("player1_id, player2_id, winner_id, played_at")
    .eq("ladder_id", ladderId)
    .eq("status", "confirmed");

  if (error) throw error;
  if (!data || data.length === 0) return [];

  const wins = new Map<string, number>();
  const losses = new Map<string, number>();
  const lastMatch = new Map<string, string>();

  for (const m of data as any[]) {
    for (const playerId of [m.player1_id, m.player2_id]) {
      const prev = lastMatch.get(playerId);
      if (!prev || m.played_at > prev) lastMatch.set(playerId, m.played_at);
    }

    if (m.winner_id === m.player1_id) {
      wins.set(m.player1_id, (wins.get(m.player1_id) ?? 0) + 1);
      losses.set(m.player2_id, (losses.get(m.player2_id) ?? 0) + 1);
    } else {
      wins.set(m.player2_id, (wins.get(m.player2_id) ?? 0) + 1);
      losses.set(m.player1_id, (losses.get(m.player1_id) ?? 0) + 1);
    }
  }

  return Array.from(lastMatch.entries()).map(([playerId, lastAt]) => ({
    player_id: playerId,
    wins: wins.get(playerId) ?? 0,
    losses: losses.get(playerId) ?? 0,
    last_match_at: lastAt,
  }));
}

export async function getClubWithCity(
  citySlug: string,
  clubSlug: string
): Promise<ClubWithCity | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clubs")
    .select("*, cities!inner(slug, name)")
    .eq("slug", clubSlug)
    .eq("cities.slug", citySlug)
    .maybeSingle();

  if (error) throw error;
  return data;
}
