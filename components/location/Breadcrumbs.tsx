import Link from "next/link";

export function Breadcrumbs({
  city,
  club,
}: {
  city?: { name: string; slug: string };
  club?: { name: string; slug: string };
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-2 text-base text-white/70"
    >
      <Link href="/" className="transition hover:text-white">
        All cities
      </Link>
      {city && (
        <>
          <span className="text-white/35" aria-hidden="true">/</span>
          <Link
            href={`/${city.slug}`}
            className={
              club
                ? "transition hover:text-white"
                : "font-semibold text-white"
            }
          >
            {city.name}
          </Link>
        </>
      )}
      {city && club && (
        <>
          <span className="text-white/35" aria-hidden="true">/</span>
          <span className="font-semibold text-white">{club.name}</span>
        </>
      )}
    </nav>
  );
}
