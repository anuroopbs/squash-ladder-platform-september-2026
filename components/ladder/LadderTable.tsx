"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ChallengeModal } from "./ChallengeModal";
import { ReportScoreModal } from "./ReportScoreModal";
import { JoinLadderButton } from "./JoinLadderButton";
import type { LadderStandingRow, ChallengeWithProfiles } from "@/lib/types/database";
import { formatDate } from "@/lib/formatDate";

interface LadderTableProps {
  standings: LadderStandingRow[];
  challenges: ChallengeWithProfiles[];
  currentPlayerId: string | null;
  ladderId: string;
  isMember: boolean;
}

export function LadderTable({
  standings,
  challenges,
  currentPlayerId,
  ladderId,
  isMember,
}: LadderTableProps) {
  const [challengeModalOpen, setChallengeModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState<LadderStandingRow | null>(null);

  const getRankBadge = (rank: number) => `#${rank}`;

  const getRankBadgeClass = (rank: number) => {
    if (rank === 1) return "text-yellow-400"; // gold
    if (rank === 2) return "text-slate-300"; // silver
    if (rank === 3) return "text-amber-600"; // bronze
    return "text-white/80";
  };

  const getActiveChallenge = (playerId: string) => {
    return challenges.find(
      (c) =>
        ((c.challenger_id === currentPlayerId && c.challenged_id === playerId) ||
          (c.challenged_id === currentPlayerId && c.challenger_id === playerId)) &&
        c.status === "pending"
    );
  };

  const getChallengeLabel = (playerId: string) => {
    const challenge = getActiveChallenge(playerId);
    if (!challenge) return null;
    if (challenge.challenger_id === currentPlayerId) return "Challenge Sent";
    return "Challenged You";
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
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Ladder Rankings</h2>
        <div className="flex items-center gap-2">
          {!isMember && currentPlayerId && (
            <JoinLadderButton ladderId={ladderId} />
          )}
        </div>
      </div>

      {/* Standings */}
      {standings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
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
                className={`rounded-xl border p-4 transition ${
                  player.player_id === currentPlayerId
                    ? "border-court-400/30 bg-court-500/10"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20"
                }`}
              >
                {/* Mobile: stacked layout */}
                <div className="flex items-center gap-3">
                  <div className={`w-12 text-center text-lg font-bold shrink-0 ${getRankBadgeClass(player.rank)}`}>
                    {getRankBadge(player.rank)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-white truncate">
                        {player.display_name}
                      </span>
                      {player.player_id === currentPlayerId && (
                        <span className="shrink-0 rounded bg-court-500/20 px-1.5 py-0.5 text-xs text-court-300">
                          You
                        </span>
                      )}
                      {hasActiveChallenge && (
                        <span className="shrink-0 rounded bg-blue-500/20 px-1.5 py-0.5 text-xs font-medium text-blue-300">
                          {getChallengeLabel(player.player_id)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/40 mt-0.5">
                      Joined {formatDate(player.joined_at)}
                    </p>
                    {isMember && player.phone && (
                      <a
                        href={`tel:${player.phone}`}
                        className="mt-1 inline-flex items-center gap-1 text-xs text-court-300 hover:text-court-200"
                      >
                        📞 {player.phone}
                      </a>
                    )}
                  </div>
                </div>

                {/* Actions - mobile friendly */}
                {currentPlayerId && player.player_id !== currentPlayerId && (
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    {canChallenge && !hasActiveChallenge && (
                      <Button
                        size="sm"
                        variant="challenge"
                        onClick={() => handleChallenge(player)}
                        className="flex-1 sm:flex-initial"
                      >
                        ⚔️ Challenge
                      </Button>
                    )}
                    {isMember && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleReportScore(player)}
                        className="flex-1 sm:flex-initial"
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
        />
      )}
      {reportModalOpen && selectedOpponent && (
        <ReportScoreModal
          opponent={selectedOpponent}
          ladderId={ladderId}
          onClose={() => setReportModalOpen(false)}
        />
      )}
    </div>
  );
}
