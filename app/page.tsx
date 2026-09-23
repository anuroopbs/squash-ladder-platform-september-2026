import { getCities } from "@/lib/queries/cities";
import { getAllClubsWithCity } from "@/lib/queries/clubs";
import { GlobalExplorer } from "@/components/explorer/GlobalExplorer";
import { HowItWorks } from "@/components/home/HowItWorks";
import { VisionSection } from "@/components/home/VisionSection";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { PWAInstaller } from "@/components/ui/PWAInstaller";
import { SupportContact } from "@/components/ui/SupportContact";

export const revalidate = 60;

export default async function HomePage() {
  const [cities, clubs] = await Promise.all([getCities(), getAllClubsWithCity()]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 pb-24 sm:pb-16">
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
        <p className="mt-4 text-sm text-white/45">
          Need help getting started, or found something broken?{" "}
          <a
            href="https://www.instagram.com/dublinsquashmentor/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-court-300 hover:text-court-200"
          >
            📩 Message us @dublinsquashmentor
          </a>
        </p>
      </div>

      {/* Simplified flow: choose a city -> see its clubs -> open a club.
          One search box covers both cities and clubs directly. */}
      <div className="mt-12">
        <GlobalExplorer cities={cities} clubs={clubs} />
      </div>

      {/* How It Works */}
      <HowItWorks />

      {/* Vision */}
      <VisionSection />

      {/* Footer */}
      <footer className="mt-6 border-t border-white/10 pt-8 text-center">
        <p className="text-sm text-white/40">
          Built with ❤️ for the squash community. Play fair, climb high, make
          friends.
        </p>
        <SupportContact />
      </footer>

      {/* Floating UI */}
      <ScrollToTop />
      <PWAInstaller />
    </div>
  );
}

