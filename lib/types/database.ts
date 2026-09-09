// Hand-written types mirroring sql/schema.sql.
// Once the Supabase CLI is set up locally, replace this with the generated
// version: `supabase gen types typescript --project-id wektzyvprwhzdqizbgih`

export type LadderSport = "squash" | "padel" | "racquetball" | "other";
export type ChallengeStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "expired"
  | "completed";
export type MatchStatus = "pending_confirmation" | "confirmed" | "disputed";

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  is_admin: boolean;
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

// Convenience shapes used by the UI layer (joined query results)

export interface ClubWithLadderCount extends Club {
  ladders: { count: number }[];
}

export interface CityWithClubCount extends City {
  clubs: { count: number }[];
}
