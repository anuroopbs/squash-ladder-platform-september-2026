import Link from "next/link";
import type { CityWithClubCount } from "@/lib/types/database";

const GRADIENTS = [
  "from-court-600/40 via-court-800/20 to-transparent",
  "from-ember-600/40 via-ember-800/20 to-transparent",
  "from-sky-600/40 via-sky-800/20 to-transparent",
  "from-fuchsia-600/30 via-fuchsia-800/15 to-transparent",
];

function gradientFor(seed: string) {
  const hash = Array.from(seed).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return GRADIENTS[hash % GRADIENTS.length];
}

export function CityCard({ city }: { city: CityWithClubCount }) {
  const clubCount = city.clubs?.[0]?.count ?? 0;

  return (
    <Link
      href={`/${city.slug}`}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition duration-200 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06]"
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradientFor(
          city.name
        )} opacity-70 transition group-hover:opacity-100`}
        aria-hidden
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl font-semibold tracking-tight text-white">
            {city.name}
          </h3>
          <span className="mt-1 shrink-0 text-xs font-medium uppercase tracking-wide text-white/40">
            {city.country}
          </span>
        </div>
        <p className="mt-3 text-sm text-white/60">
          {clubCount === 0
            ? "No clubs yet — be the first"
            : `${clubCount} ${clubCount === 1 ? "club" : "clubs"} on the ladder`}
        </p>
        <div className="mt-6 flex items-center gap-1.5 text-sm font-medium text-white/80 transition group-hover:gap-2.5 group-hover:text-white">
          View clubs
          <span aria-hidden>→</span>
        </div>
      </div>
    </Link>
  );
}
