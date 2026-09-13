import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/lib/queries/profile";
import { getDisputedMatches } from "@/lib/queries/disputes";
import { DisputedMatchesPanel } from "@/components/admin/DisputedMatchesPanel";

export const revalidate = 0;

export default async function AdminDisputesPage() {
  const player = await getCurrentPlayer();
  if (!player) redirect("/login?next=/admin/disputes");
  if (!player.profile?.is_admin) redirect("/");

  const matches = await getDisputedMatches();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Disputed matches
      </h1>
      <p className="mt-2 text-white/50">
        Review matches players have flagged as disputed and either confirm the
        reported result or reset it back to pending confirmation.
      </p>

      <div className="mt-8">
        <DisputedMatchesPanel
          initialMatches={matches}
          adminUserId={player.user.id}
        />
      </div>
    </main>
  );
}
