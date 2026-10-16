import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Order, OrderStatus } from '../types';

export function useOrders(userId?: string, role: 'seller' | 'buyer' = 'seller') {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const colRef = collection(db, 'orders');
    const fieldToQuery = role === 'seller' ? 'sellerId' : 'buyerId';
    const q = query(colRef, where(fieldToQuery, '==', userId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Order[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Order, 'id'>),
        }));

        // Sort newest first
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setOrders(list);
        setLoading(false);
      },
      (err) => {
        console.error(`Error loading orders for ${role}:`, err);
        setError('Gagal memuat data pesanan.');
        setOrders([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, role]);

  return { orders, loading, error };
}

export async function createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'status'>) {
  const path = 'orders';
  try {
    const newDocRef = doc(collection(db, path));
    const now = new Date().toISOString();

    const order: Order = {
      ...orderData,
      id: newDocRef.id,
      status: 'Pending',
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(newDocRef, order);
    return newDocRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
}

export async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
  const path = `orders/${orderId}`;
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      throw new Error('Pesanan tidak ditemukan.');
    }

    const orderData = orderSnap.data() as Order;
    const now = new Date().toISOString();

    const updates: Partial<Order> = {
      status: newStatus,
      updatedAt: now,
    };

    if (newStatus === 'Selesai') {
      updates.completedAt = now;

      // Update product salesCount and reduce stock
      if (orderData.productId) {
        const productRef = doc(db, 'products', orderData.productId);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          const prod = productSnap.data();
          const currentSales = prod.salesCount || 0;
          const currentStock = prod.stock || 0;
          const newStock = Math.max(0, currentStock - (orderData.quantity || 1));

          await updateDoc(productRef, {
            salesCount: currentSales + (orderData.quantity || 1),
            stock: newStock,
          });
        }
      }
    }

    await updateDoc(orderRef, updates);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    throw err;
  }
}

export function computeSalesAnalytics(orders: Order[]) {
  const completedOrders = orders.filter((o) => o.status === 'Selesai');
  const pendingOrders = orders.filter((o) => o.status === 'Pending' || o.status === 'Diproses');
  const shippedOrders = orders.filter((o) => o.status === 'Dikirim');

  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const pendingRevenue = pendingOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const totalItemsSold = completedOrders.reduce((sum, o) => sum + (o.quantity || 1), 0);

  // Group monthly revenue for the last 6 months
  const monthlyDataMap: { [key: string]: { revenue: number; orders: number } } = {};
  
  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthKey = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
    monthlyDataMap[monthKey] = { revenue: 0, orders: 0 };
  }

  completedOrders.forEach((o) => {
    const d = new Date(o.createdAt || o.completedAt || new Date());
    const monthKey = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
    if (monthlyDataMap[monthKey]) {
      monthlyDataMap[monthKey].revenue += o.totalPrice || 0;
      monthlyDataMap[monthKey].orders += 1;
    }
  });

  const monthlyChart = Object.keys(monthlyDataMap).map((month) => ({
    month,
    revenue: monthlyDataMap[month].revenue,
    orders: monthlyDataMap[month].orders,
  }));

  // Group top selling products
  const productSalesMap: {
    [productId: string]: {
      productId: string;
      productName: string;
      productImage?: string;
      totalSold: number;
      totalRevenue: number;
    };
  } = {};

  completedOrders.forEach((o) => {
    if (!productSalesMap[o.productId]) {
      productSalesMap[o.productId] = {
        productId: o.productId,
        productName: o.productName,
        productImage: o.productImage,
        totalSold: 0,
        totalRevenue: 0,
      };
    }
    productSalesMap[o.productId].totalSold += o.quantity || 1;
    productSalesMap[o.productId].totalRevenue += o.totalPrice || 0;
  });

  const topProducts = Object.values(productSalesMap).sort((a, b) => b.totalRevenue - a.totalRevenue);

  return {
    totalRevenue,
    pendingRevenue,
    totalOrdersCount: orders.length,
    completedOrdersCount: completedOrders.length,
    pendingOrdersCount: pendingOrders.length,
    shippedOrdersCount: shippedOrders.length,
    totalItemsSold,
    monthlyChart,
    topProducts,
  };
}
