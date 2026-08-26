'use client';

import React, { useState, useEffect } from 'react';
import {
  X, Sparkles, Upload, Loader2, CheckCircle2, Shield, User,
  Phone, MapPin, Shuffle, CreditCard, Flame, Award, Crown,
  Clock, AlertCircle, MessageCircle, ArrowRight, ArrowLeft, Check,
  QrCode, HelpCircle
} from 'lucide-react';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTier?: 'FAN' | 'PRO' | 'ELITE';
  onSuccess?: (member: any) => void;
  onOpenLogin?: () => void;
}

const TIER_PRICES = {
  FAN: {
    label: 'FAN PASS',
    title: 'FAN MEMBER',
    price: 'Rp 15.000',
    period: '/ pertandingan',
    badge: '1x Fun Match',
    benefits: [
      'Ikut 1x pertandingan Fun Match di hari Minggu',
      'Akses masuk Grup WhatsApp resmi komunitas',
      'Profil & nomor punggung masuk web member',
      'Mendapatkan catatan statistik pribadi member',
    ],
  },
  PRO: {
    label: 'PRO PASS',
    title: 'PRO MEMBER',
    price: 'Rp 49.000',
    period: '/ bulan (30 hari)',
    badge: 'PALING POPULER',
    benefits: [
      'Ikut pertandingan Fun Match tiap minggu selama 1 bulan',
      'Bisa terpilih ikut uji tanding Skuad Utama',
      'Akses masuk Grup WhatsApp resmi komunitas',
      'Profil & nomor punggung masuk web member',
      'Mendapatkan statistik lengkap member',
    ],
  },
  ELITE: {
    label: 'ELITE PASS (6 BULAN)',
    title: 'ELITE MEMBER',
    price: 'Rp 399.000',
    period: '/ 6 bulan',
    badge: 'FULL KIT + PRIORITAS UTAMA',
    benefits: [
      'Ikut pertandingan Fun Match tiap minggu selama 6 bulan',
      'Bonus 1 Set Jersey Komunitas + Stiker Eksklusif',
      'Prioritas terpilih masuk Skuad Aktif Utama',
      'Akses Grup WhatsApp Skuad Utama (jika terpilih)',
      'Profil masuk web Skuad Utama & statistik pribadi',
    ],
  },
};

