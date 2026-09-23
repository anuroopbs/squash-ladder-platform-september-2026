"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "coaching-bar-dismissed-until";
const DISMISS_DAYS = 30;

function shouldShow(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return true;
    const dismissedUntil = parseInt(raw, 10);
    if (isNaN(dismissedUntil)) return true;
    return Date.now() > dismissedUntil;
  } catch {
    // Private browsing / storage blocked -- still show it.
    return true;
  }
}

function onDismiss(): void {
  try {
    const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEY, String(until));
  } catch {
    // Silently ignore -- dismissal just won't persist, bar reappears.
  }
}

/**
 * Slim squash-coaching announcement bar across the very top of every
 * page, above the main navigation. Deliberately not rendered on the
 * Sign in (/login) or Join (/register) pages per product brief.
 *
 * Dismissed via the "×" button; dismissal persists 30 days in
 * localStorage (wrapped in try/catch so private browsing still works).
 */
export function CoachingAnnouncementBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  // Run the show/dismiss check on the client only -- server has no
  // localStorage and no pathname-based auth exclusion, so we can't
  // render this on the server without either leaking the bar onto
  // /login (RLS mismatch) or flashing it in/out on hydration.
  useEffect(() => {
    const isAuthPage = pathname === "/login" || pathname === "/register";
    if (isAuthPage) {
      setVisible(false);
    } else {
      setVisible(shouldShow());
    }
  }, [pathname]);

  if (!visible) return null;

  function handleDismiss(e: React.MouseEvent) {
    e.preventDefault();
    onDismiss();
    setVisible(false);
  }

  return (
    <div
      className="w-full border-b border-white/10 bg-white/[0.03] px-4 py-1.5"
      role="note"
      aria-label="Squash coaching announcement"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 text-xs sm:text-sm">
        <p className="text-white/70">
          <span className="hidden sm:inline">
            Want to take your game further? Squash coaching available —{" "}
          </span>
          <span className="sm:hidden">
            Squash coaching —{" "}
          </span>
          <Link
            href="https://www.instagram.com/dublinsquashmentor/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-court-300 hover:text-court-200"
          >
            DM @dublinsquashmentor
          </Link>
          <span className="hidden sm:inline"> on Instagram →</span>
          <span className="sm:hidden"> →</span>
        </p>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss coaching announcement"
          className="shrink-0 rounded p-1 text-white/40 transition hover:bg-white/5 hover:text-white"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </div>
  );
}
