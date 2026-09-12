"use client";

import { useEffect, useRef, useState, createElement as h } from "react";
import Link from "next/link";
import { getPendingActionsForUser, type PendingAction } from "@/lib/queries/pendingActions";

// Small bell/badge shown in the site header for a signed-in player,
// whenever they have a challenge waiting for a response or a match score
// waiting for their confirmation, ANYWHERE on the platform — not just on
// the club page they happen to be looking at. Before this existed, the
// only way to find out you'd been challenged was to happen to reload the
// exact club page it happened on.
export function PendingActionsBadge({ userId }: { userId: string }) {
  const [actions, setActions] = useState<PendingAction[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const data = await getPendingActionsForUser(userId);
      if (!cancelled) setActions(data);
    }

    load();
    // Polling rather than a realtime subscription — simple, and good
    // enough for how often a friends/family-scale ladder actually changes.
    const interval = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [userId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (actions.length === 0) return null;

  return h(
    "div",
    { className: "relative", ref: containerRef },
    h(
      "button",
      {
        type: "button",
        onClick: () => setOpen((v) => !v),
        className:
          "relative rounded-lg border border-white/15 px-2.5 py-1.5 text-sm text-white/80 transition hover:text-white",
        "aria-label": "Pending actions",
      },
      "🔔",
      h(
        "span",
        {
          className:
            "absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white",
        },
        actions.length
      )
    ),
    open &&
      h(
        "div",
        {
          className:
            "absolute right-0 top-full z-20 mt-2 w-72 rounded-xl border border-white/10 bg-[#0b0f0d] p-2 shadow-lg",
        },
        actions.map((a) =>
          h(
            Link,
            {
              key: a.id,
              href: `/${a.citySlug}/${a.clubSlug}`,
              onClick: () => setOpen(false),
              className:
                "block rounded-lg px-3 py-2 text-sm text-white/80 transition hover:bg-white/[0.06] hover:text-white",
            },
            a.kind === "challenge"
              ? `${a.otherPlayerName} challenged you — ${a.clubName}`
              : `Confirm your match vs ${a.otherPlayerName} — ${a.clubName}`
          )
        )
      )
  );
}
