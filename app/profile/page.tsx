import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/lib/queries/profile";
import { getLaddersForPlayer } from "@/lib/queries/playerLadders";

export const revalidate = 0;

export default async function ProfilePage() {
  const player = await getCurrentPlayer();
  if (!player) redirect("/login?next=/profile");

  const ladders = await getLaddersForPlayer(player.user.id);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        {player.profile?.display_name ?? player.user.email}
      </h1>
      <p className="mt-2 text-white/50">{player.user.email}</p>

      <div className="mt-10">
        <h2 className="text-sm font-semibold text-white">Your ladders</h2>

        {ladders.length === 0 ? (
          <p className="mt-3 text-sm text-white/50">
            You haven&apos;t joined a ladder yet.{" "}
            <Link href="/" className="text-court-300 underline underline-offset-2">
              Find one
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {ladders.map((l) => (
              <li
                key={l.ladder_id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20"
              >
                <Link
                  href={`/${l.city_slug}/${l.club_slug}`}
                  className="flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{l.club_name}</p>
                    <p className="mt-0.5 text-xs text-white/50">
                      {l.city_name} · {l.ladder_name}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg border border-white/15 px-2.5 py-1 text-sm font-medium text-white/80">
                    #{l.rank} of {l.total_players}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
