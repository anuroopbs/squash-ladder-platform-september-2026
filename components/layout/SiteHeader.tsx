import Link from "next/link";
import { getCurrentPlayer } from "@/lib/queries/profile";
import { SignOutButton } from "@/components/auth/SignOutButton";

export async function SiteHeader() {
  const player = await getCurrentPlayer();

  return (
    <header className="sticky top-0 z-50 mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
      <Link href="/" className="flex items-center gap-2 font-semibold text-white">
        🎾 Ladder
      </Link>

      {player ? (
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/profile"
            className="text-sm text-white/60 transition hover:text-white"
          >
            <span className="hidden sm:inline">{player.profile?.display_name ?? player.user.email}</span>
            <span className="sm:hidden">Profile</span>
          </Link>
          <SignOutButton />
        </div>
      ) : (
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-court-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-court-400"
          >
            Join
          </Link>
        </div>
      )}
    </header>
  );
}
