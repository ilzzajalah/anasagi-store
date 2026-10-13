import { useState, useEffect, useRef } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  getDoc,
  orderBy,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Conversation, Message, Product, UserProfile } from '../types';
import { formatRupiah } from '../lib/utils';

export function useConversations(userId?: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const colRef = collection(db, 'conversations');
    const q = query(
      colRef,
      where('participantIds', 'array-contains', userId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Conversation[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Conversation, 'id'>),
        }));

        // Sort in memory by lastMessageAt descending for instant real-time sync across devices
        list.sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime());

        setConversations(list);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching conversations:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const totalUnread = conversations.reduce((acc, conv) => {
    if (conv.buyerId === userId) {
      return acc + (conv.unreadBuyerCount || 0);
    }
    if (conv.sellerId === userId) {
      return acc + (conv.unreadSellerCount || 0);
    }
    return acc;
  }, 0);

  return { conversations, totalUnread, loading };
}

export function useChatRoom(conversationId?: string, currentUserId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);

  const conversationRef = useRef<Conversation | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setConversation(null);
      setLoading(false);
      return;
    }

    // Subscribe to conversation details in real time
    const convRef = doc(db, 'conversations', conversationId);
    const unsubConv = onSnapshot(convRef, (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...(snap.data() as Omit<Conversation, 'id'>) };
        setConversation(data);
        conversationRef.current = data;

        // Clear unread count for current user
        if (currentUserId) {
          if (data.buyerId === currentUserId && data.unreadBuyerCount > 0) {
            updateDoc(convRef, { unreadBuyerCount: 0 }).catch(() => {});
          } else if (data.sellerId === currentUserId && data.unreadSellerCount > 0) {
            updateDoc(convRef, { unreadSellerCount: 0 }).catch(() => {});
          }
        }
      }
    });

    // Subscribe to messages in real time
    const msgRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(msgRef, orderBy('createdAt', 'asc'));

    const unsubMsg = onSnapshot(
      q,
      (snap) => {
        const list: Message[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Message, 'id'>),
        }));
        setMessages(list);
        setLoading(false);

        // Mark messages as read
        if (currentUserId) {
          snap.docs.forEach((msgDoc) => {
            const m = msgDoc.data() as Message;
            if (m.senderId !== currentUserId && !m.isRead) {
              updateDoc(doc(db, 'conversations', conversationId, 'messages', msgDoc.id), {
                isRead: true,
              }).catch(() => {});
            }
          });
        }
      },
      (err) => {
        console.error('Error fetching messages:', err);
        setLoading(false);
      }
    );

    return () => {
      unsubConv();
      unsubMsg();
    };
  }, [conversationId, currentUserId]);

  const partnerIsTyping = Boolean(
    conversation &&
      currentUserId &&
      (conversation.buyerId === currentUserId
        ? conversation.isSellerTyping
        : conversation.isBuyerTyping)
  );

  const updateTypingInFirestore = async (isTyping: boolean) => {
    const conv = conversationRef.current || conversation;
    if (!conversationId || !conv || !currentUserId) return;

    const isBuyer = conv.buyerId === currentUserId;
    const fieldToUpdate = isBuyer ? 'isBuyerTyping' : 'isSellerTyping';
    const convDoc = doc(db, 'conversations', conversationId);

    try {
      await updateDoc(convDoc, { [fieldToUpdate]: isTyping });
      isTypingRef.current = isTyping;
    } catch (err) {
      console.warn('Failed to update typing status:', err);
    }
  };

  const handleTyping = () => {
    if (!isTypingRef.current) {
      updateTypingInFirestore(true);
    }

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    typingTimerRef.current = setTimeout(() => {
      updateTypingInFirestore(false);
    }, 2500);
  };

  const sendMessage = async (content: string, senderProfile: UserProfile) => {
    if (!conversationId || !conversation || !currentUserId) return;
    const trimmed = content.trim();
    if (!trimmed || trimmed.length > 1000) return;

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    // Reset typing status on send
    updateTypingInFirestore(false);

    const path = `conversations/${conversationId}/messages`;
    try {
      const msgCol = collection(db, 'conversations', conversationId, 'messages');
      const now = new Date().toISOString();

      const newMsg: Omit<Message, 'id'> = {
        conversationId,
        senderId: currentUserId,
        senderName: senderProfile.name || 'Pengguna',
        content: trimmed,
        isRead: false,
        createdAt: now,
      };

      await addDoc(msgCol, newMsg);

      // Update conversation lastMessage & unread count
      const isBuyer = conversation.buyerId === currentUserId;
      const convRef = doc(db, 'conversations', conversationId);

      await updateDoc(convRef, {
        lastMessage: trimmed,
        lastMessageAt: now,
        lastMessageSenderId: currentUserId,
        unreadBuyerCount: isBuyer ? conversation.unreadBuyerCount : (conversation.unreadBuyerCount || 0) + 1,
        unreadSellerCount: !isBuyer ? conversation.unreadSellerCount : (conversation.unreadSellerCount || 0) + 1,
        ...(isBuyer ? { isBuyerTyping: false } : { isSellerTyping: false }),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  return { conversation, messages, partnerIsTyping, handleTyping, loading, sendMessage };
}

// Function to find existing conversation or create a new one
export async function getOrCreateConversation(
  buyerProfile: UserProfile,
  product: Product
): Promise<string> {
  const currentUid = auth.currentUser?.uid || buyerProfile.id;
  if (!currentUid) {
    throw new Error('Anda harus login terlebih dahulu.');
  }

  if (currentUid === product.sellerId) {
    throw new Error('Anda tidak dapat mengirim pesan ke produk milik sendiri.');
  }

  const convId = `${currentUid}_${product.sellerId}_${product.id}`;
  const convRef = doc(db, 'conversations', convId);

  try {
    try {
      const snap = await getDoc(convRef);
      if (snap.exists()) {
        return convId;
      }
    } catch (e) {
      console.warn('Doc check skipped, proceeding to create conversation:', e);
    }

    const now = new Date().toISOString();
    const buyerName = buyerProfile.name || auth.currentUser?.displayName || 'Pembeli';
    const buyerAvatar = buyerProfile.avatarUrl || auth.currentUser?.photoURL || '';

    const newConv: Conversation = {
      id: convId,
      productId: product.id || '',
      productName: product.name || 'Produk',
      productPrice: product.price || 0,
      productImage: product.images?.[product.mainImageIndex || 0] || product.images?.[0] || '',
      buyerId: currentUid,
      buyerName,
      buyerAvatar,
      sellerId: product.sellerId || '',
      sellerName: product.sellerName || 'Penjual',
      sellerAvatar: product.sellerAvatar || '',
      participantIds: [currentUid, product.sellerId],
      lastMessage: `Menanyakan tentang ${product.name}`,
      lastMessageAt: now,
      lastMessageSenderId: currentUid,
      unreadBuyerCount: 0,
      unreadSellerCount: 1,
      isBuyerTyping: false,
      isSellerTyping: false,
      createdAt: now,
    };

    await setDoc(convRef, newConv);

    const msgCol = collection(db, 'conversations', convId, 'messages');
    const firstMsg: Omit<Message, 'id'> = {
      conversationId: convId,
      senderId: currentUid,
      senderName: buyerName,
      content: `Halo, saya tertarik dengan produk ${product.name} (${formatRupiah(product.price)}). Apakah masih tersedia?`,
      isProductCard: true,
      productId: product.id,
      isRead: false,
      createdAt: now,
    };

    await addDoc(msgCol, firstMsg);

    return convId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `conversations/${convId}`);
    throw err;
  }
}
