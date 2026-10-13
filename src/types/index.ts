export type ProductCategory =
  | 'Fashion'
  | 'Elektronik'
  | 'Makanan & Minuman'
  | 'Kecantikan'
  | 'Rumah Tangga'
  | 'Hobi'
  | 'Digital'
  | 'Lainnya';

export type ProductCondition = 'Baru' | 'Bekas';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string;
  name: string;
  description: string;
  price: number; // in Rupiah
  stock: number; // >= 0
  category: ProductCategory;
  condition: ProductCondition;
  images: string[]; // 1 to 5 image URLs or base64
  mainImageIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImage: string;
  buyerId: string;
  buyerName: string;
  buyerAvatar?: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string;
  participantIds: string[];
  lastMessage: string;
  lastMessageAt: string;
  lastMessageSenderId?: string;
  unreadBuyerCount: number;
  unreadSellerCount: number;
  isBuyerTyping?: boolean;
  isSellerTyping?: boolean;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  isProductCard?: boolean;
  productId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ProductFilterOptions {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  sortBy?: 'newest' | 'price_asc' | 'price_desc';
}
