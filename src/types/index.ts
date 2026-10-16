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
  ratingAverage?: number; // e.g. 4.8
  ratingCount?: number;    // total reviews count
  salesCount?: number;     // total units sold
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  productId: string;
  productName?: string;
  sellerId?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1 to 5 stars
  comment: string;
  photoUrl?: string;
  isVerifiedBuyer?: boolean;
  sellerReply?: {
    replyText: string;
    createdAt: string;
  };
  createdAt: string;
}

export type OrderStatus = 'Pending' | 'Diproses' | 'Dikirim' | 'Selesai' | 'Dibatalkan';

export interface Order {
  id: string;
  sellerId: string;
  sellerName?: string;
  buyerId: string;
  buyerName: string;
  buyerAvatar?: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  status: OrderStatus;
  paymentMethod?: string;
  shippingAddress?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
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
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  mediaName?: string;
  mediaSize?: number;
  thumbnailUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ProductFilterOptions {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popular';
}
