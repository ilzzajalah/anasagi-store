import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  getDocs,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Review } from '../types';

export function useReviews(productId?: string, sellerId?: string) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId && !sellerId) {
      setReviews([]);
      setLoading(false);
      return;
    }

    const colRef = collection(db, 'reviews');
    let q;

    if (productId) {
      q = query(colRef, where('productId', '==', productId));
    } else if (sellerId) {
      q = query(colRef, where('sellerId', '==', sellerId));
    } else {
      q = colRef;
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Review[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Review, 'id'>),
        }));

        // Sort by newest
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setReviews(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to reviews:', err);
        setError('Gagal memuat ulasan produk.');
        setReviews([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [productId, sellerId]);

  return { reviews, loading, error };
}

export async function addReview(reviewData: Omit<Review, 'id' | 'createdAt'>) {
  const path = 'reviews';
  try {
    const newDocRef = doc(collection(db, path));
    const now = new Date().toISOString();

    const review: Review = {
      ...reviewData,
      id: newDocRef.id,
      createdAt: now,
    };

    await setDoc(newDocRef, review);

    // Recalculate average rating for product
    if (review.productId) {
      const reviewsSnap = await getDocs(
        query(collection(db, 'reviews'), where('productId', '==', review.productId))
      );
      const allReviews = reviewsSnap.docs.map((d) => d.data() as Review);
      
      const totalCount = allReviews.length;
      const sumRating = allReviews.reduce((acc, r) => acc + (r.rating || 5), 0);
      const avgRating = totalCount > 0 ? Number((sumRating / totalCount).toFixed(1)) : 0;

      await updateDoc(doc(db, 'products', review.productId), {
        ratingAverage: avgRating,
        ratingCount: totalCount,
      });
    }

    return newDocRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
}

export async function addSellerReply(reviewId: string, replyText: string) {
  const path = `reviews/${reviewId}`;
  try {
    const ref = doc(db, 'reviews', reviewId);
    await updateDoc(ref, {
      sellerReply: {
        replyText: replyText.trim(),
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    throw err;
  }
}

export function computeRatingBreakdown(reviews: Review[]) {
  const total = reviews.length;
  if (total === 0) {
    return {
      average: 0,
      total: 0,
      counts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }

  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;

  reviews.forEach((r) => {
    const star = Math.min(5, Math.max(1, Math.round(r.rating || 5))) as 1 | 2 | 3 | 4 | 5;
    counts[star] = (counts[star] || 0) + 1;
    sum += r.rating;
  });

  const average = Number((sum / total).toFixed(1));
  const percentages = {
    5: Math.round((counts[5] / total) * 100),
    4: Math.round((counts[4] / total) * 100),
    3: Math.round((counts[3] / total) * 100),
    2: Math.round((counts[2] / total) * 100),
    1: Math.round((counts[1] / total) * 100),
  };

  return { average, total, counts, percentages };
}
