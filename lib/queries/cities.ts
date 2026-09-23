import { createClient } from "@/lib/supabase/server";
import type { CityWithClubCount } from "@/lib/types/database";

export async function getCities(): Promise<CityWithClubCount[]> {
  const supabase = createClient();
  // Pull clubs with their ladder/player counts so the visible-club count
  // (excluding test data and zero-player clubs, same rule as the city
  // page) can be computed here instead of the raw total -- otherwise the
  // homepage would advertise clubs that then don't even show up once you
  // click into that city.
  const { data, error } = await supabase
    .from("cities")
    .select("*, clubs(name, ladders(id, ladder_players(count)))")
    .order("name");

  if (error) throw error;
  const rows = (data ?? []) as any[];

  const HIDDEN_CLUB_NAMES = new Set(["Test Club"]);
  const cities: CityWithClubCount[] = rows.map((row) => {
    const visibleClubCount = (row.clubs ?? []).filter((club: any) => {
      if (HIDDEN_CLUB_NAMES.has(club.name)) return false;
      return (club.ladders ?? []).some(
        (l: any) => (l.ladder_players?.[0]?.count ?? 0) > 0
      );
    }).length;

    return {
      ...row,
      clubs: [{ count: visibleClubCount }],
    };
  });

  // Pin Secunderabad/Hyderabad first (user's home city), rest stay
  // alphabetical. No manual sort_order column on cities yet -- if more
  // pinned cities are needed later, add a sort_order int column instead
  // of growing this list.
  const pinnedSlug = "hyderabad";
  return [
    ...cities.filter((c) => c.slug === pinnedSlug),
    ...cities.filter((c) => c.slug !== pinnedSlug),
  ];
}

export async function getCityBySlug(citySlug: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cities")
    .select("*")
    .eq("slug", citySlug)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createCity(input: {
  name: string;
  slug: string;
  country: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cities")
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}
