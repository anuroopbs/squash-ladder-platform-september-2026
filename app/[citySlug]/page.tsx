import { notFound } from "next/navigation";
import { getCityBySlug } from "@/lib/queries/cities";
import { getClubsByCitySlug } from "@/lib/queries/clubs";
import { Breadcrumbs } from "@/components/location/Breadcrumbs";
import { ClubCardGrid } from "@/components/location/ClubCardGrid";

export const revalidate = 60;

export default async function CityPage({
  params,
}: {
  params: { citySlug: string };
}) {
  const city = await getCityBySlug(params.citySlug);
  if (!city) notFound();

  const clubs = await getClubsByCitySlug(params.citySlug);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <Breadcrumbs city={city} />

      <div className="mt-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {city.name}
          </h1>
          <p className="mt-2 text-white/50">
            {clubs.length === 0
              ? `No clubs in ${city.name} yet`
              : `${clubs.length} ${clubs.length === 1 ? "club" : "clubs"} on the ladder`}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <ClubCardGrid clubs={clubs} citySlug={city.slug} />
      </div>
    </main>
  );
}
