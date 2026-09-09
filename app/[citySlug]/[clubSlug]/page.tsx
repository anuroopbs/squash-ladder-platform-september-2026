import { createElement } from "react";
import { notFound } from "next/navigation";
import { getClubBySlug } from "@/lib/queries/clubs";
import { getMainLadderForClub, getLadderStandings } from "@/lib/queries/ladders";
import { Breadcrumbs } from "@/components/location/Breadcrumbs";
import { LadderTable } from "@/components/ladder/LadderTable";
import { JoinLadderButton } from "@/components/ladder/JoinLadderButton";
import { ChallengeHub } from "@/components/ladder/ChallengeHub";

export const revalidate = 60;

export default async function ClubHubPage({ params }: { params: { citySlug: string; clubSlug: string } }) {
    const club = await getClubBySlug(params.citySlug, params.clubSlug);
    if (!club) notFound();

  const city = (club as any).cities as { slug: string; name: string };

  const ladder = await getMainLadderForClub(club.id);
    const standings = ladder ? await getLadderStandings(ladder.id) : [];

  return createElement(
        "main",
    { className: "mx-auto max-w-4xl px-6 py-12 sm:py-16" },
        createElement(Breadcrumbs, { city, club }),
        createElement(
                "h1",
          { className: "mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl" },
                club.name
              ),
        club.address && createElement("p", { className: "mt-2 text-white/50" }, club.address),
        club.description && createElement("p", { className: "mt-4 max-w-2xl text-white/60" }, club.description),
        createElement(
                "div",
          { className: "mt-10" },
                createElement(LadderTable, {
                          ladderName: ladder?.name ?? "Main Ladder",
                          standings,
                }),
                ladder && createElement(JoinLadderButton, { ladderId: ladder.id }),
                ladder && createElement(ChallengeHub, { ladderId: ladder.id, standings })
              )
      );
}
