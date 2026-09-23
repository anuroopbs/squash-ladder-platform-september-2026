/**
 * Deterministic date formatting for anything server-rendered then
 * hydrated on the client. `toLocaleDateString()` with no explicit locale
 * pulls the RUNTIME's default locale/timezone -- which differs between
 * the Node server (Vercel's server locale) and the visitor's browser
 * (their OS locale), producing different strings for the same date
 * (e.g. "9/9/2026" server vs "09/09/2026" client). React then throws
 * hydration mismatch errors (#425/#422) and has to discard + re-render
 * the whole subtree client-side, causing visible flicker.
 *
 * This formats using explicit UTC getters and fixed padding, so the
 * output is identical no matter where or in what locale it runs.
 */
export function formatDate(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}
