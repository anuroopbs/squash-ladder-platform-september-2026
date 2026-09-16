"use client";

export function VisionSection() {
  return (
    <section className="mt-16">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-bold text-white">Our Vision</h2>
        <p className="mt-2 text-white/60">
          More than just rankings &mdash; it&lsquo;s about community.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-court-500/15 text-2xl ring-1 ring-inset ring-court-500/30">
            🏸
          </div>
          <h3 className="mt-4 font-semibold text-white">Play the Game</h3>
          <p className="mt-2 text-sm text-white/55">
            Squash is one of the most social sports. Our platform makes it easy to find opponents at your level and push each other to improve.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-court-500/15 text-2xl ring-1 ring-inset ring-court-500/30">
            🤝
          </div>
          <h3 className="mt-4 font-semibold text-white">Make Connections</h3>
          <p className="mt-2 text-sm text-white/55">
            Every match is a chance to meet someone new. Build your squash circle, find hitting partners, and make friends through friendly competition.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-court-500/15 text-2xl ring-1 ring-inset ring-court-500/30">
            📈
          </div>
          <h3 className="mt-4 font-semibold text-white">Track Progress</h3>
          <p className="mt-2 text-sm text-white/55">
            Watch yourself climb the ladder over time. Every challenge makes you better — on and off the court.
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-court-400/20 bg-court-500/5 p-6 text-center">
        <p className="text-sm text-white/70">
          <strong className="text-court-300">Fair play is everything.</strong> We built this platform to bring squash players together in a spirit of friendly competition and mutual respect. Challenge honestly, report fairly, and let the rankings reflect the truth.
        </p>
      </div>
    </section>
  );
}
