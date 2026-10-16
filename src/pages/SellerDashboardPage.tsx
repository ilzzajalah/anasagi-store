import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../hooks/useProducts';
import { useOrders, updateOrderStatus, computeSalesAnalytics, createOrder } from '../hooks/useSalesStats';
import { useReviews } from '../hooks/useReviews';
import { formatRupiah, timeAgo } from '../lib/utils';
import { ProductRatingStars } from '../components/product/ProductRatingStars';
import { OrderStatus } from '../types';
import {
  TrendingUp,
  DollarSign,
  PackageCheck,
  ShoppingBag,
  Star,
  Clock,
  CheckCircle2,
  Truck,
  PlusCircle,
  FileSpreadsheet,
  Store,
  ChevronRight,
  Filter,
  AlertCircle,
  Loader2,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface SellerDashboardPageProps {
  navigate: (path: string) => void;
}

export function SellerDashboardPage({ navigate }: SellerDashboardPageProps) {
  const { user, profile } = useAuth();
  const { orders, loading: ordersLoading } = useOrders(user?.uid, 'seller');
  const { products, loading: productsLoading } = useProducts();
  const { reviews } = useReviews(undefined, user?.uid);

  const [activeTab, setActiveTab] = useState<'analytics' | 'orders' | 'simulate'>('analytics');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('Semua');

  // Direct Transaction Simulation Form State
  const [simProductId, setSimProductId] = useState('');
  const [simBuyerName, setSimBuyerName] = useState('');
  const [simQty, setSimQty] = useState(1);
  const [simulating, setSimulating] = useState(false);

  const myProducts = products.filter((p) => p.sellerId === user?.uid);
  const analytics = computeSalesAnalytics(orders);

  // Compute overall store rating
  const storeRatingAvg =
    reviews.length > 0
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
      : 0;

  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === 'Semua') return true;
    return o.status === orderStatusFilter;
  });

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(`Status pesanan diperbarui ke "${newStatus}"`);
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('Gagal memperbarui status pesanan.');
    }
  };

  const handleCreateSimulatedOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetProd = myProducts.find((p) => p.id === simProductId);
    if (!targetProd) {
      toast.error('Silakan pilih produk.');
      return;
    }

    if (!simBuyerName.trim()) {
      toast.error('Silakan isi nama pembeli.');
      return;
    }

    setSimulating(true);
    try {
      const priceUnit = targetProd.price;
      const total = priceUnit * simQty;

      const newOrderId = await createOrder({
        sellerId: user?.uid || '',
        sellerName: profile?.name || 'Penjual',
        buyerId: 'simulated_buyer_' + Date.now(),
        buyerName: simBuyerName.trim(),
        productId: targetProd.id,
        productName: targetProd.name,
        productImage: targetProd.images?.[0],
        quantity: simQty,
        pricePerUnit: priceUnit,
        totalPrice: total,
        paymentMethod: 'Transfer Bank (Simulasi)',
        shippingAddress: 'Alamat Pembeli Simulasi',
      });

      // Automatically mark as completed to show in stats
      await updateOrderStatus(newOrderId, 'Selesai');

      toast.success('Transaksi penjualan berhasil dicatat!');
      setSimProductId('');
      setSimBuyerName('');
      setSimQty(1);
      setActiveTab('analytics');
    } catch (err) {
      console.error('Failed to create simulated transaction:', err);
      toast.error('Gagal mencatat transaksi.');
    } finally {
      setSimulating(false);
    }
  };

  const handleExportCSV = () => {
    if (orders.length === 0) {
      toast.error('Belum ada data pesanan untuk diexport.');
      return;
    }

    const headers = ['ID Pesanan', 'Tanggal', 'Produk', 'Pembeli', 'Jumlah', 'Harga Unit', 'Total Harga', 'Status'];
    const rows = orders.map((o) => [
      o.id,
      new Date(o.createdAt).toLocaleDateString('id-ID'),
      `"${o.productName.replace(/"/g, '""')}"`,
      `"${o.buyerName.replace(/"/g, '""')}"`,
      o.quantity,
      o.pricePerUnit,
      o.totalPrice,
      o.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Penjualan_${profile?.name || 'Toko'}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Laporan penjualan berhasil didownload (CSV)!');
  };

  const maxChartRevenue = Math.max(...analytics.monthlyChart.map((m) => m.revenue), 1);

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
            <button onClick={() => navigate('/')} className="hover:underline">Beranda</button>
            <ChevronRight className="w-3.5 h-3.5" />
            <button onClick={() => navigate('/my-products')} className="hover:underline">Produk Saya</button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-neutral-900 dark:text-white font-bold">Statistik Penjualan</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-8 h-8 text-emerald-500" />
            <span>Statistik & Dasbor Penjualan</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Pantau total pendapatan, performa produk terlaris, dan manajemen order toko Anda
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 text-xs font-bold text-neutral-800 dark:text-neutral-200 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all shadow-xs flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Laporan (CSV)</span>
          </button>

          <button
            onClick={() => setActiveTab('simulate')}
            className="px-4 py-2.5 text-xs font-bold text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-sm flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Catat Transaksi</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Revenue */}
        <div className="p-5 bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Total Pendapatan</span>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-neutral-900 dark:text-white tabular-nums tracking-tight">
              {formatRupiah(analytics.totalRevenue)}
            </p>
            <p className="text-[11px] text-neutral-500 mt-1">
              Pendapatan selesai dari {analytics.completedOrdersCount} pesanan
            </p>
          </div>
        </div>

        {/* Total Items Sold */}
        <div className="p-5 bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Total Terjual</span>
            <div className="p-2 bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 rounded-xl">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-neutral-900 dark:text-white tabular-nums tracking-tight">
              {analytics.totalItemsSold} <span className="text-sm font-bold text-neutral-400">Pcs</span>
            </p>
            <p className="text-[11px] text-neutral-500 mt-1">
              Dari {myProducts.length} produk aktif di toko
            </p>
          </div>
        </div>

        {/* Orders Count */}
        <div className="p-5 bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Status Order</span>
            <div className="p-2 bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-neutral-900 dark:text-white tabular-nums tracking-tight">
              {analytics.totalOrdersCount} <span className="text-sm font-bold text-neutral-400">Order</span>
            </p>
            <p className="text-[11px] text-neutral-500 mt-1">
              {analytics.pendingOrdersCount} pending · {analytics.shippedOrdersCount} dikirim
            </p>
          </div>
        </div>

        {/* Rating Performance */}
        <div className="p-5 bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Performa Rating</span>
            <div className="p-2 bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 rounded-xl">
              <Star className="w-5 h-5 fill-purple-500 text-purple-500" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black text-neutral-900 dark:text-white tabular-nums tracking-tight">
                {storeRatingAvg > 0 ? storeRatingAvg.toFixed(1) : '0.0'}
              </p>
              <ProductRatingStars rating={storeRatingAvg} size="xs" />
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              Berdasarkan {reviews.length} ulasan dari pembeli
            </p>
          </div>
        </div>

      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-3 border-b border-neutral-200 dark:border-neutral-800">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeTab === 'analytics'
              ? 'text-neutral-900 dark:text-white border-b-2 border-neutral-900 dark:border-white'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          Grafik & Produk Terlaris
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-1.5 ${
            activeTab === 'orders'
              ? 'text-neutral-900 dark:text-white border-b-2 border-neutral-900 dark:border-white'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <span>Manajemen Pesanan ({orders.length})</span>
          {analytics.pendingOrdersCount > 0 && (
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('simulate')}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeTab === 'simulate'
              ? 'text-neutral-900 dark:text-white border-b-2 border-neutral-900 dark:border-white'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          + Catat Transaksi Langsung
        </button>
      </div>

      {/* TAB 1: Analytics & Revenue Chart */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          
          {/* Monthly Revenue Visual Bar Chart */}
          <div className="bg-white dark:bg-neutral-900/80 p-6 sm:p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-500" />
                  <span>Tren Pendapatan Bulanan</span>
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Visualisasi pendapatan dari transaksi yang telah selesai 6 bulan terakhir
                </p>
              </div>

              <span className="text-xs font-mono text-neutral-400">
                Total: {formatRupiah(analytics.totalRevenue)}
              </span>
            </div>

            {/* Custom Responsive Tailwind Bar Chart */}
            <div className="pt-4">
              <div className="h-48 flex items-end justify-between gap-2 sm:gap-6 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                {analytics.monthlyChart.map((item, idx) => {
                  const heightPct = Math.max(8, Math.round((item.revenue / maxChartRevenue) * 100));

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                      {/* Bar tooltip hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900 text-white text-[10px] py-1 px-2 rounded-md font-mono whitespace-nowrap shadow-lg">
                        {formatRupiah(item.revenue)} ({item.orders} order)
                      </div>

                      {/* Bar Fill */}
                      <div className="w-full max-w-[48px] bg-neutral-100 dark:bg-neutral-800 rounded-t-xl overflow-hidden flex items-end">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${heightPct}%` }}
                          transition={{ duration: 0.6, delay: idx * 0.1 }}
                          className={`w-full rounded-t-xl transition-all duration-300 ${
                            item.revenue > 0
                              ? 'bg-neutral-900 dark:bg-white group-hover:bg-emerald-500 dark:group-hover:bg-emerald-400'
                              : 'bg-neutral-200 dark:bg-neutral-800'
                          }`}
                        />
                      </div>

                      <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 truncate">
                        {item.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Top Products Table */}
          <div className="bg-white dark:bg-neutral-900/80 p-6 sm:p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-6 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
                <Store className="w-5 h-5 text-sky-500" />
                <span>Peringkat Produk Terlaris</span>
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Daftar produk dengan jumlah unit dan total omzet pendapatan tertinggi
              </p>
            </div>

            {analytics.topProducts.length === 0 ? (
              <div className="py-12 text-center space-y-2 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
                <ShoppingBag className="w-8 h-8 mx-auto text-neutral-400" />
                <p className="text-xs font-bold text-neutral-900 dark:text-white">Belum Ada Data Penjualan</p>
                <p className="text-[11px] text-neutral-500">
                  Gunakan tab "Catat Transaksi Langsung" atau selesaikan pesanan masuk untuk mengumpulkan data.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 font-bold uppercase tracking-wider">
                      <th className="pb-3 pr-4">Produk</th>
                      <th className="pb-3 px-4 text-center">Unit Terjual</th>
                      <th className="pb-3 px-4 text-right">Total Revenue</th>
                      <th className="pb-3 pl-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-medium">
                    {analytics.topProducts.map((p, i) => (
                      <tr key={p.productId} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                        <td className="py-3.5 pr-4">
                          <div className="flex items-center gap-3">
                            <span className="font-bold font-mono text-neutral-400 w-4">#{i + 1}</span>
                            {p.productImage ? (
                              <img src={p.productImage} alt={p.productName} className="w-10 h-10 rounded-lg object-cover bg-neutral-200 shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 shrink-0">
                                <Store className="w-5 h-5" />
                              </div>
                            )}
                            <span className="font-bold text-neutral-900 dark:text-white line-clamp-1 max-w-xs">
                              {p.productName}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold text-neutral-900 dark:text-white tabular-nums">
                          {p.totalSold} Pcs
                        </td>

                        <td className="py-3.5 px-4 text-right font-black text-neutral-900 dark:text-white tabular-nums">
                          {formatRupiah(p.totalRevenue)}
                        </td>

                        <td className="py-3.5 pl-4 text-right">
                          <button
                            onClick={() => navigate(`/product/${p.productId}`)}
                            className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:underline"
                          >
                            Lihat Halaman
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: Order Management List */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          
          {/* Order Status Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs text-neutral-500 font-medium shrink-0 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter Status:
            </span>
            {['Semua', 'Pending', 'Diproses', 'Dikirim', 'Selesai', 'Dibatalkan'].map((st) => (
              <button
                key={st}
                onClick={() => setOrderStatusFilter(st)}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all shrink-0 ${
                  orderStatusFilter === st
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                    : 'bg-white text-neutral-700 border border-neutral-300 dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Orders Feed */}
          {ordersLoading ? (
            <div className="py-12 text-center text-xs text-neutral-400 animate-pulse">
              Memuat data pesanan...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-16 text-center space-y-3 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
              <ShoppingBag className="w-10 h-10 mx-auto text-neutral-400" />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Tidak Ada Pesanan Ditemukan</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Belum ada pesanan masuk dalam kategori ini. Anda dapat mencatat transaksi secara manual di tab sebelah.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-5 bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-4 shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                    <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono">
                      <span>ID: #{ord.id.slice(0, 8)}</span>
                      <span>·</span>
                      <span>{timeAgo(ord.createdAt)}</span>
                      <span>·</span>
                      <span className="font-sans font-bold text-neutral-800 dark:text-neutral-200">
                        Pembeli: {ord.buyerName}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
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
                        <span>Status: {ord.status}</span>
                      </span>
                    </div>
                  </div>

                  {/* Order Item Details */}
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
                          Jumlah: <strong className="text-neutral-800 dark:text-neutral-200">{ord.quantity} pcs</strong> × {formatRupiah(ord.pricePerUnit)}
                        </p>
                        {ord.paymentMethod && (
                          <p className="text-[11px] text-neutral-400">Pembayaran: {ord.paymentMethod}</p>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs text-neutral-500 font-medium">Total Harga</p>
                      <p className="text-base font-black text-neutral-900 dark:text-white tabular-nums">
                        {formatRupiah(ord.totalPrice)}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons for Updating Status */}
                  {ord.status !== 'Selesai' && ord.status !== 'Dibatalkan' && (
                    <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-2">
                      {ord.status === 'Pending' && (
                        <button
                          onClick={() => handleStatusChange(ord.id, 'Diproses')}
                          className="px-3.5 py-1.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-xs rounded-xl hover:scale-105 active:scale-95 transition-all"
                        >
                          Proses Pesanan
                        </button>
                      )}

                      {ord.status === 'Diproses' && (
                        <button
                          onClick={() => handleStatusChange(ord.id, 'Dikirim')}
                          className="px-3.5 py-1.5 bg-sky-600 text-white font-bold text-xs rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Kirim Pesanan</span>
                        </button>
                      )}

                      {(ord.status === 'Diproses' || ord.status === 'Dikirim') && (
                        <button
                          onClick={() => handleStatusChange(ord.id, 'Selesai')}
                          className="px-3.5 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Tandai Selesai</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleStatusChange(ord.id, 'Dibatalkan')}
                        className="px-3.5 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 font-bold text-xs rounded-xl hover:bg-rose-100 transition-colors"
                      >
                        Batalkan
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* TAB 3: Direct Transaction Simulator */}
      {activeTab === 'simulate' && (
        <div className="max-w-2xl mx-auto bg-white dark:bg-neutral-900/80 p-6 sm:p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-6 shadow-xs">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-500" />
              <span>Catat / Simulasi Transaksi Langsung</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Gunakan formulir ini untuk mencatat transaksi penjualan produk secara langsung agar statistik pendapatan dan unit terjual toko Anda terbarui otomatis.
            </p>
          </div>

          <form onSubmit={handleCreateSimulatedOrder} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Pilih Produk yang Terjual:
              </label>
              {myProducts.length === 0 ? (
                <p className="text-xs text-rose-500 font-medium">
                  Anda belum memasang produk. Pasang produk di halaman "+ Jual Produk" terlebih dahulu.
                </p>
              ) : (
                <select
                  value={simProductId}
                  onChange={(e) => setSimProductId(e.target.value)}
                  className="w-full p-3 text-xs sm:text-sm bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white focus:outline-none"
                >
                  <option value="">-- Pilih Produk --</option>
                  {myProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatRupiah(p.price)} · Stok {p.stock})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Nama Pembeli:
              </label>
              <input
                type="text"
                value={simBuyerName}
                onChange={(e) => setSimBuyerName(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                className="w-full p-3 text-xs sm:text-sm bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Jumlah Terjual (Unit):
              </label>
              <input
                type="number"
                min={1}
                value={simQty}
                onChange={(e) => setSimQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full p-3 text-xs sm:text-sm bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={simulating || !simProductId || !simBuyerName.trim()}
              className="w-full py-3.5 text-xs sm:text-sm font-bold text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
            >
              {simulating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Simpan Transaksi & Perbarui Statistik</span>
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
