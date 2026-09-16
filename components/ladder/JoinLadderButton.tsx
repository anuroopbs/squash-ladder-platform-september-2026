"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { toUserMessage } from "@/lib/errors";

interface JoinLadderButtonProps {
  ladderId: string;
}

export function JoinLadderButton({ ladderId }: JoinLadderButtonProps) {
  const router = useRouter();
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

      // Delegate to the atomic join_ladder() Postgres function instead of
      // reading max rank client-side then inserting — reading-then-inserting
      // has a race condition when two people join at the same moment (both
      // can read the same max rank and collide on the unique(ladder_id, rank)
      // constraint). The DB function does it atomically in one statement.
      const { error: rpcError } = await supabase.rpc("join_ladder", {
        ladder_uuid: ladderId,
        player_uuid: user.id,
      });

      if (rpcError) throw rpcError;

      router.refresh();
    } catch (err) {
      setError(toUserMessage(err));
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
