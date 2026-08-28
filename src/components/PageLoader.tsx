'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function PageLoader() {
  const [navigating, setNavigating] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // When pathname or searchParams change, show quick top progress bar then complete
  useEffect(() => {
    setNavigating(true);
    const timer = setTimeout(() => {
      setNavigating(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  if (!navigating) return null;

  return (
    /* ── TOP ULTRA-FAST SLICK PROGRESS BAR (Like YouTube / GitHub) ── */
    <div className="fixed top-0 left-0 right-0 z-9999 h-1 pointer-events-none overflow-hidden bg-slate-900/50">
      <div className="h-full bg-gradient-to-r from-blue-600 via-sky-400 to-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.9)] animate-shimmer" />
    </div>
  );
}
