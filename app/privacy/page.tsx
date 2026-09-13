export const metadata = {
  title: "Privacy Policy — Ladder",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-white/80">
      <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
      <p className="mt-2 text-sm text-white/40">Last updated: September 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed">
        <p>
          Ladder is a squash and racket-sports ladder platform. This page
          explains what information we collect from players and how it is
          used.
        </p>

        <section>
          <h2 className="text-lg font-semibold text-white">
            Information we collect
          </h2>
          <p className="mt-2">
            When you create an account, we collect your email address and the
            display name you choose to show on the ladder. If you sign in
            with Google, we receive your name, email address, and profile
            picture from your Google account, and nothing else.
          </p>
          <p className="mt-2">
            When you use the platform, we store the cities, clubs, and
            ladders you join, along with the matches and challenges you
            report, so that rankings can be calculated and shown to other
            players.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">
            How we use this information
          </h2>
          <p className="mt-2">
            We use your information to run your account, show you on the
            correct ladder, calculate rankings, and let other players in your
            club see your results, challenges, and rank. We do not sell your
            information, and we do not share it with advertisers.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">
            Sign in with Google
          </h2>
          <p className="mt-2">
            If you choose "Continue with Google," authentication is handled
            by Google and Supabase (our backend provider). We only receive
            your basic profile information (name, email, profile picture) —
            we never see or store your Google password.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">
            Data storage
          </h2>
          <p className="mt-2">
            Player data is stored securely with Supabase. You can ask us to
            delete your account and associated data at any time by
            contacting us using the email below.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Contact</h2>
          <p className="mt-2">
            Questions about this policy or your data can be sent to{" "}
            <a
              href="mailto:anuroopquestion7@gmail.com"
              className="text-court-400 underline"
            >
              anuroopquestion7@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
