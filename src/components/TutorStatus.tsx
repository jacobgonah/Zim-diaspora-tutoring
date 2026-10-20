"use client";

import { useEffect, useState } from "react";

function formatLastSeen(dateStr: string) {
  const date = new Date(dateStr);
  const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return date.toLocaleDateString("en-GB");
}

export function TutorStatus({ lastSeen }: { lastSeen: string | null }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  if (now === null) return <span className="text-sm text-neutral-500">&nbsp;</span>;

  if (!lastSeen) {
    return <span className="text-sm text-neutral-400">Offline</span>;
  }

  const isOnline = (now - new Date(lastSeen).getTime()) / 60000 < 5;

  if (isOnline) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-sm font-medium text-emerald-300">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
        </span>
        Live
      </span>
    );
  }

  return (
    <span className="text-sm text-amber-400/80">
      Offline · Last seen {formatLastSeen(lastSeen)}
    </span>
  );
}
