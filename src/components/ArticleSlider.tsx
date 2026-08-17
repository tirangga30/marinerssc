'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

interface ArticleSliderProps {
  images: string[];
  altTitle?: string;
}

export default function ArticleSlider({ images, altTitle = 'Foto Berita' }: ArticleSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const cleanImages = Array.isArray(images) && images.length > 0 ? images.filter(Boolean) : [];

  if (cleanImages.length === 0) {
    return (
      <div className="relative aspect-[4/5] max-w-lg mx-auto w-full rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-slate-900 flex items-center justify-center text-slate-500">
        <ImageIcon className="w-12 h-12" />
      </div>
    );
  }

  const prevSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? cleanImages.length - 1 : prev - 1));
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === cleanImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative aspect-[4/5] max-w-lg mx-auto w-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900 group select-none">
      {/* Slides Container */}
      <div
        className="w-full h-full flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {cleanImages.map((src, idx) => (
          <div key={idx} className="w-full h-full shrink-0 relative bg-slate-950">
            <img
              src={src}
              alt={`${altTitle} - ${idx + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Counter Badge (Top-Right, IG style: 1/3) */}
      {cleanImages.length > 1 && (
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/20 text-white font-mono text-[11px] font-bold z-20 shadow-md">
          {currentIndex + 1}/{cleanImages.length}
        </div>
      )}

      {/* Left Navigation Arrow */}
      {cleanImages.length > 1 && (
        <button
          onClick={prevSlide}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/70 hover:bg-slate-950/90 text-white border border-white/20 flex items-center justify-center transition-all opacity-80 hover:opacity-100 z-20 shadow-lg"
          aria-label="Foto Sebelumnya"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* Right Navigation Arrow */}
      {cleanImages.length > 1 && (
        <button
          onClick={nextSlide}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/70 hover:bg-slate-950/90 text-white border border-white/20 flex items-center justify-center transition-all opacity-80 hover:opacity-100 z-20 shadow-lg"
          aria-label="Foto Selanjutnya"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Bottom Dot Indicators (IG style) */}
      {cleanImages.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 px-2 py-1 rounded-full bg-slate-950/60 backdrop-blur-xs">
          {cleanImages.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`h-1.5 rounded-full transition-all ${
                currentIndex === idx ? 'w-4 bg-sky-400' : 'w-1.5 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
