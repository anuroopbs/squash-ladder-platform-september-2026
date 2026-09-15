"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

interface JoinLadderButtonProps {
  ladderId: string;
  onJoined: () => void;
}

export function JoinLadderButton({ ladderId, onJoined }: JoinLadderButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Redirect to login
        window.location.href = "/login";
        return;
      }

      // Get current max rank
      const { data: maxRow } = await supabase
        .from("ladder_players")
        .select("rank")
        .eq("ladder_id", ladderId)
        .order("rank", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextRank = (maxRow?.rank ?? 0) + 1;

      const { error: insertError } = await supabase
        .from("ladder_players")
        .insert({ ladder_id: ladderId, player_id: user.id, rank: nextRank });

      if (insertError) throw insertError;

      onJoined();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join ladder");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button onClick={handleJoin} loading={loading}>
        Join Ladder
      </Button>
      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
