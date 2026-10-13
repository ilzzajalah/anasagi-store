import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';
import { updateProduct, deleteProduct } from '../hooks/useProducts';
import { formatRupiah } from '../lib/utils';
import {
  PlusCircle,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Store,
  PackageX,
  AlertCircle,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

interface MyProductsPageProps {
  navigate: (path: string) => void;
}

export function MyProductsPage({ navigate }: MyProductsPageProps) {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal delete
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState<string>('');

  // Quick stock edit
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [stockVal, setStockVal] = useState<string>('');

  useEffect(() => {
    if (!user) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'products'), where('sellerId', '==', user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list: Product[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Product, 'id'>),
        }));
        setProducts(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching my products:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleToggleActive = async (product: Product) => {
    try {
      await updateProduct(product.id, { isActive: !product.isActive });
      toast.success(
        `Produk ${product.name} sekarang ${!product.isActive ? 'Aktif' : 'Nonaktif'}`
      );
    } catch (err) {
      toast.error('Gagal memperbarui status produk');
    }
  };

  const handleSaveStock = async (id: string) => {
    const newStock = Number(stockVal);
    if (isNaN(newStock) || newStock < 0) {
      toast.error('Stok harus angka bulat minimal 0');
      return;
    }

    try {
      await updateProduct(id, { stock: newStock });
      toast.success('Stok berhasil diperbarui');
      setEditingStockId(null);
    } catch (err) {
      toast.error('Gagal mengedit stok');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await deleteProduct(deletingId);
      toast.success('Produk berhasil dihapus');
      setDeletingId(null);
    } catch (err) {
      toast.error('Gagal menghapus produk');
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 space-y-4 animate-pulse">
        <div className="h-8 bg-neutral-200 dark:bg-neutral-800 w-48 rounded" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-neutral-100 dark:bg-neutral-900 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-16 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Produk Saya ({products.length})
          </h1>
          <p className="text-xs text-neutral-500">Kelola daftar jualan, stok, dan status produk Anda.</p>
        </div>

        <button
          onClick={() => navigate('/sell')}
          className="px-4 py-2.5 text-xs font-bold text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Tambah Produk</span>
        </button>
      </div>

      {products.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 space-y-4">
          <Store className="w-12 h-12 mx-auto text-neutral-400" />
          <h3 className="text-base font-bold text-neutral-900 dark:text-white">
            Belum ada produk. Mulai jualan sekarang.
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Unggah produk Anda dan dapatkan pembeli secara cepat dan mudah.
          </p>
          <button
            onClick={() => navigate('/sell')}
            className="px-5 py-2.5 text-xs font-bold text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-xl"
          >
            + Tambah Produk Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product) => {
            const mainImg = product.images?.[product.mainImageIndex || 0] || product.images?.[0];
            const isOutOfStock = product.stock <= 0;

            return (
              <div
                key={product.id}
                className="bg-white dark:bg-neutral-900/80 p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs"
              >
                {/* Product Meta */}
                <div className="flex items-center gap-4 flex-1">
                  <div
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="w-16 h-16 rounded-xl bg-neutral-100 dark:bg-neutral-950 overflow-hidden border border-neutral-200 dark:border-neutral-800 shrink-0 cursor-pointer"
                  >
                    {mainImg ? (
                      <img
                        src={mainImg}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Store className="w-8 h-8 m-auto text-neutral-400" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-neutral-900 dark:text-white line-clamp-1">
                        {product.name}
                      </span>
                      {isOutOfStock && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 rounded">
                          Stok Habis
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-bold text-neutral-900 dark:text-white tabular-nums">
                      {formatRupiah(product.price)}
                    </p>

                    <p className="text-[11px] text-neutral-500">
                      Kategori: {product.category} · Kondisi: {product.condition}
                    </p>
                  </div>
                </div>

                {/* Quick Stock & Status Actions */}
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-neutral-100 dark:border-neutral-800">
                  
                  {/* Stock quick edit */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-neutral-500 font-medium">Stok:</span>
                    {editingStockId === product.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={stockVal}
                          onChange={(e) => setStockVal(e.target.value)}
                          className="w-16 p-1 text-xs bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded text-center"
                          min={0}
                        />
                        <button
                          onClick={() => handleSaveStock(product.id)}
                          className="p-1 bg-neutral-900 text-white rounded hover:bg-neutral-800"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingStockId(product.id);
                          setStockVal(String(product.stock));
                        }}
                        className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg text-xs font-mono font-bold transition-colors"
                      >
                        {product.stock} pcs
                      </button>
                    )}
                  </div>

                  {/* Toggle Active Status */}
                  <button
                    onClick={() => handleToggleActive(product)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                      product.isActive
                        ? 'bg-neutral-100 text-neutral-900 border-neutral-300 dark:bg-neutral-800 dark:text-white dark:border-neutral-700'
                        : 'bg-neutral-50 text-neutral-400 border-neutral-200 dark:bg-neutral-950 dark:border-neutral-800'
                    }`}
                  >
                    {product.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{product.isActive ? 'Aktif' : 'Nonaktif'}</span>
                  </button>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigate(`/my-products/${product.id}/edit`)}
                      className="p-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                      title="Edit Produk"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setDeletingId(product.id);
                        setDeletingName(product.name);
                      }}
                      className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                      title="Hapus Produk"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl max-w-sm w-full space-y-4 border border-neutral-200 dark:border-neutral-800 shadow-xl">
            <div className="w-10 h-10 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Hapus Produk?
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Apakah Anda yakin ingin menghapus <strong>"{deletingName}"</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
