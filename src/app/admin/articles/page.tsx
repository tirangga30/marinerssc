'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  X,
  Upload,
  Calendar,
  Layers,
  FileText,
  Loader2,
  Crop,
  RefreshCw,
} from 'lucide-react';
import ImageCropperModal from '@/components/ImageCropperModal';
import { WIB_TIMEZONE } from '@/lib/date';

interface Article {
  id: string;
  title: string;
  slug?: string;
  category: string;
  thumbnail: string;
  images?: string | null;
  content: string;
  publishedAt: string;
}

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  // 5 photo slots
  const [formData, setFormData] = useState({
    title: '',
    category: 'Kabar Tim',
    photos: ['', '', '', '', ''] as string[],
    content: '',
    publishedAt: '',
  });

  // Cropper Modal state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState<string | null>(null);
  const [cropperSlotIndex, setCropperSlotIndex] = useState<number | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const res = await fetch('/api/articles');
      if (res.ok) {
        const data = await res.json();
        setArticles(data);
      }
    } catch {
      console.error('Gagal mengambil data artikel');
    } finally {
      setLoading(false);
    }
  };

  const getArticlePhotos = (art: Article): string[] => {
    if (art.images) {
      try {
        const parsed = JSON.parse(art.images);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    if (art.thumbnail) {
      return art.thumbnail.split('|||').filter(Boolean);
    }
    return ['/LOGIN.jpeg'];
  };

  const getMainThumbnail = (thumbnail: string): string => {
    if (!thumbnail) return '/LOGIN.jpeg';
    return thumbnail.split('|||')[0] || '/LOGIN.jpeg';
  };

  const formatDateForInput = (dateStr: string) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
  };

  const openAddModal = () => {
    setEditingArticle(null);
    setFormData({
      title: '',
      category: 'Kabar Tim',
      photos: ['', '', '', '', ''],
      content: '',
      publishedAt: new Date().toISOString().slice(0, 10),
    });
    setShowModal(true);
  };

  const openEditModal = (art: Article) => {
    setEditingArticle(art);
    const existingPhotos = getArticlePhotos(art);
    const paddedPhotos = ['', '', '', '', ''];
    for (let i = 0; i < 5; i++) {
      paddedPhotos[i] = existingPhotos[i] || '';
    }

    setFormData({
      title: art.title,
      category: art.category,
      photos: paddedPhotos,
      content: art.content,
      publishedAt: formatDateForInput(art.publishedAt),
    });
    setShowModal(true);
  };

  // Trigger file selection for slot
  const handleSelectFileForCrop = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCropperImageSrc(event.target.result as string);
        setCropperSlotIndex(index);
        setCropperOpen(true);
      }
    };
    reader.readAsDataURL(file);

    // Reset input so re-selecting same file triggers change
    e.target.value = '';
  };

  // Re-crop an existing uploaded photo
  const handleOpenCropperForExisting = async (index: number) => {
    const existingUrl = formData.photos[index];
    if (!existingUrl) return;

    try {
      const res = await fetch(existingUrl);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCropperImageSrc(event.target.result as string);
          setCropperSlotIndex(index);
          setCropperOpen(true);
        }
      };
      reader.readAsDataURL(blob);
    } catch {
      setCropperImageSrc(existingUrl);
      setCropperSlotIndex(index);
      setCropperOpen(true);
    }
  };

  // After crop is confirmed in modal -> Upload to /api/upload?folder=articles
  const handleCropComplete = async (croppedBlob: Blob) => {
    if (cropperSlotIndex === null) return;
    const targetIndex = cropperSlotIndex;

    setUploadingIndex(targetIndex);
    const body = new FormData();
    const articleSlug = formData.title
      ? formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : (editingArticle?.slug || `article-${Date.now()}`);

    body.append('file', croppedBlob, `foto_${targetIndex + 1}.jpg`);
    body.append('folder', 'articles');
    body.append('articleSlug', articleSlug);
    body.append('slotIndex', targetIndex.toString());

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setFormData((prev) => {
          const updated = [...prev.photos];
          updated[targetIndex] = data.url;
          return { ...prev, photos: updated };
        });
      } else {
        alert(data.error || 'Gagal mengunggah foto');
      }
    } catch {
      alert('Terjadi kesalahan saat mengunggah foto');
    } finally {
      setUploadingIndex(null);
      setCropperSlotIndex(null);
      setCropperImageSrc(null);
    }
  };

  const removePhotoSlot = (index: number) => {
    setFormData((prev) => {
      const updated = [...prev.photos];
      updated[index] = '';
      return { ...prev, photos: updated };
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus artikel ini?')) return;
    try {
      await fetch(`/api/articles/${id}`, { method: 'DELETE' });
      fetchArticles();
    } catch {
      alert('Gagal menghapus artikel');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingArticle ? `/api/articles/${editingArticle.id}` : '/api/articles';
      const method = editingArticle ? 'PUT' : 'POST';

      const validPhotos = formData.photos.filter(Boolean);
      const payload = {
        title: formData.title,
        category: formData.category,
        thumbnail: validPhotos[0] || '/LOGIN.jpeg',
        images: validPhotos,
        content: formData.content,
        publishedAt: formData.publishedAt,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Gagal menyimpan artikel');
        return;
      }

      setShowModal(false);
      fetchArticles();
    } catch {
      alert('Terjadi kesalahan');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-10 space-y-4 sm:space-y-8">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-slate-300 hover:text-sky-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Dashboard Admin</span><span className="sm:hidden">Dashboard</span>
        </Link>
        <button
          onClick={openAddModal}
          className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl white-blue-btn font-extrabold uppercase text-[11px] sm:text-xs flex items-center gap-1.5 shadow-lg cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-blue-600" /> Tulis Artikel
        </button>
      </div>

      <div className="glass-panel p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-sky-400/30 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 sm:pb-4">
          <h1 className="text-base sm:text-xl font-black uppercase text-white blue-gradient-text">
            Manajemen Berita & Artikel ({articles.length})
          </h1>
        </div>

        {/* ── MOBILE ARTICLES CARDS (Block on mobile, hidden on tablet/desktop) ── */}
        <div className="block md:hidden space-y-2.5">
          {articles.length === 0 && !loading ? (
            <p className="text-xs text-slate-500 py-6 text-center">Belum ada artikel berita terdaftar.</p>
          ) : (
            articles.map((art) => {
              const photos = getArticlePhotos(art);
              const mainThumb = getMainThumbnail(art.thumbnail);

              return (
                <div
                  key={art.id}
                  className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3 shadow-md"
                >
                  {/* Thumbnail 4:5 */}
                  <div className="relative w-12 aspect-[4/5] rounded-xl overflow-hidden bg-slate-950 border border-sky-400/30 shrink-0 shadow">
                    <img src={mainThumb} alt={art.title} className="w-full h-full object-cover" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-sky-500/10 text-sky-400 border border-sky-400/20">
                        {art.category}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(art.publishedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', timeZone: WIB_TIMEZONE })}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug">{art.title}</h3>
                    <p className="text-[10px] text-slate-400 font-semibold">{photos.length} Foto</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(art)}
                      className="p-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 transition-colors cursor-pointer"
                      title="Edit Artikel"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(art.id)}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                      title="Hapus Artikel"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── DESKTOP ARTICLES TABLE (Hidden on mobile) ── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-slate-900/90 text-sky-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Tanggal Terbit</th>
                <th className="p-3">Judul Artikel</th>
                <th className="p-3">Foto (Maks 5)</th>
                <th className="p-3">Kategori</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {articles.map((art) => {
                const photos = getArticlePhotos(art);
                const mainThumb = getMainThumbnail(art.thumbnail);

                return (
                  <tr key={art.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-slate-300">
                      {new Date(art.publishedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: WIB_TIMEZONE })}
                    </td>
                    <td className="p-3 flex items-center gap-3">
                      <img src={mainThumb} alt={art.title} className="w-8 aspect-[4/5] rounded-lg object-cover border border-sky-400/30 shadow-sm" />
                      <span className="font-bold text-white">{art.title}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        {photos.slice(0, 5).map((p, idx) => (
                          <img key={idx} src={p} alt={`p-${idx}`} className="w-6 h-7 rounded object-cover border border-slate-700 shadow-xs" />
                        ))}
                        <span className="text-[10px] text-slate-400 font-bold ml-1">
                          ({photos.length} Foto)
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-sky-500/10 text-sky-400 border border-sky-400/20">
                        {art.category}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(art)}
                        className="p-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 transition-colors cursor-pointer"
                        title="Edit Artikel"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(art.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                        title="Hapus Artikel"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {articles.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Belum ada artikel berita yang dibuat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORM (ADD / EDIT) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-3xl glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-sky-400/30 space-y-4 sm:space-y-6 shadow-2xl my-4 sm:my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 sm:pb-4">
              <h2 className="text-base sm:text-lg font-black uppercase text-white tracking-wide">
                {editingArticle ? 'Edit Berita / Artikel' : 'Tulis Berita / Artikel Baru'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div className="space-y-1.5 sm:space-y-2">
                <label className="font-bold text-sky-300 uppercase text-xs flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" /> Judul Berita
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kemenangan Dramatis di Laga Pamungkas"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-sky-400 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="font-bold text-sky-300 uppercase text-xs flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" /> Kategori Berita
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-sky-400 transition-colors"
                  >
                    <option value="Kabar Tim">Kabar Tim</option>
                    <option value="Hasil Pertandingan">Hasil Pertandingan</option>
                    <option value="Wawancara">Wawancara</option>
                    <option value="Transfer">Transfer</option>
                    <option value="Akademi">Akademi</option>
                  </select>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label className="font-bold text-sky-300 uppercase text-xs flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" /> Tanggal Terbit
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.publishedAt}
                    onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-sky-400 transition-colors"
                  />
                </div>
              </div>

              {/* 5 PHOTO SLOTS WITH INTEGRATED CROPPER */}
              <div className="space-y-3 p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-bold text-sky-300 uppercase block text-xs">
                      Foto Berita (Maks 5 Foto - Rasio 4:5)
                    </label>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Setiap foto dapat dipotong (crop 4:5) sebelum diunggah.
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-sky-400 font-bold">
                    {formData.photos.filter(Boolean).length}/5
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
                  {[0, 1, 2, 3, 4].map((idx) => {
                    const photoUrl = formData.photos[idx];
                    return (
                      <div key={idx} className="space-y-1.5 flex flex-col">
                        {/* Photo Box */}
                        <div
                          onClick={() => {
                            if (!photoUrl && uploadingIndex === null) {
                              fileInputRefs.current[idx]?.click();
                            }
                          }}
                          className={`relative aspect-[4/5] rounded-xl overflow-hidden bg-slate-950 border ${
                            photoUrl ? 'border-sky-500/40' : 'border-dashed border-slate-700 hover:border-sky-400/60 cursor-pointer'
                          } flex items-center justify-center transition-all group`}
                        >
                          {uploadingIndex === idx ? (
                            <div className="text-center p-2 space-y-1.5">
                              <Loader2 className="w-6 h-6 animate-spin mx-auto text-sky-400" />
                              <span className="text-[9px] text-sky-300 font-bold block">Mengunggah...</span>
                            </div>
                          ) : photoUrl ? (
                            <>
                              <img src={photoUrl} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                              
                              {/* Hover quick overlay */}
                              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenCropperForExisting(idx);
                                  }}
                                  className="p-1.5 rounded-lg bg-sky-600 text-white hover:bg-sky-500 transition-colors shadow cursor-pointer"
                                  title="Crop Ulang"
                                >
                                  <Crop className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    fileInputRefs.current[idx]?.click();
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors shadow cursor-pointer"
                                  title="Ganti Foto"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removePhotoSlot(idx);
                                  }}
                                  className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors shadow cursor-pointer"
                                  title="Hapus"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {idx === 0 && (
                                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-sky-500 text-slate-950 font-black text-[8px] uppercase tracking-wide pointer-events-none">
                                  Utama
                                </span>
                              )}
                            </>
                          ) : (
                            <div className="text-center p-2 space-y-1">
                              <Upload className="w-5 h-5 mx-auto text-slate-500 group-hover:text-sky-400 transition-colors" />
                              <span className="text-[10px] text-slate-400 font-bold block group-hover:text-white transition-colors">
                                {idx === 0 ? '+ Foto 1 (Utama)' : `+ Foto ${idx + 1}`}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Explicit Action Buttons Under Box */}
                        {photoUrl ? (
                          <div className="grid grid-cols-3 gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenCropperForExisting(idx)}
                              className="py-1 rounded bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white text-[9px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-0.5"
                              title="Crop Ulang"
                            >
                              <Crop className="w-2.5 h-2.5" /> Crop
                            </button>
                            <button
                              type="button"
                              onClick={() => fileInputRefs.current[idx]?.click()}
                              className="py-1 rounded bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white text-[9px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-0.5"
                              title="Ganti Foto"
                            >
                              <RefreshCw className="w-2.5 h-2.5" /> Ganti
                            </button>
                            <button
                              type="button"
                              onClick={() => removePhotoSlot(idx)}
                              className="py-1 rounded bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white text-[9px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-0.5"
                              title="Hapus Foto"
                            >
                              <Trash2 className="w-2.5 h-2.5" /> Hapus
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRefs.current[idx]?.click()}
                            disabled={uploadingIndex !== null}
                            className="w-full py-1 rounded bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white text-[10px] font-bold transition-colors cursor-pointer block text-center"
                          >
                            Pilih Foto
                          </button>
                        )}

                        {/* Hidden input for this slot */}
                        <input
                          ref={(el) => {
                            fileInputRefs.current[idx] = el;
                          }}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleSelectFileForCrop(idx, e)}
                          disabled={uploadingIndex !== null}
                          className="hidden"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-sky-300 uppercase text-xs">
                  Isi Konten Berita
                </label>
                <textarea
                  rows={8}
                  required
                  placeholder="Tuliskan isi berita lengkap di sini..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-sky-400 transition-colors leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl glass-panel text-slate-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploadingIndex !== null}
                  className="px-6 py-2.5 rounded-xl white-blue-btn font-extrabold uppercase text-xs shadow-lg transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {editingArticle ? 'Perbarui Artikel' : 'Terbitkan Artikel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMAGE CROPPER MODAL */}
      <ImageCropperModal
        isOpen={cropperOpen}
        imageSrc={cropperImageSrc}
        aspectRatio={4 / 5}
        title={`Sesuaikan & Crop Foto ${cropperSlotIndex !== null ? cropperSlotIndex + 1 : ''} (Rasio 4:5)`}
        onCropComplete={handleCropComplete}
        onClose={() => {
          setCropperOpen(false);
          setCropperImageSrc(null);
          setCropperSlotIndex(null);
        }}
      />
    </div>
  );
}
