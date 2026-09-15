import { notFound } from "next/navigation";
import { getClubWithCity } from "@/lib/queries/ladders";
import { getLadderStandings } from "@/lib/queries/ladders";
import { getChallengesByLadder } from "@/lib/queries/challenges";
import { getMatchesByLadder } from "@/lib/queries/challenges";
import { getLadderById } from "@/lib/queries/ladders";
import { getCurrentPlayer } from "@/lib/queries/profile";
import { getLadderPlayer } from "@/lib/queries/challenges";
import { Breadcrumbs } from "@/components/location/Breadcrumbs";
import { LadderTable } from "@/components/ladder/LadderTable";
import { ChallengesList } from "@/components/ladder/ChallengesList";
import { MatchHistory } from "@/components/ladder/MatchHistory";

export const revalidate = 60;

export default async function ClubHubPage({
  params,
}: {
  params: { citySlug: string; clubSlug: string };
}) {
  const club = await getClubWithCity(params.citySlug, params.clubSlug);
  if (!club) notFound();

  // Get the primary ladder (first active one)
  const ladders = await (await import("@/lib/queries/ladders"))
    .getLaddersByClubSlug(params.citySlug, params.clubSlug);
  
  if (ladders.length === 0) {
    // No ladder yet — show club info with a "coming soon" for ladder
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

  // Check if current player is a member of this ladder
  const playerLadderInfo = currentPlayer?.user
    ? await getLadderPlayer(primaryLadder.id, currentPlayer.user.id)
    : null;

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

      <div className="mt-10 space-y-8">
        {/* Active Challenges */}
        {currentPlayer?.user && (
          <ChallengesList
            challenges={challenges}
            currentPlayerId={currentPlayer.user.id}
            onRefresh={async () => {
              "use server";
            }}
          />
        )}

        {/* Ladder Table */}
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

        {/* Match History */}
        <MatchHistory matches={matches} />
      </div>
    </main>
  );
}
