export function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "ember";
}) {
  const toneClasses =
    tone === "ember"
      ? "bg-ember-500/15 text-ember-300 ring-ember-500/30"
      : "bg-court-500/15 text-court-300 ring-court-500/30";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${toneClasses}`}
    >
      {children}
    </span>
  );
}
