'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@marinersfc.com');
  const [password, setPassword] = useState('password123');
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
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-sky-400/30 space-y-6 shadow-2xl shadow-slate-950">
        
        {/* Brand Header - NO BOX around logo */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center mb-3">
            <img
              src="/marinerssc.png"
              alt="Mariners SC Logo"
              className="h-16 w-auto object-contain drop-shadow-xl"
            />
          </div>
          <h1 className="text-2xl font-black uppercase blue-gradient-text">
            Portal Admin Mariners SC
          </h1>
          <p className="text-xs text-slate-300">Masukkan kredensial pengelola klub untuk melanjutkan</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-200 tracking-wider">Email Admin</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 focus:border-sky-400 text-sm text-white placeholder-slate-500 outline-none transition-colors"
                placeholder="admin@marinersfc.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-200 tracking-wider">Kata Sandi</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 focus:border-sky-400 text-sm text-white placeholder-slate-500 outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl white-blue-btn font-extrabold uppercase tracking-wider text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? 'Memverifikasi...' : 'Masuk Dashboard'}
            <ArrowRight className="w-4 h-4 text-blue-600" />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400 space-y-1">
          <p>Kredensial Bawaan Dev:</p>
          <p className="font-mono text-sky-400 font-bold">admin@marinersfc.com / password123</p>
        </div>

      </div>
    </div>
  );
}
