import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useOrders, updateOrderStatus } from '../hooks/useSalesStats';
import { formatRupiah, timeAgo } from '../lib/utils';
import {
  ShoppingBag,
  CheckCircle2,
  Clock,
  Truck,
  Store,
  ChevronRight,
  Star,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';

interface MyOrdersPageProps {
  navigate: (path: string) => void;
}

export function MyOrdersPage({ navigate }: MyOrdersPageProps) {
  const { user } = useAuth();
  const { orders, loading } = useOrders(user?.uid, 'buyer');

  const handleMarkCompleted = async (orderId: string, productId: string) => {
    try {
      await updateOrderStatus(orderId, 'Selesai');
      toast.success('Pesanan telah dikonfirmasi selesai!');
      navigate(`/product/${productId}`);
    } catch (err) {
      console.error('Failed to mark order completed:', err);
      toast.error('Gagal memperbarui status pesanan.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-6">
      
      {/* Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-6 space-y-1">
        <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
          <button onClick={() => navigate('/')} className="hover:underline">Beranda</button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-neutral-900 dark:text-white font-bold">Pesanan Saya</span>
        </div>

        <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
          <ShoppingBag className="w-7 h-7 text-neutral-900 dark:text-white" />
          <span>Riwayat Pesanan Saya</span>
        </h1>
        <p className="text-xs text-neutral-500">
          Daftar barang yang telah Anda beli di Anasagi Store
        </p>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-neutral-400 animate-pulse">
          Memuat riwayat pesanan...
        </div>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center space-y-4 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-md mx-auto">
          <ShoppingBag className="w-12 h-12 mx-auto text-neutral-400" />
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">Belum Ada Pesanan</h3>
            <p className="text-xs text-neutral-500 mt-1">Anda belum melakukan pembelian barang apapun.</p>
          </div>
          <button
            onClick={() => navigate('/search')}
            className="px-5 py-2.5 text-xs font-bold text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-xl hover:scale-105 active:scale-95 transition-all"
          >
            Mulai Belanja Sekarang
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="p-5 bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-4 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <Store className="w-4 h-4 text-neutral-400" />
                  <span className="font-bold text-neutral-900 dark:text-white">{ord.sellerName || 'Penjual'}</span>
                  <span>·</span>
                  <span className="font-mono">{timeAgo(ord.createdAt)}</span>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full ${
                    ord.status === 'Selesai'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                      : ord.status === 'Dikirim'
                      ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300'
                      : ord.status === 'Diproses'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                      : ord.status === 'Pending'
                      ? 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                  }`}
                >
                  {ord.status === 'Selesai' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {ord.status === 'Dikirim' && <Truck className="w-3.5 h-3.5" />}
                  {ord.status === 'Diproses' && <Clock className="w-3.5 h-3.5" />}
                  <span>{ord.status}</span>
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  {ord.productImage ? (
                    <img src={ord.productImage} alt={ord.productName} className="w-14 h-14 rounded-xl object-cover bg-neutral-200 shrink-0" />
                  ) : (
                    <div className="w-14 h-14 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center text-neutral-400 shrink-0">
                      <Store className="w-6 h-6" />
                    </div>
                  )}

                  <div className="text-xs space-y-0.5 min-w-0">
                    <p className="font-bold text-neutral-900 dark:text-white truncate text-sm">
                      {ord.productName}
                    </p>
                    <p className="text-neutral-500">
                      Jumlah: <strong className="text-neutral-800 dark:text-neutral-200">{ord.quantity} pcs</strong>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs text-neutral-500 font-medium">Total Pembayaran</p>
                  <p className="text-base font-black text-neutral-900 dark:text-white tabular-nums">
                    {formatRupiah(ord.totalPrice)}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-3">
                <button
                  onClick={() => navigate(`/product/${ord.productId}`)}
                  className="px-3.5 py-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:underline"
                >
                  Lihat Produk
                </button>

                {ord.status === 'Dikirim' && (
                  <button
                    onClick={() => handleMarkCompleted(ord.id, ord.productId)}
                    className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Pesanan Diterima & Selesai</span>
                  </button>
                )}

                {ord.status === 'Selesai' && (
                  <button
                    onClick={() => navigate(`/product/${ord.productId}`)}
                    className="px-4 py-2 bg-amber-500 text-white font-bold text-xs rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Star className="w-4 h-4 fill-white" />
                    <span>Beri Ulasan & Rating</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
