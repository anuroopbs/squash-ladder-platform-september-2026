import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-3xl">
        🎾
      </div>
      <h1 className="mt-6 text-2xl font-bold text-white">
        We couldn&apos;t find that court
      </h1>
      <p className="mt-2 text-white/50">
        The city or club you&apos;re looking for doesn&apos;t exist yet — or
        the link might be off.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-court-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-court-400"
      >
        ← Back to all cities
      </Link>
    </main>
  );
}
