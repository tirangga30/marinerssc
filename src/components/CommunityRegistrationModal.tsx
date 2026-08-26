'use client';

import React, { useState, useEffect } from 'react';
import {
  X, Sparkles, Upload, Loader2, CheckCircle2, Shield, User,
  Phone, MapPin, Shuffle, CreditCard, Flame, Award, Crown,
  Clock, AlertCircle, MessageCircle, ArrowRight
} from 'lucide-react';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTier?: 'FAN' | 'PRO' | 'ELITE';
  onSuccess?: (member: any) => void;
  onOpenLogin?: () => void;
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
  onOpenLogin,
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

  // Success Submitted State
  const [submittedData, setSubmittedData] = useState<any | null>(null);

  useEffect(() => {
    if (initialTier) setTier(initialTier);
    rollRandomNumber();
    setSubmittedData(null);
  }, [initialTier, isOpen]);

  const rollRandomNumber = () => {
    const random = Math.floor(Math.random() * (99 - 30 + 1)) + 30;
    setJerseyNumber(random);
  };

  if (!isOpen) return null;

  // Validation: Semua field wajib terisi sebelum tombol bisa diklik
  const isFormValid = Boolean(
    fullName.trim() &&
    origin.trim() &&
    phone.trim() &&
    position.trim() &&
    photoUrl.trim() &&
    paymentProof.trim()
  );

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

    if (!isFormValid) {
      setError('Mohon lengkapi semua data formulir (Nama, Asal Domisili, No WhatsApp, Posisi, Foto Profil, dan Bukti Transfer).');
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

      setSubmittedData({
        fullName,
        phone,
        tier,
        memberCode: data.member?.memberCode,
      });

      if (onSuccess) onSuccess(data.member);
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

        {/* ─── SUCCESS SUBMITTED STATE ─── */}
        {submittedData ? (
          <div className="p-6 sm:p-10 text-center space-y-6 animate-fadeIn">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 mx-auto shadow-xl shadow-amber-500/20 animate-pulse">
              <Clock className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-widest">
                Menunggu Verifikasi Admin
              </span>
              <h3 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight">
                Pendaftaran Berhasil Dikirim!
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Terima kasih telah mendaftar, <strong className="text-sky-300">{submittedData.fullName}</strong>!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-2.5 max-w-md mx-auto text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Bukti pembayaran & data pendaftaran diterima</span>
              </div>
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>Admin akan memeriksa dan mengirimkan akun via WhatsApp</span>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p>📱 Nomor WhatsApp: <strong className="text-white">{submittedData.phone}</strong></p>
                <p>👑 Paket Dipilih: <strong className="text-amber-300">{submittedData.tier}</strong></p>
                <p className="text-slate-400 pt-1 text-[10px] italic">
                  *Setelah pembayaran diverifikasi oleh Admin, <strong>ID Member</strong> dan <strong>Kata Sandi</strong> akan langsung dikirimkan ke nomor WhatsApp Anda untuk login.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {onOpenLogin && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenLogin();
                  }}
                  className="px-6 py-3 rounded-xl font-bold uppercase text-white glass-panel border border-slate-700 hover:border-sky-400 hover:text-sky-300 text-xs transition-all"
                >
                  Buka Form Login
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-xl font-extrabold uppercase white-blue-btn text-xs shadow-lg shadow-sky-500/20"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        ) : (
          /* ─── REGISTRATION FORM BODY ─── */
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
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
                      <span className="block text-xs font-black uppercase text-white">{info.label}</span>
                      <span className="block text-sm sm:text-base font-black text-amber-400 mt-0.5">{info.price}</span>
                      <span className="block text-[9px] text-slate-400 font-semibold">{info.period}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Biodata Calon Member */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                2. Data Diri & Kontak <span className="text-rose-400">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Nama Lengkap <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Budi Santoso"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-hidden focus:border-sky-400 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Nama Panggilan / Jersey Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Budi"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-hidden focus:border-sky-400 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Nomor WhatsApp <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 081234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-hidden focus:border-sky-400 font-medium"
                  />
                  <span className="text-[9px] text-slate-500 block mt-0.5">*ID login & password akan dikirim ke nomor ini</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Asal Domisili <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jakarta Selatan"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-hidden focus:border-sky-400 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* 3. Posisi & Nomor Punggung */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                3. Posisi & Nomor Punggung <span className="text-rose-400">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Posisi Utama <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-hidden focus:border-sky-400"
                  >
                    <option value="GK">Goalkeeper (Kiper)</option>
                    <option value="DF">Defender (Bek)</option>
                    <option value="MF">Midfielder (Gelandang)</option>
                    <option value="FW">Forward (Penyerang)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Posisi Alternatif
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. RW / LW / CB"
                    value={altPosition}
                    onChange={(e) => setAltPosition(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-hidden focus:border-sky-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Nomor Punggung (30-99)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="30"
                      max="99"
                      value={jerseyNumber}
                      onChange={(e) => setJerseyNumber(parseInt(e.target.value) || 30)}
                      className="w-20 px-3 py-2 text-center rounded-xl bg-slate-950 border border-amber-500/50 text-amber-400 font-mono font-black text-sm"
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
            </div>

            {/* 4. Foto Profil Member */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                4. Foto Profil Member (4:5) <span className="text-rose-400">*</span>
              </label>

              <div className="flex items-center gap-3">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Preview"
                    className="w-14 h-16 rounded-xl object-cover border border-sky-400 bg-slate-950 shadow-md"
                  />
                ) : (
                  <div className="w-14 h-16 rounded-xl border border-dashed border-slate-700 bg-slate-950 flex items-center justify-center text-slate-600 text-[9px] text-center p-1">
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
                    Gunakan foto diri setengah badan / jersey.
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Pembayaran & Upload Bukti Transfer */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  5. Pembayaran Membership ({tier}) <span className="text-rose-400">*</span>
                </span>
                <span className="text-sm font-black text-white">{TIER_PRICES[tier].price}</span>
              </div>

              <div className="text-[11px] text-slate-300 space-y-0.5 pt-1 border-b border-slate-800 pb-2">
                <p>🏦 <strong>BCA :</strong> 893-019-2810 (a.n MARINERS SOCCER CLUB)</p>
                <p>📱 <strong>QRIS / E-Wallet :</strong> Konfirmasi via WhatsApp Admin</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                  Upload Bukti Transfer Pembayaran <span className="text-rose-400">*</span>
                </label>
                <div className="flex items-center gap-3">
                  {paymentProof ? (
                    <img
                      src={paymentProof}
                      alt="Bukti Transfer"
                      className="w-12 h-12 rounded-xl object-cover border border-emerald-500 bg-slate-950"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl border border-dashed border-slate-700 bg-slate-950 flex items-center justify-center text-slate-600 text-[8px] text-center p-1">
                      Bukti TF
                    </div>
                  )}
                  <label className="cursor-pointer flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 font-semibold transition-all">
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

            {/* Validation Notice if not complete */}
            {!isFormValid && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Harap isi semua kolom data dan upload foto profil + bukti transfer untuk mengaktifkan tombol pendaftaran.</span>
              </div>
            )}

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
                disabled={!isFormValid || loading || uploadingPhoto || uploadingProof}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-extrabold uppercase white-blue-btn text-xs shadow-lg shadow-sky-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{loading ? 'Mengirim Data...' : 'Kirim Pendaftaran & Bukti Transfer'}</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
