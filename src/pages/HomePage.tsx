import React, { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { ProductCard } from '../components/product/ProductCard';
import { ProductCategory } from '../types';
import { Filter, Store, ArrowRight, ShieldCheck, MessageCircle, PackageCheck } from 'lucide-react';

interface HomePageProps {
  navigate: (path: string) => void;
}

const CATEGORIES: (ProductCategory | 'Semua')[] = [
  'Semua',
  'Fashion',
  'Elektronik',
  'Makanan & Minuman',
  'Kecantikan',
  'Rumah Tangga',
  'Hobi',
  'Digital',
  'Lainnya',
];

export function HomePage({ navigate }: HomePageProps) {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'Semua'>('Semua');
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  const { products, loading } = useProducts({
    category: selectedCategory === 'Semua' ? undefined : selectedCategory,
  });

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const visibleProducts = products.slice(0, page * itemsPerPage);

  return (
    <div className="space-y-12 pb-16">
      
      {/* Clean High-Contrast Hero Banner */}
      <section className="bg-neutral-900 text-white dark:bg-neutral-950 border border-neutral-800 rounded-2xl p-6 sm:p-10 lg:p-12 shadow-lg">
        <div className="max-w-3xl space-y-6">
          <p className="text-xs font-bold tracking-wider text-neutral-300 uppercase">
            Pasar Online Indonesia
          </p>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Jual & Beli Produk Pilihan Langsung dari Penjual
          </h1>

          <p className="text-sm sm:text-base text-neutral-200 leading-relaxed max-w-2xl font-normal">
            Cari barang berkualitas dengan harga terbaik atau buka toko Anda sendiri dalam beberapa langkah mudah. Komunikasi langsung dengan penjual lewat chat realtime.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => navigate('/search')}
              className="px-6 py-3.5 text-xs sm:text-sm font-bold text-neutral-900 bg-white hover:bg-neutral-100 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-md flex items-center gap-2"
            >
              <span>Jelajahi Produk</span>
              <ArrowRight className="w-4 h-4 text-neutral-900" />
            </button>

            {/* High-Contrast Secondary Button - Solid Colors */}
            <button
              onClick={() => navigate('/sell')}
              className="px-6 py-3.5 text-xs sm:text-sm font-bold text-white bg-neutral-800 hover:bg-neutral-700 border-2 border-neutral-400 hover:border-white rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2 shadow-sm"
            >
              <Store className="w-4 h-4 text-white" />
              <span>+ Pasang Iklan Gratis</span>
            </button>
          </div>

          {/* High Contrast Value Props */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-neutral-800 text-xs sm:text-sm text-neutral-200 font-medium">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-white shrink-0" />
              <span>Pesan Instan Realtime</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-white shrink-0" />
              <span>Penjual Terverifikasi</span>
            </div>
            <div className="flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-white shrink-0" />
              <span>Gratis Tanpa Komisi</span>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter Chips - Added Padding for Scroller Edge */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Kategori
          </h2>
          <button
            onClick={() => navigate('/search')}
            className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Lihat Semua Kategori →
          </button>
        </div>

        {/* Scrollable category chips with side padding to prevent flush edge */}
        <div className="flex items-center gap-2.5 overflow-x-auto py-2 px-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setPage(1);
                }}
                className={`px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all duration-200 hover:scale-105 active:scale-95 border shrink-0 ${
                  isSelected
                    ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white shadow-sm'
                    : 'bg-white text-neutral-800 border-neutral-300 hover:border-neutral-500 dark:bg-neutral-900 dark:text-neutral-200 dark:border-neutral-700'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Product Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
              {selectedCategory === 'Semua' ? 'Produk Terbaru' : `Kategori: ${selectedCategory}`}
            </h2>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
              {products.length === 0
                ? 'Belum ada produk'
                : `Menampilkan ${visibleProducts.length} dari ${products.length} produk`}
            </p>
          </div>

          <button
            onClick={() => navigate(`/search?category=${encodeURIComponent(selectedCategory)}`)}
            className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:underline flex items-center gap-1"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>
        </div>

        {loading ? (
          /* Skeleton Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-neutral-100 dark:bg-neutral-900/60 rounded-2xl p-4 space-y-3 animate-pulse border border-neutral-200 dark:border-neutral-800"
              >
                <div className="aspect-4/3 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
                <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
                <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : visibleProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => navigate(`/product/${product.id}`)}
              />
            ))}
          </div>
        ) : (
          /* Empty state for real users */
          <div className="py-16 text-center border-2 border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl p-8 bg-white dark:bg-neutral-900/40 space-y-3">
            <Store className="w-10 h-10 mx-auto text-neutral-400 dark:text-neutral-600" />
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Belum ada produk terdaftar
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
              Penjual belum mengunggah barang di kategori ini. Pasang iklan barang Anda sekarang.
            </p>
            <button
              onClick={() => navigate('/sell')}
              className="mt-2 px-5 py-2.5 text-xs font-bold text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md inline-flex items-center gap-2"
            >
              <Store className="w-4 h-4" />
              <span>+ Pasang Iklan Sekarang</span>
            </button>
          </div>
        )}

        {/* Load more button */}
        {page < totalPages && (
          <div className="text-center pt-8">
            <button
              onClick={() => setPage((prev) => prev + 1)}
              className="px-6 py-2.5 text-xs font-bold text-neutral-900 dark:text-white bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-white rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-xs"
            >
              Muat Produk Lainnya
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
