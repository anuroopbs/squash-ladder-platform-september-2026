"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { toUserMessage } from "@/lib/errors";
import type { AdminLadderGroup } from "@/lib/queries/admin";

interface AdminLadderPanelProps {
  initialLadders: AdminLadderGroup[];
}

export function AdminLadderPanel({ initialLadders }: AdminLadderPanelProps) {
  const router = useRouter();
  const [ladders, setLadders] = useState(initialLadders);
  const [busyPlayerId, setBusyPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rankDrafts, setRankDrafts] = useState<Record<string, string>>({});

  async function handleRemove(ladderId: string, playerId: string, displayName: string) {
    if (!confirm(`Remove ${displayName} from this ladder? This can't be undone.`)) return;

    setError(null);
    setBusyPlayerId(playerId);
    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from("ladder_players")
        .delete()
        .eq("ladder_id", ladderId)
        .eq("player_id", playerId);

      if (deleteError) throw deleteError;

      setLadders((prev) =>
        prev.map((l) =>
          l.ladder_id === ladderId
            ? { ...l, players: l.players.filter((p) => p.player_id !== playerId) }
            : l
        )
      );
      router.refresh();
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setBusyPlayerId(null);
    }
  }

  async function handleMoveRank(ladderId: string, playerId: string) {
    const draftKey = `${ladderId}:${playerId}`;
    const newRank = parseInt(rankDrafts[draftKey], 10);
    if (!newRank || newRank < 1) {
      setError("Enter a valid rank (1 or higher).");
      return;
    }

    setError(null);
    setBusyPlayerId(playerId);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("ladder_players")
        .update({ rank: newRank })
        .eq("ladder_id", ladderId)
        .eq("player_id", playerId);

      if (updateError) throw updateError;

      setLadders((prev) =>
        prev.map((l) =>
          l.ladder_id === ladderId
            ? {
                ...l,
                players: l.players
                  .map((p) => (p.player_id === playerId ? { ...p, rank: newRank } : p))
                  .sort((a, b) => a.rank - b.rank),
              }
            : l
        )
      );
      setRankDrafts((prev) => {
        const next = { ...prev };
        delete next[draftKey];
        return next;
      });
      router.refresh();
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setBusyPlayerId(null);
    }
  }

  if (ladders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
        <p className="text-sm text-white/50">No ladders found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
      )}

      {ladders.map((ladder) => (
        <section key={ladder.ladder_id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-semibold text-white">{ladder.ladder_name}</h2>
            <span className="text-xs text-white/40">
              {ladder.club_name} • {ladder.city_name}
            </span>
          </div>

          {ladder.players.length === 0 ? (
            <p className="mt-3 text-sm text-white/40">No players in this ladder.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {ladder.players.map((p) => {
                const draftKey = `${ladder.ladder_id}:${p.player_id}`;
                const busy = busyPlayerId === p.player_id;
                return (
                  <div
                    key={p.player_id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3"
                  >
                    <div className="w-10 text-center text-sm font-bold text-white/70">
                      #{p.rank}
                    </div>
                    <div className="min-w-[140px] flex-1">
                      <p className="text-sm font-medium text-white">{p.display_name}</p>
                      {(p.phone || p.email) && (
                        <p className="text-xs text-white/40">{p.phone ?? p.email}</p>
                      )}
                    </div>

                    <input
                      type="number"
                      min={1}
                      placeholder="New rank"
                      value={rankDrafts[draftKey] ?? ""}
                      onChange={(e) =>
                        setRankDrafts((prev) => ({ ...prev, [draftKey]: e.target.value }))
                      }
                      className="w-24 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white placeholder:text-white/30 focus:border-court-500 focus:outline-none"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={busy}
                      onClick={() => handleMoveRank(ladder.ladder_id, p.player_id)}
                    >
                      Move
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      loading={busy}
                      onClick={() => handleRemove(ladder.ladder_id, p.player_id, p.display_name)}
                    >
                      Remove
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
