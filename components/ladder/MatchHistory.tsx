"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { toUserMessage } from "@/lib/errors";
import type { MatchWithProfiles } from "@/lib/types/database";

interface MatchHistoryProps {
  matches: MatchWithProfiles[];
  currentPlayerId: string | null;
}

export function MatchHistory({ matches, currentPlayerId }: MatchHistoryProps) {
  const router = useRouter();
  const [busyMatchId, setBusyMatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm(matchId: string) {
    if (!currentPlayerId) return;
    setError(null);
    setBusyMatchId(matchId);
    try {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc("confirm_match_and_swap", {
        match_uuid: matchId,
        confirmed_by_uuid: currentPlayerId,
      });
      if (rpcError) throw rpcError;
      router.refresh();
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setBusyMatchId(null);
    }
  }

  async function handleDispute(matchId: string) {
    if (!currentPlayerId) return;
    if (!confirm("Dispute this result? An admin will need to review and resolve it manually.")) return;
    setError(null);
    setBusyMatchId(matchId);
    try {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc("dispute_match", {
        match_uuid: matchId,
        disputed_by_uuid: currentPlayerId,
      });
      if (rpcError) throw rpcError;
      router.refresh();
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setBusyMatchId(null);
    }
  }

  if (matches.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
        <p className="text-sm text-white/50">No matches reported yet. Be the first to play!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-white">Recent Matches</h3>
      {error && (
        <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>
      )}
      <div className="space-y-2">
        {matches.map((match) => {
          // The player who did NOT report the score is the one who needs
          // to confirm or dispute it. reported_by is on the row directly.
          const isOpponentOfReporter =
            currentPlayerId &&
            currentPlayerId !== match.reported_by &&
            (currentPlayerId === match.player1_id || currentPlayerId === match.player2_id);
          const needsMyConfirmation =
            match.status === "pending_confirmation" && isOpponentOfReporter;
          const busy = busyMatchId === match.id;

          return (
            <div
              key={match.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex items-center gap-3">
                {/* Match Status Badge */}
                <div
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    match.status === "confirmed"
                      ? "bg-green-500/15 text-green-300"
                      : match.status === "pending_confirmation"
                      ? "bg-yellow-500/15 text-yellow-300"
                      : "bg-red-500/15 text-red-300"
                  }`}
                >
                  {match.status === "confirmed"
                    ? "Confirmed"
                    : match.status === "pending_confirmation"
                    ? "Pending"
                    : "Disputed"}
                </div>

                {/* Match Details */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{match.player1_name}</span>
                    <span className="text-white/40">vs</span>
                    <span className="font-medium text-white">{match.player2_name}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-white/40">
                    <span className="font-medium text-court-300">{match.winner_name} won</span>
                    <span>•</span>
                    <span>{match.score}</span>
                    <span>•</span>
                    <span>{new Date(match.played_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {needsMyConfirmation && (
                <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3">
                  <span className="text-xs text-white/50 mr-auto">
                    Reported against you — confirm it&apos;s correct?
                  </span>
                  <Button
                    size="sm"
                    variant="primary"
                    loading={busy}
                    onClick={() => handleConfirm(match.id)}
                  >
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={busy}
                    onClick={() => handleDispute(match.id)}
                  >
                    Dispute
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
