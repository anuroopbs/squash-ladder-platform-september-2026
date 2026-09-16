import { createClient } from "@/lib/supabase/server";
import type {
  Challenge,
  ChallengeWithProfiles,
  Match,
  MatchWithProfiles,
  LadderPlayer,
} from "@/lib/types/database";

// ----------------------------------------------------------------------------
// Challenges
// ----------------------------------------------------------------------------

export async function getChallengesByLadder(
  ladderId: string
): Promise<ChallengeWithProfiles[]> {
  const supabase = createClient();
  // Embedded select — 1 query instead of 1 + 2N (was firing two profile
  // lookups per challenge row in a loop).
  const { data, error } = await supabase
    .from("challenges")
    .select(
      "*, challenger:profiles!challenger_id(display_name), challenged:profiles!challenged_id(display_name)"
    )
    .eq("ladder_id", ladderId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!data) return [];

  return data.map((c) => ({
    ...c,
    challenger_name: (c as any).challenger?.display_name ?? "Unknown",
    challenged_name: (c as any).challenged?.display_name ?? "Unknown",
  }));
}

export async function getChallengesByPlayer(
  playerId: string
): Promise<ChallengeWithProfiles[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("challenges")
    .select(
      "*, challenger:profiles!challenger_id(display_name), challenged:profiles!challenged_id(display_name)"
    )
    .or(`challenger_id.eq.${playerId},challenged_id.eq.${playerId}`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!data) return [];

  return data.map((c) => ({
    ...c,
    challenger_name: (c as any).challenger?.display_name ?? "Unknown",
    challenged_name: (c as any).challenged?.display_name ?? "Unknown",
  }));
}

export async function createChallenge(input: {
  ladder_id: string;
  challenger_id: string;
  challenged_id: string;
}): Promise<Challenge> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("challenges")
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateChallengeStatus(
  challengeId: string,
  status: "accepted" | "declined" | "completed"
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("challenges")
    .update({ status })
    .eq("id", challengeId);

  if (error) throw error;
}

// ----------------------------------------------------------------------------
// Matches
// ----------------------------------------------------------------------------

export async function getMatchesByLadder(
  ladderId: string,
  limit = 10
): Promise<MatchWithProfiles[]> {
  const supabase = createClient();
  // Embedded select — 1 query instead of 1 + 3N.
  const { data, error } = await supabase
    .from("matches")
    .select(
      "*, p1:profiles!player1_id(display_name), p2:profiles!player2_id(display_name), winner:profiles!winner_id(display_name)"
    )
    .eq("ladder_id", ladderId)
    .order("played_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  if (!data) return [];

  return data.map((m) => ({
    ...m,
    player1_name: (m as any).p1?.display_name ?? "Unknown",
    player2_name: (m as any).p2?.display_name ?? "Unknown",
    winner_name: (m as any).winner?.display_name ?? "Unknown",
  }));
}

export async function reportMatch(input: {
  ladder_id: string;
  challenge_id?: string;
  player1_id: string;
  player2_id: string;
  winner_id: string;
  score: string;
  reported_by: string;
  played_at?: string;
}): Promise<Match> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("matches")
    .insert({
      ...input,
      played_at: input.played_at ?? new Date().toISOString().split("T")[0],
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function confirmMatch(
  matchId: string,
  confirmedBy: string
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("matches")
    .update({ status: "confirmed", confirmed_by: confirmedBy })
    .eq("id", matchId);

  if (error) throw error;
}

// ----------------------------------------------------------------------------
// Ladder Players
// ----------------------------------------------------------------------------

export async function getLadderPlayer(
  ladderId: string,
  playerId: string
): Promise<LadderPlayer | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ladder_players")
    .select("*")
    .eq("ladder_id", ladderId)
    .eq("player_id", playerId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function joinLadder(
  ladderId: string,
  playerId: string
): Promise<void> {
  const supabase = createClient();
  // Delegate to the atomic join_ladder() Postgres function instead of
  // reimplementing "read max rank, insert next rank" here — that pattern
  // has a race condition (two concurrent joins can read the same max
  // rank and collide on the unique(ladder_id, rank) constraint, or in
  // rare timing insert non-adjacent ranks). The DB function does the
  // read-and-insert in one atomic statement server-side.
  const { error } = await supabase.rpc("join_ladder", {
    ladder_uuid: ladderId,
    player_uuid: playerId,
  });

  if (error) throw error;
}
