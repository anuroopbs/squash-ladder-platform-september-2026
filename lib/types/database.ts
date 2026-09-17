// Proper TypeScript types for the Ladder Platform
// These mirror sql/schema.sql exactly — no `as any` needed

export type LadderSport = "squash" | "padel" | "racquetball" | "other";
export type ChallengeStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "expired"
  | "completed";
export type MatchStatus = "pending_confirmation" | "confirmed" | "disputed";

// ============================================================================
// Base table row types
// ============================================================================

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  is_admin: boolean;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface City {
  id: string;
  name: string;
  slug: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Club {
  id: string;
  city_id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Ladder {
  id: string;
  club_id: string;
  name: string;
  slug: string;
  sport: LadderSport;
  description: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LadderPlayer {
  id: string;
  ladder_id: string;
  player_id: string;
  rank: number;
  joined_at: string;
}

export interface Challenge {
  id: string;
  ladder_id: string;
  challenger_id: string;
  challenged_id: string;
  status: ChallengeStatus;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  ladder_id: string;
  challenge_id: string | null;
  player1_id: string;
  player2_id: string;
  winner_id: string;
  score: string;
  status: MatchStatus;
  reported_by: string;
  confirmed_by: string | null;
  played_at: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Joined / computed types for UI consumption
// ============================================================================

/** City with a count of its clubs (from the `*, clubs(count)` query) */
export interface CityWithClubCount extends City {
  clubs: { count: number }[];
}

/** Club with a count of its ladders (from the `*, ladders(count)` query) */
export interface ClubWithLadderCount extends Club {
  ladders: { count: number }[];
}

/** Club row joined with its parent city (for breadcrumbs) */
export interface ClubWithCity extends Club {
  cities: { slug: string; name: string };
}

/** A single row from the `ladder_standings` view */
export interface LadderStandingRow {
  ladder_id: string;
  rank: number;
  player_id: string;
  display_name: string;
  avatar_url: string | null;
  is_admin: boolean;
  phone: string | null;
  joined_at: string;
  ladder_name: string;
  club_name: string;
  club_slug: string;
  city_name: string;
  city_slug: string;
}

/** Challenge enriched with profile names for display */
export interface ChallengeWithProfiles extends Challenge {
  challenger_name: string;
  challenged_name: string;
}

/** Match enriched with profile names and score for display */
export interface MatchWithProfiles extends Match {
  player1_name: string;
  player2_name: string;
  winner_name: string;
}

/** The currently signed-in player (auth user + their profile) */
export interface CurrentPlayer {
  user: { id: string; email: string | null };
  profile: Profile | null;
}
