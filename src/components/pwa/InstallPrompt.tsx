"use client";

import { useEffect, useState } from "react";
import { X, Share, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const isClient = typeof window !== "undefined";

const getIsStandalone = () =>
  isClient &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      (window.navigator as { standalone?: boolean }).standalone === true));

export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS] = useState(() => isClient && /iphone|ipad|ipod/i.test(navigator.userAgent));
  const [dismissed, setDismissed] = useState(
    () => isClient && !!sessionStorage.getItem("pwa-prompt-dismissed")
  );
  const [isStandalone] = useState(getIsStandalone);

  useEffect(() => {
    if (isStandalone) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [isStandalone]);

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
  if (!installEvent && !isIOS) return null;

  const content = installEvent ? (
    <>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800">
        <Download className="h-4 w-4 text-zinc-300" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-100">Add to Home Screen</p>
        <p className="text-xs text-zinc-400">Install for a faster experience</p>
      </div>
      <button
        onClick={handleInstall}
        type="button"
        className="shrink-0 rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-900 transition-colors hover:bg-white"
      >
        Install
      </button>
      <button
        onClick={handleDismiss}
        type="button"
        aria-label="Dismiss"
        className="shrink-0 rounded-md p-1 text-zinc-500 transition-colors hover:text-zinc-300"
      >
        <X className="h-4 w-4" />
      </button>
    </>
  ) : (
    <>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800">
        <Share className="h-4 w-4 text-zinc-300" />
      </div>
      <p className="min-w-0 flex-1 text-xs text-zinc-300">
        Tap <Share className="inline h-3.5 w-3.5 align-text-bottom" /> then{" "}
        <strong className="text-zinc-100">Add to Home Screen</strong>
      </p>
      <button
        onClick={handleDismiss}
        type="button"
        aria-label="Dismiss"
        className="shrink-0 rounded-md p-1 text-zinc-500 transition-colors hover:text-zinc-300"
      >
        <X className="h-4 w-4" />
      </button>
    </>
  );

  return (
    <>
      {/* Mobile — above bottom nav, full width */}
      <div
        role="banner"
        className="lg:hidden fixed left-3 right-3 z-50 flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 shadow-xl"
        style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}
      >
        {content}
      </div>

      {/* Desktop — compact card at bottom-right, clear of sidebar */}
      <div
        role="banner"
        className="hidden lg:flex fixed bottom-6 right-6 z-50 items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 shadow-xl w-[360px]"
      >
        {content}
      </div>
    </>
  );
}
