import React from 'react';
import { Star } from 'lucide-react';

interface ProductRatingStarsProps {
  rating: number; // 0 to 5
  maxStars?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (newRating: number) => void;
  showScore?: boolean;
  reviewCount?: number;
}

export function ProductRatingStars({
  rating,
  maxStars = 5,
  size = 'sm',
  interactive = false,
  onRatingChange,
  showScore = false,
  reviewCount,
}: ProductRatingStarsProps) {
  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  const textSizes = {
    xs: 'text-[10px]',
    sm: 'text-xs',
    md: 'text-sm font-bold',
    lg: 'text-lg font-black',
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxStars }).map((_, idx) => {
          const starValue = idx + 1;
          const isFilled = starValue <= Math.round(rating);

          return (
            <button
              key={idx}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onRatingChange && onRatingChange(starValue)}
              className={`${interactive ? 'cursor-pointer hover:scale-125 transition-transform' : 'cursor-default'}`}
              title={`${starValue} Bintang`}
            >
              <Star
                className={`${iconSizes[size]} ${
                  isFilled
                    ? 'fill-amber-400 text-amber-400 drop-shadow-2xs'
                    : 'fill-neutral-200 text-neutral-300 dark:fill-neutral-800 dark:text-neutral-700'
                }`}
              />
            </button>
          );
        })}
      </div>

      {showScore && (
        <div className={`flex items-center gap-1 text-neutral-800 dark:text-neutral-200 ${textSizes[size]}`}>
          <span>{rating > 0 ? rating.toFixed(1) : 'Belum ada ulasan'}</span>
          {reviewCount !== undefined && reviewCount > 0 && (
            <span className="text-neutral-400 font-normal">({reviewCount})</span>
          )}
        </div>
      )}
    </div>
  );
}
