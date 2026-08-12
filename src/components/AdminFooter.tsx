import React from 'react';

/**
 * Footer ringkas khusus halaman admin kelola.
 * Web publik tetap menggunakan Footer.tsx yang lengkap.
 */
export default function AdminFooter() {
  return (
    <footer className="border-t border-slate-800/60 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center">
        <p className="text-[11px] text-slate-600 font-medium">
          © 2026 NY Company. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
