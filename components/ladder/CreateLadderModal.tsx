"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { toUserMessage } from "@/lib/errors";
import type { City, ClubWithLadderCount, LadderSport } from "@/lib/types/database";

interface CreateLadderModalProps {
  onClose: () => void;
  /** Pre-select a city (e.g. opened from a city page). */
  presetCityId?: string;
  /** Pre-select a club (e.g. opened from an empty club page). */
  presetClubId?: string;
}

const NEW_CITY = "__new_city__";
const NEW_CLUB = "__new_club__";

const SPORTS: { value: LadderSport; label: string }[] = [
  { value: "squash", label: "Squash" },
  { value: "padel", label: "Padel" },
  { value: "racquetball", label: "Racquetball" },
  { value: "other", label: "Other" },
];

export function CreateLadderModal({ onClose, presetCityId, presetClubId }: CreateLadderModalProps) {
  const router = useRouter();
  const supabase = createClient();

  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [clubs, setClubs] = useState<ClubWithLadderCount[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [loadingClubs, setLoadingClubs] = useState(false);

  const [cityChoice, setCityChoice] = useState<string>(presetCityId ?? "");
  const [newCityName, setNewCityName] = useState("");
  const [newCountry, setNewCountry] = useState("");

  const [clubChoice, setClubChoice] = useState<string>(presetClubId ?? "");
  const [newClubName, setNewClubName] = useState("");
  const [newClubAddress, setNewClubAddress] = useState("");

  const [ladderName, setLadderName] = useState("");
  const [sport, setSport] = useState<LadderSport>("squash");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ citySlug: string; clubSlug: string } | null>(null);

  // Load cities + check auth on mount
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setSignedIn(!!user);

      const { data } = await supabase.from("cities").select("*").order("name");
      setCities(data ?? []);
      setLoadingCities(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load clubs whenever an existing city is chosen
  useEffect(() => {
    if (!cityChoice || cityChoice === NEW_CITY) {
      setClubs([]);
      return;
    }
    setLoadingClubs(true);
    (async () => {
      const { data } = await supabase
        .from("clubs")
        .select("*, ladders(count)")
        .eq("city_id", cityChoice)
        .order("name");
      setClubs((data ?? []) as ClubWithLadderCount[]);
      setLoadingClubs(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityChoice]);

  const isNewCity = cityChoice === NEW_CITY;
  const isNewClub = clubChoice === NEW_CLUB || (isNewCity && !presetClubId);

  const canSubmit =
    ladderName.trim().length > 0 &&
    (isNewCity ? newCityName.trim().length > 0 && newCountry.trim().length > 0 : !!cityChoice) &&
    (isNewClub ? newClubName.trim().length > 0 : !!clubChoice);

  async function handleSubmit() {
    setError(null);

    if (!signedIn) {
      window.location.href = "/login?returnTo=/";
      return;
    }

    setSubmitting(true);
    try {
      const { data, error: rpcError } = await supabase.rpc("create_ladder_full", {
        p_city_id: isNewCity ? null : cityChoice || null,
        p_city_name: isNewCity ? newCityName.trim() : null,
        p_country: isNewCity ? newCountry.trim() : null,
        p_club_id: isNewClub ? null : clubChoice || null,
        p_club_name: isNewClub ? newClubName.trim() : null,
        p_club_address: isNewClub ? newClubAddress.trim() || null : null,
        p_ladder_name: ladderName.trim(),
        p_sport: sport,
      });

      if (rpcError) throw rpcError;
      const row = Array.isArray(data) ? data[0] : data;
      setSuccess({ citySlug: row.out_city_slug, clubSlug: row.out_club_slug });
      router.refresh();
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1b26] p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-court-500/15 text-2xl ring-1 ring-inset ring-court-500/30">
            🏆
          </div>
          <h3 className="mt-4 text-lg font-semibold text-white">Ladder created!</h3>
          <p className="mt-2 text-sm text-white/60">
            You&apos;ve been added as its first member at rank #1. Share the QR code
            or link to get others to join.
          </p>
          <a
            href={`/${success.citySlug}/${success.clubSlug}`}
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-court-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-court-400"
          >
            View my new ladder →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1b26] p-6 my-8">
        <h3 className="text-lg font-semibold text-white">Create a Ladder</h3>
        <p className="mt-2 text-sm text-white/60">
          Don&apos;t see your city or club? Create it in a few taps — you&apos;ll be
          the first player on the ladder.
        </p>

        {signedIn === false && (
          <div className="mt-4 rounded-lg bg-yellow-500/10 px-3 py-2 text-sm text-yellow-300">
            You&apos;ll need to sign in to finish creating a ladder — you can fill
            this out first.
          </div>
        )}

        <div className="mt-5 space-y-4">
          {/* City */}
          <div className="space-y-1.5">
            <label className="block text-sm text-white/60">City</label>
            {loadingCities ? (
              <div className="h-12 animate-pulse rounded-xl bg-white/5" />
            ) : (
              <select
                value={cityChoice}
                onChange={(e) => {
                  setCityChoice(e.target.value);
                  setClubChoice("");
                }}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-base text-white outline-none transition focus:border-court-400/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-court-400/20"
              >
                <option value="" disabled>
                  Select a city…
                </option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}, {c.country}
                  </option>
                ))}
                <option value={NEW_CITY}>+ Add a new city</option>
              </select>
            )}
          </div>

          {isNewCity && (
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="City name"
                placeholder="e.g. Bangalore"
                value={newCityName}
                onChange={(e) => setNewCityName(e.target.value)}
              />
              <Input
                label="Country"
                placeholder="e.g. India"
                value={newCountry}
                onChange={(e) => setNewCountry(e.target.value)}
              />
            </div>
          )}

          {/* Club — only once a city is resolved */}
          {(cityChoice || isNewCity) && (isNewCity ? newCityName.trim() : true) && (
            <div className="space-y-1.5">
              <label className="block text-sm text-white/60">Club</label>
              {isNewCity ? (
                <div className="rounded-lg bg-white/[0.03] px-3 py-2 text-sm text-white/50">
                  New city — you&apos;ll also create the first club below.
                </div>
              ) : loadingClubs ? (
                <div className="h-12 animate-pulse rounded-xl bg-white/5" />
              ) : (
                <select
                  value={clubChoice}
                  onChange={(e) => setClubChoice(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-base text-white outline-none transition focus:border-court-400/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-court-400/20"
                >
                  <option value="" disabled>
                    Select a club…
                  </option>
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  <option value={NEW_CLUB}>+ Add a new club</option>
                </select>
              )}
            </div>
          )}

          {isNewClub && (cityChoice || isNewCity) && (
            <div className="space-y-3">
              <Input
                label="Club name"
                placeholder="e.g. Koramangala Squash Club"
                value={newClubName}
                onChange={(e) => setNewClubName(e.target.value)}
              />
              <Input
                label="Address (optional)"
                placeholder="Street, area"
                value={newClubAddress}
                onChange={(e) => setNewClubAddress(e.target.value)}
              />
            </div>
          )}

          {/* Ladder name + sport — always visible once city/club resolved */}
          {(cityChoice || isNewCity) && (
            <>
              <Input
                label="Ladder name"
                placeholder="e.g. Open Ranking"
                value={ladderName}
                onChange={(e) => setLadderName(e.target.value)}
                helper="Shown to players, e.g. &quot;Open Ranking&quot; or &quot;Men's Ladder&quot;"
              />

              <div className="space-y-1.5">
                <label className="block text-sm text-white/60">Sport</label>
                <div className="flex flex-wrap gap-2">
                  {SPORTS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setSport(s.value)}
                      className={`rounded-lg px-3 py-2 text-sm transition ${
                        sport === s.value
                          ? "bg-court-500 text-white"
                          : "bg-white/5 text-white/60 hover:bg-white/10"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting} disabled={!canSubmit}>
            Create Ladder
          </Button>
        </div>
      </div>
    </div>
  );
}
