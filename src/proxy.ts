import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'mariners-fc-super-secret-key-2026-gold-navy'
);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── BLOKIR ADMIN DI PRODUCTION ───────────────────────────────────────────
  // Set ADMIN_ENABLED=true di environment variable untuk mengaktifkan admin.
  // Jika tidak diset (misal di Vercel), semua /admin/* akan diblokir.
  if (pathname.startsWith('/admin') && process.env.ADMIN_ENABLED !== 'true') {
    return NextResponse.redirect(new URL('/', request.url));
  }
  // ──────────────────────────────────────────────────────────────────────────

  // Proteksi semua halaman /admin/* kecuali halaman login itu sendiri
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      // Belum login — redirect ke halaman login
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    try {
      await jwtVerify(token, JWT_SECRET);
      // Token valid — lanjutkan request
      return NextResponse.next();
    } catch {
      // Token tidak valid / kadaluarsa — redirect ke login dan hapus cookie
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.delete('auth_token');
      return response;
    }
  }

  // Jika sudah login dan coba buka /admin/login, redirect ke dashboard
  if (pathname.startsWith('/admin/login')) {
    const token = request.cookies.get('auth_token')?.value;
    if (token) {
      try {
        await jwtVerify(token, JWT_SECRET);
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      } catch {
        // Token tidak valid, biarkan buka login
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
