"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0b0f0d] font-sans text-white antialiased">
        <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-3xl">
            ⚠️
          </div>
          <h1 className="mt-6 text-2xl font-bold text-white">
            Something went wrong
          </h1>
          <p className="mt-2 text-white/50">
            {error.message || "An unexpected error occurred. Please try again."}
          </p>
          {error.digest && (
            <p className="mt-2 text-xs text-white/30">Error code: {error.digest}</p>
          )}
          <div className="mt-6 flex items-center gap-3">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl bg-court-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-court-400"
            >
              ← Back to all cities
            </a>
            <button
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.08]"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
