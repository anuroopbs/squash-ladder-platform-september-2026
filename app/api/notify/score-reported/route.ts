import { NextRequest, NextResponse } from "next/server";

// Sends a "a score was reported against you, please confirm" transactional
// email via Resend. Called client-side from ReportScoreModal right after a
// pending_confirmation match is successfully inserted. Never blocks the
// score submission itself -- email is best-effort, same pattern as
// /api/notify/challenge.
//
// Requires RESEND_API_KEY set in Vercel project env vars. If it's not
// set, this route no-ops with a 200.
export async function POST(request: NextRequest) {
  try {
    const { to, reporterName, opponentName, score, winnerName, clubName, ladderUrl } =
      await request.json();

    if (!to || !reporterName || !opponentName || !score) {
      return NextResponse.json(
        { skipped: true, reason: "missing required fields" },
        { status: 200 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { skipped: true, reason: "RESEND_API_KEY not set" },
        { status: 200 }
      );
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "Squash Ladder <notifications@squashladder.in>",
        to: [to],
        subject: `🏆 ${reporterName} reported a match result — please confirm`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #1a1b26;">Match result reported 🏆</h2>
            <p><strong>${reporterName}</strong> reported a result for your match on the
            <strong>${clubName ?? "ladder"}</strong> ranking:</p>
            <p style="font-size: 18px; font-weight: 600; margin: 16px 0;">
              ${winnerName} won ${score}
            </p>
            <p>If this is correct, confirm it to lock in the rank change. If it's
            wrong, you can dispute it instead. Unconfirmed results auto-confirm
            after 48 hours.</p>
            <a href="${ladderUrl ?? "https://squashladder.in"}"
               style="display: inline-block; margin-top: 16px; padding: 12px 24px;
                      background: #38a473; color: white; border-radius: 8px;
                      text-decoration: none; font-weight: 600;">
              Confirm or dispute →
            </a>
            <p style="margin-top: 24px; font-size: 12px; color: #888;">
              Squash Ladder — squashladder.in
            </p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend API error:", errText);
      return NextResponse.json({ sent: false, error: errText }, { status: 200 });
    }

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("Failed to send score-reported notification:", err);
    return NextResponse.json({ sent: false, error: String(err) }, { status: 200 });
  }
}
