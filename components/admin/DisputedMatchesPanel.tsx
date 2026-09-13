"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DisputedMatch } from "@/lib/queries/disputes";

export function DisputedMatchesPanel({
  initialMatches,
  adminUserId,
}: {
  initialMatches: DisputedMatch[];
  adminUserId: string;
}) {
  const [matches, setMatches] = useState(initialMatches);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function winnerName(m: DisputedMatch) {
    if (m.winner_id === m.player1_id) return m.player1_name;
    if (m.winner_id === m.player2_id) return m.player2_name;
    return "Unknown player";
  }

  async function handleConfirm(matchId: string) {
    setError(null);
    setBusyId(matchId);
    const supabase = createClient();
    const { error } = await supabase
      .from("matches")
      .update({ status: "confirmed", confirmed_by: adminUserId })
      .eq("id", matchId);
    setBusyId(null);
    if (error) {
      setError(error.message);
      return;
    }
    setMatches((prev) => prev.filter((m) => m.id !== matchId));
  }

  async function handleReset(matchId: string) {
    setError(null);
    setBusyId(matchId);
    const supabase = createClient();
    const { error } = await supabase
      .from("matches")
      .update({ status: "pending_confirmation", confirmed_by: null })
      .eq("id", matchId);
    setBusyId(null);
    if (error) {
      setError(error.message);
      return;
    }
    setMatches((prev) => prev.filter((m) => m.id !== matchId));
  }

  if (matches.length === 0) {
    return (
      <p className="text-sm text-white/40">
        No disputed matches right now. New disputes will show up here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-red-300">{error}</p>}

      {matches.map((m) => (
        <div
          key={m.id}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-white">
              {m.player1_name} vs {m.player2_name}
            </p>
            <p className="text-xs text-white/40">
              {m.city_name} / {m.club_name} — {m.ladder_name}
            </p>
          </div>

          <div className="mt-2 text-xs text-white/60">
            <p>
              Reported score: <span className="text-white/80">{m.score}</span>{" "}
              (winner: {winnerName(m)})
            </p>
            <p className="mt-1">Reported by {m.reported_by_name}</p>
            <p className="mt-1 text-white/30">
              Played {new Date(m.played_at).toLocaleDateString()}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleConfirm(m.id)}
              disabled={busyId === m.id}
              className="rounded-xl bg-court-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-court-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyId === m.id ? "Working…" : "Confirm as reported"}
            </button>
            <button
              type="button"
              onClick={() => handleReset(m.id)}
              disabled={busyId === m.id}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reset to pending
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
