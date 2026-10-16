import React, { useState } from 'react';
import { Product, UserProfile } from '../../types';
import { useReviews, addReview, addSellerReply, computeRatingBreakdown } from '../../hooks/useReviews';
import { ProductRatingStars } from './ProductRatingStars';
import { timeAgo } from '../../lib/utils';
import {
  MessageSquare,
  Send,
  Star,
  CheckCircle2,
  Paperclip,
  X,
  CornerDownRight,
  Loader2,
  ThumbsUp,
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface ProductReviewsSectionProps {
  product: Product;
  currentUser: UserProfile | null;
  navigate: (path: string) => void;
}

export function ProductReviewsSection({ product, currentUser, navigate }: ProductReviewsSectionProps) {
  const { reviews, loading } = useReviews(product.id);
  const ratingBreakdown = computeRatingBreakdown(reviews);

  // Write Review State
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);
  const [commentText, setCommentText] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Seller Reply State
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Star Filter
  const [starFilter, setStarFilter] = useState<number | 'all'>('all');

  const filteredReviews = reviews.filter((r) => {
    if (starFilter === 'all') return true;
    return Math.round(r.rating) === starFilter;
  });

  const isOwner = currentUser?.id === product.sellerId;

  // Handle Photo attachment for review
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran foto ulasan maksimal 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      navigate(`/login?redirect=${encodeURIComponent(`/product/${product.id}`)}`);
      return;
    }

    if (!commentText.trim()) {
      toast.error('Silakan tuliskan komentar ulasan Anda.');
      return;
    }

    setSubmitting(true);
    try {
      await addReview({
        productId: product.id,
        productName: product.name,
        sellerId: product.sellerId,
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatarUrl,
        rating: selectedRating,
        comment: commentText.trim(),
        photoUrl: photoUrl || undefined,
        isVerifiedBuyer: true,
      });

      toast.success('Ulasan & rating berhasil ditambahkan!');
      setCommentText('');
      setPhotoUrl(null);
      setSelectedRating(5);
      setShowReviewForm(false);
    } catch (err) {
      console.error('Failed to add review:', err);
      toast.error('Gagal mengirimkan ulasan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSellerReplySubmit = async (reviewId: string) => {
    if (!replyText.trim()) return;

    setSubmittingReply(true);
    try {
      await addSellerReply(reviewId, replyText.trim());
      toast.success('Balasan berhasil dikirim!');
      setReplyingReviewId(null);
      setReplyText('');
    } catch (err) {
      console.error('Failed to add reply:', err);
      toast.error('Gagal membalas ulasan.');
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900/80 p-6 sm:p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-8 shadow-xs">
      
      {/* Header & Write Review Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-6">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            <span>Ulasan & Rating Pembeli</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Ulasan jujur dari pembeli yang telah memiliki produk ini
          </p>
        </div>

        {!isOwner && (
          <button
            onClick={() => {
              if (!currentUser) {
                navigate(`/login?redirect=${encodeURIComponent(`/product/${product.id}`)}`);
                return;
              }
              setShowReviewForm(!showReviewForm);
            }}
            className="px-4 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-xs rounded-xl hover:scale-105 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{showReviewForm ? 'Batal Ulasan' : '+ Tulis Ulasan'}</span>
          </button>
        )}
      </div>

      {/* Review Form Area */}
      <AnimatePresence>
        {showReviewForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleReviewSubmit}
            className="p-5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-4"
          >
            <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
              Beri Ulasan Produk Ini
            </h3>

            {/* Rating Stars Picker */}
            <div className="space-y-1">
              <label className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">Pilih Bintang:</label>
              <div>
                <ProductRatingStars
                  rating={selectedRating}
                  interactive={true}
                  onRatingChange={(r) => setSelectedRating(r)}
                  size="md"
                  showScore={true}
                />
              </div>
            </div>

            {/* Comment Area */}
            <div>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Bagaimana kualitas barang ini? Tuliskan ulasan pengalaman Anda..."
                rows={3}
                maxLength={500}
                className="w-full p-3 text-xs sm:text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white resize-none"
              />
            </div>

            {/* Photo Attachment & Submit */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <label className="p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer flex items-center gap-1.5 transition-colors">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>{photoUrl ? 'Ganti Foto' : 'Lampirkan Foto'}</span>
                  <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                </label>

                {photoUrl && (
                  <div className="relative group">
                    <img src={photoUrl} alt="Preview" className="w-10 h-10 rounded-lg object-cover border border-neutral-300 dark:border-neutral-700" />
                    <button
                      type="button"
                      onClick={() => setPhotoUrl(null)}
                      className="absolute -top-1 -right-1 p-0.5 bg-rose-600 text-white rounded-full hover:scale-110"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || !commentText.trim()}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Kirim Ulasan</span>
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Rating Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-neutral-50 dark:bg-neutral-950 p-6 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80">
        
        {/* Rating Score Summary */}
        <div className="md:col-span-4 text-center md:text-left space-y-2 border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800 pb-4 md:pb-0 md:pr-6">
          <div className="flex items-baseline justify-center md:justify-start gap-2">
            <span className="text-4xl sm:text-5xl font-black text-neutral-900 dark:text-white tabular-nums">
              {ratingBreakdown.average > 0 ? ratingBreakdown.average.toFixed(1) : '0.0'}
            </span>
            <span className="text-sm font-bold text-neutral-400">/ 5.0</span>
          </div>

          <div>
            <ProductRatingStars rating={ratingBreakdown.average} size="md" />
          </div>

          <p className="text-xs text-neutral-500 font-medium">
            Berdasarkan <strong>{ratingBreakdown.total} ulasan</strong>
          </p>
        </div>

        {/* Progress Bars for Stars */}
        <div className="md:col-span-8 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingBreakdown.counts[star as 1 | 2 | 3 | 4 | 5] || 0;
            const pct = ratingBreakdown.percentages[star as 1 | 2 | 3 | 4 | 5] || 0;

            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1 w-12 font-bold text-neutral-700 dark:text-neutral-300 shrink-0">
                  <span>{star}</span>
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </div>

                <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <span className="w-12 text-right font-mono text-neutral-400 shrink-0">{count} ({pct}%)</span>
              </div>
            );
          })}
        </div>

      </div>

      {/* Star Rating Filter Chips */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs text-neutral-500 font-medium shrink-0">Filter:</span>
          <button
            onClick={() => setStarFilter('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shrink-0 ${
              starFilter === 'all'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
            }`}
          >
            Semua ({reviews.length})
          </button>
          {[5, 4, 3, 2, 1].map((st) => (
            <button
              key={st}
              onClick={() => setStarFilter(st)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shrink-0 flex items-center gap-1 ${
                starFilter === st
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
              }`}
            >
              <span>{st}</span>
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>({ratingBreakdown.counts[st as 1 | 2 | 3 | 4 | 5]})</span>
            </button>
          ))}
        </div>
      )}

      {/* Reviews Feed List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-neutral-400 animate-pulse">
            Memuat ulasan...
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="py-12 text-center space-y-2 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
            <MessageSquare className="w-8 h-8 mx-auto text-neutral-400" />
            <p className="text-xs font-bold text-neutral-900 dark:text-white">
              Belum Ada Ulasan
            </p>
            <p className="text-[11px] text-neutral-500">
              Jadilah pembeli pertama yang memberikan ulasan untuk produk ini!
            </p>
          </div>
        ) : (
          filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="p-4 sm:p-5 bg-neutral-50/60 dark:bg-neutral-950/60 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl space-y-3"
            >
              {/* User Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {rev.userAvatar ? (
                    <img src={rev.userAvatar} alt={rev.userName} className="w-9 h-9 rounded-full object-cover bg-neutral-200" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold flex items-center justify-center text-xs">
                      {rev.userName?.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-neutral-900 dark:text-white">{rev.userName}</p>
                      {rev.isVerifiedBuyer && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                          <CheckCircle2 className="w-3 h-3" />
                          Pembeli Terverifikasi
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5">
                      <ProductRatingStars rating={rev.rating} size="xs" />
                    </div>
                  </div>
                </div>

                <span className="text-[10px] text-neutral-400 font-mono">{timeAgo(rev.createdAt)}</span>
              </div>

              {/* Review Text */}
              <p className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-line leading-relaxed pl-1">
                {rev.comment}
              </p>

              {/* Attached Review Photo */}
              {rev.photoUrl && (
                <div className="pt-1">
                  <img
                    src={rev.photoUrl}
                    alt="Foto Ulasan"
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl object-cover border border-neutral-200 dark:border-neutral-800 hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => window.open(rev.photoUrl, '_blank')}
                  />
                </div>
              )}

              {/* Seller Reply Section */}
              {rev.sellerReply ? (
                <div className="mt-3 p-3 bg-neutral-100 dark:bg-neutral-900/90 rounded-xl border-l-4 border-neutral-900 dark:border-white space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-neutral-900 dark:text-white flex items-center gap-1">
                      <CornerDownRight className="w-3.5 h-3.5 text-neutral-500" />
                      Balasan Penjual ({product.sellerName})
                    </span>
                    <span className="text-neutral-400 text-[10px]">{timeAgo(rev.sellerReply.createdAt)}</span>
                  </div>
                  <p className="text-xs text-neutral-700 dark:text-neutral-300 pl-4 whitespace-pre-line">
                    {rev.sellerReply.replyText}
                  </p>
                </div>
              ) : (
                /* Reply button for product seller */
                isOwner && (
                  <div className="pt-2">
                    {replyingReviewId === rev.id ? (
                      <div className="space-y-2 bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Tuliskan ucapan terima kasih atau jawaban untuk pembeli..."
                          rows={2}
                          className="w-full p-2.5 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white focus:outline-none"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingReviewId(null);
                              setReplyText('');
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            disabled={submittingReply || !replyText.trim()}
                            onClick={() => handleSellerReplySubmit(rev.id)}
                            className="px-3.5 py-1.5 text-xs font-bold text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-lg transition-all"
                          >
                            {submittingReply ? 'Mengirim...' : 'Kirim Balasan'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setReplyingReviewId(rev.id);
                          setReplyText('');
                        }}
                        className="text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1"
                      >
                        <CornerDownRight className="w-3.5 h-3.5" />
                        <span>Balas Ulasan Ini</span>
                      </button>
                    )}
                  </div>
                )
              )}

            </div>
          ))
        )}
      </div>

    </div>
  );
}
