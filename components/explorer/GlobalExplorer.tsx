"use client";

import { useMemo, useState } from "react";
import type { CityWithClubCount } from "@/lib/types/database";
import type { ClubSearchResult } from "@/lib/queries/clubs";
import { CitySearchBar } from "./CitySearchBar";
import { CityCardGrid } from "./CityCardGrid";
import { ClubSearchResultCard } from "./ClubSearchResultCard";
import { Button } from "@/components/ui/Button";
import { CreateLadderModal } from "@/components/ladder/CreateLadderModal";

interface GlobalExplorerProps {
  cities: CityWithClubCount[];
  clubs: ClubSearchResult[];
}

// Phase 2 simplification: the homepage used to show a side-by-side
// "All Ladders" panel (its own scroll box, separate from the city
// explorer) alongside this. That's gone now -- the flow is choose a
// city -> see its clubs -> open a club, with ONE search box here that
// searches both cities and clubs, so a player who types a club name
// directly still finds it instead of only ever being able to filter by
// city name.
export function GlobalExplorer({ cities, clubs }: GlobalExplorerProps) {
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const q = query.trim().toLowerCase();

  const filteredCities = useMemo(() => {
    if (!q) return cities;
    return cities.filter(
      (city) =>
        city.name.toLowerCase().includes(q) ||
        city.country.toLowerCase().includes(q)
    );
  }, [cities, q]);

  const matchedClubs = useMemo(() => {
    if (!q) return [];
    return clubs.filter(
      (club) =>
        club.name.toLowerCase().includes(q) ||
        club.cityName.toLowerCase().includes(q)
    );
  }, [clubs, q]);

  const totalClubs = cities.reduce(
    (sum, city) => sum + (city.clubs?.[0]?.count ?? 0),
    0
  );

  const noResults = q && filteredCities.length === 0 && matchedClubs.length === 0;

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

      {noResults ? (
        <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
          <p className="text-sm text-white/50">
            No city or club matches &ldquo;{query}&rdquo;.
          </p>
        </div>
      ) : (
        <>
          {matchedClubs.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-white/40">
                Clubs matching &ldquo;{query}&rdquo;
              </h3>
              <div className="space-y-2">
                {matchedClubs.map((club) => (
                  <ClubSearchResultCard key={club.id} club={club} />
                ))}
              </div>
            </div>
          )}

          <div className="mt-4">
            <CityCardGrid cities={filteredCities} />
          </div>
        </>
      )}

      <div className="mt-10 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
        <p className="text-sm text-white/50">
          Don&apos;t see your city or club?
        </p>
        <Button onClick={() => setCreateOpen(true)} className="mt-3">
          🏆 Create a Ladder
        </Button>
      </div>

      {createOpen && <CreateLadderModal onClose={() => setCreateOpen(false)} />}
    </div>
  );
}
