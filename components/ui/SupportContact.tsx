interface SupportContactProps {
  variant?: "footer" | "inline";
}

export function SupportContact({ variant = "footer" }: SupportContactProps) {
  if (variant === "inline") {
    return (
      <div className="rounded-xl border border-court-400/20 bg-court-500/5 p-4">
        <p className="text-sm text-white/70">
          🛠️ Trouble joining, creating a ladder, or something not working?
        </p>
        <a
          href="https://www.instagram.com/dublinsquashmentor/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-court-300 hover:text-court-200"
        >
          📩 Message us on Instagram @dublinsquashmentor
        </a>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-center">
      <p className="text-sm text-white/60">
        Having trouble creating a ladder ranking, joining, or anything else on the platform?
      </p>
      <a
        href="https://www.instagram.com/dublinsquashmentor/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-court-300 transition hover:text-court-200"
      >
        📩 Get in touch on Instagram @dublinsquashmentor
      </a>
    </div>
  );
}
