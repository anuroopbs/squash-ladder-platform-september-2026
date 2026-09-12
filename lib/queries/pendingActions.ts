import { createClient } from "@/lib/supabase/client";

// A "pending action" is something that needs THIS signed-in player's
// attention somewhere on the platform, regardless of which club/ladder
// page they're currently looking at (or not looking at any club page at
// all). Two kinds today:
//   - "challenge": someone has challenged them and it's awaiting their
//     accept/decline.
//   - "confirmation": someone reported a match score against them and it's
//     awaiting their confirm/dispute.
// This intentionally mirrors ChallengeHub's own status values
// ("pending" / "pending_confirmation") so the two stay in sync.
export type PendingAction = {
  id: string;
  kind: "challenge" | "confirmation";
  otherPlayerName: string;
  clubName: string;
  citySlug: string;
  clubSlug: string;
};

export async function getPendingActionsForUser(userId: string): Promise<PendingAction[]> {
  const supabase = createClient();

  const [{ data: challengeRows }, { data: matchRows }] = await Promise.all([
    supabase
      .from("challenges")
      .select("id, ladder_id, challenger_id")
      .eq("challenged_id", userId)
      .eq("status", "pending"),
    supabase
      .from("matches")
      .select("id, ladder_id, player1_id, player2_id, reported_by")
      .eq("status", "pending_confirmation")
      .neq("reported_by", userId)
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`),
  ]);

  const challenges = challengeRows ?? [];
  const matches = matchRows ?? [];

  if (challenges.length === 0 && matches.length === 0) return [];

  const ladderIds = Array.from(
    new Set([...challenges.map((c) => c.ladder_id), ...matches.map((m) => m.ladder_id)])
  );

  const { data: ladderRows } = await supabase.from("ladders").select("id, club_id").in("id", ladderIds);
  const ladders = ladderRows ?? [];

  const clubIds = Array.from(new Set(ladders.map((l) => l.club_id)));
  const { data: clubRows } = await supabase
    .from("clubs")
    .select("id, name, slug, city_id")
    .in("id", clubIds.length > 0 ? clubIds : [""]);
  const clubs = clubRows ?? [];

  const cityIds = Array.from(new Set(clubs.map((c) => c.city_id)));
  const { data: cityRows } = await supabase
    .from("cities")
    .select("id, slug")
    .in("id", cityIds.length > 0 ? cityIds : [""]);
  const cities = cityRows ?? [];

  const otherPlayerIds = Array.from(
    new Set([
      ...challenges.map((c) => c.challenger_id),
      ...matches.map((m) => (m.player1_id === userId ? m.player2_id : m.player1_id)),
    ])
  );
  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", otherPlayerIds.length > 0 ? otherPlayerIds : [""]);
  const profiles = profileRows ?? [];

  function locationFor(ladderId: string) {
    const ladder = ladders.find((l) => l.id === ladderId);
    const club = ladder ? clubs.find((c) => c.id === ladder.club_id) : undefined;
    const city = club ? cities.find((ci) => ci.id === club.city_id) : undefined;
    return {
      clubName: club?.name ?? "a club",
      clubSlug: club?.slug ?? "",
      citySlug: city?.slug ?? "",
    };
  }

  function nameFor(playerId: string) {
    return profiles.find((p) => p.id === playerId)?.display_name ?? "A player";
  }

  const challengeActions: PendingAction[] = challenges.map((c) => ({
    id: `challenge-${c.id}`,
    kind: "challenge",
    otherPlayerName: nameFor(c.challenger_id),
    ...locationFor(c.ladder_id),
  }));

  const matchActions: PendingAction[] = matches.map((m) => {
    const otherId = m.player1_id === userId ? m.player2_id : m.player1_id;
    return {
      id: `match-${m.id}`,
      kind: "confirmation",
      otherPlayerName: nameFor(otherId),
      ...locationFor(m.ladder_id),
    };
  });

  // Drop anything we couldn't resolve a real club/city link for (shouldn't
  // normally happen, but a badge item with a dead link is worse than one
  // fewer item).
  return [...challengeActions, ...matchActions].filter((a) => a.clubSlug && a.citySlug);
}
