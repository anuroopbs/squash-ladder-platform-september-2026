"use client";

import Link from "next/link";
import { isChunkLoadError } from "@/lib/isChunkLoadError";

export default function ClubHubError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isStaleChunk = isChunkLoadError(error);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-3xl">
        {isStaleChunk ? "🔄" : "⚠️"}
      </div>
      <h1 className="mt-6 text-2xl font-bold text-white">
        {isStaleChunk ? "We've updated the site" : "Something went wrong loading this club"}
      </h1>
      <p className="mt-2 text-white/50">
        {isStaleChunk
          ? "Tap refresh to load the latest version."
          : error.message || "An unexpected error occurred. Please try again."}
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-xl bg-court-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-court-400"
        >
          ← Back to all cities
        </Link>
        {isStaleChunk ? (
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.08]"
          >
            Tap to refresh
          </button>
        ) : (
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.08]"
          >
            Try again
          </button>
        )}
      </div>
    </main>
  );
}
