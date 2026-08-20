import React from 'react';

/**
 * Admin Layout
 * Wraps all /admin/* pages with a full-screen stadium background image
 * and a dark overlay, so the glass-panel content pops on top.
 * The /admin/login page has its own background logic but inherits this too —
 * the overlay is subtle enough not to clash.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      {/* ── Stadium background photo ── */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/LOGIN.jpeg')", zIndex: 0 }}
        aria-hidden="true"
      />

      {/* ── Multi-layer dark overlay for readability ── */}
      <div
        className="fixed inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(3,7,18,0.82) 0%, rgba(3,7,18,0.78) 50%, rgba(3,7,18,0.88) 100%)',
          zIndex: 1,
        }}
        aria-hidden="true"
      />
      {/* subtle blue-tinted vignette */}
      <div
        className="fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse at top, rgba(30,58,138,0.18) 0%, transparent 70%)',
          zIndex: 2,
        }}
        aria-hidden="true"
      />

      {/* ── Page content ── */}
      <div className="relative" style={{ zIndex: 10 }}>
        {children}
      </div>
    </div>
  );
}
