"use client";

import { useState } from "react";

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

interface AllLaddersProps {
  ladders: Ladder[];
}

export function AllLadders({ ladders }: AllLaddersProps) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = q
    ? ladders.filter(
        (l) =>
          l.clubName.toLowerCase().includes(q) ||
          l.cityName.toLowerCase().includes(q) ||
          l.name.toLowerCase().includes(q)
      )
    : ladders;

  return (
    <section className="mt-12" id="ladders">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">All Ladders</h2>
          <p className="mt-1 text-sm text-white/50">
            Search your club and join instantly.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search club or city..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 pl-10 text-sm text-white placeholder-white/30 outline-none focus:border-court-400/50 focus:ring-1 focus:ring-court-400/30"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
          <p className="text-sm text-white/50">
            No ladders found for &ldquo;{query}&rdquo;.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ladder) => (
            <LadderCard key={ladder.id} ladder={ladder} />
          ))}
        </div>
      )}
    </section>
  );
}

function LadderCard({ ladder }: { ladder: Ladder }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20 hover:bg-white/[0.06]">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium text-white">{ladder.clubName}</h3>
          <p className="truncate text-xs text-white/40">{ladder.cityName}</p>
        </div>
        <span className="shrink-0 rounded-md bg-court-500/10 px-2 py-1 text-xs font-medium text-court-300 ring-1 ring-court-500/20">
          {ladder.playerCount}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <a
          href={`/${ladder.citySlug}/${ladder.clubSlug}`}
          className="flex-1 rounded-lg bg-white/[0.06] px-3 py-2.5 text-center text-sm font-medium text-white/80 transition hover:bg-white/[0.1]"
        >
          View
        </a>
        <a
          href={`/${ladder.citySlug}/${ladder.clubSlug}?join=true`}
          className="flex-1 rounded-lg bg-court-500 px-3 py-2.5 text-center text-sm font-medium text-white transition hover:bg-court-400"
        >
          Join
        </a>
      </div>
    </div>
  );
}
