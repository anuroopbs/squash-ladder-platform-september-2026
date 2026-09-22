// ============================================================================
// AppError — Structured error codes for fast debugging
// ============================================================================
//
// Use this when you throw an error in server code or client modals. The `code`
// is searchable; copy it into grep / `rg ERR_` and you land in seconds.
//
//   throw new AppError('ERR_AUTH_NOT_SIGNED_IN', 'You must be signed in')
//
// These codes are ALSO surfaced to the UI error boundary, so a user sees
// "Error: ERR_LADDER_NOT_FOUND" — searchable, traceable.
//
// AppError code format: ERR_<CONTEXT>_<SPECIFIC>
//   AUTH_*    — authentication / authorization
//   CLUB_*    — club lookup / city-club relationship
//   LADDER_*  — ladder existence, membership, ranks
//   CHAL_*    — challenge creation, rank gap, existing challenges
//   MATCH_*   — score reporting, winner validation
//   SCORE_*   — score format, parsing
//   DB_*      — generic database / RLS errors
// ============================================================================

export type AppErrorCode =
  | 'ERR_AUTH_NOT_SIGNED_IN'
  | 'ERR_AUTH_RLS_DENIED'
  | 'ERR_AUTH_SESSION_EXPIRED'
  | 'ERR_AUTH_NOT_ADMIN'
  | 'ERR_CLUB_NOT_FOUND'
  | 'ERR_CITY_NOT_FOUND'
  | 'ERR_LADDER_NOT_FOUND'
  | 'ERR_LADDER_INACTIVE'
  | 'ERR_LADDER_NOT_MEMBER'
  | 'ERR_LADDER_ALREADY_MEMBER'
  | 'ERR_CHALLENGE_RANK_GAP'
  | 'ERR_CHALLENGE_ALREADY_ACTIVE'
  | 'ERR_CHALLENGE_SELF'
  | 'ERR_CHALLENGE_DECLINED'
  | 'ERR_CHALLENGE_EXPIRED'
  | 'ERR_MATCH_SCORE_FORMAT'
  | 'ERR_MATCH_WINNER_INVALID'
  | 'ERR_DB_UNKNOWN';

export class AppError extends Error {
  code: AppErrorCode;

  constructor(code: AppErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'AppError';
  }
}

// Convenience factory — matches the rest of the codebase (throw err, not return)
export function appError(code: AppErrorCode, message: string): AppError {
  return new AppError(code, message);
}

// ============================================================================
// Maps known Postgres/Supabase error codes and messages to user-facing
// strings. Without this, raw errors like "duplicate key value violates
// unique constraint one_active_challenge_per_player" reach the UI.
//
// Usage: catch (err) { setError(toUserMessage(err)); }
// ============================================================================

interface PostgrestLikeError {
  code?: string;
  message?: string;
  details?: string | null;
}

const KNOWN_MESSAGES: { match: RegExp; message: string; code?: AppErrorCode }[] = [
  {
    match: /one_active_challenge_per_player/i,
    message: "You already have an active challenge. Finish or wait for it to expire before sending another.",
    code: 'ERR_CHALLENGE_ALREADY_ACTIVE',
  },
  {
    match: /ladder_players_ladder_id_rank_key|ladder_id.*rank/i,
    message: "That rank is already taken in this ladder. Please refresh and try again.",
    code: 'ERR_LADDER_ALREADY_MEMBER',
  },
  {
    match: /ladder_players_ladder_id_player_id_key|already.*member|duplicate.*ladder_players/i,
    message: "You're already a member of this ladder.",
    code: 'ERR_LADDER_ALREADY_MEMBER',
  },
  {
    match: /valid_score_format/i,
    message: "Invalid score format. Use something like: 11-8, 9-11, 11-6",
    code: 'ERR_MATCH_SCORE_FORMAT',
  },
  {
    match: /you can only challenge players 1-3 positions above you/i,
    message: "You can only challenge players 1-3 positions above you on the ladder.",
    code: 'ERR_CHALLENGE_RANK_GAP',
  },
  {
    match: /challenger is not in this ladder|challenged player is not in this ladder/i,
    message: "Both players must be members of this ladder to create a challenge.",
    code: 'ERR_LADDER_NOT_MEMBER',
  },
  {
    match: /winner_id.*player1_id.*player2_id|check constraint.*winner/i,
    message: "The winner must be one of the two players in the match.",
    code: 'ERR_MATCH_WINNER_INVALID',
  },
  {
    match: /permission denied for table|row-level security/i,
    message: "You don't have permission to do that.",
    code: 'ERR_AUTH_RLS_DENIED',
  },
  {
    match: /JWT expired|invalid claim|not authenticated/i,
    message: "Your session has expired. Please sign in again.",
    code: 'ERR_AUTH_SESSION_EXPIRED',
  },
];

/**
 * Converts a Supabase/Postgrest error (or any thrown error) into a short,
 * user-facing message. Falls back to a generic message rather than ever
 * showing a raw database error string to the end user.
 *
 * For AppErrors, the message is already user-facing and includes the code
 * for searchability.
 */
export function toUserMessage(err: unknown): string {
  // AppError — already structured, include code for searchability
  if (err instanceof AppError) {
    return `[${err.code}] ${err.message}`;
  }

  const pgError = err as PostgrestLikeError;
  const raw = [pgError?.message, pgError?.details].filter(Boolean).join(" ");

  if (raw) {
    for (const { match, message } of KNOWN_MESSAGES) {
      if (match.test(raw)) return message;
    }
  }

  // If it's a plain Error with a message we already wrote ourselves
  // (e.g. "You must be signed in to challenge"), it's already user-facing.
  if (err instanceof Error && err.message && !err.message.includes("violates")) {
    return err.message;
  }

  return "Something went wrong. Please try again.";
}

/**
 * Extracts the AppErrorCode from any error, or returns null if unstructured.
 * Useful for UI error boundaries to display a searchable code.
 */
export function getErrorCode(err: unknown): AppErrorCode | null {
  if (err instanceof AppError) return err.code;
  if (err instanceof Error) {
    const match = err.message.match(/^ERR_[A-Z0-9_]+/);
    if (match) return match[0] as AppErrorCode;
  }
  return null;
}
