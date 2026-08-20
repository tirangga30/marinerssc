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
    <div className="relative min-h-screen w-full flex items-center justify-center p-4">

      {/* Frosted Glass Login Card (Slightly Transparent) */}
      <div className="relative z-10 w-full max-w-md">

        <div
          className="rounded-3xl border border-white/20 shadow-2xl shadow-black/80 overflow-hidden backdrop-blur-2xl transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.45) 0%, rgba(10, 18, 35, 0.55) 100%)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(56, 189, 248, 0.1)',
          }}
        >
          {/* Card Header */}
          <div className="px-8 pt-8 pb-6 text-center border-b border-white/10">
            <div className="flex justify-center mb-4">
              <img
                src="/marinerssc.png"
                alt="Mariners SC"
                className="h-16 w-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-300"
              />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-wide text-white drop-shadow-md">
              Portal <span className="text-sky-400">Admin</span>
            </h1>
            <p className="text-xs text-slate-300 mt-1 font-medium drop-shadow-sm">Mariners SC — Akses Pengelola Klub</p>
          </div>

          {/* Card Body */}
          <div className="px-8 py-7 space-y-5">

            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-semibold flex items-center gap-2 backdrop-blur-md">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-300 drop-shadow-xs">Email</label>
                <div className="relative group">
                  <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-sky-400 absolute left-3.5 top-3.5 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/40 border border-white/15 focus:border-sky-400 focus:bg-slate-950/60 text-sm text-white placeholder-slate-400 outline-hidden transition-all backdrop-blur-xs"
                    placeholder="email@marinersfc.com"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-300 drop-shadow-xs">Kata Sandi</label>
                <div className="relative group">
                  <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-sky-400 absolute left-3.5 top-3.5 transition-colors" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/40 border border-white/15 focus:border-sky-400 focus:bg-slate-950/60 text-sm text-white placeholder-slate-400 outline-hidden transition-all backdrop-blur-xs"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-2 rounded-xl font-extrabold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]"
                style={{
                  background: loading
                    ? 'rgba(59,130,246,0.4)'
                    : 'linear-gradient(135deg, #38bdf8 0%, #1d4ed8 100%)',
                  boxShadow: loading ? 'none' : '0 4px 24px rgba(56, 189, 248, 0.4)',
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
        <p className="text-center text-[11px] text-slate-300/80 mt-5 font-medium drop-shadow-sm">
          © 2026 Mariners SC · Akses terbatas untuk pengelola resmi klub
        </p>
      </div>
    </div>
  );
}
