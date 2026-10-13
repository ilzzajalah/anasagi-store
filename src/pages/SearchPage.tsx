import React, { useState, useEffect } from 'react';
import { useProducts } from '../hooks/useProducts';
import { ProductCard } from '../components/product/ProductCard';
import { ProductCategory, ProductCondition } from '../types';
import { Search, Filter, X, ArrowUpDown, SlidersHorizontal, PackageX } from 'lucide-react';

interface SearchPageProps {
  navigate: (path: string) => void;
  searchParams: URLSearchParams;
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

export function SearchPage({ navigate, searchParams }: SearchPageProps) {
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'Semua';

  const [queryInput, setQueryInput] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [category, setCategory] = useState<string>(initialCategory);
  const [condition, setCondition] = useState<string>('Semua');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Debounce query 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(queryInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [queryInput]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set('q', debouncedQuery);
    if (category && category !== 'Semua') params.set('category', category);
    if (condition && condition !== 'Semua') params.set('condition', condition);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (sortBy !== 'newest') params.set('sortBy', sortBy);

    const newUrl = `/search${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [debouncedQuery, category, condition, minPrice, maxPrice, sortBy]);

  const { products, loading } = useProducts({
    query: debouncedQuery,
    category: category === 'Semua' ? undefined : category,
    condition: condition === 'Semua' ? undefined : condition,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    sortBy,
  });

  const resetFilters = () => {
    setQueryInput('');
    setDebouncedQuery('');
    setCategory('Semua');
    setCondition('Semua');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header & Search Bar */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
          Pencarian Produk
        </h1>

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Cari berdasarkan nama, deskripsi, atau penjual..."
              className="w-full pl-10 pr-10 py-2.5 text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white transition-all shadow-xs"
            />
            {queryInput && (
              <button
                onClick={() => setQueryInput('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowMobileFilter(!showMobileFilter)}
            className="lg:hidden p-2.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-xl text-neutral-800 dark:text-neutral-200 flex items-center gap-2 text-xs font-semibold"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Desktop Sidebar Filters */}
        <aside
          className={`lg:col-span-3 space-y-6 bg-white dark:bg-neutral-900/60 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 ${
            showMobileFilter ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter Produk
            </h2>
            <button
              onClick={resetFilters}
              className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white font-medium transition-colors"
            >
              Reset All
            </button>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              Kategori
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white focus:outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Condition Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              Kondisi
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-950 rounded-lg text-xs">
              {['Semua', 'Baru', 'Bekas'].map((cond) => (
                <button
                  key={cond}
                  onClick={() => setCondition(cond)}
                  className={`py-1.5 rounded-md font-medium transition-colors ${
                    condition === cond
                      ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  {cond}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              Rentang Harga (Rp)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min"
                className="w-full p-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white focus:outline-none"
              />
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Maks"
                className="w-full p-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Sort By */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              Urutkan
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full p-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white focus:outline-none"
            >
              <option value="newest">Terbaru</option>
              <option value="price_asc">Harga Termurah</option>
              <option value="price_desc">Harga Termahal</option>
            </select>
          </div>
        </aside>

        {/* Results Grid */}
        <main className="lg:col-span-9 space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>
              Menampilkan <strong className="text-neutral-900 dark:text-white">{products.length}</strong> produk
            </span>

            {/* Selected active tags indicator */}
            {(debouncedQuery || category !== 'Semua' || condition !== 'Semua' || minPrice || maxPrice) && (
              <button
                onClick={resetFilters}
                className="text-xs text-neutral-900 dark:text-white font-medium hover:underline flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                Hapus Filter
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-neutral-100 dark:bg-neutral-900/60 rounded-xl p-4 space-y-3 animate-pulse border border-neutral-200 dark:border-neutral-800"
                >
                  <div className="aspect-4/3 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => navigate(`/product/${product.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl p-8">
              <PackageX className="w-12 h-12 mx-auto text-neutral-400 dark:text-neutral-600 mb-3" />
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Produk tidak ditemukan
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
                Coba ubah kata kunci pencarian Anda atau reset filter yang sedang aktif.
              </p>
              <button
                onClick={resetFilters}
                className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-lg"
              >
                Reset Semua Filter
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
