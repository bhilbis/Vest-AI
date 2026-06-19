"use client";

import { useEffect, useState } from "react";
import { X, Share, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true);

    if (standalone) {
      setIsStandalone(true);
      return;
    }

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    const wasDismissed = sessionStorage.getItem("pwa-prompt-dismissed");
    if (wasDismissed) setDismissed(true);

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === "accepted") setInstallEvent(null);
    else handleDismiss();
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("pwa-prompt-dismissed", "1");
  };

  if (isStandalone || dismissed) return null;

  // Android — native install prompt available
  if (installEvent) {
    return (
      <div
        role="banner"
        className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-3 right-3 z-50 flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 shadow-xl"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800">
          <Download className="h-4 w-4 text-zinc-300" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-100">Add to Home Screen</p>
          <p className="text-xs text-zinc-400">Install for a faster, app-like experience</p>
        </div>
        <button
          onClick={handleInstall}
          className="shrink-0 rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-900 transition-colors hover:bg-white"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-md p-1 text-zinc-500 transition-colors hover:text-zinc-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // iOS — manual install via Share sheet
  if (isIOS) {
    return (
      <div
        role="banner"
        className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-3 right-3 z-50 flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 shadow-xl"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800">
          <Share className="h-4 w-4 text-zinc-300" />
        </div>
        <p className="min-w-0 flex-1 text-xs text-zinc-300">
          Tap <Share className="inline h-3.5 w-3.5 align-text-bottom" /> then{" "}
          <strong className="text-zinc-100">Add to Home Screen</strong> to install
        </p>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-md p-1 text-zinc-500 transition-colors hover:text-zinc-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return null;
}
