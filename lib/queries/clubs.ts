import { createClient } from "@/lib/supabase/server";
import type { ClubWithLadderCount } from "@/lib/types/database";

interface ClubWithLadderPlayers {
  id: string;
  name: string;
  slug: string;
  ladders: { id: string; ladder_players: { count: number }[] }[];
}

// Clubs to always hide from public listings (homepage, city pages) even
// though they may have real data -- seed/test data that shouldn't be shown
// to real players. Never deleted: still reachable via direct link or a
// printed QR code, this only filters what shows up in the browse flow.
const HIDDEN_CLUB_NAMES = new Set(["Test Club"]);

export async function getClubsByCitySlug(
  citySlug: string
): Promise<ClubWithLadderCount[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clubs")
    .select("*, ladders(id, ladder_players(count)), cities!inner(slug)")
    .eq("cities.slug", citySlug)
    .order("name");

  if (error) throw error;
  const clubs = (data ?? []) as unknown as ClubWithLadderPlayers[];

  return clubs
    .filter((c) => !HIDDEN_CLUB_NAMES.has(c.name))
    .map((c) => ({
      ...c,
      ladders: [{ count: c.ladders.length }],
    })) as unknown as ClubWithLadderCount[];
}

export interface ClubSearchResult {
  id: string;
  name: string;
  slug: string;
  citySlug: string;
  cityName: string;
  ladderCount: number;
}

/**
 * Every visible club across every city, with enough city context to link
 * straight to it and to filter by search query. Clubs with no players are
 * still shown -- ClubCard renders a "No ladder yet" label for them -- so
 * a player who hears about a club by word of mouth can still find it and
 * be the first to join. Test Club remains hidden by name.
 */
export async function getAllClubsWithCity(): Promise<ClubSearchResult[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clubs")
    .select("id, name, slug, ladders(id, ladder_players(count)), cities(name, slug)")
    .order("name");

  if (error) throw error;

  const rows = (data ?? []) as any[];

  return rows
    .filter((row) => !HIDDEN_CLUB_NAMES.has(row.name))
    .map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      citySlug: row.cities?.slug ?? "",
      cityName: row.cities?.name ?? "",
      ladderCount: row.ladders?.length ?? 0,
    }));
}

export async function getClubBySlug(citySlug: string, clubSlug: string) {
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

export async function createClub(input: {
  city_id: string;
  name: string;
  slug: string;
  description?: string;
  address?: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clubs")
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}
