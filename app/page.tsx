import { getCities } from "@/lib/queries/cities";
import { GlobalExplorer } from "@/components/explorer/GlobalExplorer";
import { LadderSidebar } from "@/components/home/LadderSidebar";
import { HowItWorks } from "@/components/home/HowItWorks";
import { VisionSection } from "@/components/home/VisionSection";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 60;

interface LadderPreview {
  citySlug: string;
  cityName: string;
  clubSlug: string;
  clubName: string;
  ladderName: string;
  players: { rank: number; name: string }[];
}

async function getLadderPreviews(): Promise<LadderPreview[]> {
  const supabase = createClient();
  const { data: standings } = await supabase
    .from("ladder_standings")
    .select("*")
    .order("rank");

  if (!standings) return [];

  const ladderMap = new Map<string, LadderPreview>();
  for (const row of standings) {
    const key = `${row.club_slug}-${row.ladder_name}`;
    if (!ladderMap.has(key)) {
      ladderMap.set(key, {
        citySlug: row.city_slug,
        cityName: row.city_name,
        clubSlug: row.club_slug,
        clubName: row.club_name,
        ladderName: row.ladder_name,
        players: [],
      });
    }
    const preview = ladderMap.get(key)!;
    if (preview.players.length < 5) {
      preview.players.push({ rank: row.rank, name: row.display_name });
    }
  }
  return Array.from(ladderMap.values());
}

export default async function HomePage() {
  const cities = await getCities();
  const ladderPreviews = await getLadderPreviews();

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 sm:py-16">
      {/* Hero Section */}
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/60">
          🌍 Live in {cities.length} {cities.length === 1 ? "city" : "cities"}
        </span>
        <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Find your local ladder.
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-balance text-lg text-white/55">
          Pick your city, pick your club, and see where you rank. Challenge
          players, report scores, and climb — wherever in the world you play.
        </p>
      </div>

      {/* Main Content: Explorer + Ladder Sidebar */}
      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <GlobalExplorer cities={cities} />
        </div>
        <div className="hidden lg:block">
          <LadderSidebar previews={ladderPreviews} />
        </div>
      </div>

      {/* Mobile Ladder Rankings */}
      <div className="mt-8 lg:hidden">
        <LadderSidebar previews={ladderPreviews} />
      </div>

      {/* How It Works */}
      <HowItWorks />

      {/* Vision */}
      <VisionSection />

      {/* Footer */}
      <footer className="mt-16 border-t border-white/10 pt-8 text-center">
        <p className="text-sm text-white/40">
          Built with ❤️ for the squash community. Play fair, climb high, make friends.
        </p>
      </footer>
    </div>
  );
}
