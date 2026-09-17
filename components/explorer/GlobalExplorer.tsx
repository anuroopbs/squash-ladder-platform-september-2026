"use client";

import { useMemo, useState } from "react";
import type { CityWithClubCount } from "@/lib/types/database";
import { CitySearchBar } from "./CitySearchBar";
import { CityCardGrid } from "./CityCardGrid";

export function GlobalExplorer({ cities }: { cities: CityWithClubCount[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter(
      (city) =>
        city.name.toLowerCase().includes(q) ||
        city.country.toLowerCase().includes(q)
    );
  }, [cities, query]);

  const totalClubs = cities.reduce(
    (sum, city) => sum + (city.clubs?.[0]?.count ?? 0),
    0
  );

  return (
    <div>
      <div className="mx-auto max-w-xl">
        <CitySearchBar value={query} onChange={setQuery} />
      </div>

      <div className="mt-6 flex items-center justify-between text-sm text-white/40">
        <span>
          {cities.length} {cities.length === 1 ? "city" : "cities"}
          {totalClubs > 0 &&
            ` · ${totalClubs} ${totalClubs === 1 ? "club" : "clubs"}`}
        </span>
      </div>

      <div className="mt-4">
        <CityCardGrid cities={filtered} />
      </div>

      <div className="mt-10 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
        <p className="text-sm text-white/50">
          Don&apos;t see your city or club? Message us and we&apos;ll set it up for you.
        </p>
        <a
          href="https://www.instagram.com/dublinsquashmentor/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15"
        >
          📩 Message us on Instagram @dublinsquashmentor
        </a>
      </div>
    </div>
  );
}
