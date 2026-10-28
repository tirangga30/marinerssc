import React from 'react';

/**
 * Footer ringkas khusus halaman admin kelola.
 * Web publik tetap menggunakan Footer.tsx yang lengkap.
 */
export default function AdminFooter() {
  return (
    <footer className="border-t border-slate-200 mt-auto bg-white/80 backdrop-blur-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center">
        <p className="text-[11px] text-slate-500 font-medium">
          NY Company © 2026 All rights reserved.
        </p>
      </div>
    </footer>
  );
}
