"use client";

import { useEffect, useState, createElement as h } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Challenge, Match } from "@/lib/types/database";
import type { LadderStanding } from "@/lib/queries/ladders";

export function ChallengeHub({ ladderId, standings }: { ladderId: string; standings: LadderStanding[] }) {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [opponentId, setOpponentId] = useState("");
    const [busyId, setBusyId] = useState<string | null>(null);
    const [reportingId, setReportingId] = useState<string | null>(null);
    const [winnerId, setWinnerId] = useState("");
    const [score, setScore] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const nameOf = (id: string) => standings.find((s) => s.player_id === id)?.display_name ?? "A player";

  async function loadAll() {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id ?? null);

      const [{ data: challengeRows }, { data: matchRows }] = await Promise.all([
              supabase.from("challenges").select("*").eq("ladder_id", ladderId).order("created_at", { ascending: false }),
              supabase.from("matches").select("*").eq("ladder_id", ladderId).order("created_at", { ascending: false }).limit(15),
            ]);

      setChallenges((challengeRows ?? []) as Challenge[]);
        setMatches((matchRows ?? []) as Match[]);
        setLoading(false);
  }

  useEffect(() => {
        loadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ladderId]);

  async function refresh() {
        await loadAll();
        router.refresh();
  }

  async function sendChallenge() {
        if (!userId || !opponentId) return;
        setErrorMessage(null);
        setBusyId("new-challenge");

      const supabase = createClient();
        const { error } = await supabase
          .from("challenges")
          .insert({ ladder_id: ladderId, challenger_id: userId, challenged_id: opponentId });

      setBusyId(null);
        if (error) {
                setErrorMessage(error.message);
                return;
        }
        setOpponentId("");
        await refresh();
  }

  async function respondToChallenge(challengeId: string, status: "accepted" | "declined") {
        setErrorMessage(null);
        setBusyId(challengeId);

      const supabase = createClient();
        const { error } = await supabase.from("challenges").update({ status }).eq("id", challengeId);

      setBusyId(null);
        if (error) {
                setErrorMessage(error.message);
                return;
        }
        await refresh();
  }

  function openReportForm(challenge: Challenge) {
        setReportingId(challenge.id);
        setWinnerId(challenge.challenger_id);
        setScore("");
        setErrorMessage(null);
  }

  async function submitScore(challenge: Challenge) {
        if (!userId || !winnerId || !score.trim()) return;
        setErrorMessage(null);
        setBusyId(challenge.id);

      const supabase = createClient();
        const { error: matchError } = await supabase.from("matches").insert({
                ladder_id: ladderId,
                challenge_id: challenge.id,
                player1_id: challenge.challenger_id,
                player2_id: challenge.challenged_id,
                winner_id: winnerId,
                score: score.trim(),
                reported_by: userId,
        });

      if (matchError) {
              setBusyId(null);
              setErrorMessage(matchError.message);
              return;
      }

      await supabase.from("challenges").update({ status: "completed" }).eq("id", challenge.id);

      setBusyId(null);
        setReportingId(null);
        await refresh();
  }

  async function respondToMatch(matchId: string, status: "confirmed" | "disputed") {
        if (!userId) return;
        setErrorMessage(null);
        setBusyId(matchId);

      const supabase = createClient();
        const { error } = await supabase
          .from("matches")
          .update({ status, confirmed_by: userId })
          .eq("id", matchId);

      setBusyId(null);
        if (error) {
                setErrorMessage(error.message);
                return;
        }
        await refresh();
  }

  if (loading) return null;

  const onLadder = standings.some((s) => s.player_id === userId);
    const opponents = standings.filter((s) => s.player_id !== userId);

  const activeChallenges = challenges.filter((c) => c.status === "pending" || c.status === "accepted");
    const myChallengeMap = new Map<string, Challenge>();
    activeChallenges.forEach((c) => {
          if (c.challenger_id === userId || c.challenged_id === userId) myChallengeMap.set(c.id, c);
    });
    const myActiveChallenges = Array.from(myChallengeMap.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

  const sectionClass = "mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5";
    const labelClass = "text-sm font-semibold text-white";
    const buttonClass =
          "rounded-lg bg-court-500 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-court-400 disabled:cursor-not-allowed disabled:opacity-60";
    const ghostButtonClass =
          "rounded-lg border border-white/15 px-3.5 py-1.5 text-sm font-medium text-white/70 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-60";

  const children: any[] = [];

  if (userId && onLadder && opponents.length > 0) {
        children.push(
                h(
                          "div",
                  { key: "challenge-form", className: sectionClass },
                          h("h3", { className: labelClass }, "Challenge a player"),
                          h(
                                      "div",
                            { className: "mt-3 flex flex-col gap-2 sm:flex-row" },
                                      h(
                                                    "select",
                                        {
                                                        value: opponentId,
                                                        onChange: (e: any) => setOpponentId(e.target.value),
                                                        className:
                                                                          "flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-court-400/60",
                                        },
                                                    h("option", { value: "" }, "Choose an opponent…"),
                                                    opponents.map((o) => h("option", { key: o.player_id, value: o.player_id }, o.display_name))
                                                  ),
                                      h(
                                                    "button",
                                        { onClick: sendChallenge, disabled: !opponentId || busyId === "new-challenge", className: buttonClass },
                                                    busyId === "new-challenge" ? "Sending…" : "Send challenge"
                                                  )
                                    )
                        )
              );
  }

  if (userId && myActiveChallenges.length > 0) {
        children.push(
                h(
                          "div",
                  { key: "challenges-list", className: sectionClass },
                          h("h3", { className: labelClass }, "Your challenges"),
                          h(
                                      "ul",
                            { className: "mt-3 flex flex-col gap-3" },
                                      myActiveChallenges.map((c) => {
                                                    const isChallenger = c.challenger_id === userId;
                                                    const opponentName = isChallenger ? nameOf(c.challenged_id) : nameOf(c.challenger_id);

                                                                         if (c.status === "pending" && !isChallenger) {
                                                                                         return h(
                                                                                                           "li",
                                                                                           { key: c.id, className: "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between" },
                                                                                                           h("span", { className: "text-sm text-white/70" }, `${opponentName} challenged you`),
                                                                                                           h(
                                                                                                                               "div",
                                                                                                             { className: "flex gap-2" },
                                                                                                                               h(
                                                                                                                                                     "button",
                                                                                                                                 { onClick: () => respondToChallenge(c.id, "accepted"), disabled: busyId === c.id, className: buttonClass },
                                                                                                                                                     "Accept"
                                                                                                                                                   ),
                                                                                                                               h(
                                                                                                                                                     "button",
                                                                                                                                 { onClick: () => respondToChallenge(c.id, "declined"), disabled: busyId === c.id, className: ghostButtonClass },
                                                                                                                                                     "Decline"
                                                                                                                                                   )
                                                                                                                             )
                                                                                                         );
                                                                         }

                                                                         if (c.status === "pending" && isChallenger) {
                                                                                         return h(
                                                                                                           "li",
                                                                                           { key: c.id, className: "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between" },
                                                                                                           h("span", { className: "text-sm text-white/50" }, `You challenged ${opponentName} — pending`),
                                                                                                           h(
                                                                                                                               "button",
                                                                                                             { onClick: () => respondToChallenge(c.id, "declined"), disabled: busyId === c.id, className: ghostButtonClass },
                                                                                                                               "Cancel"
                                                                                                                             )
                                                                                                         );
                                                                         }

                                                                         return h(
                                                                                         "li",
                                                                           { key: c.id, className: "flex flex-col gap-2" },
                                                                                         h(
                                                                                                           "div",
                                                                                           { className: "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between" },
                                                                                                           h("span", { className: "text-sm text-white/70" }, `Accepted — you vs ${opponentName}`),
                                                                                                           reportingId !== c.id && h("button", { onClick: () => openReportForm(c), className: buttonClass }, "Report score")
                                                                                                         ),
                                                                                         reportingId === c.id &&
                                                                                           h(
                                                                                                               "div",
                                                                                             { className: "mt-1 flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3" },
                                                                                                               h(
                                                                                                                                     "select",
                                                                                                                 {
                                                                                                                                         value: winnerId,
                                                                                                                                         onChange: (e: any) => setWinnerId(e.target.value),
                                                                                                                                         className:
                                                                                                                                                                   "rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-court-400/60",
                                                                                                                   },
                                                                                                                                     h("option", { value: c.challenger_id }, `${nameOf(c.challenger_id)} won`),
                                                                                                                                     h("option", { value: c.challenged_id }, `${nameOf(c.challenged_id)} won`)
                                                                                                                                   ),
                                                                                                               h("input", {
                                                                                                                                     type: "text",
                                                                                                                                     value: score,
                                                                                                                                     onChange: (e: any) => setScore(e.target.value),
                                                                                                                                     placeholder: "Score, e.g. 11-8, 9-11, 11-6",
                                                                                                                                     className:
                                                                                                                                                             "rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none focus:border-court-400/60",
                                                                                                                 }),
                                                                                                               h(
                                                                                                                                     "div",
                                                                                                                 { className: "flex gap-2" },
                                                                                                                                     h(
                                                                                                                                                             "button",
                                                                                                                                       { onClick: () => submitScore(c), disabled: !score.trim() || busyId === c.id, className: buttonClass },
                                                                                                                                                             busyId === c.id ? "Submitting…" : "Submit score"
                                                                                                                                                           ),
                                                                                                                                     h("button", { onClick: () => setReportingId(null), className: ghostButtonClass }, "Cancel")
                                                                                                                                   )
                                                                                                             )
                                                                                       );
                                      })
                                    )
                        )
              );
  }

  if (matches.length > 0) {
        children.push(
                h(
                          "div",
                  { key: "matches", className: sectionClass },
                          h("h3", { className: labelClass }, "Recent matches"),
                          h(
                                      "ul",
                            { className: "mt-3 flex flex-col gap-3" },
                                      matches.map((m) => {
                                                    const winnerName = nameOf(m.winner_id);
                                                    const loserId = m.winner_id === m.player1_id ? m.player2_id : m.player1_id;
                                                    const loserName = nameOf(loserId);
                                                    const canRespond =
                                                                    m.status === "pending_confirmation" &&
                                                                    userId !== m.reported_by &&
                                                                    (userId === m.player1_id || userId === m.player2_id);

                                                              return h(
                                                                              "li",
                                                                { key: m.id, className: "flex flex-col gap-1.5" },
                                                                              h(
                                                                                                "div",
                                                                                { className: "flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between" },
                                                                                                h("span", { className: "text-sm text-white" }, `${winnerName} def. ${loserName}, ${m.score}`),
                                                                                                h(
                                                                                                                    "span",
                                                                                                  {
                                                                                                                        className:
                                                                                                                                                m.status === "confirmed"
                                                                                                                            ? "text-xs font-medium text-court-300"
                                                                                                                                                  : m.status === "disputed"
                                                                                                                            ? "text-xs font-medium text-red-300"
                                                                                                                                                  : "text-xs font-medium text-white/40",
                                                                                                    },
                                                                                                                    m.status === "confirmed" ? "Confirmed" : m.status === "disputed" ? "Disputed" : "Awaiting confirmation"
                                                                                                                  )
                                                                                              ),
                                                                              canRespond &&
                                                                                h(
                                                                                                    "div",
                                                                                  { className: "flex gap-2" },
                                                                                                    h(
                                                                                                                          "button",
                                                                                                      { onClick: () => respondToMatch(m.id, "confirmed"), disabled: busyId === m.id, className: buttonClass },
                                                                                                                          "Confirm"
                                                                                                                        ),
                                                                                                    h(
                                                                                                                          "button",
                                                                                                      { onClick: () => respondToMatch(m.id, "disputed"), disabled: busyId === m.id, className: ghostButtonClass },
                                                                                                                          "Dispute"
                                                                                                                        )
                                                                                                  )
                                                                            );
                                      })
                                    )
                        )
              );
  }

  if (errorMessage) {
        children.push(h("p", { key: "error", className: "mt-3 text-sm text-red-300" }, errorMessage));
  }

  if (children.length === 0) return null;

  return h("div", null, ...children);
}
