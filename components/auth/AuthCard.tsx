import Link from "next/link";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-lg font-semibold text-white"
          >
            🎾 Ladder
          </Link>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-white">
            {title}
          </h1>
          <p className="mt-1.5 text-sm text-white/50">{subtitle}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          {children}
        </div>

        <p className="mt-6 text-center text-sm text-white/40">{footer}</p>
      </div>
    </main>
  );
}
