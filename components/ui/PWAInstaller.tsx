"use client";

import { useEffect, useState } from "react";

export function PWAInstaller() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Also show a persistent banner if not installed as PWA
  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    setShowBanner(true);
  }, []);

  if (!showBanner) return null;

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result.outcome === "accepted") {
        setShowBanner(false);
      }
      setInstallPrompt(null);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0b0f0d]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-court-500/15 text-lg">
            📱
          </div>
          <div>
            <p className="text-sm font-medium text-white">Install Ladder</p>
            <p className="text-xs text-white/40">Add to home screen for the app experience</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBanner(false)}
            className="rounded-lg px-3 py-2 text-xs text-white/50 hover:text-white"
          >
            Later
          </button>
          <button
            onClick={handleInstall}
            className="rounded-lg bg-court-500 px-4 py-2 text-xs font-medium text-white hover:bg-court-400"
          >
            Install App
          </button>
        </div>
      </div>
    </div>
  );
}
