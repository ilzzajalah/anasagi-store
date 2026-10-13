import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { updateProduct } from '../hooks/useProducts';
import { ImageUploader } from '../components/product/ImageUploader';
import { Product, ProductCategory, ProductCondition } from '../types';
import { formatRupiah } from '../lib/utils';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface EditProductPageProps {
  productId: string;
  navigate: (path: string) => void;
}

const CATEGORIES: ProductCategory[] = [
  'Fashion',
  'Elektronik',
  'Makanan & Minuman',
  'Kecantikan',
  'Rumah Tangga',
  'Hobi',
  'Digital',
  'Lainnya',
];

export function EditProductPage({ productId, navigate }: EditProductPageProps) {
  const { user } = useAuth();
  const [loadingProduct, setLoadingProduct] = useState(true);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceStr, setPriceStr] = useState('');
  const [stockStr, setStockStr] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Fashion');
  const [condition, setCondition] = useState<ProductCondition>('Baru');
  const [images, setImages] = useState<string[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchProduct() {
      try {
        const snap = await getDoc(doc(db, 'products', productId));
        if (snap.exists()) {
          const data = snap.data() as Product;
          if (data.sellerId !== user?.uid) {
            toast.error('Anda tidak berhak mengedit produk ini.');
            navigate('/my-products');
            return;
          }

          setName(data.name || '');
          setDescription(data.description || '');
          setPriceStr(String(data.price || ''));
          setStockStr(String(data.stock ?? '0'));
          setCategory(data.category || 'Fashion');
          setCondition(data.condition || 'Baru');
          setImages(data.images || []);
          setMainImageIndex(data.mainImageIndex || 0);
          setIsActive(data.isActive !== undefined ? data.isActive : true);
        } else {
          toast.error('Produk tidak ditemukan');
          navigate('/my-products');
        }
      } catch (err) {
        console.error('Error fetching product for edit:', err);
      } finally {
        setLoadingProduct(false);
      }
    }

    if (user) {
      fetchProduct();
    }
  }, [productId, user]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Nama produk wajib diisi.';
    else if (name.length > 100) errs.name = 'Nama produk maksimal 100 karakter.';

    if (!description.trim()) errs.description = 'Deskripsi wajib diisi.';
    else if (description.length > 2000) errs.description = 'Deskripsi maksimal 2000 karakter.';

    const priceNum = Number(priceStr);
    if (!priceStr || isNaN(priceNum) || priceNum <= 0) {
      errs.price = 'Harga harus angka positif lebih dari 0.';
    }

    const stockNum = Number(stockStr);
    if (stockStr === '' || isNaN(stockNum) || stockNum < 0) {
      errs.stock = 'Stok harus berupa angka bulat minimal 0.';
    }

    if (images.length === 0) {
      errs.images = 'Wajib mengunggah minimal 1 gambar produk.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await updateProduct(productId, {
        name: name.trim(),
        description: description.trim(),
        price: Number(priceStr),
        stock: Number(stockStr),
        category,
        condition,
        images,
        mainImageIndex,
        isActive,
      });

      toast.success('Produk berhasil diperbarui!');
      navigate(`/product/${productId}`);
    } catch (err: any) {
      console.error('Failed to update product:', err);
      toast.error('Gagal memperbarui produk.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingProduct) {
    return (
      <div className="max-w-3xl mx-auto py-12 space-y-4 animate-pulse">
        <div className="h-8 bg-neutral-200 dark:bg-neutral-800 w-40 rounded" />
        <div className="h-96 bg-neutral-100 dark:bg-neutral-900 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-16 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/my-products')}
          className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Edit Produk
          </h1>
          <p className="text-xs text-neutral-500">Perbarui rincian dan stok produk Anda.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-900/80 p-6 sm:p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-6 shadow-sm">
        
        {/* Product Images */}
        <div>
          <ImageUploader
            images={images}
            mainImageIndex={mainImageIndex}
            onChange={(imgs, idx) => {
              setImages(imgs);
              setMainImageIndex(idx);
              if (errors.images) setErrors((prev) => ({ ...prev, images: '' }));
            }}
          />
          {errors.images && <p className="text-xs text-rose-500 mt-1">{errors.images}</p>}
        </div>

        {/* Product Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            Nama Produk <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
            }}
            maxLength={100}
            className="w-full p-2.5 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white focus:outline-none"
          />
          <div className="flex justify-between text-[11px] text-neutral-500">
            {errors.name ? <span className="text-rose-500">{errors.name}</span> : <span />}
            <span>{name.length}/100</span>
          </div>
        </div>

        {/* Category & Condition */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              Kategori <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ProductCategory)}
              className="w-full p-2.5 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white focus:outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              Kondisi <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 dark:bg-neutral-950 rounded-xl text-xs">
              {(['Baru', 'Bekas'] as ProductCondition[]).map((cond) => (
                <button
                  type="button"
                  key={cond}
                  onClick={() => setCondition(cond)}
                  className={`py-2 rounded-lg font-medium transition-all ${
                    condition === cond
                      ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs font-bold'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {cond}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Price & Stock */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              Harga (Rp) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={priceStr}
              onChange={(e) => {
                setPriceStr(e.target.value);
                if (errors.price) setErrors((prev) => ({ ...prev, price: '' }));
              }}
              className="w-full p-2.5 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white focus:outline-none"
            />
            {priceStr && !isNaN(Number(priceStr)) && Number(priceStr) > 0 && (
              <p className="text-[11px] font-mono text-neutral-500">
                Format: {formatRupiah(Number(priceStr))}
              </p>
            )}
            {errors.price && <p className="text-xs text-rose-500">{errors.price}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              Jumlah Stok <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={stockStr}
              onChange={(e) => {
                setStockStr(e.target.value);
                if (errors.stock) setErrors((prev) => ({ ...prev, stock: '' }));
              }}
              min={0}
              className="w-full p-2.5 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white focus:outline-none"
            />
            {errors.stock && <p className="text-xs text-rose-500">{errors.stock}</p>}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            Deskripsi Produk <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
            }}
            rows={5}
            maxLength={2000}
            className="w-full p-2.5 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white focus:outline-none"
          />
          <div className="flex justify-between text-[11px] text-neutral-500">
            {errors.description ? <span className="text-rose-500">{errors.description}</span> : <span />}
            <span>{description.length}/2000</span>
          </div>
        </div>

        {/* Status Active toggle */}
        <div className="flex items-center justify-between p-3.5 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200/80 dark:border-neutral-800">
          <div>
            <p className="text-xs font-semibold text-neutral-900 dark:text-white">Status Produk</p>
            <p className="text-[11px] text-neutral-500">
              {isActive ? 'Produk aktif dan tampil di pencarian' : 'Produk disimpan sebagai draf/nonaktif'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              isActive ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-300 dark:bg-neutral-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white dark:bg-neutral-900 absolute top-0.5 transition-transform ${
                isActive ? 'translate-x-5.5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Submit */}
        <div className="pt-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/my-products')}
            className="px-5 py-2.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 text-xs font-bold text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan Perubahan...</span>
              </>
            ) : (
              <span>Simpan Perubahan</span>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
