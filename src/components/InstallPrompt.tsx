"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    const dismissed = localStorage.getItem("zdt-install-dismissed") === "1";
    const mobile = window.matchMedia("(max-width: 768px)").matches;
    if (standalone || dismissed || !mobile) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);
    if (ios) {
      const t = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(t);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setTimeout(() => setShow(true), 3000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const close = () => {
    localStorage.setItem("zdt-install-dismissed", "1");
    setShow(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    close();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[60] md:hidden">
      <div className="relative overflow-hidden rounded-2xl border border-emerald-800 bg-gradient-to-br from-emerald-950 via-neutral-950 to-neutral-950 p-4 text-neutral-100 shadow-2xl shadow-black/70">
        <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#007a3d_0_14.28%,#fcd116_14.28%_28.56%,#ce1126_28.56%_42.84%,#000_42.84%_57.12%,#ce1126_57.12%_71.4%,#fcd116_71.4%_85.68%,#007a3d_85.68%)]" />
        <button onClick={close} aria-label="Close" className="absolute right-3 top-3 rounded-md p-1 text-neutral-400 hover:text-amber-400">
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3 pr-6">
          <img src="/icons/icon-192.png" alt="" className="h-12 w-12 shrink-0 rounded-xl ring-1 ring-amber-400/40" />
          <div className="min-w-0">
            <p className="font-bold text-white">Install the ZDT app</p>
            {isIOS ? (
              <p className="mt-0.5 text-sm text-neutral-300">
                Tap <Share className="inline h-4 w-4 text-amber-400" /> then &quot;Add to Home Screen&quot;.
              </p>
            ) : (
              <p className="mt-0.5 text-sm text-neutral-300">Quick access to tutors from your home screen.</p>
            )}
          </div>
        </div>
        {!isIOS && (
          <button
            onClick={install}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-amber-400 py-2.5 font-bold text-neutral-950 transition-colors hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <Download className="h-4 w-4" /> Install
          </button>
        )}
      </div>
    </div>
  );
}
