import { getCities } from "@/lib/queries/cities";
import { GlobalExplorer } from "@/components/explorer/GlobalExplorer";
import { AllLadders } from "@/components/home/AllLadders";
import { HowItWorks } from "@/components/home/HowItWorks";
import { VisionSection } from "@/components/home/VisionSection";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { PWAInstaller } from "@/components/ui/PWAInstaller";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 60;

interface Ladder {
  id: string;
  name: string;
  slug: string;
  clubId: string;
  clubName: string;
  clubSlug: string;
  cityName: string;
  citySlug: string;
  playerCount: number;
}

async function getAllLadders(): Promise<Ladder[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("ladders")
    .select(
      "id, name, slug, club_id, clubs (name, slug, cities (name, slug)), ladder_players (count)"
    )
    .order("created_at");

  if (error || !data) return [];

  const result: Ladder[] = [];

  for (const row of data) {
    const ladder = row as any;
    result.push({
      id: ladder.id,
      name: ladder.name,
      slug: ladder.slug,
      clubId: ladder.club_id,
      clubName: ladder.clubs?.name ?? "Unknown Club",
      clubSlug: ladder.clubs?.slug ?? "",
      cityName: ladder.clubs?.cities?.name ?? "Unknown City",
      citySlug: ladder.clubs?.cities?.slug ?? "",
      playerCount: ladder.ladder_players?.[0]?.count ?? 0,
    });
  }

  // Sort by playerCount descending (most players first)
  result.sort((a, b) => b.playerCount - a.playerCount);

  return result;
}

export default async function HomePage() {
  const cities = await getCities();
  const ladders = await getAllLadders();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 pb-24 sm:pb-16">
      {/* Hero Section */}
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/60">
          🌍 Live in {cities.length} {cities.length === 1 ? "city" : "cities"}
        </span>
        <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Find your local ladder.
        </h1>
        <p className="mt-4 mx-auto max-w-2xl text-balance text-lg text-white/55">
          Pick your city, pick your club, and see where you rank. Challenge
          players, report scores, and climb — wherever in the world you play.
        </p>
      </div>

      {/* Main Content: Explorer (left) + All Ladders (right) */}
      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px]">
        {/* Left: City Explorer */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Explore Cities</h2>
          <GlobalExplorer cities={cities} />
        </div>

        {/* Right: All Ladders with search */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <AllLadders ladders={ladders} />
        </div>
      </div>

      {/* How It Works */}
      <HowItWorks />

      {/* Vision */}
      <VisionSection />

      {/* Footer */}
      <footer className="mt-16 border-t border-white/10 pt-8 text-center">
        <p className="text-sm text-white/40">
          Built with ❤️ for the squash community. Play fair, climb high, make
          friends.
        </p>
      </footer>

      {/* Floating UI */}
      <ScrollToTop />
      <PWAInstaller />
    </div>
  );
}
