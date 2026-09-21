import { NextRequest, NextResponse } from "next/server";

// Sends a "you've been challenged" transactional email via Resend.
// Called client-side from ChallengeModal right after a challenge row is
// successfully inserted. Never blocks the challenge creation itself --
// if the email fails, the challenge still stands; email is best-effort.
//
// Requires RESEND_API_KEY set in Vercel project env vars. If it's not
// set, this route no-ops with a 200 so the client never sees an error
// for a feature that just isn't configured yet.
export async function POST(request: NextRequest) {
  try {
    const { to, challengerName, challengedName, clubName, ladderUrl } =
      await request.json();

    if (!to || !challengerName || !challengedName) {
      return NextResponse.json(
        { skipped: true, reason: "missing required fields" },
        { status: 200 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      // Not configured yet -- don't error the challenge flow over it.
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
        subject: `⚔️ ${challengerName} has challenged you on the ladder!`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #1a1b26;">You've been challenged! ⚔️</h2>
            <p><strong>${challengerName}</strong> has challenged you on the
            <strong>${clubName ?? "ladder"}</strong> ranking.</p>
            <p>You have 7 days to accept, decline, or play the match before
            the challenge expires.</p>
            <a href="${ladderUrl ?? "https://squashladder.in"}"
               style="display: inline-block; margin-top: 16px; padding: 12px 24px;
                      background: #38a473; color: white; border-radius: 8px;
                      text-decoration: none; font-weight: 600;">
              View the challenge →
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
      // Still return 200 -- email failure shouldn't surface as an error
      // to the player who just successfully created a real challenge.
      return NextResponse.json(
        { sent: false, error: errText },
        { status: 200 }
      );
    }

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("Failed to send challenge notification:", err);
    return NextResponse.json(
      { sent: false, error: String(err) },
      { status: 200 }
    );
  }
}
