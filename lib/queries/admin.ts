import { createClient } from "@/lib/supabase/server";
import type { LadderStandingRow } from "@/lib/types/database";

// ----------------------------------------------------------------------------
// Admin-only queries. Every function here assumes the caller has already
// verified the current user is an admin (see requireAdmin() in profile.ts) —
// RLS also double-enforces this at the DB layer (see sql/025_admin_panel_setup.sql)
// so a non-admin hitting these directly still gets nothing back.
// ----------------------------------------------------------------------------

export interface AdminLadderGroup {
  ladder_id: string;
  ladder_name: string;
  club_name: string;
  city_name: string;
  city_slug: string;
  club_slug: string;
  players: LadderStandingRow[];
}

/** Every ladder with its full standings, grouped for the admin dashboard. */
export async function getAllLaddersWithPlayers(): Promise<AdminLadderGroup[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ladder_standings")
    .select("*")
    .order("city_name")
    .order("club_name")
    .order("ladder_name")
    .order("rank");

  if (error) throw error;
  const rows = (data ?? []) as LadderStandingRow[];

  const groups = new Map<string, AdminLadderGroup>();
  for (const row of rows) {
    if (!groups.has(row.ladder_id)) {
      groups.set(row.ladder_id, {
        ladder_id: row.ladder_id,
        ladder_name: row.ladder_name,
        club_name: row.club_name,
        city_name: row.city_name,
        city_slug: row.city_slug,
        club_slug: row.club_slug,
        players: [],
      });
    }
    groups.get(row.ladder_id)!.players.push(row);
  }

  return Array.from(groups.values());
}

/** Remove a player from a ladder entirely. Admin-only via RLS. */
export async function removePlayerFromLadder(ladderId: string, playerId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("ladder_players")
    .delete()
    .eq("ladder_id", ladderId)
    .eq("player_id", playerId);

  if (error) throw error;
}

/** Move a player to a new rank within their ladder. Admin-only via RLS. */
export async function updatePlayerRank(ladderId: string, playerId: string, newRank: number) {
  const supabase = createClient();
  const { error } = await supabase
    .from("ladder_players")
    .update({ rank: newRank })
    .eq("ladder_id", ladderId)
    .eq("player_id", playerId);

  if (error) throw error;
}

export interface DisputedMatchRow {
  match_id: string;
  ladder_id: string;
  player1_id: string;
  player2_id: string;
  winner_id: string;
  score: string;
  reported_by: string;
  played_at: string;
  updated_at: string;
  player1_name: string;
  player2_name: string;
  reported_by_name: string;
  ladder_name: string;
  club_name: string;
  club_slug: string;
  city_name: string;
  city_slug: string;
}

/** Every match currently awaiting admin resolution (status = 'disputed'). */
export async function getDisputedMatches(adminId: string): Promise<DisputedMatchRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_disputed_matches", {
    admin_uuid: adminId,
  });
  if (error) throw error;
  return (data ?? []) as DisputedMatchRow[];
}
