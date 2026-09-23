"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { AppError, toUserMessage } from "@/lib/errors";
import type { LadderStandingRow } from "@/lib/types/database";

interface ReportScoreModalProps {
  opponent: LadderStandingRow;
  ladderId: string;
  onClose: () => void;
}

export function ReportScoreModal({ opponent, ladderId, onClose }: ReportScoreModalProps) {
  const router = useRouter();
  const [score, setScore] = useState("");
  const [winner, setWinner] = useState<"me" | "opponent">("me");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    // Validate score format
    const scoreRegex = /^([0-9]{1,2}-[0-9]{1,2}(,\s)?){1,4}$/;
    if (!scoreRegex.test(score)) {
      setError("Invalid score format. Use: 11-8, 9-11, 11-6");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new AppError("ERR_AUTH_NOT_SIGNED_IN", "You must be signed in");

      const { data: playerRow } = await supabase
        .from("ladder_players")
        .select("rank")
        .eq("ladder_id", ladderId)
        .eq("player_id", user.id)
        .single();

      if (!playerRow) throw new AppError("ERR_LADDER_NOT_MEMBER", "You must be a member of this ladder");

      const winnerId = winner === "me" ? user.id : opponent.player_id;

      // Look up any pending/accepted challenge between these two players so
      // report_match_and_swap() can mark it completed. Without this, the
      // challenge lifecycle never finishes -- it stays "pending"/"accepted"
      // forever, which permanently blocks the challenger from creating a
      // new challenge (only 1 active challenge per player is allowed).
      const { data: relatedChallenge } = await supabase
        .from("challenges")
        .select("id")
        .or(
          `and(challenger_id.eq.${user.id},challenged_id.eq.${opponent.player_id}),and(challenger_id.eq.${opponent.player_id},challenged_id.eq.${user.id})`
        )
        .in("status", ["pending", "accepted"])
        .maybeSingle();

      // Delegate to the atomic report_match() Postgres function. This ONLY
      // inserts the match as pending_confirmation -- it does NOT swap
      // ranks. Ranks only move once the opponent confirms the result via
      // confirm_match_and_swap() (see MatchHistory.tsx), or after 48h of
      // silence via the auto_confirm_stale_matches() daily sweep. This
      // closes a real gap found in a system audit: ranks used to swap
      // the instant a score was reported, before the opponent ever saw
      // or could dispute it.
      const { error: rpcError } = await supabase.rpc("report_match", {
        ladder_uuid: ladderId,
        challenge_uuid: relatedChallenge?.id ?? null,
        p1_uuid: user.id,
        p2_uuid: opponent.player_id,
        winner_uuid: winnerId,
        match_score: score,
        reported_by_uuid: user.id,
      });

      if (rpcError) throw rpcError;

      // Fire-and-forget email to the opponent asking them to confirm the
      // result -- never blocks the report itself. The server reads the
      // score/winner/email from the database; we only send the opponent's id.
      fetch("/api/notify/score-reported", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opponentId: opponent.player_id }),
      }).catch(() => {
        // Silently ignore -- notification is best-effort, not critical path.
      });

      router.refresh();
      onClose();
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1b26] p-6">
        <h3 className="text-lg font-semibold text-white">Report Score</h3>
        <p className="mt-2 text-sm text-white/60">
          Report match result vs <span className="font-medium text-white">{opponent.display_name}</span>
        </p>

        {/* Winner Selection */}
        <div className="mt-4 space-y-2">
          <label className="block text-sm text-white/60">Who won?</label>
          <div className="flex gap-2">
            <Button
              variant={winner === "me" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setWinner("me")}
            >
              I Won
            </Button>
            <Button
              variant={winner === "opponent" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setWinner("opponent")}
            >
              {opponent.display_name} Won
            </Button>
          </div>
        </div>

        {/* Score Input */}
        <div className="mt-4">
          <Input
            label="Score"
            placeholder="11-8, 9-11, 11-6"
            value={score}
            onChange={(e) => setScore(e.target.value)}
          />
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            Submit Result
          </Button>
        </div>
      </div>
    </div>
  );
}
