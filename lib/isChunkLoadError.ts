/**
 * Detects the "stale chunk" class of error: after a new deploy, a user's
 * already-open tab still references old JS chunk filenames that Vercel
 * has since replaced, so the browser 404s trying to fetch them. This
 * shows up as "Loading chunk N failed" / ChunkLoadError, and clicking
 * "Try again" (which just re-renders the same broken React tree) can
 * never fix it -- the fix is a full page reload so the browser re-fetches
 * the current index.html and its up-to-date chunk manifest.
 */
export function isChunkLoadError(error: Error): boolean {
  const message = error.message || "";
  return (
    error.name === "ChunkLoadError" ||
    /Loading chunk [\d\w]+ failed/i.test(message) ||
    /Failed to fetch dynamically imported module/i.test(message) ||
    /error loading dynamically imported module/i.test(message)
  );
}
