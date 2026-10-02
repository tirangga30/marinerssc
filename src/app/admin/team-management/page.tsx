'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield, Lock, Unlock, KeyRound, ArrowLeft, Save, Upload,
  Users, Image as ImageIcon, Sparkles, Check, AlertCircle,
  Eye, EyeOff, UserPlus, Trash2, Edit3, RefreshCw
} from 'lucide-react';

export default function TeamManagementPage() {
  const router = useRouter();

  // PIN Gate State
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'identity' | 'wallpapers' | 'users' | 'security'>('identity');

  // Notification Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Settings State
  const [teamName, setTeamName] = useState('Mariners SC');
  const [teamLogo, setTeamLogo] = useState('/marinerssc.webp');
  const [loginWallpaper, setLoginWallpaper] = useState('/newposter.webp');
  const [adminWallpaper, setAdminWallpaper] = useState('/stadium_hero2.png');
  const [savingSettings, setSavingSettings] = useState(false);

  // Users State
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [userFormData, setUserFormData] = useState({ name: '', email: '', password: '' });
  const [userFormLoading, setUserFormLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // PIN Change State
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinChangeLoading, setPinChangeLoading] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Check PIN unlock status on mount
  useEffect(() => {
    fetch('/api/admin/system-settings/verify-pin')
      .then((res) => res.json())
      .then((data) => {
        setIsUnlocked(Boolean(data.unlocked));
        if (data.unlocked) {
          loadSettings();
          loadUsers();
        }
      })
      .catch(() => setIsUnlocked(false));
  }, []);

  const loadSettings = () => {
    fetch('/api/admin/system-settings')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          if (data.teamName) setTeamName(data.teamName);
          if (data.teamLogo) setTeamLogo(data.teamLogo);
          if (data.loginWallpaper) setLoginWallpaper(data.loginWallpaper);
          if (data.adminWallpaper) setAdminWallpaper(data.adminWallpaper);
        }
      })
      .catch((err) => console.error('Error loading settings:', err));
  };

  const loadUsers = () => {
    setLoadingUsers(true);
    fetch('/api/admin/users')
      .then((res) => res.json())
      .then((data) => {
        if (data.users) setUsers(data.users);
      })
      .catch((err) => console.error('Error loading users:', err))
      .finally(() => setLoadingUsers(false));
  };

  // Handle PIN unlock submission
  const handleUnlockPin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pinInput.trim()) {
      setPinError('Masukkan PIN keamanan');
      return;
    }

    setPinLoading(true);
    setPinError('');

    try {
      const res = await fetch('/api/admin/system-settings/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPinError(data.error || 'PIN keamanan salah');
      } else {
        setIsUnlocked(true);
        loadSettings();
        loadUsers();
      }
    } catch {
      setPinError('Terjadi kesalahan jaringan');
    } finally {
      setPinLoading(false);
    }
  };

  // Lock the portal again
  const handleLockPortal = async () => {
    await fetch('/api/admin/system-settings/verify-pin', { method: 'DELETE' });
    setIsUnlocked(false);
    setPinInput('');
  };

  // Upload handler for team logo or wallpapers
  const handleFileUpload = async (file: File, folder: 'team' | 'wallpapers', callback: (url: string) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'Gagal mengunggah file');
      } else {
        callback(data.url);
        showToast('success', 'Gambar berhasil diunggah!');
      }
    } catch {
      showToast('error', 'Gagal mengunggah file (kesalahan jaringan)');
    }
  };

  // Save Settings (Identity or Wallpapers)
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/system-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamName,
          teamLogo,
          loginWallpaper,
          adminWallpaper,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'Gagal menyimpan pengaturan');
      } else {
        showToast('success', 'Pengaturan tim berhasil disimpan!');
        window.dispatchEvent(new Event('system_settings_updated'));
      }
    } catch {
      showToast('error', 'Terjadi kesalahan jaringan');
    } finally {
      setSavingSettings(false);
    }
  };

  // Change PIN handler
  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPin || !newPin || !confirmPin) {
      showToast('error', 'Semua kolom PIN wajib diisi');
      return;
    }

    if (newPin !== confirmPin) {
      showToast('error', 'Konfirmasi PIN baru tidak cocok');
      return;
    }

    if (newPin.length < 4 || newPin.length > 8) {
      showToast('error', 'PIN baru harus 4-8 digit angka');
      return;
    }

    setPinChangeLoading(true);
    try {
      const res = await fetch('/api/admin/system-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPin,
          newPin,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'Gagal memperbarui PIN');
      } else {
        showToast('success', 'PIN Keamanan berhasil diperbarui!');
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
      }
    } catch {
      showToast('error', 'Terjadi kesalahan jaringan');
    } finally {
      setPinChangeLoading(false);
    }
  };

  // User Management Handlers
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormLoading(true);

    try {
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
      const method = editingUser ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userFormData),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'Gagal menyimpan pengguna');
      } else {
        showToast('success', editingUser ? 'Pengguna diperbarui!' : 'Pengguna baru ditambahkan!');
        setShowAddUserModal(false);
        setEditingUser(null);
        setUserFormData({ name: '', email: '', password: '' });
        loadUsers();
      }
    } catch {
      showToast('error', 'Terjadi kesalahan jaringan');
    } finally {
      setUserFormLoading(false);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Hapus pengguna admin "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'Gagal menghapus pengguna');
      } else {
        showToast('success', 'Pengguna berhasil dihapus');
        loadUsers();
      }
    } catch {
      showToast('error', 'Gagal menghapus pengguna');
    }
  };

  // Still checking initial unlock state
  if (isUnlocked === null) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Memeriksa Keamanan...</p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // RENDER: PIN GATE (PORTAL TERKUNCI)
  // ══════════════════════════════════════════════════════════
  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 sm:py-20 animate-fadeIn">
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-sky-400/40 shadow-2xl shadow-slate-950 text-center space-y-6 relative overflow-hidden backdrop-blur-2xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Logo / Shield Icon */}
          <div className="relative mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/20 border border-white/20">
            <Lock className="w-9 h-9 text-slate-950" />
            <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-sky-500 text-white text-[9px] font-black uppercase tracking-wider shadow">
              PIN
            </span>
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
              <Shield className="w-3 h-3 text-amber-400" />
              Area Khusus Pengelola
            </div>
            <h1 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight">
              Team Management
            </h1>
          </div>

          {pinError && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-semibold flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{pinError}</span>
            </div>
          )}

          {/* Clean PIN Input Field */}
          <form onSubmit={handleUnlockPin} className="space-y-4">
            <div className="relative max-w-xs mx-auto">
              <input
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={8}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value.replace(/[^0-9]/g, ''));
                  setPinError('');
                }}
                placeholder="Masukkan PIN"
                autoFocus
                className="w-full py-3.5 px-4 text-center text-xl font-mono tracking-[0.3em] rounded-2xl bg-slate-950/80 border border-sky-400/40 focus:border-sky-400 text-white outline-hidden shadow-inner transition-all placeholder:text-xs placeholder:tracking-normal placeholder-slate-500"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1.5 transition-colors cursor-pointer"
                title={showPin ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={pinLoading || !pinInput}
              className="w-full max-w-xs mx-auto py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              {pinLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Membuka...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 text-slate-950" />
                  Buka Portal
                </>
              )}
            </button>
          </form>

          {/* Kembali ke Dashboard Button */}
          <div className="pt-3">
            <button
              type="button"
              onClick={() => {
                try {
                  router.push('/admin/dashboard');
                } catch {
                  window.location.href = '/admin/dashboard';
                }
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 hover:border-sky-400/50 text-xs font-bold uppercase transition-all cursor-pointer shadow-md active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-sky-400" />
              <span>Kembali ke Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // RENDER: UNLOCKED TEAM MANAGEMENT PORTAL
  // ══════════════════════════════════════════════════════════
  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8 animate-fadeIn">
      
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl border text-xs font-bold shadow-2xl flex items-center gap-2.5 backdrop-blur-xl animate-bounce-short ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/90 border-red-500/40 text-red-200'
          }`}
        >
          {toast.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="glass-panel p-5 sm:p-7 rounded-2xl sm:rounded-3xl border border-sky-400/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl relative overflow-hidden">
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
            <Unlock className="w-3.5 h-3.5 text-amber-400" />
            Portal Team Management · Akses Terbuka
          </div>
          <h1 className="text-xl sm:text-3xl font-black uppercase text-white tracking-tight flex items-center justify-center sm:justify-start gap-2">
            <span>TEAM MANAGEMENT</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </h1>
          <p className="text-xs text-slate-300">
            Kelola logo klub, nama tim, wallpaper login &amp; panel admin, pengguna admin, serta keamanan PIN.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center">
          <button
            onClick={handleLockPortal}
            className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" /> Kunci Portal
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 glass-panel rounded-2xl overflow-x-auto border border-sky-400/20 max-w-full">
        <button
          onClick={() => setActiveTab('identity')}
          className={`flex-1 min-w-[120px] py-2 sm:py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'identity'
              ? 'blue-gradient-bg text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-sky-300" />
          <span>Identitas Tim</span>
        </button>

        <button
          onClick={() => setActiveTab('wallpapers')}
          className={`flex-1 min-w-[120px] py-2 sm:py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'wallpapers'
              ? 'blue-gradient-bg text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5 text-sky-300" />
          <span>Wallpaper &amp; Tema</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 min-w-[120px] py-2 sm:py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'users'
              ? 'blue-gradient-bg text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-sky-300" />
          <span>Kelola Pengguna ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex-1 min-w-[120px] py-2 sm:py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'security'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>PIN Keamanan</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════
          TAB 1: IDENTITAS TIM (LOGO & NAMA TIM)
         ══════════════════════════════════════════════════════════ */}
      {activeTab === 'identity' && (
        <div className="glass-panel p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-sky-400/20 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base sm:text-lg font-black uppercase text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-sky-400" />
              Identitas Klub Sepak Bola
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Ubah logo dan nama resmi klub. Logo yang diunggah otomatis tersinkronisasi ke navbar, kartu pertandingan, dan seluruh halaman web.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start">
            {/* Box Logo */}
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                Logo Resmi Tim (Logo Mariners SC)
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="w-28 h-28 rounded-2xl bg-[#09111e] border-2 border-sky-400/40 flex items-center justify-center p-3 shadow-xl relative group">
                  <img
                    src={teamLogo}
                    alt={teamName}
                    className="w-full h-full object-contain drop-shadow-2xl transition-transform group-hover:scale-110 duration-300"
                  />
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <span className="text-[11px] font-mono text-slate-400 break-all block">
                    {teamLogo}
                  </span>
                  <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                    <label className="px-3.5 py-2 rounded-xl blue-gradient-bg text-white text-xs font-bold uppercase tracking-wider cursor-pointer hover:shadow-lg transition-all flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Unggah Logo Baru</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'team', (url) => setTeamLogo(url));
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => setTeamLogo('/marinerssc.webp')}
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-bold uppercase transition-all cursor-pointer"
                    >
                      Reset Default
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Disarankan format WebP / PNG transparan resolusi minimal 512x512.
                  </p>
                </div>
              </div>
            </div>

            {/* Box Nama Tim */}
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                Nama Resmi Tim
              </label>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="MARINERS SC"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:border-sky-400 text-white font-bold text-sm outline-hidden transition-all uppercase tracking-wide"
                />
                <p className="text-[11px] text-slate-400">
                  Nama ini digunakan sebagai label klub utama pada scorecard, header beranda, dan modul laga.
                </p>
              </div>
            </div>
          </div>

          {/* Action Save */}
          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="px-6 py-3 rounded-xl blue-gradient-bg text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-sky-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {savingSettings ? 'Menyimpan...' : 'Simpan Identitas Tim'}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 2: TAMPILAN & WALLPAPER
         ══════════════════════════════════════════════════════════ */}
      {activeTab === 'wallpapers' && (
        <div className="glass-panel p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-sky-400/20 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base sm:text-lg font-black uppercase text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-sky-400" />
              Wallpaper Login &amp; Panel Admin
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Atur gambar latar belakang untuk halaman login pengelola dan dashboard panel admin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            
            {/* 1. Wallpaper Halaman Login */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-300">
                  Wallpaper Halaman Login (/admin/login)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">16:9 Lanskap</span>
              </div>

              {/* Preview Box */}
              <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-800 group shadow-lg">
                <img
                  src={loginWallpaper}
                  alt="Login Wallpaper Preview"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="px-3 py-1 rounded-full bg-slate-950/90 text-white text-[10px] font-bold uppercase tracking-wider border border-white/20">
                    Pratinjau Login
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <label className="flex-1 py-2 px-3 rounded-xl blue-gradient-bg text-white text-xs font-bold uppercase tracking-wider cursor-pointer hover:shadow-lg transition-all flex items-center justify-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Ganti Wallpaper</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'wallpapers', (url) => setLoginWallpaper(url));
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setLoginWallpaper('/newposter.webp')}
                  className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-bold uppercase transition-all cursor-pointer"
                >
                  Reset Default
                </button>
              </div>
            </div>

            {/* 2. Wallpaper Panel Admin Dashboard */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-300">
                  Wallpaper Panel Admin (Seluruh Admin)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">16:9 Lanskap</span>
              </div>

              {/* Preview Box */}
              <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-800 group shadow-lg">
                <img
                  src={adminWallpaper}
                  alt="Admin Panel Wallpaper Preview"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="px-3 py-1 rounded-full bg-slate-950/90 text-white text-[10px] font-bold uppercase tracking-wider border border-white/20">
                    Pratinjau Admin Panel
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <label className="flex-1 py-2 px-3 rounded-xl blue-gradient-bg text-white text-xs font-bold uppercase tracking-wider cursor-pointer hover:shadow-lg transition-all flex items-center justify-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Ganti Wallpaper</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'wallpapers', (url) => setAdminWallpaper(url));
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setAdminWallpaper('/stadium_hero2.png')}
                  className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-bold uppercase transition-all cursor-pointer"
                >
                  Reset Default
                </button>
              </div>
            </div>

          </div>

          {/* Action Save */}
          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="px-6 py-3 rounded-xl blue-gradient-bg text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-sky-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {savingSettings ? 'Menyimpan...' : 'Simpan Wallpaper'}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 3: KELOLA PENGGUNA (ADMIN USERS)
         ══════════════════════════════════════════════════════════ */}
      {activeTab === 'users' && (
        <div className="glass-panel p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-sky-400/20 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-400" />
                Daftar Akun Pengelola Admin
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Kelola akun admin untuk login ke portal klub. Anda dapat menambah, mengedit, atau mengganti kata sandi admin.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingUser(null);
                setUserFormData({ name: '', email: '', password: '' });
                setShowAddUserModal(true);
              }}
              className="px-4 py-2.5 rounded-xl blue-gradient-bg text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-sky-500/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Admin Baru</span>
            </button>
          </div>

          {/* User List Table */}
          {loadingUsers ? (
            <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
              Memuat data pengguna...
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Belum ada data admin terdaftar.
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-sky-400/30 transition-all flex-wrap"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-black text-sm uppercase shadow">
                      {u.name ? u.name.charAt(0) : 'A'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white uppercase">{u.name}</h4>
                        <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[9px] font-black uppercase">
                          ADMIN
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingUser(u);
                        setUserFormData({ name: u.name, email: u.email, password: '' });
                        setShowAddUserModal(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-sky-500/20 text-slate-300 hover:text-sky-300 border border-slate-700 text-xs font-bold uppercase flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>

                    {users.length > 1 && (
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 text-xs font-bold uppercase flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 4: KEAMANAN & PIN KHUSUS
         ══════════════════════════════════════════════════════════ */}
      {activeTab === 'security' && (
        <div className="glass-panel p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-amber-500/30 space-y-6 bg-amber-950/5">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base sm:text-lg font-black uppercase text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-400" />
              Pengaturan PIN Keamanan Portal
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              PIN ini digunakan untuk mengunci dan membuka portal Team Management ini agar tidak sembarang orang bisa mengakses pengaturan inti klub.
            </p>
          </div>

          <form onSubmit={handleChangePin} className="max-w-md space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                PIN Lama
              </label>
              <input
                type="password"
                maxLength={8}
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Masukkan PIN saat ini (default: 1234)"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 text-white font-mono text-sm outline-hidden transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                PIN Baru (4-8 Digit Angka)
              </label>
              <input
                type="password"
                maxLength={8}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="PIN Baru"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 text-white font-mono text-sm outline-hidden transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Konfirmasi PIN Baru
              </label>
              <input
                type="password"
                maxLength={8}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Ketik ulang PIN Baru"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 text-white font-mono text-sm outline-hidden transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={pinChangeLoading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4 text-slate-950" />
              {pinChangeLoading ? 'Menyimpan...' : 'Perbarui PIN Keamanan'}
            </button>
          </form>
        </div>
      )}

      {/* ── MODAL: TAMBAH / EDIT USER ADMIN ── */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-sky-400/40 max-w-md w-full space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" />
                {editingUser ? 'Edit Pengguna Admin' : 'Tambah Admin Baru'}
              </h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Nama Pengguna
                </label>
                <input
                  type="text"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  placeholder="Misal: Coach Tirangga / Admin 1"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-hidden focus:border-sky-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Email (Untuk Login)
                </label>
                <input
                  type="email"
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  placeholder="admin@marinersfc.com"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-hidden focus:border-sky-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  {editingUser ? 'Kata Sandi Baru (Kosongkan jika tidak diubah)' : 'Kata Sandi'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    placeholder={editingUser ? '•••••••• (Tetap)' : 'Minimal 6 karakter'}
                    required={!editingUser}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-hidden focus:border-sky-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs font-bold uppercase"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={userFormLoading}
                  className="px-5 py-2 rounded-xl blue-gradient-bg text-white text-xs font-black uppercase tracking-wider shadow cursor-pointer disabled:opacity-50"
                >
                  {userFormLoading ? 'Menyimpan...' : 'Simpan User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
