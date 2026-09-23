import Link from "next/link";

interface BackButtonProps {
  href: string;
  label: string;
}

/**
 * A clear, high-tap-target "go back" link for the top of city/club pages.
 * Distinct from the breadcrumb trail: many users arrive here straight
 * from a QR code scan (no back button on that page, no navigation
 * history to speak of), so this needs to be an obvious, thumb-sized
 * target rather than relying on breadcrumbs alone.
 */
export function BackButton({ href, label }: BackButtonProps) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 py-2.5 -ml-3 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white active:bg-white/10"
    >
      <span aria-hidden="true">←</span>
      {label}
    </Link>
  );
}
