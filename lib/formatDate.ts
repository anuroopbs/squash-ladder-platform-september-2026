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
 * This formats using explicit UTC getters and a fixed month-name table,
 * so the output ("9 Sep 2026") is byte-identical no matter where or in
 * what locale/timezone it runs -- both server and client always read the
 * same UTC calendar date for the same timestamp.
 */
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatDate(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  const day = d.getUTCDate();
  const month = MONTH_NAMES[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return `${day} ${month} ${year}`;
}
