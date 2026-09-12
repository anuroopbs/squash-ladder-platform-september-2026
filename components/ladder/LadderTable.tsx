"use client";

import { useEffect, useState, createElement as h } from "react";
import type { LadderStanding } from "@/lib/queries/ladders";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/client";

const MEDALS = ["🥇", "🥈", "🥉"];

type MembershipStatus = "checking" | "signed-out" | "not-joined" | "joined";

export function LadderTable({
  ladderId,
  ladderName,
  standings,
}: {
  ladderId?: string;
  ladderName: string;
  standings: LadderStanding[];
}) {
  const [membership, setMembership] = useState<MembershipStatus>("checking");

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) setMembership("signed-out");
        return;
      }

      const isMember = standings.some((s) => s.player_id === user.id);
      if (!cancelled) setMembership(isMember ? "joined" : "not-joined");
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [ladderId, standings]);

  if (standings.length === 0) {
    return h(EmptyState, {
      title: "No one's on this ladder yet",
      description: "Be the first to join and claim the top spot.",
    });
  }

  const showGhostRow = membership === "signed-out" || membership === "not-joined";

  return h(
    "div",
    { className: "overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]" },
    h(
      "div",
      { className: "flex items-center justify-between border-b border-white/10 px-6 py-4" },
      h("h2", { className: "font-semibold text-white" }, ladderName),
      h(
        "span",
        { className: "text-sm text-white/40" },
        `${standings.length} ${standings.length === 1 ? "player" : "players"}`
      )
    ),
    h(
      "ul",
      { className: "divide-y divide-white/5" },
      standings.map((player) =>
        h(
          "li",
          {
            key: player.player_id,
            className: "flex items-center gap-4 px-6 py-3.5 transition hover:bg-white/[0.02]",
          },
          h(
            "span",
            { className: "w-8 shrink-0 text-center text-sm font-semibold text-white/50" },
            MEDALS[player.rank - 1] ?? `#${player.rank}`
          ),
          h("span", { className: "flex-1 text-sm font-medium text-white" }, player.display_name)
        )
      ),
      showGhostRow &&
        h(
          "li",
          {
            key: "ghost-row",
            className: "flex items-center gap-4 border-t-2 border-dashed border-white/10 px-6 py-3.5",
          },
          h(
            "span",
            { className: "w-8 shrink-0 text-center text-sm font-semibold text-white/25" },
            `#${standings.length + 1}`
          ),
          h("span", { className: "flex-1 text-sm text-white/35" }, "Your name could be here"),
          h(
            "a",
            { href: "#join-ladder", className: "text-sm font-medium text-court-300 hover:text-court-200" },
            "Join now →"
          )
        )
    )
  );
}
