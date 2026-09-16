import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/lib/queries/profile";
import { getChallengesByPlayer } from "@/lib/queries/challenges";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function ProfilePage() {
  const player = await getCurrentPlayer();
  if (!player?.user) redirect("/login");

  const challenges = await getChallengesByPlayer(player.user.id);

  // Get player's standings across all ladders
  const supabase = createClient();
  const { data: standings } = await supabase
    .from("ladder_standings")
    .select("*")
    .eq("player_id", player.user.id)
    .order("rank");

  const pendingChallenges = challenges.filter(
    (c) => c.status === "pending" && c.challenged_id === player.user.id
  );
  const myActiveChallenges = challenges.filter(
    (c) => c.status === "pending" && c.challenger_id === player.user.id
  );

  return (
    <main className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-court-500/15 text-3xl ring-1 ring-inset ring-court-500/30">
          🎾
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {player.profile?.display_name ?? "Player"}
          </h1>
          <p className="text-sm text-white/50">{player.user.email}</p>
        </div>
      </div>

      {/* My Ladder Positions */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white">My Ladder Positions</h2>
        {standings && standings.length > 0 ? (
          <div className="mt-4 space-y-2">
            {standings.map((row) => (
              <Link
                key={row.ladder_id}
                href={`/${row.city_slug}/${row.club_slug}`}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20"
              >
                <div className="w-12 text-center text-lg font-bold text-white/80">
                  #{row.rank}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">{row.ladder_name}</p>
                  <p className="text-xs text-white/40">
                    {row.club_name} • {row.city_name}
                  </p>
                </div>
                <span className="text-sm text-white/40">→</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
            <p className="text-sm text-white/50">
              You haven&lsquo;t joined any ladders yet.
            </p>
          </div>
        )}
      </section>

      {/* Pending Challenges */}
      {pendingChallenges.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-white">
            Pending Challenges ({pendingChallenges.length})
          </h2>
          <div className="mt-4 space-y-2">
            {pendingChallenges.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4"
              >
                <div className="flex-1">
                  <p className="text-sm text-white">
                    <span className="font-medium">{c.challenger_name}</span>{" "}
                    challenged you
                  </p>
                  <p className="text-xs text-white/40">
                    {new Date(c.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
