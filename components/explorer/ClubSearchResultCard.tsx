import Link from "next/link";
import type { ClubSearchResult } from "@/lib/queries/clubs";

/**
 * Shown when a homepage search matches a club directly (not just its
 * city) -- links straight to the club page rather than making the
 * player go city -> club when they already typed the club's name.
 */
export function ClubSearchResultCard({ club }: { club: ClubSearchResult }) {
  return (
    <Link
      href={`/${club.citySlug}/${club.slug}`}
      className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-court-400/30 hover:bg-white/[0.06]"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-court-500/15 text-lg ring-1 ring-inset ring-court-500/30">
        🏆
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold text-white">{club.name}</h3>
        <p className="truncate text-xs text-white/40">{club.cityName}</p>
      </div>
      <span className="shrink-0 flex items-center gap-1 text-sm font-medium text-white/80 transition group-hover:gap-2 group-hover:text-white">
        Open <span aria-hidden>→</span>
      </span>
    </Link>
  );
}
