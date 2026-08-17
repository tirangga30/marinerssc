'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Newspaper, Plus, Edit, Trash2, ArrowLeft, X, Save, Upload, Loader2, Calendar } from 'lucide-react';
import { formatDateForInput, WIB_TIMEZONE } from '@/lib/date';

interface Article {
  id: string;
  title: string;
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
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const getDefaultPublishedAt = () => {
    return formatDateForInput(new Date());
  };

  const [formData, setFormData] = useState<{
    title: string;
    category: string;
    photos: string[];
    content: string;
    publishedAt: string;
  }>({
    title: '',
    category: 'Kabar Tim',
    photos: ['', '', ''],
    content: '',
    publishedAt: getDefaultPublishedAt(),
  });

  const fetchArticles = async () => {
    try {
      const res = await fetch('/api/articles');
      const data = await res.json();
      setArticles(data);
    } catch {
      console.error('Gagal mengambil artikel');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const openAddModal = () => {
    setEditingArticle(null);
    setFormData({
      title: '',
      category: 'Kabar Tim',
      photos: ['', '', ''],
      content: '',
      publishedAt: getDefaultPublishedAt(),
    });
    setShowModal(true);
  };

  const openEditModal = (art: Article) => {
    setEditingArticle(art);
    let parsedPhotos: string[] = [];
    try {
      if (art.images) {
        const arr = JSON.parse(art.images);
        if (Array.isArray(arr)) parsedPhotos = arr;
      }
    } catch {
      parsedPhotos = [];
    }
    if (parsedPhotos.length === 0 && art.thumbnail) {
      parsedPhotos = [art.thumbnail];
    }
    while (parsedPhotos.length < 3) {
      parsedPhotos.push('');
    }

    setFormData({
      title: art.title,
      category: art.category,
      photos: parsedPhotos.slice(0, 3),
      content: art.content,
      publishedAt: formatDateForInput(art.publishedAt),
    });
    setShowModal(true);
  };

  // Direct Photo Upload Handler for Slot 0, 1, or 2
  const handleSlotUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIndex(index);
    const body = new FormData();
    body.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setFormData((prev) => {
          const updated = [...prev.photos];
          updated[index] = data.url;
          return { ...prev, photos: updated };
        });
      } else {
        alert(data.error || 'Gagal mengunggah foto');
      }
    } catch {
      alert('Terjadi kesalahan saat mengunggah foto');
    } finally {
      setUploadingIndex(null);
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
        thumbnail: validPhotos[0] || '/stadium_hero.png',
        images: validPhotos,
        content: formData.content,
        publishedAt: formData.publishedAt,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowModal(false);
        fetchArticles();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Gagal menyimpan artikel');
      }
    } catch {
      alert('Terjadi kesalahan');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase text-slate-300 hover:text-sky-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Dashboard Admin
        </Link>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl white-blue-btn font-extrabold uppercase text-xs flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-4 h-4 text-blue-600" /> Tulis Artikel Berita Baru
        </button>
      </div>

      <div className="glass-panel p-6 rounded-3xl border border-sky-400/30 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h1 className="text-xl font-black uppercase text-white blue-gradient-text">
            Manajemen Berita & Artikel Mariners SC ({articles.length})
          </h1>
        </div>

        {/* Articles Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-slate-900/90 text-sky-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Tanggal Terbit</th>
                <th className="p-3">Judul Artikel</th>
                <th className="p-3">Foto (Max 3)</th>
                <th className="p-3">Kategori</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {articles.map((art) => {
                let photosCount = 1;
                try {
                  if (art.images) {
                    const parsed = JSON.parse(art.images);
                    if (Array.isArray(parsed) && parsed.length > 0) photosCount = parsed.length;
                  }
                } catch {
                  photosCount = 1;
                }

                return (
                  <tr key={art.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-slate-300">
                      {new Date(art.publishedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: WIB_TIMEZONE })}
                    </td>
                    <td className="p-3 flex items-center gap-3">
                      <img src={art.thumbnail} alt={art.title} className="w-8 aspect-[4/5] rounded-lg object-cover border border-sky-400/30 shadow-sm" />
                      <span className="font-bold text-white">{art.title}</span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-sky-300 font-bold text-[10px] border border-slate-700">
                        {photosCount} Foto
                      </span>
                    </td>
                    <td className="p-3 font-bold text-sky-300">{art.category}</td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(art)}
                        className="p-1.5 rounded-lg bg-slate-800 text-sky-400 hover:bg-sky-400 hover:text-slate-950 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(art.id)}
                        className="p-1.5 rounded-lg bg-slate-800 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Article */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl glass-panel p-6 sm:p-8 rounded-3xl border border-sky-400/30 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black uppercase text-sky-400">
                {editingArticle ? 'Edit Artikel' : 'Tulis Artikel Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* MULTI-PHOTO UPLOAD SECTION (UP TO 3 PHOTOS - IG STYLE) */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-sky-300 uppercase block">
                    Foto Berita (Maksimal 3 Foto - Slide seperti IG)
                  </label>
                  <span className="text-[11px] text-slate-400 font-bold">
                    {formData.photos.filter(Boolean).length}/3 Ter-upload
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((idx) => {
                    const photoUrl = formData.photos[idx];
                    return (
                      <div key={idx} className="space-y-2">
                        <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center group">
                          {photoUrl ? (
                            <>
                              <img src={photoUrl} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removePhotoSlot(idx)}
                                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-red-600/80 text-white hover:bg-red-600 transition-colors shadow"
                                title="Hapus Foto"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                              {idx === 0 && (
                                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-sky-500 text-slate-950 font-black text-[8px] uppercase">
                                  Utama
                                </span>
                              )}
                            </>
                          ) : (
                            <div className="text-center p-2 space-y-1">
                              <Upload className="w-5 h-5 mx-auto text-slate-600" />
                              <span className="text-[10px] text-slate-500 font-bold block">Foto {idx + 1}</span>
                            </div>
                          )}
                        </div>

                        <label className="cursor-pointer block text-center px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-300 font-bold text-[10px] transition-colors">
                          {uploadingIndex === idx ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto text-sky-400" />
                          ) : photoUrl ? (
                            'Ganti Foto'
                          ) : (
                            `+ Foto ${idx + 1}`
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleSlotUpload(idx, e)}
                            disabled={uploadingIndex !== null}
                            className="hidden"
                          />
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* PUBLISHED DATE & TIME INPUT FIELD */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-200 uppercase block mb-1">Judul Artikel</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:border-sky-400 outline-none"
                    placeholder="Judul Berita Terbaru..."
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-200 uppercase block mb-1">Tanggal & Waktu Berita</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.publishedAt}
                    onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:border-sky-400 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-200 uppercase block mb-1">Kategori</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:border-sky-400 outline-none"
                >
                  <option value="Laporan Pertandingan">Laporan Pertandingan</option>
                  <option value="Kabar Tim">Kabar Tim</option>
                  <option value="Transfer">Transfer Pemain</option>
                  <option value="Klub">Informasi Klub</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-200 uppercase block mb-1">Isi Berita Lengkap (Format Markdown / Paragraf)</label>
                <textarea
                  rows={8}
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:border-sky-400 outline-none"
                  placeholder="### Subjudul Berita&#10;&#10;Isi paragraf berita..."
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold uppercase"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploadingIndex !== null}
                  className="px-6 py-2 rounded-xl white-blue-btn font-extrabold uppercase flex items-center gap-2 shadow"
                >
                  <Save className="w-4 h-4 text-blue-600" /> Terbitkan Artikel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
