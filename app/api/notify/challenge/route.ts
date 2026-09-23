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

// "You've been challenged" email. Called (fire-and-forget) by ChallengeModal
// right after the challenge row is inserted.
//
// Body: { opponentId }. The caller must be signed in and must have created a
// pending challenge against opponentId in the last 10 minutes. The recipient
// email, names and link are all looked up here, never taken from the client.
// Always answers 200 so a notification problem never breaks the challenge.
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
    const { data: challenge } = await admin
      .from("challenges")
      .select("id, ladders(clubs(name, slug, cities(slug)))")
      .eq("challenger_id", user.id)
      .eq("challenged_id", opponentId)
      .eq("status", "pending")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!challenge) return NextResponse.json({ skipped: true, reason: "no recent challenge" });

    const { data: people } = await admin
      .from("profiles")
      .select("id, display_name, email")
      .in("id", [user.id, opponentId]);
    const challenger = people?.find((p) => p.id === user.id);
    const opponent = people?.find((p) => p.id === opponentId);
    if (!opponent?.email) return NextResponse.json({ skipped: true, reason: "opponent has no email" });

    const club = (challenge as any).ladders?.clubs;
    const ladderUrl = club?.cities?.slug ? `${SITE_URL}/${club.cities.slug}/${club.slug}` : SITE_URL;
    const challengerName = escapeHtml(challenger?.display_name ?? "A player");
    const clubName = escapeHtml(club?.name ?? "ladder");

    const result = await sendEmail(
      opponent.email,
      `${challenger?.display_name ?? "A player"} has challenged you on the ladder!`,
      emailLayout(
        "You've been challenged! ⚔️",
        `<p><strong>${challengerName}</strong> has challenged you on the
         <strong>${clubName}</strong> ranking.</p>
         <p>You have 7 days to play the match before the challenge expires.</p>`,
        ladderUrl,
        "View the challenge →"
      )
    );
    return NextResponse.json(result);
  } catch (err) {
    console.error("challenge notification failed:", err);
    return NextResponse.json({ sent: false, reason: "error" });
  }
}
