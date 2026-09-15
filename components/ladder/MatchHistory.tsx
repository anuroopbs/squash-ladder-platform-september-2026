"use client";

import type { MatchWithProfiles } from "@/lib/types/database";

interface MatchHistoryProps {
  matches: MatchWithProfiles[];
}

export function MatchHistory({ matches }: MatchHistoryProps) {
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
      <div className="space-y-2">
        {matches.map((match) => (
          <div
            key={match.id}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4"
          >
            {/* Match Status Badge */}
            <div
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
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
        ))}
      </div>
    </div>
  );
}
