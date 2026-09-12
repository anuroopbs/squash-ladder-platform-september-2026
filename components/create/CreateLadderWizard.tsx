"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/slugify";
import type { City, Club, LadderSport } from "@/lib/types/database";

type AuthState = "checking" | "signed-out" | "signed-in";
type Step = "city" | "club" | "ladder" | "existing-ladder" | "done";

const SPORTS: { value: LadderSport; label: string }[] = [
  { value: "squash", label: "Squash" },
  { value: "padel", label: "Padel" },
  { value: "racquetball", label: "Racquetball" },
  { value: "other", label: "Other" },
];

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-court-400/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-court-400/20";
const primaryButtonClass =
  "rounded-xl bg-court-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-court-400 disabled:cursor-not-allowed disabled:opacity-60";
const ghostButtonClass =
  "rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold text-white/80 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-60";
const toggleClass = (active: boolean) =>
  `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
    active ? "bg-court-500 text-white" : "bg-white/[0.04] text-white/60 hover:text-white"
  }`;

export function CreateLadderWizard() {
  const searchParams = useSearchParams();
  const prefCitySlug = searchParams.get("city") || "";

  const [auth, setAuth] = useState<AuthState>("checking");
  const [userId, setUserId] = useState<string | null>(null);

  const [step, setStep] = useState<Step>("city");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [cities, setCities] = useState<City[]>([]);
  const [cityMode, setCityMode] = useState<"choose" | "new">("choose");
  const [selectedCityId, setSelectedCityId] = useState("");
  const [newCityName, setNewCityName] = useState("");
  const [newCityCountry, setNewCityCountry] = useState("");

  const [resolvedCity, setResolvedCity] = useState<{ id: string; name: string; slug: string } | null>(null);

  const [clubs, setClubs] = useState<Club[]>([]);
  const [clubMode, setClubMode] = useState<"choose" | "new">("new");
  const [selectedClubId, setSelectedClubId] = useState("");
  const [newClubName, setNewClubName] = useState("");
  const [newClubAddress, setNewClubAddress] = useState("");
  const [newClubDescription, setNewClubDescription] = useState("");

  const [resolvedClub, setResolvedClub] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [existingLadder, setExistingLadder] = useState<{ id: string; name: string } | null>(null);

  const [ladderName, setLadderName] = useState("Main Ladder");
  const [ladderSport, setLadderSport] = useState<LadderSport>("squash");
  const [ladderDescription, setLadderDescription] = useState("");

  const [createdPath, setCreatedPath] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (!user) {
        setAuth("signed-out");
        return;
      }

      setUserId(user.id);
      setAuth("signed-in");

      const { data } = await supabase.from("cities").select("*").order("name");
      if (cancelled || !data) return;

      setCities(data as City[]);

      if (prefCitySlug) {
        const match = (data as City[]).find((c) => c.slug === prefCitySlug);
        if (match) {
          setSelectedCityId(match.id);
          setCityMode("choose");
        }
      }
    }

    check();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadClubsForCity(cityId: string) {
    const supabase = createClient();
    const { data } = await supabase.from("clubs").select("*").eq("city_id", cityId).order("name");
    setClubs((data ?? []) as Club[]);
  }

  async function handleCityContinue() {
    setError(null);
    setBusy(true);
    const supabase = createClient();

    try {
      if (cityMode === "choose") {
        const city = cities.find((c) => c.id === selectedCityId);
        if (!city) {
          setError("Pick a city, or switch to add a new one.");
          setBusy(false);
          return;
        }
        setResolvedCity({ id: city.id, name: city.name, slug: city.slug });
        await loadClubsForCity(city.id);
        setClubMode("new");
        setStep("club");
      } else {
        const name = newCityName.trim();
        const country = newCityCountry.trim();
        if (!name || !country) {
          setError("Enter both a city name and country.");
          setBusy(false);
          return;
        }
        const slug = slugify(name);

        // Someone may have already added this city — reuse it rather than erroring.
        const { data: existing } = await supabase.from("cities").select("*").eq("slug", slug).maybeSingle();

        if (existing) {
          setResolvedCity({ id: existing.id, name: existing.name, slug: existing.slug });
          await loadClubsForCity(existing.id);
        } else {
          const { data: created, error: insertError } = await supabase
            .from("cities")
            .insert({ name, slug, country, created_by: userId })
            .select()
            .single();

          if (insertError || !created) throw insertError ?? new Error("Could not create that city.");

          setResolvedCity({ id: created.id, name: created.name, slug: created.slug });
          setClubs([]);
        }
        setClubMode("new");
        setStep("club");
      }
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong creating that city.");
    } finally {
      setBusy(false);
    }
  }

  async function handleClubContinue() {
    if (!resolvedCity) return;
    setError(null);
    setBusy(true);
    const supabase = createClient();

    try {
      let club: { id: string; name: string; slug: string };

      if (clubMode === "choose") {
        const found = clubs.find((c) => c.id === selectedClubId);
        if (!found) {
          setError("Pick a club, or switch to add a new one.");
          setBusy(false);
          return;
        }
        club = { id: found.id, name: found.name, slug: found.slug };
      } else {
        const name = newClubName.trim();
        if (!name) {
          setError("Enter a club name.");
          setBusy(false);
          return;
        }
        const slug = slugify(name);

        const { data: existing } = await supabase
          .from("clubs")
          .select("*")
          .eq("city_id", resolvedCity.id)
          .eq("slug", slug)
          .maybeSingle();

        if (existing) {
          club = { id: existing.id, name: existing.name, slug: existing.slug };
        } else {
          const { data: created, error: insertError } = await supabase
            .from("clubs")
            .insert({
              city_id: resolvedCity.id,
              name,
              slug,
              address: newClubAddress.trim() || null,
              description: newClubDescription.trim() || null,
              created_by: userId,
            })
            .select()
            .single();

          if (insertError || !created) throw insertError ?? new Error("Could not create that club.");

          club = { id: created.id, name: created.name, slug: created.slug };
        }
      }

      setResolvedClub(club);

      // v1 shows one active ladder per club — if it already has one, send the
      // player straight there instead of quietly creating a confusing second one.
      const { data: activeLadder } = await supabase
        .from("ladders")
        .select("id, name")
        .eq("club_id", club.id)
        .eq("is_active", true)
        .order("created_at")
        .limit(1)
        .maybeSingle();

      if (activeLadder) {
        setExistingLadder(activeLadder as { id: string; name: string });
        setStep("existing-ladder");
      } else {
        setStep("ladder");
      }
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong creating that club.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateLadder() {
    if (!resolvedCity || !resolvedClub || !userId) return;
    setError(null);
    setBusy(true);
    const supabase = createClient();

    try {
      const name = ladderName.trim() || "Main Ladder";
      const slug = slugify(name);

      const { data: created, error: insertError } = await supabase
        .from("ladders")
        .insert({
          club_id: resolvedClub.id,
          name,
          slug,
          sport: ladderSport,
          description: ladderDescription.trim() || null,
          created_by: userId,
        })
        .select()
        .single();

      if (insertError || !created) throw insertError ?? new Error("Could not create the ladder.");

      // Claim rank #1 as the ladder's founding player.
      await supabase.from("ladder_players").insert({ ladder_id: created.id, player_id: userId, rank: 1 });

      setCreatedPath(`/${resolvedCity.slug}/${resolvedClub.slug}`);
      setStep("done");
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong creating that ladder.");
    } finally {
      setBusy(false);
    }
  }

  if (auth === "checking") return null;

  if (auth === "signed-out") {
    const next = "/create" + (prefCitySlug ? `?city=${encodeURIComponent(prefCitySlug)}` : "");
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <p className="text-lg font-bold text-white">Sign in to start a ladder</p>
        <p className="mt-1.5 text-sm text-white/60">
          Adding a city, club, or ladder takes an account, so we know who to credit as the founder.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link href={`/register?next=${encodeURIComponent(next)}`} className={primaryButtonClass}>
            Join free
          </Link>
          <Link href={`/login?next=${encodeURIComponent(next)}`} className={ghostButtonClass}>
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (step === "done" && createdPath) {
    return (
      <div className="rounded-2xl border border-court-500/30 bg-court-500/10 p-8 text-center">
        <p className="text-lg font-bold text-white">Your ladder is live</p>
        <p className="mt-1.5 text-sm text-white/70">You&apos;ve claimed rank #1. Time to defend it.</p>
        <Link href={createdPath} className={`${primaryButtonClass} mt-5 inline-block`}>
          Go to your ladder →
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-white/40">
        <span className={step === "city" ? "text-court-300" : ""}>1. City</span>
        <span>→</span>
        <span className={step === "club" ? "text-court-300" : ""}>2. Club</span>
        <span>→</span>
        <span className={step === "ladder" || step === "existing-ladder" ? "text-court-300" : ""}>3. Ladder</span>
      </div>

      {step === "city" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <button type="button" className={toggleClass(cityMode === "choose")} onClick={() => setCityMode("choose")}>
              Pick existing city
            </button>
            <button type="button" className={toggleClass(cityMode === "new")} onClick={() => setCityMode("new")}>
              + Add a new city
            </button>
          </div>

          {cityMode === "choose" ? (
            cities.length === 0 ? (
              <p className="text-sm text-white/50">No cities yet — add the first one.</p>
            ) : (
              <select
                value={selectedCityId}
                onChange={(e) => setSelectedCityId(e.target.value)}
                className={inputClass}
              >
                <option value="">Choose a city…</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}, {c.country}
                  </option>
                ))}
              </select>
            )
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={newCityName}
                onChange={(e) => setNewCityName(e.target.value)}
                placeholder="City name, e.g. Mumbai"
                className={inputClass}
              />
              <input
                type="text"
                value={newCityCountry}
                onChange={(e) => setNewCityCountry(e.target.value)}
                placeholder="Country"
                className={inputClass}
              />
            </div>
          )}

          {error && <p className="text-sm text-red-300">{error}</p>}

          <div>
            <button type="button" onClick={handleCityContinue} disabled={busy} className={primaryButtonClass}>
              {busy ? "Checking…" : "Continue"}
            </button>
          </div>
        </div>
      )}

      {step === "club" && resolvedCity && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-white/50">Club in {resolvedCity.name}</p>

          <div className="flex flex-wrap gap-2">
            <button type="button" className={toggleClass(clubMode === "choose")} onClick={() => setClubMode("choose")}>
              Pick existing club
            </button>
            <button type="button" className={toggleClass(clubMode === "new")} onClick={() => setClubMode("new")}>
              + Add a new club
            </button>
          </div>

          {clubMode === "choose" ? (
            clubs.length === 0 ? (
              <p className="text-sm text-white/50">No clubs in {resolvedCity.name} yet — add the first one.</p>
            ) : (
              <select
                value={selectedClubId}
                onChange={(e) => setSelectedClubId(e.target.value)}
                className={inputClass}
              >
                <option value="">Choose a club…</option>
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )
          ) : (
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={newClubName}
                onChange={(e) => setNewClubName(e.target.value)}
                placeholder="Club name"
                className={inputClass}
              />
              <input
                type="text"
                value={newClubAddress}
                onChange={(e) => setNewClubAddress(e.target.value)}
                placeholder="Address (optional)"
                className={inputClass}
              />
              <textarea
                value={newClubDescription}
                onChange={(e) => setNewClubDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className={inputClass}
              />
            </div>
          )}

          {error && <p className="text-sm text-red-300">{error}</p>}

          <div className="flex gap-2">
            <button type="button" onClick={() => setStep("city")} className={ghostButtonClass}>
              Back
            </button>
            <button type="button" onClick={handleClubContinue} disabled={busy} className={primaryButtonClass}>
              {busy ? "Checking…" : "Continue"}
            </button>
          </div>
        </div>
      )}

      {step === "existing-ladder" && resolvedCity && resolvedClub && existingLadder && (
        <div className="flex flex-col gap-4 text-center">
          <p className="text-sm text-white/70">
            {resolvedClub.name} already has a ladder, <strong>{existingLadder.name}</strong>. Join it instead of
            starting a duplicate.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href={`/${resolvedCity.slug}/${resolvedClub.slug}`} className={primaryButtonClass}>
              Go to {existingLadder.name} →
            </Link>
            <button type="button" onClick={() => setStep("club")} className={ghostButtonClass}>
              Pick a different club
            </button>
          </div>
        </div>
      )}

      {step === "ladder" && resolvedCity && resolvedClub && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-white/50">
            New ladder at {resolvedClub.name}, {resolvedCity.name}
          </p>

          <input
            type="text"
            value={ladderName}
            onChange={(e) => setLadderName(e.target.value)}
            placeholder="Ladder name"
            className={inputClass}
          />

          <select
            value={ladderSport}
            onChange={(e) => setLadderSport(e.target.value as LadderSport)}
            className={inputClass}
          >
            {SPORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <textarea
            value={ladderDescription}
            onChange={(e) => setLadderDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className={inputClass}
          />

          {error && <p className="text-sm text-red-300">{error}</p>}

          <div className="flex gap-2">
            <button type="button" onClick={() => setStep("city")} className={ghostButtonClass}>
              Back
            </button>
            <button type="button" onClick={handleCreateLadder} disabled={busy} className={primaryButtonClass}>
              {busy ? "Creating…" : "Create ladder"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
