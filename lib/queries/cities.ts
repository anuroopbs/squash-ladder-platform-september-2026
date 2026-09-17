import { createClient } from "@/lib/supabase/server";
import type { CityWithClubCount } from "@/lib/types/database";

export async function getCities(): Promise<CityWithClubCount[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cities")
    .select("*, clubs(count)")
    .order("name");

  if (error) throw error;
  const cities = (data ?? []) as CityWithClubCount[];

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
