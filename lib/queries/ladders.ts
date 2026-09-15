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
