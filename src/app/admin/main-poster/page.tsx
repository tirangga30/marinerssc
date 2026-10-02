'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Image as ImageIcon, ArrowLeft, Upload, Trash2, Check,
  AlertCircle, Sparkles, RefreshCw, Layers, Play, Crop,
  Edit2, Loader2, X, Link as LinkIcon, FileText, Timer
} from 'lucide-react';
import ImageCropperModal from '@/components/ImageCropperModal';

interface PosterItem {
  id?: string;
  imageUrl: string;
  title?: string | null;
  subtitle?: string | null;
  linkUrl?: string | null;
  order: number;
  isActive: boolean;
}

export default function MainPosterAdminPage() {
  const [posters, setPosters] = useState<PosterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Rotation duration setting (3 - 10 seconds)
  const [slideInterval, setSlideInterval] = useState<number>(5);
  const [savingInterval, setSavingInterval] = useState<boolean>(false);

  // Live Carousel Preview index
  const [previewIndex, setPreviewIndex] = useState(0);

  // Cropper Modal state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState<string | null>(null);
  const [cropperSlotOrder, setCropperSlotOrder] = useState<number | null>(null);

  // Edit Link Modal state (Only Link URL)
  const [editingPoster, setEditingPoster] = useState<PosterItem | null>(null);
  const [metaFormData, setMetaFormData] = useState({ linkUrl: '' });
  const [savingMeta, setSavingMeta] = useState(false);

  // File input refs for slots 1..5 (index 0..4)
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadPosters = () => {
    setLoading(true);
    fetch('/api/admin/posters')
      .then((res) => res.json())
      .then((data) => {
        if (data.posters) {
          setPosters(data.posters);
        }
        if (data.interval) {
          setSlideInterval(data.interval);
        }
      })
      .catch((err) => console.error('Error loading posters:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPosters();
  }, []);

  // Update slide interval in seconds (3 - 10 seconds)
  const handleUpdateInterval = async (sec: number) => {
    const clamped = Math.max(3, Math.min(10, sec));
    setSlideInterval(clamped);
    setSavingInterval(true);
    try {
      const res = await fetch('/api/admin/posters', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interval: clamped }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'Gagal menyimpan durasi');
      } else {
        showToast('success', `Durasi slide berhasil diatur ke ${clamped} detik!`);
      }
    } catch {
      showToast('error', 'Terjadi kesalahan jaringan');
    } finally {
      setSavingInterval(false);
    }
  };

  // Timer for live preview of active posters (syncs with slideInterval)
  const activePosters = posters.filter((p) => p.isActive);
  useEffect(() => {
    if (activePosters.length <= 1) return;
    const interval = setInterval(() => {
      setPreviewIndex((prev) => (prev + 1) % activePosters.length);
    }, slideInterval * 1000);
    return () => clearInterval(interval);
  }, [activePosters.length, slideInterval]);

  // ── 1. Select file from disk -> Open Cropper Modal ──
  const handleSelectFileForCrop = (slotOrder: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCropperImageSrc(event.target.result as string);
        setCropperSlotOrder(slotOrder);
        setCropperOpen(true);
      }
    };
    reader.readAsDataURL(file);

    // Reset input value so re-selecting same file triggers change
    e.target.value = '';
  };

  // ── 2. Open Cropper for existing uploaded image ──
  const handleOpenCropperForExisting = async (poster: PosterItem) => {
    try {
      setUploadingSlot(poster.order);
      const res = await fetch(poster.imageUrl);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setCropperImageSrc(e.target.result as string);
          setCropperSlotOrder(poster.order);
          setCropperOpen(true);
        }
      };
      reader.readAsDataURL(blob);
    } catch {
      // Fallback: direct URL if CORS allows or same origin
      setCropperImageSrc(poster.imageUrl);
      setCropperSlotOrder(poster.order);
      setCropperOpen(true);
    } finally {
      setUploadingSlot(null);
    }
  };

  // ── 3. Handle Crop Complete -> Upload to /api/upload -> Upsert in /api/admin/posters ──
  const handleCropComplete = async (croppedBlob: Blob) => {
    if (cropperSlotOrder === null) return;
    const targetSlot = cropperSlotOrder;
    setUploadingSlot(targetSlot);

    const formData = new FormData();
    formData.append('file', croppedBlob, `poster_slot_${targetSlot}.jpg`);
    formData.append('folder', 'posters');

    try {
      // Step A: Upload file
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.url) {
        showToast('error', uploadData.error || 'Gagal mengunggah gambar');
        return;
      }

      const existing = posters.find((p) => p.order === targetSlot);

      // Step B: Save to posters table
      const saveRes = await fetch('/api/admin/posters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: existing?.id,
          imageUrl: uploadData.url,
          order: targetSlot,
          isActive: existing ? existing.isActive : true,
          title: existing?.title || null,
          subtitle: existing?.subtitle || null,
          linkUrl: existing?.linkUrl || null,
        }),
      });

      const saveData = await saveRes.json();
      if (!saveRes.ok) {
        showToast('error', saveData.error || 'Gagal menyimpan data poster');
      } else {
        showToast('success', `Poster Slot ${targetSlot} berhasil di-crop & disimpan!`);
        loadPosters();
      }
    } catch {
      showToast('error', 'Terjadi kesalahan jaringan saat menyimpan poster');
    } finally {
      setUploadingSlot(null);
      setCropperSlotOrder(null);
      setCropperImageSrc(null);
      setCropperOpen(false);
    }
  };

  // ── 4. Toggle Active Status ──
  const handleToggleActive = async (poster: PosterItem) => {
    if (!poster.id) return;
    try {
      const res = await fetch(`/api/admin/posters/${poster.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !poster.isActive }),
      });

      if (!res.ok) {
        showToast('error', 'Gagal mengubah status');
      } else {
        showToast('success', `Poster Slot ${poster.order} ${!poster.isActive ? 'diaktifkan' : 'dinonaktifkan'}`);
        loadPosters();
      }
    } catch {
      showToast('error', 'Terjadi kesalahan jaringan');
    }
  };

  // ── 5. Delete Poster ──
  const handleDeletePoster = async (id?: string, slotOrder?: number) => {
    if (!id) return;
    if (!confirm(`Hapus poster pada Slot ${slotOrder}?`)) return;

    try {
      const res = await fetch(`/api/admin/posters/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        showToast('error', 'Gagal menghapus poster');
      } else {
        showToast('success', `Poster Slot ${slotOrder} berhasil dihapus`);
        loadPosters();
      }
    } catch {
      showToast('error', 'Gagal menghapus poster');
    }
  };

  // ── 6. Save Link URL ──
  const handleSaveMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPoster?.id) return;

    setSavingMeta(true);
    try {
      const res = await fetch(`/api/admin/posters/${editingPoster.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: null,
          subtitle: null,
          linkUrl: metaFormData.linkUrl.trim() || null,
        }),
      });

      if (!res.ok) {
        showToast('error', 'Gagal menyimpan link poster');
      } else {
        showToast('success', 'Link poster berhasil disimpan!');
        setEditingPoster(null);
        loadPosters();
      }
    } catch {
      showToast('error', 'Terjadi kesalahan jaringan');
    } finally {
      setSavingMeta(false);
    }
  };

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
      <div className="glass-panel p-5 sm:p-7 rounded-2xl sm:rounded-3xl border border-sky-400/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-300 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            Hero Banner Beranda Web
          </div>
          <h1 className="text-xl sm:text-3xl font-black uppercase text-white tracking-tight flex items-center justify-center sm:justify-start gap-2">
            <span>MAIN POSTER (SLIDE)</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold">
              {activePosters.length}/5 Aktif
            </span>
          </h1>
          <p className="text-xs text-slate-300">
            Unggah hingga 5 poster beranda dengan fitur crop 16:9 presisi. Poster aktif otomatis berputar bergantian tiap {slideInterval} detik.
          </p>
        </div>

        <Link
          href="/admin/dashboard"
          className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold uppercase flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
        </Link>
      </div>

      {/* ── PENGATURAN DURASI SLIDE (3 - 10 DETIK) ── */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-sky-400/30 shadow-xl space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl blue-gradient-bg flex items-center justify-center text-white shadow shrink-0">
              <Timer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black uppercase text-white tracking-wide flex items-center gap-2">
                <span>Pengaturan Durasi Slide Poster</span>
                {savingInterval && (
                  <span className="text-[10px] text-sky-400 font-normal flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Menyimpan...
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400">
                Pilih interval waktu pergantian otomatis antar poster aktif di halaman beranda (3 – 10 detik).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Durasi Aktif:</span>
            <span className="px-3 py-1 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-400/40 font-mono font-black text-xs shadow-inner">
              {slideInterval} Detik
            </span>
          </div>
        </div>

        {/* Quick Interval Buttons: 3s to 10s */}
        <div className="space-y-2.5">
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {[3, 4, 5, 6, 7, 8, 9, 10].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => handleUpdateInterval(sec)}
                disabled={savingInterval}
                className={`py-2 px-1 rounded-xl text-xs font-black uppercase transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 border shadow ${
                  slideInterval === sec
                    ? 'blue-gradient-bg text-white border-sky-300 shadow-sky-500/30 scale-[1.03]'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800 hover:border-sky-400/40'
                }`}
              >
                <span>{sec}s</span>
                <span className="text-[8px] font-normal opacity-70">
                  {sec === 5 ? 'Default' : `${sec} dtk`}
                </span>
              </button>
            ))}
          </div>

          {/* Range Slider for Fine Adjustment */}
          <div className="pt-1 flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-400 shrink-0">3 Detik (Cepat)</span>
            <input
              type="range"
              min={3}
              max={10}
              step={1}
              value={slideInterval}
              onChange={(e) => handleUpdateInterval(parseInt(e.target.value, 10))}
              className="w-full accent-sky-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] font-bold text-slate-400 shrink-0">10 Detik (Santai)</span>
          </div>
        </div>
      </div>

      {/* ── LIVE PREVIEW CAROUSEL ── */}
      <div className="glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-sky-400/30 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-sky-300">
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pratinjau Live Slide Tiap {slideInterval} Detik</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Slide {activePosters.length > 0 ? previewIndex + 1 : 0} dari {activePosters.length}
          </span>
        </div>

        {/* Carousel Viewport */}
        <div className="relative aspect-[16/9] sm:aspect-[21/9] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
          {activePosters.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs space-y-2">
              <ImageIcon className="w-8 h-8 text-slate-600" />
              <span>Belum ada poster aktif. Poster bawaan (/LOGIN.webp) akan ditampilkan.</span>
            </div>
          ) : (
            activePosters.map((poster, idx) => (
              <div
                key={poster.id || idx}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  idx === previewIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <img
                  src={poster.imageUrl}
                  alt={`Slide ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />
                <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-950/80 text-white text-[10px] font-bold uppercase tracking-wider border border-white/20">
                    Slot {poster.order || idx + 1}
                  </span>
                  {poster.linkUrl && (
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[10px] font-mono font-medium flex items-center gap-1 drop-shadow">
                      <LinkIcon className="w-3 h-3 text-sky-400 shrink-0" />
                      <span className="truncate max-w-[200px]">{poster.linkUrl}</span>
                    </span>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Dots Indicator */}
          {activePosters.length > 1 && (
            <div className="absolute bottom-3 right-4 z-30 flex items-center gap-1.5">
              {activePosters.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setPreviewIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === previewIndex ? 'w-6 bg-sky-400' : 'w-2 bg-white/40 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 5 POSTER SLOTS GRID WITH INTEGRATED CROPPER & HOVER CONTROLS ── */}
      <div className="space-y-4">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-black uppercase text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-sky-400" />
              Pengaturan 5 Slot Poster
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Unggah, crop rasio 16:9, ganti gambar, atau atur headline caption per slot poster.
            </p>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-sky-400 font-bold border border-slate-700">
            {posters.filter((p) => p.imageUrl).length}/5 Terisi
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5].map((slotOrder) => {
            const slotIndex = slotOrder - 1;
            const slotPoster = posters.find((p) => p.order === slotOrder);
            const isUploading = uploadingSlot === slotOrder;

            return (
              <div
                key={slotOrder}
                className="glass-panel p-4 rounded-2xl border border-slate-800 hover:border-sky-400/40 space-y-3 transition-all relative overflow-hidden flex flex-col justify-between"
              >
                {/* Hidden File Input for this slot */}
                <input
                  type="file"
                  accept="image/*"
                  ref={(el) => {
                    fileInputRefs.current[slotIndex] = el;
                  }}
                  className="hidden"
                  onChange={(e) => handleSelectFileForCrop(slotOrder, e)}
                />

                {/* Slot Card Header */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg blue-gradient-bg text-white text-xs font-black flex items-center justify-center shadow">
                      {slotOrder}
                    </span>
                    <h3 className="text-xs font-black uppercase text-white">
                      Slot {slotOrder} {slotOrder === 1 && <span className="text-[10px] text-sky-300 font-normal">(Utama)</span>}
                    </h3>
                  </div>

                  {slotPoster && (
                    <button
                      type="button"
                      onClick={() => handleToggleActive(slotPoster)}
                      className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border cursor-pointer transition-all ${
                        slotPoster.isActive
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {slotPoster.isActive ? 'Aktif' : 'Nonaktif'}
                    </button>
                  )}
                </div>

                {/* Photo Box with Hover Overlay (Exact same interaction as Articles Page) */}
                <div
                  onClick={() => {
                    if (!slotPoster?.imageUrl && !isUploading) {
                      fileInputRefs.current[slotIndex]?.click();
                    }
                  }}
                  className={`relative aspect-video rounded-xl overflow-hidden bg-slate-950 border ${
                    slotPoster?.imageUrl ? 'border-sky-500/40' : 'border-dashed border-slate-700 hover:border-sky-400/60 cursor-pointer'
                  } flex items-center justify-center transition-all group`}
                >
                  {isUploading ? (
                    <div className="text-center p-3 space-y-1.5">
                      <Loader2 className="w-7 h-7 animate-spin mx-auto text-sky-400" />
                      <span className="text-[10px] text-sky-300 font-bold block">Memproses &amp; Mengunggah...</span>
                    </div>
                  ) : slotPoster?.imageUrl ? (
                    <>
                      <img
                        src={slotPoster.imageUrl}
                        alt={`Poster Slot ${slotOrder}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          // Fallback if image path was broken
                          (e.currentTarget as any).src = '/LOGIN.webp';
                        }}
                      />

                      {/* Hover Action Bar (Crop Ulang, Ganti Foto, Edit Detail, Hapus) */}
                      <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                        {/* Crop Ulang */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCropperForExisting(slotPoster);
                          }}
                          className="p-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white transition-all shadow-lg cursor-pointer hover:scale-110 active:scale-95 flex items-center gap-1 text-[10px] font-bold uppercase"
                          title="Crop Ulang (Rasio 16:9)"
                        >
                          <Crop className="w-3.5 h-3.5" />
                          <span>Crop</span>
                        </button>

                        {/* Ganti Foto */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRefs.current[slotIndex]?.click();
                          }}
                          className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-all shadow-lg cursor-pointer hover:scale-110 active:scale-95 flex items-center gap-1 text-[10px] font-bold uppercase"
                          title="Ganti Foto"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Ganti</span>
                        </button>

                        {/* Edit Link */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPoster(slotPoster);
                            setMetaFormData({
                              linkUrl: slotPoster.linkUrl || '',
                            });
                          }}
                          className="p-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white transition-all shadow-lg cursor-pointer hover:scale-110 active:scale-95 flex items-center gap-1 text-[10px] font-bold uppercase"
                          title="Atur URL / Link Tujuan"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                          <span>Link</span>
                        </button>

                        {/* Hapus */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePoster(slotPoster.id, slotOrder);
                          }}
                          className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-all shadow-lg cursor-pointer hover:scale-110 active:scale-95"
                          title="Hapus Poster"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Bottom Banner Tag if Link exists */}
                      {slotPoster.linkUrl && (
                        <div className="absolute bottom-1.5 left-1.5 right-1.5 px-2 py-0.5 rounded-lg bg-slate-950/85 backdrop-blur-xs text-[10px] text-sky-300 font-mono font-medium truncate flex items-center gap-1 border border-sky-400/30">
                          <LinkIcon className="w-2.5 h-2.5 text-sky-400 shrink-0" />
                          <span className="truncate">{slotPoster.linkUrl}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center p-4 space-y-1.5">
                      <Upload className="w-6 h-6 mx-auto text-slate-500 group-hover:text-sky-400 transition-colors" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-sky-300 block">
                        + Unggah Poster Slot {slotOrder}
                      </span>
                      <span className="text-[9px] text-slate-500 block">
                        Klik untuk pilih foto &amp; crop 16:9
                      </span>
                    </div>
                  )}
                </div>

                {/* Dedicated Action Buttons Under Box (Exact same pattern as Article Photo Upload) */}
                {slotPoster?.imageUrl ? (
                  <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => handleOpenCropperForExisting(slotPoster)}
                      className="py-1.5 px-1 rounded-xl bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow group"
                      title="Crop Ulang (Rasio 16:9)"
                    >
                      <Crop className="w-3 h-3 text-sky-400 group-hover:text-white" />
                      <span>Crop</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[slotIndex]?.click()}
                      className="py-1.5 px-1 rounded-xl bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow group"
                      title="Ganti Foto Poster"
                    >
                      <RefreshCw className="w-3 h-3 text-emerald-400 group-hover:text-white" />
                      <span>Ganti</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingPoster(slotPoster);
                        setMetaFormData({
                          linkUrl: slotPoster.linkUrl || '',
                        });
                      }}
                      className="py-1.5 px-1 rounded-xl bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow group"
                      title="Atur Link Tujuan Poster"
                    >
                      <LinkIcon className={`w-3 h-3 ${slotPoster.linkUrl ? 'text-sky-400' : 'text-slate-400'} group-hover:text-white`} />
                      <span>{slotPoster.linkUrl ? 'Link (Aktif)' : 'Link'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeletePoster(slotPoster.id, slotOrder)}
                      className="py-1.5 px-1 rounded-xl bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow group"
                      title="Hapus Poster Ini"
                    >
                      <Trash2 className="w-3 h-3 text-red-400 group-hover:text-white" />
                      <span>Hapus</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[slotIndex]?.click()}
                      disabled={isUploading}
                      className="w-full py-2 rounded-xl bg-slate-800/90 hover:bg-sky-600 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-slate-700/80 hover:border-sky-500 shadow"
                    >
                      <Upload className="w-3.5 h-3.5 text-sky-400" />
                      <span>Pilih Foto Slot {slotOrder}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── IMAGE CROPPER MODAL (INTEGRATED EXACTLY LIKE ARTICLES) ── */}
      <ImageCropperModal
        isOpen={cropperOpen}
        imageSrc={cropperImageSrc}
        aspectRatio={16 / 9}
        title="Sesuaikan & Crop Poster Utama (Rasio 16:9 Lanskap)"
        onCropComplete={handleCropComplete}
        onClose={() => {
          setCropperOpen(false);
          setCropperImageSrc(null);
          setCropperSlotOrder(null);
        }}
      />

      {/* ── MODAL: ATUR LINK TUJUAN POSTER ── */}
      {editingPoster && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-sky-400/40 max-w-md w-full space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg blue-gradient-bg text-white text-xs font-black flex items-center justify-center">
                  {editingPoster.order}
                </span>
                <h3 className="text-base font-black uppercase text-white">
                  Atur Link Poster Slot {editingPoster.order}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingPoster(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMetadata} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-sky-400" />
                  URL / Link Tujuan Poster
                </label>
                <input
                  type="text"
                  value={metaFormData.linkUrl}
                  onChange={(e) => setMetaFormData({ linkUrl: e.target.value })}
                  placeholder="Misal: /matches, /articles/judul-berita, atau https://instagram.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-hidden focus:border-sky-400 font-mono"
                  autoFocus
                />
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Ketika pengunjung beranda mengeklik poster ini, halaman akan langsung diarahkan ke URL tujuan di atas. Kosongkan jika poster tidak memerlukan link.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPoster(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs font-bold uppercase cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingMeta}
                  className="px-5 py-2 rounded-xl blue-gradient-bg text-white text-xs font-black uppercase tracking-wider shadow cursor-pointer disabled:opacity-50"
                >
                  {savingMeta ? 'Menyimpan...' : 'Simpan Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
