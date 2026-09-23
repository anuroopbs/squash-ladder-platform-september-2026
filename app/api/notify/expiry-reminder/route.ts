import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailLayout, escapeHtml, sendEmail, SITE_URL } from "@/lib/notify";

// Daily job: finds challenges created 5+ days ago (2 days before the 7-day
// expiry) that are still pending/accepted and haven't had a reminder sent
// yet, emails both players, and marks reminder_sent_at so it never repeats.
//
// Triggered by a Hermes cronjob calling this route once a day with a
// shared secret header (CRON_SECRET) so it can't be hit by randoms and
// used to spam Resend's quota.
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { skipped: true, reason: "SUPABASE_SERVICE_ROLE_KEY not set" },
      { status: 200 }
    );
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

  const { data: challenges, error } = await supabase
    .from("challenges")
    .select(
      "id, created_at, ladder_id, challenger:profiles!challenger_id(display_name, email), challenged:profiles!challenged_id(display_name, email)"
    )
    .in("status", ["pending", "accepted"])
    .lte("created_at", fiveDaysAgo.toISOString())
    .is("reminder_sent_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!challenges || challenges.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  let sentCount = 0;

  for (const c of challenges as any[]) {
    const challenger = c.challenger;
    const challenged = c.challenged;
    const recipients = [
      { email: challenger?.email, otherName: challenged?.display_name ?? "your opponent" },
      { email: challenged?.email, otherName: challenger?.display_name ?? "your opponent" },
    ].filter((r) => r.email);

    let anySent = false;
    for (const r of recipients) {
      const name = escapeHtml(r.otherName);
      const result = await sendEmail(
        r.email,
        `⏰ Your challenge vs ${r.otherName} expires in 2 days`,
        emailLayout(
          "Challenge expiring soon ⏰",
          `<p>Your challenge against <strong>${name}</strong> was sent 5 days ago
           and will expire in 2 days if the match isn't reported.</p>`,
          SITE_URL,
          "Report the score →"
        )
      );
      if (result.sent) anySent = true;
    }

    // Only mark as reminded once an email actually went out. Before
    // 2026-09-23 this was set even when Resend rejected the send (e.g. domain
    // not verified yet), so those reminders were silently lost forever.
    if (anySent) {
      await supabase
        .from("challenges")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", c.id);
      sentCount++;
    }
  }

  return NextResponse.json({ sent: sentCount, candidates: challenges.length });
}
