import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

  const apiKey = process.env.RESEND_API_KEY;
  let sentCount = 0;

  for (const c of challenges as any[]) {
    const challenger = c.challenger;
    const challenged = c.challenged;

    if (apiKey) {
      const recipients = [
        { email: challenger?.email, otherName: challenged?.display_name },
        { email: challenged?.email, otherName: challenger?.display_name },
      ].filter((r) => r.email);

      for (const r of recipients) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from: "Squash Ladder <notifications@squashladder.in>",
            to: [r.email],
            subject: `⏰ Your challenge vs ${r.otherName} expires in 2 days`,
            html: `
              <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                <h2 style="color: #1a1b26;">Challenge expiring soon ⏰</h2>
                <p>Your challenge against <strong>${r.otherName}</strong> was
                sent 5 days ago and will automatically expire in 2 days if
                the match isn't reported.</p>
                <a href="https://squashladder.in"
                   style="display: inline-block; margin-top: 16px; padding: 12px 24px;
                          background: #38a473; color: white; border-radius: 8px;
                          text-decoration: none; font-weight: 600;">
                  Report the score →
                </a>
                <p style="margin-top: 24px; font-size: 12px; color: #888;">
                  Squash Ladder — squashladder.in
                </p>
              </div>
            `,
          }),
        }).catch((err) => console.error("Resend send failed:", err));
      }
    }

    await supabase
      .from("challenges")
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("id", c.id);

    sentCount++;
  }

  return NextResponse.json({ sent: sentCount });
}
