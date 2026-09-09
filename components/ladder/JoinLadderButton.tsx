"use client";

import { useEffect, useState, createElement } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Status = "checking" | "signed-out" | "not-joined" | "joining" | "joined";

export function JoinLadderButton({ ladderId }: { ladderId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

useEffect(() => {
  let cancelled = false;

          async function check() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    if (!cancelled) setStatus("signed-out");
    return;
  }

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

if (status === "checking") {
  return null;
}

if (status === "signed-out") {
  return createElement(
    "div",
    { className: "mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4" },
    createElement("span", { className: "text-sm text-white/50" }, "Sign in to join this ladder."),
    createElement(
      Link,
      { href: "/login", className: "rounded-lg bg-court-500 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-court-400" },
      "Sign in"
      )
    );
}

if (status === "joined") {
  return createElement(
    "div",
    { className: "mt-4 rounded-xl border border-court-500/30 bg-court-500/10 px-5 py-4 text-sm text-court-300" },
    "You're on this ladder. Refresh to see your current rank."
    );
}

return createElement(
  "div",
  { className: "mt-4 flex flex-col gap-2" },
  createElement(
    "button",
    {
      onClick: handleJoin,
      disabled: status === "joining",
      className: "w-full rounded-xl bg-court-500 py-3 text-sm font-semibold text-white transition hover:bg-court-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-6",
    },
    status === "joining" ? "Joining…" : "Join this ladder"
    ),
  errorMessage && createElement("p", { className: "text-sm text-red-300" }, errorMessage)
  );
}
