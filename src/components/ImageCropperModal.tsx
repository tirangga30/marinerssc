'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Check, Move, Crop } from 'lucide-react';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  aspectRatio?: number; // width / height, default 4/5 = 0.8
  title?: string;
  onCropComplete: (croppedBlob: Blob, previewUrl: string) => void;
  onClose: () => void;
}

export default function ImageCropperModal({
  isOpen,
  imageSrc,
  aspectRatio = 4 / 5,
  title = 'Sesuaikan & Crop Foto (Rasio 4:5)',
  onCropComplete,
  onClose,
}: ImageCropperModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  // Load image whenever imageSrc changes
  useEffect(() => {
    if (!imageSrc || !isOpen) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImgElement(img);
      // Reset position and calculate initial scale to cover the 4:5 box
      setPosition({ x: 0, y: 0 });
      setScale(1);
    };
    img.src = imageSrc;
  }, [imageSrc, isOpen]);

  // Handle Drag / Pan with mouse & touch
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Reset to center and base scale
  const handleReset = () => {
    setPosition({ x: 0, y: 0 });
    setScale(1);
  };

  // Perform Final Crop
  const handleConfirmCrop = async () => {
    if (!imgElement || !containerRef.current) return;
    setIsProcessing(true);

    try {
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      // High-resolution output canvas (1080 x 1350 px for 4:5 ratio)
      const targetWidth = 1080;
      const targetHeight = Math.round(targetWidth / aspectRatio); // 1350

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context tidak tersedia');
      }

      // Smooth image rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Base dimensions of the image displayed in container
      const imgAspect = imgElement.naturalWidth / imgElement.naturalHeight;
      const containerAspect = containerWidth / containerHeight;

      let baseRenderWidth = 0;
      let baseRenderHeight = 0;

      if (imgAspect > containerAspect) {
        // Image is wider: fit height first
        baseRenderHeight = containerHeight;
        baseRenderWidth = containerHeight * imgAspect;
      } else {
        // Image is taller: fit width first
        baseRenderWidth = containerWidth;
        baseRenderHeight = containerWidth / imgAspect;
      }

      // Actual render width & height inside container given current scale
      const currentRenderWidth = baseRenderWidth * scale;
      const currentRenderHeight = baseRenderHeight * scale;

      // Position of image center relative to container center
      const centerX = containerWidth / 2 + position.x;
      const centerY = containerHeight / 2 + position.y;

      const imgLeftInContainer = centerX - currentRenderWidth / 2;
      const imgTopInContainer = centerY - currentRenderHeight / 2;

      // Map container coordinates to output canvas coordinates
      const scaleMultiplier = targetWidth / containerWidth;

      const destX = imgLeftInContainer * scaleMultiplier;
      const destY = imgTopInContainer * scaleMultiplier;
      const destW = currentRenderWidth * scaleMultiplier;
      const destH = currentRenderHeight * scaleMultiplier;

      // Fill background dark slate just in case
      ctx.fillStyle = '#060b14';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // Draw the image onto canvas
      ctx.drawImage(imgElement, destX, destY, destW, destH);

      // Convert to high-quality JPEG Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const previewUrl = URL.createObjectURL(blob);
            onCropComplete(blob, previewUrl);
            onClose();
          }
          setIsProcessing(false);
        },
        'image/jpeg',
        0.92
      );
    } catch (err) {
      console.error('Gagal melakukan crop foto:', err);
      alert('Terjadi kesalahan saat memotong foto');
      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-md glass-panel p-5 sm:p-6 rounded-3xl border border-sky-400/30 space-y-4 shadow-2xl my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Crop className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm sm:text-base font-black uppercase text-white tracking-wide">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cropper Frame (Strict 4:5 Aspect Ratio) */}
        <div className="flex flex-col items-center">
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative w-64 sm:w-72 aspect-[4/5] rounded-2xl overflow-hidden bg-slate-950 border-2 border-sky-400/50 shadow-2xl cursor-grab active:cursor-grabbing select-none"
          >
            {imgElement && (
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px)`,
                }}
              >
                <img
                  src={imageSrc}
                  alt="Crop preview"
                  draggable={false}
                  className="max-w-none transition-none"
                  style={{
                    width:
                      imgElement.naturalWidth / imgElement.naturalHeight > 4 / 5
                        ? 'auto'
                        : '100%',
                    height:
                      imgElement.naturalWidth / imgElement.naturalHeight > 4 / 5
                        ? '100%'
                        : 'auto',
                    transform: `scale(${scale})`,
                    transformOrigin: 'center center',
                  }}
                />
              </div>
            )}

            {/* 3x3 Rule-of-Thirds Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/20">
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-white/20" />
              <div className="border-r border-white/20" />
              <div />
            </div>

            {/* Instruction Badge */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-xs text-[10px] text-slate-300 font-medium flex items-center gap-1 pointer-events-none shadow">
              <Move className="w-3 h-3 text-sky-400" />
              Geser foto untuk memposisikan
            </div>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="space-y-2 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
            <span className="flex items-center gap-1.5 text-sky-400">
              <ZoomIn className="w-3.5 h-3.5" />
              Zoom ({Math.round(scale * 100)}%)
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 font-normal transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reset Posisi
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setScale((prev) => Math.max(1, +(prev - 0.1).toFixed(2)))}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
              title="Perkecil"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <input
              type="range"
              min="1"
              max="3"
              step="0.02"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-full accent-sky-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setScale((prev) => Math.min(3, +(prev + 0.1).toFixed(2)))}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
              title="Perbesar"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl glass-panel text-slate-300 hover:text-white font-bold text-xs transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirmCrop}
            disabled={isProcessing}
            className="px-5 py-2 rounded-xl white-blue-btn font-black uppercase text-xs flex items-center gap-1.5 shadow-lg"
          >
            <Check className="w-4 h-4 text-blue-600" />
            {isProcessing ? 'Memproses...' : 'Terapkan & Unggah'}
          </button>
        </div>

      </div>
    </div>
  );
}
