import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/lib/queries/profile";
import { getAllLaddersWithPlayers } from "@/lib/queries/admin";
import { AdminLadderPanel } from "@/components/admin/AdminLadderPanel";

// Server-gated admin dashboard. Redirects anyone who isn't signed in AND
// is_admin=true straight back to the home page — no admin-only content is
// ever sent to the client for a non-admin. RLS on ladder_players/etc. is a
// second, independent enforcement layer (see sql/025_admin_panel_setup.sql)
// in case this page-level check is ever bypassed or a mutation is called
// directly.
export default async function AdminPage() {
  const player = await getCurrentPlayer();
  if (!player?.user) redirect("/login");
  if (!player.profile?.is_admin) redirect("/");

  const ladders = await getAllLaddersWithPlayers();

  return (
    <main className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-court-500/15 text-3xl ring-1 ring-inset ring-court-500/30">
          🛠️
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-sm text-white/50">
            Remove or move players across every ladder. Changes are immediate.
          </p>
        </div>
      </div>

      <div className="mt-10">
        <AdminLadderPanel initialLadders={ladders} />
      </div>
    </main>
  );
}
