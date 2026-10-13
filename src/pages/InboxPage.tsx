import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useConversations } from '../hooks/useConversations';
import { formatRupiah, timeAgo } from '../lib/utils';
import { MessageSquare, Store, ChevronRight, CheckCheck } from 'lucide-react';

interface InboxPageProps {
  navigate: (path: string) => void;
}

export function InboxPage({ navigate }: InboxPageProps) {
  const { user } = useAuth();
  const { conversations, loading } = useConversations(user?.uid);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 space-y-4 animate-pulse">
        <div className="h-8 bg-neutral-200 dark:bg-neutral-800 w-36 rounded" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-neutral-100 dark:bg-neutral-900 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-16 space-y-6">
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
          Pesan Masuk (Inbox)
        </h1>
        <p className="text-xs text-neutral-500">Daftar percakapan Anda dengan penjual dan pembeli.</p>
      </div>

      {conversations.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 space-y-4">
          <MessageSquare className="w-12 h-12 mx-auto text-neutral-400" />
          <h3 className="text-base font-bold text-neutral-900 dark:text-white">
            Belum ada percakapan
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Mulailah bertanya pada produk yang Anda minati melalui tombol "Chat Penjual".
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 text-xs font-bold text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-xl hover:scale-105 active:scale-95 transition-all"
          >
            Cari Produk
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => {
            const isBuyer = conv.buyerId === user?.uid;
            const partnerName = isBuyer ? conv.sellerName : conv.buyerName;
            const partnerAvatar = isBuyer ? conv.sellerAvatar : conv.buyerAvatar;
            const unreadCount = isBuyer ? conv.unreadBuyerCount : conv.unreadSellerCount;
            const partnerIsTyping = isBuyer ? conv.isSellerTyping : conv.isBuyerTyping;
            const isLastSenderMe = conv.lastMessageSenderId === user?.uid;

            return (
              <div
                key={conv.id}
                onClick={() => navigate(`/chat/${conv.id}`)}
                className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-4 hover:scale-[1.01] active:scale-[0.99] ${
                  unreadCount > 0
                    ? 'bg-neutral-100/90 dark:bg-neutral-800/60 border-neutral-400 dark:border-neutral-600 font-semibold shadow-xs'
                    : 'bg-white dark:bg-neutral-900/60 border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700'
                }`}
              >
                {/* Left Partner Info & Product Thumbnail */}
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  
                  {/* Partner Avatar */}
                  <div className="relative shrink-0">
                    {partnerAvatar ? (
                      <img
                        src={partnerAvatar}
                        alt={partnerName}
                        className="w-12 h-12 rounded-full object-cover bg-neutral-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold flex items-center justify-center text-sm">
                        {partnerName?.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-black text-white dark:bg-white dark:text-black rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-neutral-900 animate-bounce">
                        {unreadCount}
                      </span>
                    )}
                  </div>

                  {/* Conv text summary */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                        {partnerName}
                      </p>
                      <span className="text-[11px] text-neutral-500 shrink-0 font-mono">
                        {timeAgo(conv.lastMessageAt)}
                      </span>
                    </div>

                    {partnerIsTyping ? (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold italic animate-pulse">
                        Sedang mengetik...
                      </p>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 truncate">
                        {isLastSenderMe && (
                          <span title="Mark 2 Centang" className="shrink-0 text-sky-500">
                            <CheckCheck className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <span className="truncate">{conv.lastMessage || 'Tidak ada pesan'}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-[11px] text-neutral-400 pt-0.5">
                      <span className="truncate max-w-[180px]">Produk: {conv.productName}</span>
                      <span>·</span>
                      <span className="tabular-nums font-mono">{formatRupiah(conv.productPrice)}</span>
                    </div>
                  </div>

                </div>

                {/* Right Product Image preview */}
                <div className="flex items-center gap-2 shrink-0">
                  {conv.productImage ? (
                    <img
                      src={conv.productImage}
                      alt={conv.productName}
                      className="w-12 h-12 rounded-xl object-cover bg-neutral-100 border border-neutral-200 dark:border-neutral-800"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
                      <Store className="w-6 h-6" />
                    </div>
                  )}

                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
