import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product, ProductFilterOptions } from '../types';

export function useProducts(filterOptions?: ProductFilterOptions) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const colRef = collection(db, 'products');

    // Realtime subscription to products collection
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const list: Product[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Product, 'id'>),
        }));

        setProducts(list);
        setLoading(false);
      },
      (err) => {
        console.error('Snapshot error for products:', err);
        setError('Gagal memuat produk dari database.');
        setProducts([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter in memory for instant responsiveness and zero missing index errors
  const filteredProducts = products.filter((p) => {
    if (filterOptions?.category && filterOptions.category !== 'Semua') {
      if (p.category !== filterOptions.category) return false;
    }

    if (filterOptions?.condition && filterOptions.condition !== 'Semua') {
      if (p.condition !== filterOptions.condition) return false;
    }

    if (filterOptions?.minPrice !== undefined && filterOptions.minPrice > 0) {
      if (p.price < filterOptions.minPrice) return false;
    }

    if (filterOptions?.maxPrice !== undefined && filterOptions.maxPrice > 0) {
      if (p.price > filterOptions.maxPrice) return false;
    }

    if (filterOptions?.query && filterOptions.query.trim().length > 0) {
      const qLower = filterOptions.query.toLowerCase().trim();
      const nameMatch = p.name.toLowerCase().includes(qLower);
      const descMatch = p.description.toLowerCase().includes(qLower);
      const catMatch = p.category.toLowerCase().includes(qLower);
      const sellerMatch = p.sellerName.toLowerCase().includes(qLower);
      if (!nameMatch && !descMatch && !catMatch && !sellerMatch) return false;
    }

    return true;
  });

  // Apply sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (filterOptions?.sortBy === 'price_asc') {
      return a.price - b.price;
    }
    if (filterOptions?.sortBy === 'price_desc') {
      return b.price - a.price;
    }
    // Default newest
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  return {
    products: sortedProducts,
    allProducts: products,
    loading,
    error,
  };
}

export async function createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
  const path = 'products';
  try {
    const newDocRef = doc(collection(db, path));
    const now = new Date().toISOString();
    const product: Product = {
      ...productData,
      id: newDocRef.id,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(newDocRef, product);
    return newDocRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
}

export async function updateProduct(id: string, updates: Partial<Product>) {
  const path = `products/${id}`;
  try {
    const ref = doc(db, 'products', id);
    await updateDoc(ref, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    throw err;
  }
}

export async function deleteProduct(id: string) {
  const path = `products/${id}`;
  try {
    const ref = doc(db, 'products', id);
    await deleteDoc(ref);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
}
