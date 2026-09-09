import { getCities } from "@/lib/queries/cities";
import { GlobalExplorer } from "@/components/explorer/GlobalExplorer";

export const revalidate = 60;

export default async function HomePage() {
  const cities = await getCities();

  return (
    <main className="relative mx-auto max-w-6xl px-6 py-16 sm:py-24">
      <div className="bg-grid-fade pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] [background-size:24px_24px]" />

      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/60">
          🌍 Live in {cities.length} {cities.length === 1 ? "city" : "cities"}
        </span>
        <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Find your local ladder.
        </h1>
        <p className="mt-4 text-balance text-lg text-white/55">
          Pick your city, pick your club, and see where you rank. Challenge
          players, report scores, and climb — wherever in the world you play.
        </p>
      </div>

      <div className="mt-12">
        <GlobalExplorer cities={cities} />
      </div>
    </main>
  );
}
