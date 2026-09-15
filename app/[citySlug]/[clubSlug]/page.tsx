import { notFound } from "next/navigation";
import { getClubWithCity } from "@/lib/queries/ladders";
import { getLadderStandings } from "@/lib/queries/ladders";
import { getChallengesByLadder } from "@/lib/queries/challenges";
import { getMatchesByLadder } from "@/lib/queries/challenges";
import { getCurrentPlayer } from "@/lib/queries/profile";
import { getLadderPlayer } from "@/lib/queries/challenges";
import { Breadcrumbs } from "@/components/location/Breadcrumbs";
import { LadderTable } from "@/components/ladder/LadderTable";
import { ChallengesList } from "@/components/ladder/ChallengesList";
import { MatchHistory } from "@/components/ladder/MatchHistory";
import { JoinLadderButton } from "@/components/ladder/JoinLadderButton";
import { Button } from "@/components/ui/Button";

export const revalidate = 60;

export default async function ClubHubPage({
  params,
  searchParams,
}: {
  params: { citySlug: string; clubSlug: string };
  searchParams: { join?: string };
}) {
  const club = await getClubWithCity(params.citySlug, params.clubSlug);
  if (!club) notFound();

  // Get ladders for this club
  const { getLaddersByClubSlug } = await import("@/lib/queries/ladders");
  const ladders = await getLaddersByClubSlug(params.citySlug, params.clubSlug);

  if (ladders.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
        <Breadcrumbs
          city={{ slug: club.cities.slug, name: club.cities.name }}
          club={{ slug: club.slug, name: club.name }}
        />
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {club.name}
        </h1>
        {club.address && <p className="mt-2 text-white/50">{club.address}</p>}
        {club.description && (
          <p className="mt-4 max-w-2xl text-white/60">{club.description}</p>
        )}
        <div className="mt-10 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-court-500/15 text-2xl ring-1 ring-inset ring-court-500/30">
            🏆
          </div>
          <h2 className="mt-4 text-lg font-semibold text-white">
            Ladder rankings are coming right here
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-white/50">
            No ladder has been set up for this club yet.
          </p>
        </div>
      </main>
    );
  }

  const primaryLadder = ladders[0];
  const standings = await getLadderStandings(primaryLadder.id);
  const challenges = await getChallengesByLadder(primaryLadder.id);
  const matches = await getMatchesByLadder(primaryLadder.id, 10);
  const currentPlayer = await getCurrentPlayer();
  const playerLadderInfo = currentPlayer?.user
    ? await getLadderPlayer(primaryLadder.id, currentPlayer.user.id)
    : null;

  // Filter to only pending challenges for the current player
  const myChallenges = challenges.filter(
    (c) =>
      c.status === "pending" &&
      (c.challenger_id === currentPlayer?.user?.id ||
        c.challenged_id === currentPlayer?.user?.id)
  );

  // Handle join=true from home page
  const showJoinPrompt = searchParams.join === "true";

  return (
    <main className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
      {/* Breadcrumbs */}
      <Breadcrumbs
        city={{ slug: club.cities.slug, name: club.cities.name }}
        club={{ slug: club.slug, name: club.name }}
      />

      {/* Club Header */}
      <div className="mt-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {club.name}
          </h1>
          {club.address && <p className="mt-2 text-white/50">{club.address}</p>}
        </div>
        {club.description && (
          <p className="max-w-md text-right text-sm text-white/60">{club.description}</p>
        )}
      </div>

      {/* Join prompt from home page */}
      {showJoinPrompt && !playerLadderInfo && currentPlayer?.user && (
        <div className="mt-6 rounded-2xl border border-court-400/20 bg-court-500/5 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-court-300">Ready to join?</h2>
              <p className="mt-1 text-sm text-white/60">
                You&apos;re one click away from joining this ladder.
              </p>
            </div>
            <JoinLadderButton ladderId={primaryLadder.id} onJoined={async () => {}} />
          </div>
        </div>
      )}

      {/* Not logged in but tried to join */}
      {showJoinPrompt && !currentPlayer?.user && (
        <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-yellow-300">Sign in to join</h2>
              <p className="mt-1 text-sm text-white/60">
                You need to be logged in to join this ladder.
              </p>
            </div>
            <a
              href={`/login?returnTo=/${params.citySlug}/${params.clubSlug}?join=true`}
              className="rounded-xl bg-court-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-court-400"
            >
              Sign In
            </a>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* ACTIVITY SECTION — AT THE TOP OF THE PAGE    */}
      {/* ============================================ */}
      <div className="mt-8">
        {/* Active Challenges — Most important, always first */}
        {currentPlayer?.user && myChallenges.length > 0 && (
          <div className="mb-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5">
            <h2 className="text-lg font-semibold text-yellow-300">⚔️ Action Required</h2>
            <p className="mt-1 text-sm text-white/60">
              You have pending challenges that need your response.
            </p>
            <div className="mt-4">
              <ChallengesList
                challenges={challenges}
                currentPlayerId={currentPlayer.user.id}
                onRefresh={async () => {
                  "use server";
                }}
              />
            </div>
          </div>
        )}

        {/* Quick actions bar */}
        {currentPlayer?.user && (
          <div className="mb-6 flex flex-wrap gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                const challengeBtn = document.querySelector("[data-challenge-trigger]") as HTMLButtonElement;
                challengeBtn?.click();
              }}
            >
              Challenge a Player
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const reportBtn = document.querySelector("[data-report-trigger]") as HTMLButtonElement;
                reportBtn?.click();
              }}
            >
              Report Score
            </Button>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* LADDER RANKINGS                             */}
      {/* ============================================ */}
      <div className="mt-8">
        <LadderTable
          standings={standings}
          challenges={challenges}
          currentPlayerId={currentPlayer?.user?.id ?? null}
          ladderId={primaryLadder.id}
          isMember={playerLadderInfo !== null}
          onRefresh={async () => {
            "use server";
          }}
        />
      </div>

      {/* Match History — at the bottom */}
      <div className="mt-8">
        <MatchHistory matches={matches} />
      </div>
    </main>
  );
}
