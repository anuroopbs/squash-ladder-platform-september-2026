import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createAdminClient,
  emailLayout,
  escapeHtml,
  NOTIFY_WINDOW_MS,
  sendEmail,
  SITE_URL,
} from "@/lib/notify";

// "A score was reported, please confirm" email. Called (fire-and-forget) by
// ReportScoreModal right after report_match() succeeds.
//
// Body: { opponentId }. The caller must be signed in and must have reported a
// pending_confirmation match against opponentId in the last 10 minutes. Score,
// winner, names and email all come from the database, never from the client.
export async function POST(request: NextRequest) {
  try {
    const { opponentId } = await request.json().catch(() => ({}));
    if (typeof opponentId !== "string") {
      return NextResponse.json({ skipped: true, reason: "missing opponentId" });
    }

    const {
      data: { user },
    } = await createClient().auth.getUser();
    if (!user) return NextResponse.json({ skipped: true, reason: "not signed in" }, { status: 401 });

    const admin = createAdminClient();
    if (!admin) return NextResponse.json({ skipped: true, reason: "service key not set" });

    const since = new Date(Date.now() - NOTIFY_WINDOW_MS).toISOString();
    const { data: match } = await admin
      .from("matches")
      .select("id, score, winner_id, player1_id, player2_id, ladders(clubs(name, slug, cities(slug)))")
      .eq("reported_by", user.id)
      .eq("status", "pending_confirmation")
      .or(`player1_id.eq.${opponentId},player2_id.eq.${opponentId}`)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!match) return NextResponse.json({ skipped: true, reason: "no recent match" });

    const { data: people } = await admin
      .from("profiles")
      .select("id, display_name, email")
      .in("id", [user.id, opponentId]);
    const reporter = people?.find((p) => p.id === user.id);
    const opponent = people?.find((p) => p.id === opponentId);
    if (!opponent?.email) return NextResponse.json({ skipped: true, reason: "opponent has no email" });

    const winner = people?.find((p) => p.id === match.winner_id);
    const club = (match as any).ladders?.clubs;
    const ladderUrl = club?.cities?.slug ? `${SITE_URL}/${club.cities.slug}/${club.slug}` : SITE_URL;
    const reporterName = escapeHtml(reporter?.display_name ?? "A player");

    const result = await sendEmail(
      opponent.email,
      `${reporter?.display_name ?? "A player"} reported a match result, please confirm`,
      emailLayout(
        "Match result reported 🏆",
        `<p><strong>${reporterName}</strong> reported a result for your match on the
         <strong>${escapeHtml(club?.name ?? "ladder")}</strong> ranking:</p>
         <p style="font-size: 18px; font-weight: 600; margin: 16px 0;">
           ${escapeHtml(winner?.display_name ?? "")} won ${escapeHtml(match.score ?? "")}
         </p>
         <p>If this is correct, confirm it to lock in the rank change. If it's
         wrong, you can dispute it. Unconfirmed results auto-confirm after 48 hours.</p>`,
        ladderUrl,
        "Confirm or dispute →"
      )
    );
    return NextResponse.json(result);
  } catch (err) {
    console.error("score-reported notification failed:", err);
    return NextResponse.json({ sent: false, reason: "error" });
  }
}
