"use client";

import type { ChallengeWithProfiles } from "@/lib/types/database";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface ChallengesListProps {
  challenges: ChallengeWithProfiles[];
  currentPlayerId: string | null;
  onRefresh: () => void;
}

export function ChallengesList({ challenges, currentPlayerId, onRefresh }: ChallengesListProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAccept = async (challengeId: string) => {
    setActionLoading(challengeId);
    try {
      const supabase = createClient();
      await supabase
        .from("challenges")
        .update({ status: "accepted" })
        .eq("id", challengeId);
      onRefresh();
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (challengeId: string) => {
    setActionLoading(challengeId);
    try {
      const supabase = createClient();
      await supabase
        .from("challenges")
        .update({ status: "declined" })
        .eq("id", challengeId);
      onRefresh();
    } finally {
      setActionLoading(null);
    }
  };

  // Filter to only pending/accepted challenges
  const activeChallenges = challenges.filter(
    (c) => c.status === "pending" || c.status === "accepted"
  );

  if (activeChallenges.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-white">Active Challenges</h3>
      <div className="space-y-2">
        {activeChallenges.map((challenge) => {
          const isChallenger = challenge.challenger_id === currentPlayerId;
          const isChallenged = challenge.challenged_id === currentPlayerId;

          return (
            <div
              key={challenge.id}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-white">
                    {challenge.challenger_name}
                  </span>
                  <span className="text-white/40">
                    {challenge.status === "pending" ? "challenged" : "vs"}
                  </span>
                  <span className="font-medium text-white">
                    {challenge.challenged_name}
                  </span>
                </div>
                <p className="mt-1 text-xs text-white/40">
                  {new Date(challenge.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Show actions only for the challenged player (accept/decline) */}
              {isChallenged && challenge.status === "pending" && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    loading={actionLoading === challenge.id}
                    onClick={() => handleAccept(challenge.id)}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={actionLoading === challenge.id}
                    onClick={() => handleDecline(challenge.id)}
                  >
                    Decline
                  </Button>
                </div>
              )}

              {/* Show status for challenger */}
              {isChallenger && (
                <span className="rounded bg-yellow-500/15 px-2 py-0.5 text-xs text-yellow-300">
                  Waiting for response
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
