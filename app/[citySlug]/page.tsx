import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCityBySlug } from "@/lib/queries/cities";
import { getClubsByCitySlug } from "@/lib/queries/clubs";
import { Breadcrumbs } from "@/components/location/Breadcrumbs";
import { ClubCardGrid } from "@/components/location/ClubCardGrid";
import { CreateLadderButtonForCity } from "@/components/ladder/CreateLadderButtonForCity";

export const revalidate = 60;

// SEO: organic search is how most future players in a new city will find
// this before they ever hear about it by word of mouth, so every city
// page gets a real, city-specific title/description rather than
// inheriting the generic root layout metadata.
export async function generateMetadata({
  params,
}: {
  params: { citySlug: string };
}): Promise<Metadata> {
  const city = await getCityBySlug(params.citySlug);
  if (!city) return {};

  const title = `Squash Ladder in ${city.name} | Find Your Local Ranking`;
  const description = `Join a squash, padel, or racquetball ladder in ${city.name}. Challenge nearby players, climb the rankings, and find your local club on Squash Ladder.`;
  const url = `https://squashladder.in/${city.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Squash Ladder",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function CityPage({
  params,
}: {
  params: { citySlug: string };
}) {
  const city = await getCityBySlug(params.citySlug);
  if (!city) notFound();

  const clubs = await getClubsByCitySlug(params.citySlug);

  // SportsOrganization structured data so search engines can surface this
  // as a real local sports org, not just a generic web page -- helps
  // ranking for "squash ladder in <city>" type queries.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    name: `Squash Ladder — ${city.name}`,
    url: `https://squashladder.in/${city.slug}`,
    sport: "Squash",
    areaServed: {
      "@type": "City",
      name: city.name,
    },
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
        <CreateLadderButtonForCity cityId={city.id} />
      </div>

      <div className="mt-8">
        <ClubCardGrid clubs={clubs} citySlug={city.slug} />
      </div>
    </main>
  );
}
