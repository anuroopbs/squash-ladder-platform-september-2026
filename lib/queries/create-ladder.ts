import { createClient } from "@/lib/supabase/server";
import type { City, ClubWithLadderCount } from "@/lib/types/database";

// ----------------------------------------------------------------------------
// Self-service "Create a Ladder" flow. Backs the CreateLadderModal used on
// the home page, city pages, and empty-club pages. See
// sql/027_create_ladder_flow.sql for the atomic DB function this wraps.
// ----------------------------------------------------------------------------

export async function getAllCitiesForPicker(): Promise<City[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("cities").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getClubsForCityPicker(cityId: string): Promise<ClubWithLadderCount[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clubs")
    .select("*, ladders(count)")
    .eq("city_id", cityId)
    .order("name");
  if (error) throw error;
  return (data ?? []) as ClubWithLadderCount[];
}

export interface CreateLadderInput {
  cityId: string | null;
  cityName: string | null;
  country: string | null;
  clubId: string | null;
  clubName: string | null;
  clubAddress: string | null;
  ladderName: string;
  sport?: "squash" | "padel" | "racquetball" | "other";
}

export interface CreateLadderResult {
  citySlug: string;
  clubSlug: string;
  ladderId: string;
  ladderSlug: string;
}

/**
 * Client-side wrapper is what actually calls this (needs the user's own
 * session for auth.uid() inside the RPC) -- this server-side version exists
 * for symmetry/future server-action use but isn't currently called from a
 * Server Component, since the create flow is a client modal.
 */
export async function createLadderFull(input: CreateLadderInput): Promise<CreateLadderResult> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("create_ladder_full", {
    p_city_id: input.cityId,
    p_city_name: input.cityName,
    p_country: input.country,
    p_club_id: input.clubId,
    p_club_name: input.clubName,
    p_club_address: input.clubAddress,
    p_ladder_name: input.ladderName,
    p_sport: input.sport ?? "squash",
  });

  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    citySlug: row.out_city_slug,
    clubSlug: row.out_club_slug,
    ladderId: row.out_ladder_id,
    ladderSlug: row.out_ladder_slug,
  };
}
