// Maps known Postgres/Supabase error codes and messages to user-facing
// strings. Without this, raw errors like "duplicate key value violates
// unique constraint one_active_challenge_per_player" reach the UI.
//
// Usage: catch (err) { setError(toUserMessage(err)); }

interface PostgrestLikeError {
  code?: string;
  message?: string;
  details?: string | null;
}

const KNOWN_MESSAGES: { match: RegExp; message: string }[] = [
  {
    match: /one_active_challenge_per_player/i,
    message: "You already have an active challenge. Finish or wait for it to expire before sending another.",
  },
  {
    match: /ladder_players_ladder_id_rank_key|ladder_id.*rank/i,
    message: "That rank is already taken in this ladder. Please refresh and try again.",
  },
  {
    match: /ladder_players_ladder_id_player_id_key|already.*member|duplicate.*ladder_players/i,
    message: "You're already a member of this ladder.",
  },
  {
    match: /valid_score_format/i,
    message: "Invalid score format. Use something like: 11-8, 9-11, 11-6",
  },
  {
    match: /you can only challenge players 1-3 positions above you/i,
    message: "You can only challenge players 1-3 positions above you on the ladder.",
  },
  {
    match: /challenger is not in this ladder|challenged player is not in this ladder/i,
    message: "Both players must be members of this ladder to create a challenge.",
  },
  {
    match: /winner_id.*player1_id.*player2_id|check constraint.*winner/i,
    message: "The winner must be one of the two players in the match.",
  },
  {
    match: /permission denied for table|row-level security/i,
    message: "You don't have permission to do that.",
  },
  {
    match: /JWT expired|invalid claim|not authenticated/i,
    message: "Your session has expired. Please sign in again.",
  },
];

/**
 * Converts a Supabase/Postgrest error (or any thrown error) into a short,
 * user-facing message. Falls back to a generic message rather than ever
 * showing a raw database error string to the end user.
 */
export function toUserMessage(err: unknown): string {
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
