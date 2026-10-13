import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, UserProfile } from '../types';
import { formatRupiah, timeAgo } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { getOrCreateConversation } from '../hooks/useConversations';
import { deleteProduct } from '../hooks/useProducts';
import {
  MessageSquare,
  Share2,
  Edit,
  Trash2,
  Store,
  ChevronRight,
  Package,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface ProductDetailPageProps {
  productId: string;
  navigate: (path: string) => void;
}

export function ProductDetailPage({ productId, navigate }: ProductDetailPageProps) {
  const { user, profile } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [startingChat, setStartingChat] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const snap = await getDoc(doc(db, 'products', productId));
        if (snap.exists()) {
          const data = { id: snap.id, ...(snap.data() as Omit<Product, 'id'>) };
          setProduct(data);
          setSelectedImgIndex(data.mainImageIndex || 0);
        } else {
          setProduct(null);
        }
      } catch (err) {
        console.error('Error fetching product detail:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [productId]);

  const handleChatSeller = async () => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/product/${productId}`)}`);
      return;
    }

    if (!product) return;

    if (user.uid === product.sellerId) {
      toast.error('Ini adalah produk milik Anda sendiri.');
      return;
    }

    setStartingChat(true);
    try {
      // Robust fallback so mobile users never get blocked if profile is loading
      const activeProfile: UserProfile = profile || {
        id: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Pembeli',
        email: user.email || '',
        avatarUrl: user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.email || 'User')}&backgroundColor=000000&textColor=ffffff`,
        createdAt: new Date().toISOString(),
      };

      const conversationId = await getOrCreateConversation(activeProfile, product);
      toast.success('Percakapan dibuka');
      navigate(`/chat/${conversationId}`);
    } catch (err: any) {
      console.error('Failed to open chat:', err);
      toast.error(err.message || 'Gagal memulai chat dengan penjual.');
    } finally {
      setStartingChat(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Tautan produk berhasil disalin!');
  };

  const handleDeleteProduct = async () => {
    if (!product) return;
    setDeleting(true);
    try {
      await deleteProduct(product.id);
      toast.success('Produk berhasil dihapus!');
      navigate('/my-products');
    } catch (err) {
      console.error('Failed to delete product:', err);
      toast.error('Gagal menghapus produk.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4 space-y-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
            <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded w-1/3" />
            <div className="h-24 bg-neutral-200 dark:bg-neutral-800 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-4">
        <Package className="w-12 h-12 mx-auto text-neutral-400" />
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Produk Tidak Ditemukan</h2>
        <p className="text-xs text-neutral-500">Produk ini telah dihapus atau tidak tersedia.</p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 text-xs font-bold text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-xl hover:scale-105 active:scale-95 transition-all"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  const isOwner = user?.uid === product.sellerId;
  const isOutOfStock = product.stock <= 0;
  const currentImg = product.images?.[selectedImgIndex] || product.images?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="max-w-6xl mx-auto pb-20 space-y-8"
    >
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
        <button onClick={() => navigate('/')} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
          Beranda
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <button
          onClick={() => navigate(`/search?category=${encodeURIComponent(product.category)}`)}
          className="hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          {product.category}
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-neutral-900 dark:text-white font-semibold truncate max-w-[200px]">
          {product.name}
        </span>
      </nav>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-square w-full bg-neutral-100 dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-xs flex items-center justify-center">
            {currentImg ? (
              <motion.img
                key={selectedImgIndex}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                src={currentImg}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Store className="w-16 h-16 text-neutral-400" />
            )}

            {/* Condition tag */}
            <div className="absolute top-4 left-4 px-3 py-1 bg-black/80 dark:bg-white/90 text-white dark:text-black text-xs font-bold rounded-lg uppercase tracking-wider shadow-sm">
              {product.condition}
            </div>
          </div>

          {/* Thumbnails list */}
          {product.images && product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedImgIndex(idx)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImgIndex === idx
                      ? 'border-neutral-900 dark:border-white ring-2 ring-neutral-900/20 shadow-md'
                      : 'border-neutral-200 dark:border-neutral-800 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Contiguous Purchase & Seller Module */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-neutral-900/80 p-6 sm:p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-6 shadow-sm">
            
            <div>
              <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
                <span>Kategori: {product.category}</span>
                <span>Diupload {timeAgo(product.createdAt)}</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white leading-snug">
                {product.name}
              </h1>

              {/* Price strictly formatted as Rp 1.000.000 */}
              <p className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight tabular-nums mt-3">
                {formatRupiah(product.price)}
              </p>
            </div>

            {/* Availability Indicator */}
            <div className="flex items-center justify-between p-3.5 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 text-xs">
              <span className="text-neutral-600 dark:text-neutral-400 font-medium">Status Stok:</span>
              {isOutOfStock ? (
                <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> Stok Habis
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Tersedia ({product.stock} pcs)
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              {isOwner ? (
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(`/my-products/${product.id}/edit`)}
                    className="py-3 px-4 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Produk
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowDeleteModal(true)}
                    className="py-3 px-4 bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 hover:bg-rose-100"
                  >
                    <Trash2 className="w-4 h-4" />
                    Hapus Produk
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleChatSeller}
                  disabled={startingChat || isOutOfStock}
                  className={`w-full py-3.5 px-4 text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${
                    isOutOfStock
                      ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                      : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  {startingChat ? 'Membuka Chat...' : 'Chat Penjual'}
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleShare}
                className="w-full py-3 px-4 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                Bagikan Produk
              </motion.button>
            </div>

            {/* Seller Card */}
            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Informasi Penjual
              </span>

              <div className="flex items-center gap-3">
                {product.sellerAvatar ? (
                  <img
                    src={product.sellerAvatar}
                    alt={product.sellerName}
                    className="w-10 h-10 rounded-full object-cover bg-neutral-200 border border-neutral-200"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-neutral-900 text-white font-bold flex items-center justify-center text-sm">
                    {product.sellerName?.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="flex-1">
                  <p className="text-sm font-bold text-neutral-900 dark:text-white">
                    {product.sellerName}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Penjual Terverifikasi
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Description Section */}
          <div className="bg-white dark:bg-neutral-900/80 p-6 sm:p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-3 shadow-xs">
            <h2 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
              Deskripsi Produk
            </h2>
            <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-line leading-relaxed">
              {product.description}
            </p>
          </div>

        </div>

      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="bg-white dark:bg-neutral-900 p-6 rounded-2xl max-w-sm w-full space-y-4 border border-neutral-200 dark:border-neutral-800 shadow-2xl"
            >
              <div className="w-10 h-10 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>

              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Hapus Produk Ini?
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Apakah Anda yakin ingin menghapus <strong>"{product.name}"</strong>? Tindakan ini permanen.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteProduct}
                  disabled={deleting}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all"
                >
                  {deleting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
