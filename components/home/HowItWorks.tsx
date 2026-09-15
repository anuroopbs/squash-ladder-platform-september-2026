"use client";

export function HowItWorks() {
  return (
    <section className="mt-16">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-bold text-white">How It Works</h2>
        <p className="mt-2 text-white/60">
          Simple, competitive, and social. Here's how to get started.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Step 1 */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-court-500/15 text-lg ring-1 ring-inset ring-court-500/30">
            1️⃣
          </div>
          <h3 className="mt-4 font-semibold text-white">Join a Ladder</h3>
          <p className="mt-2 text-sm text-white/55">
            Pick your city and club. Join the ladder at the bottom — everyone starts somewhere.
          </p>
        </div>

        {/* Step 2 */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-court-500/15 text-lg ring-1 ring-inset ring-court-500/30">
            2️⃣
          </div>
          <h3 className="mt-4 font-semibold text-white">Challenge Up</h3>
          <p className="mt-2 text-sm text-white/55">
            Challenge anyone <strong>1-3 positions above you</strong>. Win to swap ranks, lose and stay put.
          </p>
        </div>

        {/* Step 3 */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-court-500/15 text-lg ring-1 ring-inset ring-court-500/30">
            3️⃣
          </div>
          <h3 className="mt-4 font-semibold text-white">Report Scores</h3>
          <p className="mt-2 text-sm text-white/55">
            After your match, report the score. Both players confirm — ranks update automatically.
          </p>
        </div>

        {/* Step 4 */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-court-500/15 text-lg ring-1 ring-inset ring-court-500/30">
            4️⃣
          </div>
          <h3 className="mt-4 font-semibold text-white">Climb & Connect</h3>
          <p className="mt-2 text-sm text-white/55">
            Move up the ladder, track matches, and meet your squash community. Play fair, climb high.
          </p>
        </div>
      </div>

      {/* Rules Summary */}
      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="text-lg font-semibold text-white">📏 Ladder Rules</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-court-400">✓</span>
            <p className="text-sm text-white/60">
              <strong>New players</strong> join at the bottom of the ladder
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-court-400">✓</span>
            <p className="text-sm text-white/60">
              <strong>Challenge</strong> someone 1-3 positions above you
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-court-400">✓</span>
            <p className="text-sm text-white/60">
              <strong>Win = swap ranks</strong>. Lose = positions stay the same
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-court-400">✓</span>
            <p className="text-sm text-white/60">
              <strong>1 active challenge</strong> at a time per player
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-court-400">✓</span>
            <p className="text-sm text-white/60">
              <strong>7-day window</strong> to complete a challenge
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-court-400">✓</span>
            <p className="text-sm text-white/60">
              <strong>Honest reporting</strong> — confirm scores together
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
