'use client';

import React, { useState, useEffect } from 'react';
import {
  X, Sparkles, Upload, Loader2, CheckCircle2, Shield, User,
  Phone, MapPin, Shuffle, CreditCard, Flame, Award, Crown
} from 'lucide-react';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTier?: 'FAN' | 'PRO' | 'ELITE';
  onSuccess: (member: any) => void;
}

const TIER_PRICES = {
  FAN: { label: 'FAN', price: 'Rp 15.000', period: 'Per Pertandingan', badge: '1x Fun Match' },
  PRO: { label: 'PRO', price: 'Rp 49.000', period: 'Per Bulan (30 Hari)', badge: 'Rekomendasi Terbaik' },
  ELITE: { label: 'ELITE', price: 'Rp 399.000', period: 'Per 6 Bulan (180 Hari)', badge: 'Full Kit + Official Squad Pass' },
};

export default function CommunityRegistrationModal({
  isOpen,
  onClose,
  initialTier = 'PRO',
  onSuccess,
}: RegistrationModalProps) {
  const [tier, setTier] = useState<'FAN' | 'PRO' | 'ELITE'>(initialTier);
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [origin, setOrigin] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('MF');
  const [altPosition, setAltPosition] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState<number>(30);
  const [photoUrl, setPhotoUrl] = useState('');
  const [paymentProof, setPaymentProof] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialTier) setTier(initialTier);
    // Random jersey number between 30 and 99
    rollRandomNumber();
  }, [initialTier, isOpen]);

  const rollRandomNumber = () => {
    const random = Math.floor(Math.random() * (99 - 30 + 1)) + 30;
    setJerseyNumber(random);
  };

  if (!isOpen) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'members');
      formData.append('playerName', fullName || 'Member');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengunggah foto');
      setPhotoUrl(data.url);
    } catch (err: any) {
      setError(err.message || 'Gagal upload foto profil');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingProof(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'general');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengunggah bukti pembayaran');
      setPaymentProof(data.url);
    } catch (err: any) {
      setError(err.message || 'Gagal upload bukti transfer');
    } finally {
      setUploadingProof(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !origin.trim() || !phone.trim() || !position) {
      setError('Mohon lengkapi data Nama, Asal Domisili, No WhatsApp, dan Posisi.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/community/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          nickname,
          origin,
          phone,
          position,
          altPosition,
          requestedJerseyNumber: jerseyNumber,
          tier,
          photoUrl,
          paymentProof,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mendaftar');
      }

      onSuccess(data.member);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-sky-400/40 rounded-2xl sm:rounded-3xl shadow-2xl shadow-sky-950/60 overflow-hidden my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-black uppercase text-white tracking-wider">
                Pendaftaran Soccer Community
              </h2>
              <p className="text-xs text-sky-300">Bergabung dengan keluarga Mariners SC</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* 1. Pilih Paket Keanggotaan */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              1. Pilih Paket Membership
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {(['FAN', 'PRO', 'ELITE'] as const).map((t) => {
                const info = TIER_PRICES[t];
                const isSelected = tier === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTier(t)}
                    className={`p-2.5 sm:p-3.5 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'border-sky-400 bg-sky-950/60 shadow-lg shadow-sky-500/20 ring-1 ring-sky-400'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider ${
                        t === 'ELITE' ? 'text-amber-400' : t === 'PRO' ? 'text-sky-400' : 'text-slate-300'
                      }`}>
                        {info.label}
                      </span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />}
                    </div>
                    <p className="text-xs sm:text-sm font-black text-white mt-1">{info.price}</p>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 leading-tight mt-0.5">{info.period}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Biodata Member */}
          <div className="space-y-3 pt-1 border-t border-slate-800">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              2. Pengisian Biodata Calon Member
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dimas Bagas Prakoso"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Nama Panggilan / Di Punggung (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: DIMAS"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Asal / Domisili *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jakarta Timur / Bekasi"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Nomor WhatsApp Aktif *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Contoh: 081234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Posisi Utama *
                </label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-sky-400"
                >
                  <option value="FW">Forward / Penyerang (FW)</option>
                  <option value="MF">Midfielder / Gelandang (MF)</option>
                  <option value="DF">Defender / Bek (DF)</option>
                  <option value="GK">Goalkeeper / Kiper (GK)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Posisi Alternatif (Opsional)
                </label>
                <select
                  value={altPosition}
                  onChange={(e) => setAltPosition(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-sky-400"
                >
                  <option value="">-- Tidak Ada --</option>
                  <option value="FW">Forward (FW)</option>
                  <option value="MF">Midfielder (MF)</option>
                  <option value="DF">Defender (DF)</option>
                  <option value="GK">Goalkeeper (GK)</option>
                </select>
              </div>
            </div>

            {/* Jersey Number Generator (30 - 99) */}
            <div className="p-3 sm:p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-14 rounded-lg bg-gradient-to-br from-blue-900 to-slate-900 border border-sky-400/50 flex flex-col items-center justify-center text-white shadow-md">
                  <span className="text-[9px] uppercase font-bold text-sky-300 leading-none">NO</span>
                  <span className="text-xl font-black text-amber-400 leading-none mt-0.5">{jerseyNumber}</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase">Nomor Punggung Member (30 - 99)</h4>
                  <p className="text-[10px] text-slate-400">Diacak otomatis saat registrasi komunitas.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={rollRandomNumber}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-300 text-xs font-bold transition-all"
              >
                <Shuffle className="w-3.5 h-3.5" />
                Acak Ulang
              </button>
            </div>

            {/* Foto Profil */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Foto Profil Pemain (Opsional)
              </label>
              <div className="flex items-center gap-3">
                <img
                  src={photoUrl || '/defaultplayer.png'}
                  alt="Preview"
                  className="w-12 h-12 rounded-xl object-cover border border-slate-700 bg-slate-950"
                />
                <label className="cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 font-semibold transition-all">
                  {uploadingPhoto ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 text-sky-400" />
                  )}
                  <span>{uploadingPhoto ? 'Mengunggah...' : 'Upload Foto Profil'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* 3. Info Pembayaran & Bukti Transfer */}
          <div className="space-y-3 pt-1 border-t border-slate-800">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              3. Informasi Pembayaran Membership
            </label>

            <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/60 to-slate-900 border border-sky-400/30 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-white font-bold">
                <span>Total Biaya ({TIER_PRICES[tier].label}):</span>
                <span className="text-amber-400 text-sm font-black">{TIER_PRICES[tier].price}</span>
              </div>
              <div className="text-[11px] text-slate-300 space-y-0.5 pt-1 border-t border-slate-800">
                <p>🏦 <strong>BCA :</strong> 893-019-2810 (a.n MARINERS SOCCER CLUB)</p>
                <p>📱 <strong>QRIS / E-Wallet :</strong> Tersedia via konfirmasi WhatsApp Admin</p>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Upload Bukti Transfer / Pembayaran
              </label>
              <div className="flex items-center gap-3">
                {paymentProof && (
                  <img
                    src={paymentProof}
                    alt="Bukti Transfer"
                    className="w-12 h-12 rounded-xl object-cover border border-emerald-500/50 bg-slate-950"
                  />
                )}
                <label className="cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 font-semibold transition-all">
                  {uploadingProof ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
                  ) : (
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>{uploadingProof ? 'Mengunggah...' : paymentProof ? 'Ganti Bukti Transfer' : 'Upload Bukti Transfer'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProofUpload}
                    disabled={uploadingProof}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || uploadingPhoto || uploadingProof}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-extrabold uppercase white-blue-btn text-xs shadow-lg shadow-sky-500/20 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? 'Mendaftarkan...' : 'Konfirmasi & Daftar Sekarang'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
