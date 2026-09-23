import { createClient } from "@/lib/supabase/server";
import type { ClubWithLadderCount } from "@/lib/types/database";

// Clubs to always hide from public listings (homepage, city pages) even
// though they have real data -- seed/test data that shouldn't be shown
// to real players. Never deleted: still reachable via direct link or a
// printed QR code, this only filters what shows up in the browse flow.
const HIDDEN_CLUB_NAMES = new Set(["Test Club"]);

interface ClubWithLadderPlayers {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  city_id: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  ladders: { id: string; ladder_players: { count: number }[] }[];
}

/**
 * True if this club has at least one ladder with at least one player.
 * A club with zero players on every ladder isn't useful to show in the
 * public browse flow yet -- it's still fully reachable by direct link or
 * QR code once someone actually sets it up, per product decision not to
 * delete anything, just hide unfinished content from discovery.
 */
function hasAnyPlayers(club: ClubWithLadderPlayers): boolean {
  return club.ladders.some((l) => (l.ladder_players?.[0]?.count ?? 0) > 0);
}

function isVisible(club: { name: string } & ClubWithLadderPlayers): boolean {
  return !HIDDEN_CLUB_NAMES.has(club.name) && hasAnyPlayers(club);
}

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

  return clubs.filter(isVisible).map((c) => ({
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
 * straight to it and to filter by search query -- powers the homepage's
 * single combined city+club search (Phase 2: the old side-by-side
 * "All Ladders" panel is gone; this is how a club search still resolves
 * directly instead of only ever filtering cities). Hidden clubs (test
 * data, zero-player ladders) are excluded, same rule as city pages.
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
    .filter((row) => isVisible(row as ClubWithLadderPlayers))
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
