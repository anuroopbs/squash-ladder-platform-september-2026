import { createClient } from "@/lib/supabase/server";
import type { ClubWithLadderCount } from "@/lib/types/database";

export async function getClubsByCitySlug(
  citySlug: string
): Promise<ClubWithLadderCount[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clubs")
    .select("*, ladders(count), cities!inner(slug)")
    .eq("cities.slug", citySlug)
    .order("name");

  if (error) throw error;
  return (data ?? []) as unknown as ClubWithLadderCount[];
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
