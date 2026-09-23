import { createClient } from "@/lib/supabase/server";
import type { CityWithClubCount } from "@/lib/types/database";

export async function getCities(): Promise<CityWithClubCount[]> {
  const supabase = createClient();
  // Count all clubs per city except Test Club. City cards show empty
  // ladders with "No ladder yet" label so players can still discover them.
  const { data, error } = await supabase
    .from("cities")
    .select("*, clubs(name, ladders(id, ladder_players(count)))")
    .order("name");

  if (error) throw error;
  const rows = (data ?? []) as any[];

  const HIDDEN_CLUB_NAMES = new Set(["Test Club"]);
  const cities: CityWithClubCount[] = rows.map((row) => {
    const visibleClubCount = (row.clubs ?? []).filter(
      (club: any) => !HIDDEN_CLUB_NAMES.has(club.name)
    ).length;

    return {
      ...row,
      clubs: [{ count: visibleClubCount }],
    };
  });

  // Pin Secunderabad/Hyderabad first (user's home city), rest stay alphabetical.
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
