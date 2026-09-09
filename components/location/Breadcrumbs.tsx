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
      className="flex items-center gap-1.5 text-sm text-white/50"
    >
      <Link href="/" className="transition hover:text-white">
        All cities
      </Link>
      {city && (
        <>
          <span className="text-white/25">/</span>
          <Link
            href={`/${city.slug}`}
            className={
              club
                ? "transition hover:text-white"
                : "font-medium text-white"
            }
          >
            {city.name}
          </Link>
        </>
      )}
      {city && club && (
        <>
          <span className="text-white/25">/</span>
          <span className="font-medium text-white">{club.name}</span>
        </>
      )}
    </nav>
  );
}
