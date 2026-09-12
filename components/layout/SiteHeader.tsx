import Link from "next/link";
import { getCurrentPlayer } from "@/lib/queries/profile";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { PendingActionsBadge } from "@/components/layout/PendingActionsBadge";

export async function SiteHeader() {
  const player = await getCurrentPlayer();

  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
      <Link href="/" className="flex items-center gap-2 font-semibold text-white">
        🎾 Ladder
      </Link>

      {player ? (
        <div className="flex items-center gap-4">
          <PendingActionsBadge userId={player.user.id} />
          <Link
            href="/profile"
            className="text-sm text-white/70 transition hover:text-white"
          >
            {player.profile?.display_name ?? player.user.email}
          </Link>
          <SignOutButton />
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-white/60 transition hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-court-500 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-court-400"
          >
            Join
          </Link>
        </div>
      )}
    </header>
  );
}