export default function CommunityRegistrationModal({
  isOpen,
  onClose,
  initialTier = 'PRO',
  onSuccess,
  onOpenLogin,
}: RegistrationModalProps) {
  // Steps: 1 (Choose Membership), 2 (Personal Data & Profile), 3 (Payment & QRIS), 4 (Submitted / Success)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [tier, setTier] = useState<'FAN' | 'PRO' | 'ELITE'>(initialTier);
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [origin, setOrigin] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('MF');
  const [altPosition, setAltPosition] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState<number>(10);
  const [photoUrl, setPhotoUrl] = useState('');
  const [paymentProof, setPaymentProof] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Success Submitted State
  const [submittedData, setSubmittedData] = useState<any | null>(null);

  useEffect(() => {
    if (initialTier) setTier(initialTier);
    rollRandomNumber();
    setSubmittedData(null);
    setStep(1);
  }, [initialTier, isOpen]);

  const rollRandomNumber = () => {
    const random = Math.floor(Math.random() * 99) + 1; // 1 to 99
    setJerseyNumber(random);
  };

  if (!isOpen) return null;

  // Validation Step 2 (Data Diri & Foto)
  const isStep2Valid = Boolean(
    fullName.trim() &&
    origin.trim() &&
    phone.trim() &&
    position.trim() &&
    photoUrl.trim() &&
    jerseyNumber >= 1 &&
    jerseyNumber <= 99
  );

  // Validation Step 3 (Bukti Pembayaran)
  const isStep3Valid = Boolean(paymentProof.trim());

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

    if (!isStep2Valid || !isStep3Valid) {
      setError('Mohon lengkapi semua data formulir dan upload bukti transfer pembayaran.');
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
          altPosition: altPosition || null,
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

      setSubmittedData({
        fullName,
        nickname,
        phone,
        tier,
        jerseyNumber,
        memberCode: data.member?.memberCode,
      });

      setStep(4);
      if (onSuccess) onSuccess(data.member);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mendaftar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-sky-400/40 rounded-2xl sm:rounded-3xl shadow-2xl shadow-sky-950/80 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-black uppercase text-white tracking-wider">
                Pendaftaran Soccer Community
              </h2>
              <p className="text-[11px] sm:text-xs text-sky-300">Bergabung dengan keluarga Mariners SC</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* ─── STEP PROGRESS BAR (HANYA DITAMPILKAN JIKA BELUM SUBMITTED) ─── */}
        {step !== 4 && (
          <div className="px-4 sm:px-6 py-2.5 bg-slate-950/80 border-b border-slate-800 shrink-0">
            <div className="flex items-center justify-between max-w-lg mx-auto text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`flex items-center gap-1.5 transition-colors ${
                  step === 1 ? 'text-sky-400 font-black' : step > 1 ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                  step === 1 ? 'bg-sky-500 text-slate-950' : step > 1 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  1
                </span>
                <span>Pilih Paket</span>
              </button>

              <div className={`h-0.5 flex-1 mx-2 sm:mx-4 ${step > 1 ? 'bg-emerald-500' : 'bg-slate-800'}`} />

              <button
                type="button"
                onClick={() => {
                  if (step > 1) setStep(2);
                }}
                className={`flex items-center gap-1.5 transition-colors ${
                  step === 2 ? 'text-sky-400 font-black' : step > 2 ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                  step === 2 ? 'bg-sky-500 text-slate-950' : step > 2 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  2
                </span>
                <span>Isi Data Diri</span>
              </button>

              <div className={`h-0.5 flex-1 mx-2 sm:mx-4 ${step > 2 ? 'bg-emerald-500' : 'bg-slate-800'}`} />

              <button
                type="button"
                className={`flex items-center gap-1.5 transition-colors ${
                  step === 3 ? 'text-sky-400 font-black' : 'text-slate-500'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                  step === 3 ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  3
                </span>
                <span>Pembayaran QRIS</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════
              STEP 1: PILIH MEMBERSHIP & BENEFIT LENGKAP
             ═════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="text-center space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-sky-400">
                  LANGKAH 1 DARI 3
                </span>
                <h3 className="text-lg sm:text-2xl font-black uppercase text-white">
                  Pilih Paket Membership Anda
                </h3>
                <p className="text-xs text-slate-400 max-w-lg mx-auto">
                  Setiap paket memberikan nomor punggung resmi, akses jadwal fun match, dan kesempatan dipantau masuk Skuad Utama.
                </p>
              </div>

              {/* 3 PRICING CARDS DENGAN BENEFIT LENGKAP */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 items-stretch">
                {(['FAN', 'PRO', 'ELITE'] as const).map((t) => {
                  const info = TIER_PRICES[t];
                  const isSelected = tier === t;
                  const isPro = t === 'PRO';
                  const isElite = t === 'ELITE';

                  return (
                    <div
                      key={t}
                      onClick={() => setTier(t)}
                      className={`cursor-pointer rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 relative border ${
                        isSelected
                          ? isPro
                            ? 'border-sky-400 bg-gradient-to-b from-blue-950/70 via-slate-900 to-slate-900 shadow-xl shadow-sky-500/20 ring-2 ring-sky-400'
                            : isElite
                            ? 'border-amber-400 bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-900 shadow-xl shadow-amber-500/20 ring-2 ring-amber-400'
                            : 'border-sky-400 bg-slate-900 shadow-lg ring-2 ring-sky-400'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      {isPro && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-sky-400 to-blue-600 text-slate-950 font-black text-[8px] sm:text-[9px] uppercase tracking-widest shadow-md">
                          {info.badge}
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            isElite
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                              : isPro
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            {info.label}
                          </span>
                          {isElite ? (
                            <Crown className="w-4 h-4 text-amber-400" />
                          ) : isPro ? (
                            <Flame className="w-4 h-4 text-sky-400" />
                          ) : (
                            <Award className="w-4 h-4 text-slate-400" />
                          )}
                        </div>

                        <div>
                          <h4 className="text-base font-black uppercase text-white">{info.title}</h4>
                          <div className="flex items-baseline gap-1 mt-1">
                            <span className={`text-xl sm:text-2xl font-black ${
                              isElite ? 'text-amber-300' : isPro ? 'text-sky-300' : 'text-white'
                            }`}>
                              {info.price}
                            </span>
                            <span className="text-[11px] text-slate-400 font-semibold">{info.period}</span>
                          </div>
                        </div>

                        {/* List Benefit */}
                        <ul className="space-y-2 text-xs text-slate-300 pt-2.5 border-t border-slate-800/80">
                          {info.benefits.map((b, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                                isElite ? 'text-amber-400' : isPro ? 'text-sky-400' : 'text-emerald-400'
                              }`} />
                              <span className="text-[11px] leading-tight">{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Selected Radio Indicator */}
                      <div className="pt-4 mt-auto">
                        <div className={`w-full py-2 rounded-xl text-center text-xs font-black uppercase transition-all ${
                          isSelected
                            ? isElite
                              ? 'bg-amber-400 text-slate-950 shadow-md'
                              : 'bg-sky-400 text-slate-950 shadow-md'
                            : 'bg-slate-800/60 text-slate-400'
                        }`}>
                          {isSelected ? '✓ Paket Terpilih' : 'Pilih Paket Ini'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-extrabold uppercase white-blue-btn text-xs shadow-lg shadow-sky-500/20"
                >
                  <span>Lanjut ke Pengisian Data</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════
              STEP 2: ISI FORM DATA DIRI, POSISI & FOTO PROFIL (DISATUKAN)
             ═════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="text-center space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-sky-400">
                  LANGKAH 2 DARI 3 • PAKET {tier}
                </span>
                <h3 className="text-lg sm:text-2xl font-black uppercase text-white">
                  Lengkapi Data Diri &amp; Profil Pemain
                </h3>
                <p className="text-xs text-slate-400 max-w-lg mx-auto">
                  Isi data lengkap Anda untuk penerbitan ID Member resmi, nomor punggung, dan posisi bermain.
                </p>
              </div>

              {/* Form Grid */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                
                {/* 1. Biodata & Kontak */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Nama Lengkap <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Budi Santoso"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-sky-400 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Nama Panggilan / Jersey Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Budi"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-sky-400 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Nomor WhatsApp Aktif <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 081234567890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-sky-400 font-medium"
                    />
                    <span className="text-[9px] text-slate-500 block mt-0.5">
                      *ID Member &amp; info fun match akan dikirimkan ke nomor ini
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Asal Domisili / Kota <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jakarta Selatan / Ciamis"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-sky-400 font-medium"
                    />
                  </div>
                </div>

                {/* 2. Posisi & Nomor Punggung */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 border-t border-slate-800">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Posisi Utama <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-hidden focus:border-sky-400"
                    >
                      <option value="GK">Goalkeeper (Kiper)</option>
                      <option value="DF">Defender (Bek)</option>
                      <option value="MF">Midfielder (Gelandang)</option>
                      <option value="FW">Forward (Penyerang)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Posisi Alternatif
                    </label>
                    <select
                      value={altPosition}
                      onChange={(e) => setAltPosition(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-hidden focus:border-sky-400"
                    >
                      <option value="">Tidak Ada / Fleksibel</option>
                      <option value="GK">Goalkeeper (Kiper)</option>
                      <option value="DF">Defender (Bek)</option>
                      <option value="MF">Midfielder (Gelandang)</option>
                      <option value="FW">Forward (Penyerang)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Nomor Punggung (1-99) <span className="text-rose-400">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={jerseyNumber}
                        onChange={(e) => setJerseyNumber(parseInt(e.target.value) || 1)}
                        className="w-20 px-3 py-2 text-center rounded-xl bg-slate-900 border border-amber-500/50 text-amber-400 font-mono font-black text-sm"
                      />
                      <button
                        type="button"
                        onClick={rollRandomNumber}
                        className="flex-1 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 text-[10px] font-bold uppercase flex items-center justify-center gap-1 transition-colors"
                        title="Acak nomor lain"
                      >
                        <Shuffle className="w-3 h-3" /> Acak
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Foto Profil Member 4:5 */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <label className="block text-[11px] font-bold text-slate-300">
                    Foto Profil Member (Format Pas Foto 4:5) <span className="text-rose-400">*</span>
                  </label>
                  <div className="flex items-center gap-3.5">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt="Preview"
                        className="w-14 h-16 rounded-xl object-cover border-2 border-sky-400 bg-slate-900 shadow-md shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-16 rounded-xl border border-dashed border-slate-700 bg-slate-900 flex items-center justify-center text-slate-500 text-[9px] text-center p-1 shrink-0">
                        Wajib Foto
                      </div>
                    )}
                    <div className="flex-1">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 font-semibold transition-all">
                        {uploadingPhoto ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
                        ) : (
                          <Upload className="w-3.5 h-3.5 text-sky-400" />
                        )}
                        <span>{uploadingPhoto ? 'Mengunggah...' : photoUrl ? 'Ganti Foto' : 'Upload Foto Profil'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          disabled={uploadingPhoto}
                          className="hidden"
                        />
                      </label>
                      <span className="block text-[9px] text-slate-500 mt-1">
                        Gunakan foto diri setengah badan yang jelas (berdiri/jersey).
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Nav Buttons Step 2 */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali</span>
                </button>
                <button
                  type="button"
                  disabled={!isStep2Valid || uploadingPhoto}
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-extrabold uppercase white-blue-btn text-xs shadow-lg shadow-sky-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>Lanjut ke Pembayaran QRIS</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════
              STEP 3: PEMBAYARAN QRIS & UPLOAD BUKTI TRANSFER
             ═════════════════════════════════════════════════════════ */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-5 animate-fadeIn">
              <div className="text-center space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                  LANGKAH 3 DARI 3 • PEMBAYARAN
                </span>
                <h3 className="text-lg sm:text-2xl font-black uppercase text-white">
                  Scan QRIS &amp; Upload Bukti Pembayaran
                </h3>
                <p className="text-xs text-slate-400 max-w-lg mx-auto">
                  Selesaikan pembayaran untuk mengaktifkan keanggotaan dan nomor punggung Anda.
                </p>
              </div>

              {/* Detail Tagihan Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-950 to-amber-950/30 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Paket Yang Dipilih</span>
                  <h4 className="text-base font-black text-white">{TIER_PRICES[tier].title}</h4>
                  <p className="text-[11px] text-slate-400">Atas Nama: <strong className="text-sky-300">{fullName}</strong> (#{jerseyNumber})</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Pembayaran</span>
                  <p className="text-xl sm:text-2xl font-black text-amber-400 font-mono">{TIER_PRICES[tier].price}</p>
                </div>
              </div>

              {/* QRIS Display Card */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-amber-400/30 text-center space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Scan QRIS Resmi Mariners SC</span>
                </div>

                <div className="max-w-[240px] sm:max-w-[260px] mx-auto rounded-2xl overflow-hidden border-2 border-white/20 bg-white p-2.5 shadow-2xl">
                  <img
                    src="/qris.jpeg"
                    alt="QRIS Pembayaran Mariners SC"
                    className="w-full h-auto object-contain rounded-xl"
                    onError={(e) => {
                      // Fallback text if qris.jpeg is not yet placed
                      (e.currentTarget as any).src = '/marinerssc.png';
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Scan menggunakan GoPay, OVO, DANA, ShopeePay, BCA Mobile, atau Mobile Banking lainnya.
                </p>
              </div>

              {/* Upload Bukti Pembayaran */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                <label className="block text-[11px] font-bold text-slate-300">
                  Upload Bukti Transfer Pembayaran <span className="text-rose-400">*</span>
                </label>
                <div className="flex items-center gap-3.5">
                  {paymentProof ? (
                    <img
                      src={paymentProof}
                      alt="Bukti Transfer"
                      className="w-14 h-14 rounded-xl object-cover border-2 border-emerald-500 bg-slate-900 shrink-0 shadow-md"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl border border-dashed border-slate-700 bg-slate-900 flex items-center justify-center text-slate-500 text-[9px] text-center p-1 shrink-0">
                      Wajib Upload Bukti
                    </div>
                  )}
                  <div className="flex-1">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 font-semibold transition-all">
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
                    <span className="block text-[9px] text-slate-500 mt-1">
                      Upload screenshot bukti transaksi transfer / pembayaran QRIS yang berhasil.
                    </span>
                  </div>
                </div>
              </div>

              {/* Nav Buttons Step 3 */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali</span>
                </button>
                <button
                  type="submit"
                  disabled={!isStep3Valid || loading || uploadingProof}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-extrabold uppercase white-blue-btn text-xs shadow-lg shadow-sky-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{loading ? 'Mengirim Pendaftaran...' : 'Kirim Pendaftaran & Bukti Transfer'}</span>
                </button>
              </div>
            </form>
          )}

          {/* ═════════════════════════════════════════════════════════
              STEP 4: SUCCESS SUBMITTED / UCAPAN TERIMA KASIH & PENGADUAN
             ═════════════════════════════════════════════════════════ */}
          {step === 4 && submittedData && (
            <div className="p-4 sm:p-8 text-center space-y-6 animate-fadeIn">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mx-auto shadow-xl shadow-emerald-500/20 animate-bounce">
                <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-black uppercase tracking-widest">
                  Pendaftaran Berhasil Terkirim
                </span>
                <h3 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight">
                  Terima Kasih Telah Mendaftar!
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Halo <strong className="text-sky-300">{submittedData.fullName}</strong>, data pendaftaran dan bukti transfer Anda telah kami terima dengan baik.
                </p>
              </div>

              {/* Status Note 1x24 Jam */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-3 max-w-lg mx-auto text-xs">
                <div className="flex items-start gap-2.5 text-amber-300 font-bold">
                  <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <span>
                    Mohon ditunggu, verifikasi data dan pengiriman ID Member / Kata Sandi akan dikonfirmasi via WhatsApp dalam waktu <strong>1x24 Jam</strong>.
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                  <p>📱 WhatsApp Tujuan: <strong className="text-white">{submittedData.phone}</strong></p>
                  <p>👑 Paket Membership: <strong className="text-amber-300">{submittedData.tier}</strong></p>
                  <p>🔢 Nomor Punggung: <strong className="text-sky-300">#{submittedData.jerseyNumber}</strong></p>
                </div>
              </div>

              {/* Kotak Pengaduan Kendala */}
              <div className="p-4 rounded-2xl bg-blue-950/30 border border-sky-400/30 text-left space-y-2.5 max-w-lg mx-auto">
                <div className="flex items-center gap-2 text-sky-300 font-bold text-xs">
                  <HelpCircle className="w-4 h-4 text-sky-400" />
                  <span>Pusat Bantuan &amp; Pengaduan Kendala:</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Jika mengalami kendala atau konfirmasi belum diterima setelah 1x24 jam, hubungi admin resmi di:
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-mono font-black text-amber-400 text-sm sm:text-base">
                    📞 085223337028
                  </span>
                  <a
                    href="https://wa.me/6285223337028?text=Halo%20Admin%20Mariners%20SC,%20saya%20sudah%20mendaftar%20member%20dan%20ingin%20konfirmasi."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase transition-colors shadow-md"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Chat WhatsApp Admin</span>
                  </a>
                </div>
              </div>

              {/* Close & Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {onOpenLogin && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenLogin();
                    }}
                    className="px-6 py-2.5 rounded-xl font-bold uppercase text-white glass-panel border border-slate-700 hover:border-sky-400 hover:text-sky-300 text-xs transition-all"
                  >
                    Buka Halaman Login
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl font-extrabold uppercase white-blue-btn text-xs shadow-lg shadow-sky-500/20"
                >
                  Selesai &amp; Tutup
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
