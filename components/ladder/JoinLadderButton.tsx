"use client";

import { useEffect, useState, createElement as h } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Status = "checking" | "signed-out" | "not-joined" | "joining" | "joined" | "leaving";

export function JoinLadderButton({
  ladderId,
  citySlug,
  clubSlug,
}: {
  ladderId: string;
  citySlug?: string;
  clubSlug?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [confirmingLeave, setConfirmingLeave] = useState(false);

  const nextPath = citySlug && clubSlug ? `/${citySlug}/${clubSlug}` : "/";

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) setStatus("signed-out");
        return;
      }

      if (!cancelled) setCurrentUserId(user.id);

      const { data } = await supabase
        .from("ladder_players")
        .select("id")
        .eq("ladder_id", ladderId)
        .eq("player_id", user.id)
        .maybeSingle();

      if (!cancelled) setStatus(data ? "joined" : "not-joined");
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [ladderId]);

  async function handleJoin() {
    setStatus("joining");
    setErrorMessage(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setStatus("signed-out");
      return;
    }

    const { data: topRow } = await supabase
      .from("ladder_players")
      .select("rank")
      .eq("ladder_id", ladderId)
      .order("rank", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextRank = (topRow?.rank ?? 0) + 1;

    const { error } = await supabase
      .from("ladder_players")
      .insert({ ladder_id: ladderId, player_id: user.id, rank: nextRank });

    if (error) {
      setErrorMessage(error.message);
      setStatus("not-joined");
      return;
    }

    setStatus("joined");
    router.refresh();
  }

  async function handleLeave() {
    if (!currentUserId) return;
    setStatus("leaving");
    setErrorMessage(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("ladder_players")
      .delete()
      .eq("ladder_id", ladderId)
      .eq("player_id", currentUserId);

    if (error) {
      setErrorMessage(error.message);
      setStatus("joined");
      return;
    }

    setConfirmingLeave(false);
    setStatus("not-joined");
    router.refresh();
  }

  if (status === "checking") {
    return null;
  }

  const bannerClass =
    "mb-6 flex flex-col gap-4 rounded-2xl border border-court-400/30 bg-gradient-to-br from-court-500/25 via-court-500/10 to-transparent px-6 py-6 sm:flex-row sm:items-center sm:justify-between";
  const primaryButtonClass =
    "rounded-xl bg-court-500 px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-court-400 disabled:cursor-not-allowed disabled:opacity-60";
  const ghostButtonClass =
    "rounded-xl border border-white/20 px-5 py-2.5 text-center text-sm font-semibold text-white/80 transition hover:text-white";

  if (status === "signed-out") {
    return h(
      "div",
      { id: "join-ladder", className: bannerClass },
      h(
        "div",
        null,
        h("p", { className: "text-lg font-bold text-white" }, "Not on this ladder yet?"),
        h(
          "p",
          { className: "mt-1 text-sm text-white/60" },
          "Sign up free and claim your spot, or sign in if you already have an account."
        )
      ),
      h(
        "div",
        { className: "flex shrink-0 gap-2" },
        h(
          Link,
          { href: `/register?next=${encodeURIComponent(nextPath)}`, className: primaryButtonClass },
          "Join free"
        ),
        h(
          Link,
          { href: `/login?next=${encodeURIComponent(nextPath)}`, className: ghostButtonClass },
          "Sign in"
        )
      )
    );
  }

  if (status === "joined" || status === "leaving") {
    return h(
      "div",
      {
        className:
          "mb-6 flex flex-col gap-3 rounded-xl border border-court-500/30 bg-court-500/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
      },
      h(
        "p",
        { className: "text-sm text-court-300" },
        "You're on this ladder. Refresh to see your current rank."
      ),
      confirmingLeave
        ? h(
            "div",
            { className: "flex shrink-0 items-center gap-2" },
            h(
              "span",
              { className: "text-sm text-white/60" },
              "Leave this ladder?"
            ),
            h(
              "button",
              {
                onClick: handleLeave,
                disabled: status === "leaving",
                className:
                  "rounded-lg bg-red-500/20 px-3 py-1.5 text-sm font-medium text-red-300 transition hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-60",
              },
              status === "leaving" ? "Leaving…" : "Yes, leave"
            ),
            h(
              "button",
              {
                onClick: () => setConfirmingLeave(false),
                className: "text-sm text-white/50 transition hover:text-white",
              },
              "Cancel"
            )
          )
        : h(
            "button",
            {
              onClick: () => setConfirmingLeave(true),
              className: "shrink-0 text-sm text-white/50 underline-offset-2 transition hover:text-white hover:underline",
            },
            "Leave ladder"
          ),
      errorMessage && h("p", { className: "text-sm text-red-300" }, errorMessage)
    );
  }

  return h(
    "div",
    { id: "join-ladder", className: bannerClass },
    h(
      "div",
      null,
      h("p", { className: "text-lg font-bold text-white" }, "Ready to get ranked?"),
      h("p", { className: "mt-1 text-sm text-white/60" }, "Join this ladder and challenge your way up.")
    ),
    h(
      "div",
      { className: "flex flex-col items-start gap-2 sm:items-end" },
      h(
        "button",
        { onClick: handleJoin, disabled: status === "joining", className: primaryButtonClass },
        status === "joining" ? "Joining…" : "Join this ladder"
      ),
      errorMessage && h("p", { className: "text-sm text-red-300" }, errorMessage)
    )
  );
}
