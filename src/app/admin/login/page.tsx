'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Gagal masuk ke portal admin');
      } else {
        router.push('/admin/dashboard');
        router.refresh();
      }
    } catch {
      setError('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">

      {/* Background: Stadium Photo */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/LOGIN.jpeg')" }}
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-blue-950/75 to-slate-950/95" />

      {/* Subtle vignette edges */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.7)_100%)]" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">


        <div
          className="rounded-3xl border border-white/10 shadow-2xl shadow-black/60 overflow-hidden"
          style={{ background: 'rgba(6, 11, 20, 0.72)', backdropFilter: 'blur(24px)' }}
        >
          {/* Card Header */}
          <div className="px-8 pt-8 pb-6 text-center border-b border-white/[0.07]">
            <div className="flex justify-center mb-4">
              <img
                src="/marinerssc.png"
                alt="Mariners SC"
                className="h-16 w-auto object-contain drop-shadow-2xl"
              />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-wide text-white">
              Portal <span className="text-sky-400">Admin</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">Mariners SC — Akses Pengelola Klub</p>
          </div>

          {/* Card Body */}
          <div className="px-8 py-7 space-y-5">

            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Email</label>
                <div className="relative group">
                  <Mail className="w-4 h-4 text-slate-500 group-focus-within:text-sky-400 absolute left-3.5 top-3.5 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-sky-500/60 focus:bg-white/[0.08] text-sm text-white placeholder-slate-600 outline-none transition-all"
                    placeholder="email@marinersfc.com"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Kata Sandi</label>
                <div className="relative group">
                  <Lock className="w-4 h-4 text-slate-500 group-focus-within:text-sky-400 absolute left-3.5 top-3.5 transition-colors" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-sky-500/60 focus:bg-white/[0.08] text-sm text-white placeholder-slate-600 outline-none transition-all"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-2 rounded-xl font-extrabold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: loading
                    ? 'rgba(59,130,246,0.4)'
                    : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  boxShadow: loading ? 'none' : '0 4px 24px rgba(59,130,246,0.35)',
                  color: '#fff',
                }}
              >
                {loading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  <>
                    Masuk Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-[11px] text-slate-600 mt-5 font-medium">
          © 2026 Mariners SC · Akses terbatas untuk pengelola resmi klub
        </p>
      </div>
    </div>
  );
}

