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
  const { data, error } = await supabase
    .from("challenges")
    .select("*")
    .eq("ladder_id", ladderId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!data) return [];

  // Enrich with profile names
  const enriched: ChallengeWithProfiles[] = [];
  for (const c of data) {
    const [challenger, challenged] = await Promise.all([
      supabase
        .from("profiles")
        .select("display_name")
        .eq("id", c.challenger_id)
        .single(),
      supabase
        .from("profiles")
        .select("display_name")
        .eq("id", c.challenged_id)
        .single(),
    ]);
    enriched.push({
      ...c,
      challenger_name: challenger.data?.display_name ?? "Unknown",
      challenged_name: challenged.data?.display_name ?? "Unknown",
    });
  }
  return enriched;
}

export async function getChallengesByPlayer(
  playerId: string
): Promise<ChallengeWithProfiles[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("challenges")
    .select("*")
    .or(`challenger_id.eq.${playerId},challenged_id.eq.${playerId}`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!data) return [];

  const enriched: ChallengeWithProfiles[] = [];
  for (const c of data) {
    const [challenger, challenged] = await Promise.all([
      supabase
        .from("profiles")
        .select("display_name")
        .eq("id", c.challenger_id)
        .single(),
      supabase
        .from("profiles")
        .select("display_name")
        .eq("id", c.challenged_id)
        .single(),
    ]);
    enriched.push({
      ...c,
      challenger_name: challenger.data?.display_name ?? "Unknown",
      challenged_name: challenged.data?.display_name ?? "Unknown",
    });
  }
  return enriched;
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
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("ladder_id", ladderId)
    .order("played_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  if (!data) return [];

  const enriched: MatchWithProfiles[] = [];
  for (const m of data) {
    const [p1, p2, winner] = await Promise.all([
      supabase
        .from("profiles")
        .select("display_name")
        .eq("id", m.player1_id)
        .single(),
      supabase
        .from("profiles")
        .select("display_name")
        .eq("id", m.player2_id)
        .single(),
      supabase
        .from("profiles")
        .select("display_name")
        .eq("id", m.winner_id)
        .single(),
    ]);
    enriched.push({
      ...m,
      player1_name: p1.data?.display_name ?? "Unknown",
      player2_name: p2.data?.display_name ?? "Unknown",
      winner_name: winner.data?.display_name ?? "Unknown",
    });
  }
  return enriched;
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
  // Get current max rank
  const { data: maxRow } = await supabase
    .from("ladder_players")
    .select("rank")
    .eq("ladder_id", ladderId)
    .order("rank", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextRank = (maxRow?.rank ?? 0) + 1;

  const { error } = await supabase
    .from("ladder_players")
    .insert({ ladder_id: ladderId, player_id: playerId, rank: nextRank });

  if (error) throw error;
}
