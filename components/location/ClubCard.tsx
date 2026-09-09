import Link from "next/link";
import type { ClubWithLadderCount } from "@/lib/types/database";

export function ClubCard({
  club,
  citySlug,
}: {
  club: ClubWithLadderCount;
  citySlug: string;
}) {
  const ladderCount = club.ladders?.[0]?.count ?? 0;

  return (
    <Link
      href={`/${citySlug}/${club.slug}`}
      className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition duration-200 hover:-translate-y-1 hover:border-court-400/30 hover:bg-white/[0.06]"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-court-500/15 text-lg ring-1 ring-inset ring-court-500/30">
          🏸
        </div>
        <div>
          <h3 className="font-semibold text-white">{club.name}</h3>
          {club.address && (
            <p className="text-xs text-white/40">{club.address}</p>
          )}
        </div>
      </div>

      {club.description && (
        <p className="mt-4 line-clamp-2 text-sm text-white/55">
          {club.description}
        </p>
      )}

      <div className="mt-auto pt-5 flex items-center justify-between text-sm">
        <span className="text-white/50">
          {ladderCount === 0
            ? "No ladder yet"
            : `${ladderCount} active ${ladderCount === 1 ? "ladder" : "ladders"}`}
        </span>
        <span className="flex items-center gap-1 font-medium text-white/80 transition group-hover:gap-2 group-hover:text-white">
          Open <span aria-hidden>→</span>
        </span>
      </div>
    </Link>
  );
}
