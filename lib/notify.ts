import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Shared helpers for the /api/notify/* routes.
//
// Security model (added 2026-09-23 after an audit found the routes would
// email ANY address passed in the request body, i.e. an open relay on our
// Resend quota): routes never accept an email address or message text from
// the client. They take only the opponent's player id, check that the
// signed-in caller has a matching, recent challenge/match with that player,
// and look up the email + names server-side with the service role key.

export const SITE_URL = "https://squashladder.in";
const FROM = "Squash Ladder <notifications@squashladder.in>";

/** Service-role client. Server-only; bypasses RLS. Null if not configured. */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false },
  });
}

/** Escape user-controlled text (display names, scores) before putting it in HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type SendResult = { sent: boolean; skipped?: boolean; reason?: string };

/** Send one email through Resend. Never throws. */
export async function sendEmail(to: string, subject: string, html: string): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, skipped: true, reason: "RESEND_API_KEY not set" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend API error:", errText);
      return { sent: false, reason: "resend_error" };
    }
    return { sent: true };
  } catch (err) {
    console.error("Resend request failed:", err);
    return { sent: false, reason: "network_error" };
  }
}

/** Standard button-style email body used by every notification. */
export function emailLayout(heading: string, bodyHtml: string, ctaUrl: string, ctaLabel: string) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #1a1b26;">${heading}</h2>
      ${bodyHtml}
      <a href="${ctaUrl}"
         style="display: inline-block; margin-top: 16px; padding: 12px 24px;
                background: #38a473; color: white; border-radius: 8px;
                text-decoration: none; font-weight: 600;">
        ${ctaLabel}
      </a>
      <p style="margin-top: 24px; font-size: 12px; color: #888;">
        Squash Ladder, squashladder.in
      </p>
    </div>
  `;
}

/** Only notify about things created in the last few minutes (stops replays/spam). */
export const NOTIFY_WINDOW_MS = 10 * 60 * 1000;
