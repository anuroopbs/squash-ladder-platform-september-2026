"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { AppError, toUserMessage } from "@/lib/errors";
import type { LadderStandingRow } from "@/lib/types/database";

interface ChallengeModalProps {
  opponent: LadderStandingRow;
  ladderId: string;
  onClose: () => void;
}

export function ChallengeModal({ opponent, ladderId, onClose }: ChallengeModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new AppError("ERR_AUTH_NOT_SIGNED_IN", "You must be signed in to challenge");

      // Get current user's rank
      const { data: playerRow } = await supabase
        .from("ladder_players")
        .select("rank")
        .eq("ladder_id", ladderId)
        .eq("player_id", user.id)
        .single();

      if (!playerRow) throw new AppError("ERR_LADDER_NOT_MEMBER", "You must be a member of this ladder");

      // Validate rank gap (1-3 positions above)
      const gap = playerRow.rank - opponent.rank;
      if (gap < 1 || gap > 3) {
        throw new AppError("ERR_CHALLENGE_RANK_GAP", `You can only challenge players 1-3 positions above you (gap: ${gap})`);
      }

      // Check for existing active challenge
      const { data: existingChallenge } = await supabase
        .from("challenges")
        .select("id")
        .eq("challenger_id", user.id)
        .eq("status", "pending")
        .maybeSingle();

      if (existingChallenge) {
        throw new AppError("ERR_CHALLENGE_ALREADY_ACTIVE", "You already have an active challenge");
      }

      // Create the challenge
      const { error: insertError } = await supabase.from("challenges").insert({
        ladder_id: ladderId,
        challenger_id: user.id,
        challenged_id: opponent.player_id,
        status: "pending",
      });

      if (insertError) throw insertError;

      // Fire-and-forget email notification -- never blocks or fails the
      // challenge itself. The server looks up the opponent's email and
      // verifies this challenge exists; we only send the opponent's id.
      fetch("/api/notify/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opponentId: opponent.player_id }),
      }).catch(() => {
        // Silently ignore -- notification is best-effort, not critical path.
      });

      router.refresh();
      setSent(true);
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1b26] p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/15 text-2xl ring-1 ring-inset ring-blue-500/30">
            ⚔️
          </div>
          <h3 className="mt-4 text-lg font-semibold text-white">Challenge sent!</h3>
          <p className="mt-2 text-sm text-white/60">
            <span className="font-medium text-white">{opponent.display_name}</span> has been
            notified. You&apos;ll see &ldquo;Challenge Sent&rdquo; next to their name until they
            respond.
          </p>
          <Button onClick={onClose} className="mt-6 w-full">
            Got it
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1b26] p-6">
        <h3 className="text-lg font-semibold text-white">Challenge Player</h3>
        <p className="mt-2 text-sm text-white/60">
          Challenge <span className="font-medium text-white">{opponent.display_name}</span> at rank #{opponent.rank}?
        </p>
        <p className="mt-1 text-xs text-white/40">
          If you win, you swap ranks. If you lose, ranks stay the same.
        </p>

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
            Send Challenge
          </Button>
        </div>
      </div>
    </div>
  );
}
