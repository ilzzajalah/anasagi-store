import React, { useRef, useState } from 'react';
import { Upload, X, Star, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { compressAndResizeImage } from '../../lib/utils';

interface ImageUploaderProps {
  images: string[];
  mainImageIndex: number;
  onChange: (images: string[], mainIndex: number) => void;
}

export function ImageUploader({ images, mainImageIndex, onChange }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMessage(null);

    if (images.length + files.length > 5) {
      setErrorMessage('Maksimal 5 gambar per produk.');
      return;
    }

    setCompressing(true);
    const newImages: string[] = [...images];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
          setErrorMessage('Format gambar harus JPG, PNG, atau WebP.');
          continue;
        }

        // Check size (2MB max)
        if (file.size > 2 * 1024 * 1024) {
          // Will compress client side
        }

        const compressedBase64 = await compressAndResizeImage(file, 1200, 1200, 0.8);
        newImages.push(compressedBase64);
      }

      onChange(newImages, mainImageIndex >= newImages.length ? 0 : mainImageIndex);
    } catch (err) {
      console.error('Error processing image:', err);
      setErrorMessage('Gagal memproses gambar. Coba lagi.');
    } finally {
      setCompressing(false);
    }
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    let newMain = mainImageIndex;
    if (index === mainImageIndex) {
      newMain = 0;
    } else if (index < mainImageIndex) {
      newMain = mainImageIndex - 1;
    }
    onChange(updated, updated.length > 0 ? Math.min(newMain, updated.length - 1) : 0);
  };

  const setMainImage = (index: number) => {
    onChange(images, index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
          Gambar Produk ({images.length}/5) <span className="text-rose-500">*</span>
        </label>
        <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
          Pilih 1 gambar utama
        </span>
      </div>

      {/* Drag and Drop Zone */}
      {images.length < 5 && (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-white rounded-xl p-6 text-center cursor-pointer transition-colors bg-neutral-50 dark:bg-neutral-900/40"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileSelect(e.target.files)}
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />
          <Upload className="w-8 h-8 mx-auto text-neutral-400 dark:text-neutral-500 mb-2" />
          <p className="text-xs font-medium text-neutral-900 dark:text-white">
            {compressing ? 'Memproses gambar...' : 'Klik atau drag gambar ke sini'}
          </p>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
            Format JPG, PNG, WebP. Maks 2 MB per file.
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-lg text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Image Thumbnails */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          {images.map((img, idx) => {
            const isMain = idx === mainImageIndex;
            return (
              <div
                key={idx}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all group bg-neutral-100 dark:bg-neutral-900 ${
                  isMain
                    ? 'border-neutral-900 dark:border-white ring-2 ring-neutral-900/20 dark:ring-white/20'
                    : 'border-neutral-200 dark:border-neutral-800'
                }`}
              >
                <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />

                {/* Set main badge / button */}
                <button
                  type="button"
                  onClick={() => setMainImage(idx)}
                  className={`absolute top-1.5 left-1.5 px-2 py-0.5 text-[10px] font-bold rounded-md flex items-center gap-1 transition-all ${
                    isMain
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-black'
                  }`}
                >
                  <Star className={`w-3 h-3 ${isMain ? 'fill-current' : ''}`} />
                  {isMain ? 'Utama' : 'Jadikan Utama'}
                </button>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1.5 right-1.5 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-full transition-colors"
                  title="Hapus gambar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
