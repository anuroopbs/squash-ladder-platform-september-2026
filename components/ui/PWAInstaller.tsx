"use client";

import { useEffect, useState } from "react";

export function PWAInstaller() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as installed PWA
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone;
    setIsStandalone(standalone);
    if (standalone) return;

    // Check if already captured by head script
    const captured = (window as any).__pwaInstallPrompt;
    if (captured) {
      setInstallPrompt(captured);
      setShowBanner(true);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsStandalone(true));

    // Show banner if not dismissed
    const dismissed = sessionStorage.getItem("pwa-banner-dismissed");
    if (!dismissed) {
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handler);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem("pwa-banner-dismissed", "true");
  };

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result.outcome === "accepted") setShowBanner(false);
      setInstallPrompt(null);
    }
  };

  if (isStandalone || !showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none">
      <div className="pointer-events-auto mx-auto flex max-w-2xl items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#141816]/95 p-3 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-court-500/15 text-xl ring-1 ring-court-500/20 shrink-0">
            📱
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">Install Ladder App</p>
            <p className="text-xs text-white/50">Add to home screen • Works like an app</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDismiss}
            className="rounded-lg px-3 py-2 text-xs text-white/40 hover:text-white active:bg-white/10"
          >
            Later
          </button>
          <button
            onClick={handleInstall}
            className="rounded-lg bg-court-500 px-4 py-2 text-sm font-medium text-white hover:bg-court-400 active:bg-court-600"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
