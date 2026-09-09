import type { LadderStanding } from "@/lib/queries/ladders";
import { EmptyState } from "@/components/ui/EmptyState";
import { createElement } from "react";

const MEDALS = ["🥇", "🥈", "🥉"];

export function LadderTable({ ladderName, standings }: { ladderName: string; standings: LadderStanding[] }) {
  if (standings.length === 0) {
    return createElement(EmptyState, {
      title: "No one's on this ladder yet",
      description: "Be the first to join and claim the top spot.",
    });
  }

return createElement(
  "div",
  { className: "overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]" },
  createElement(
    "div",
    { className: "flex items-center justify-between border-b border-white/10 px-6 py-4" },
    createElement("h2", { className: "font-semibold text-white" }, ladderName),
    createElement(
      "span",
      { className: "text-sm text-white/40" },
      `${standings.length} ${standings.length === 1 ? "player" : "players"}`
      )
    ),
  createElement(
    "ul",
    { className: "divide-y divide-white/5" },
    standings.map((player) =>
      createElement(
        "li",
        {
          key: player.player_id,
          className: "flex items-center gap-4 px-6 py-3.5 transition hover:bg-white/[0.02]",
        },
        createElement(
          "span",
          { className: "w-8 shrink-0 text-center text-sm font-semibold text-white/50" },
          MEDALS[player.rank - 1] ?? `#${player.rank}`
          ),
        createElement(
          "span",
          { className: "flex-1 text-sm font-medium text-white" },
          player.display_name
          )
        )
                  )
    )
  );
}
