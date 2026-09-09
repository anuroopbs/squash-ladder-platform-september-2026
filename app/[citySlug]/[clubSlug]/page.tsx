import { notFound } from "next/navigation";
import { getClubBySlug } from "@/lib/queries/clubs";
import { Breadcrumbs } from "@/components/location/Breadcrumbs";

export const revalidate = 60;

export default async function ClubHubPage({
  params,
}: {
  params: { citySlug: string; clubSlug: string };
}) {
  const club = await getClubBySlug(params.citySlug, params.clubSlug);
  if (!club) notFound();

  // `cities` comes back as a single joined row here (see getClubBySlug),
  // typed loosely because we're not generating Supabase types yet.
  const city = (club as any).cities as { slug: string; name: string };

  return (
    <main className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
      <Breadcrumbs city={city} club={club} />

      <h1 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
        {club.name}
      </h1>
      {club.address && (
        <p className="mt-2 text-white/50">{club.address}</p>
      )}
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
          You&apos;ve found the club — next up: player rankings, challenges,
          and score reporting for this ladder.
        </p>
      </div>
    </main>
  );
}
