import React, { useState } from 'react';
import { Product } from '../../types';
import { formatRupiah } from '../../lib/utils';
import { PackageX, ShoppingBag, Star } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const isOutOfStock = product.stock <= 0;
  const mainImg = product.images?.[product.mainImageIndex || 0] || product.images?.[0];

  const rating = product.ratingAverage || 0;
  const ratingCount = product.ratingCount || 0;
  const salesCount = product.salesCount || 0;

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800/80 rounded-2xl overflow-hidden hover:border-neutral-900 dark:hover:border-neutral-400 transition-all duration-300 ease-out hover:scale-[1.03] hover:-translate-y-1 active:scale-98 flex flex-col h-full shadow-xs hover:shadow-xl"
    >
      {/* Lead Image Area */}
      <div className="relative aspect-4/3 w-full bg-neutral-100 dark:bg-neutral-950 overflow-hidden flex items-center justify-center">
        {mainImg && !imgError ? (
          <img
            src={mainImg}
            alt={product.name}
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out ${
              isOutOfStock ? 'grayscale opacity-60' : ''
            }`}
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-center text-neutral-400 dark:text-neutral-600">
            <ShoppingBag className="w-8 h-8 mb-1 stroke-1" />
            <span className="text-[11px] font-medium">{product.category}</span>
          </div>
        )}

        {/* Condition tag */}
        <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 bg-black/80 dark:bg-white/90 backdrop-blur-xs text-white dark:text-black text-[10px] font-bold rounded-lg tracking-wider uppercase shadow-xs">
          {product.condition}
        </div>

        {/* Rating Badge Overlay */}
        {rating > 0 && (
          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-black/80 dark:bg-black/90 text-amber-400 text-[10px] font-bold rounded-lg shadow-xs flex items-center gap-1 backdrop-blur-xs">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{rating.toFixed(1)}</span>
            {ratingCount > 0 && <span className="text-neutral-300 font-normal">({ratingCount})</span>}
          </div>
        )}

        {/* Out of stock overlay badge */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
            <div className="bg-neutral-900 text-white dark:bg-white dark:text-black px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide uppercase shadow-lg flex items-center gap-1.5 transform group-hover:scale-105 transition-transform duration-200">
              <PackageX className="w-3.5 h-3.5" />
              Stok Habis
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Metadata */}
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 mb-1.5">
            <span className="truncate max-w-[120px] font-medium">{product.sellerName}</span>
            <span aria-hidden="true">·</span>
            <span>{product.category}</span>
          </div>

          {/* Product Name */}
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white line-clamp-2 leading-snug group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
            {product.name}
          </h3>
        </div>

        {/* Price & Sales / Stock info */}
        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center justify-between">
          <p className="text-sm font-extrabold text-neutral-900 dark:text-white tabular-nums tracking-tight">
            {formatRupiah(product.price)}
          </p>

          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono text-right">
            {salesCount > 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Terjual {salesCount}</span>
            ) : isOutOfStock ? (
              'Habis'
            ) : (
              `Sisa ${product.stock}`
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
