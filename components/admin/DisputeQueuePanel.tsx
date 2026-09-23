"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { toUserMessage } from "@/lib/errors";
import { formatDate } from "@/lib/formatDate";
import type { DisputedMatchRow } from "@/lib/queries/admin";

interface DisputeQueuePanelProps {
  initialDisputes: DisputedMatchRow[];
  adminId: string;
}

export function DisputeQueuePanel({ initialDisputes, adminId }: DisputeQueuePanelProps) {
  const router = useRouter();
  const [disputes, setDisputes] = useState(initialDisputes);
  const [busyMatchId, setBusyMatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [winnerDrafts, setWinnerDrafts] = useState<Record<string, string>>({});
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, string>>({});

  async function handleConfirm(match: DisputedMatchRow) {
    setError(null);
    setBusyMatchId(match.match_id);
    try {
      const supabase = createClient();
      const finalWinner = winnerDrafts[match.match_id] || match.winner_id;
      const finalScore = scoreDrafts[match.match_id]?.trim() || match.score;
      const { error: rpcError } = await supabase.rpc("resolve_disputed_match", {
        match_uuid: match.match_id,
        admin_uuid: adminId,
        resolution: "confirm",
        final_winner_uuid: finalWinner,
        final_score: finalScore,
      });
      if (rpcError) throw rpcError;
      setDisputes((prev) => prev.filter((d) => d.match_id !== match.match_id));
      router.refresh();
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setBusyMatchId(null);
    }
  }

  async function handleVoid(match: DisputedMatchRow) {
    if (
      !confirm(
        "Void this match entirely? No rank change will apply, and the players' challenge reopens so they can replay it."
      )
    )
      return;
    setError(null);
    setBusyMatchId(match.match_id);
    try {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc("resolve_disputed_match", {
        match_uuid: match.match_id,
        admin_uuid: adminId,
        resolution: "void",
        final_winner_uuid: null,
        final_score: null,
      });
      if (rpcError) throw rpcError;
      setDisputes((prev) => prev.filter((d) => d.match_id !== match.match_id));
      router.refresh();
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setBusyMatchId(null);
    }
  }

  if (disputes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
        <p className="text-sm text-white/50">No disputed matches right now. 🎉</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
      )}
      {disputes.map((match) => {
        const busy = busyMatchId === match.match_id;
        const draftKey = match.match_id;
        return (
          <div
            key={match.match_id}
            className="rounded-2xl border border-red-500/20 bg-red-500/[0.03] p-5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-semibold text-white">
                {match.player1_name} vs {match.player2_name}
              </h3>
              <span className="text-xs text-white/40">
                {match.ladder_name} • {match.club_name} • {match.city_name}
              </span>
            </div>
            <p className="mt-1 text-xs text-white/50">
              Reported by <span className="text-white/70">{match.reported_by_name}</span> as{" "}
              <span className="font-medium text-white/80">
                {match.winner_id === match.player1_id ? match.player1_name : match.player2_name}
              </span>{" "}
              won <span className="font-medium text-white/80">{match.score}</span> on{" "}
              {formatDate(match.played_at)}
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-white/50">Final winner</label>
                <select
                  value={winnerDrafts[draftKey] ?? match.winner_id}
                  onChange={(e) =>
                    setWinnerDrafts((prev) => ({ ...prev, [draftKey]: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white focus:border-court-500 focus:outline-none"
                >
                  <option value={match.player1_id}>{match.player1_name}</option>
                  <option value={match.player2_id}>{match.player2_name}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/50">Final score</label>
                <input
                  type="text"
                  value={scoreDrafts[draftKey] ?? match.score}
                  onChange={(e) =>
                    setScoreDrafts((prev) => ({ ...prev, [draftKey]: e.target.value }))
                  }
                  placeholder="11-8, 9-11, 11-6"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white placeholder:text-white/30 focus:border-court-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-3">
              <Button
                variant="danger"
                size="sm"
                loading={busy}
                onClick={() => handleVoid(match)}
              >
                Void match
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={busy}
                onClick={() => handleConfirm(match)}
              >
                Confirm & apply
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
