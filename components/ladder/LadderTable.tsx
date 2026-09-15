"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ChallengeModal } from "./ChallengeModal";
import { ReportScoreModal } from "./ReportScoreModal";
import { JoinLadderButton } from "./JoinLadderButton";
import type { LadderStandingRow, ChallengeWithProfiles } from "@/lib/types/database";

interface LadderTableProps {
  standings: LadderStandingRow[];
  challenges: ChallengeWithProfiles[];
  currentPlayerId: string | null;
  ladderId: string;
  isMember: boolean;
  onRefresh: () => void;
}

export function LadderTable({
  standings,
  challenges,
  currentPlayerId,
  ladderId,
  isMember,
  onRefresh,
}: LadderTableProps) {
  const [challengeModalOpen, setChallengeModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState<LadderStandingRow | null>(null);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  const getActiveChallenge = (playerId: string) => {
    return challenges.find(
      (c) =>
        ((c.challenger_id === currentPlayerId && c.challenged_id === playerId) ||
          (c.challenged_id === currentPlayerId && c.challenger_id === playerId)) &&
        c.status === "pending"
    );
  };

  const currentPlayerRank = standings.find((s) => s.player_id === currentPlayerId)?.rank ?? 999;

  const handleChallenge = (opponent: LadderStandingRow) => {
    setSelectedOpponent(opponent);
    setChallengeModalOpen(true);
  };

  const handleReportScore = (opponent: LadderStandingRow) => {
    setSelectedOpponent(opponent);
    setReportModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Ladder Rankings</h2>
        <div className="flex items-center gap-2">
          {!isMember && currentPlayerId && (
            <JoinLadderButton ladderId={ladderId} onJoined={onRefresh} />
          )}
        </div>
      </div>

      {/* Standings Table */}
      {standings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
          <p className="text-white/50">No players on this ladder yet. Be the first to join!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {standings.map((player) => {
            const canChallenge =
              currentPlayerId &&
              player.player_id !== currentPlayerId &&
              isMember &&
              player.rank < currentPlayerRank &&
              currentPlayerRank - player.rank <= 3;

            const hasActiveChallenge = getActiveChallenge(player.player_id);

            return (
              <div
                key={player.player_id}
                className={`flex items-center gap-4 rounded-xl border p-4 transition ${
                  player.player_id === currentPlayerId
                    ? "border-court-400/30 bg-court-500/10"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20"
                }`}
              >
                {/* Rank */}
                <div className="w-16 text-center text-lg font-bold text-white/80">
                  {getRankBadge(player.rank)}
                </div>

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white truncate">{player.display_name}</span>
                    {player.player_id === currentPlayerId && (
                      <span className="shrink-0 rounded bg-court-500/20 px-1.5 py-0.5 text-xs text-court-300">
                        You
                      </span>
                    )}
                    {hasActiveChallenge && (
                      <span className="shrink-0 rounded bg-yellow-500/20 px-1.5 py-0.5 text-xs text-yellow-300">
                        In Challenge
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/40">
                    Joined {new Date(player.joined_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                {currentPlayerId && player.player_id !== currentPlayerId && (
                  <div className="flex items-center gap-2 shrink-0">
                    {canChallenge && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleChallenge(player)}
                      >
                        Challenge
                      </Button>
                    )}
                    {isMember && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleReportScore(player)}
                      >
                        Report Score
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {challengeModalOpen && selectedOpponent && (
        <ChallengeModal
          opponent={selectedOpponent}
          ladderId={ladderId}
          onClose={() => setChallengeModalOpen(false)}
          onSuccess={onRefresh}
        />
      )}
      {reportModalOpen && selectedOpponent && (
        <ReportScoreModal
          opponent={selectedOpponent}
          ladderId={ladderId}
          onClose={() => setReportModalOpen(false)}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
}
