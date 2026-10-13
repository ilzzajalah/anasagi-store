import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useConversations } from '../../hooks/useConversations';
import { formatRupiah, timeAgo } from '../../lib/utils';
import {
  MessageSquare,
  Search,
  Store,
  ChevronRight,
  CheckCheck,
  Package,
  ShieldCheck,
} from 'lucide-react';
import { ChatRoomPanel } from './ChatRoomPanel';

interface ChatLayoutProps {
  activeConversationId?: string;
  navigate: (path: string) => void;
}

export function ChatLayout({ activeConversationId, navigate }: ChatLayoutProps) {
  const { user, profile } = useAuth();
  const { conversations, totalUnread, loading } = useConversations(user?.uid);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const isBuyer = conv.buyerId === user?.uid;
    const partnerName = (isBuyer ? conv.sellerName : conv.buyerName) || '';
    const lastMsg = conv.lastMessage || '';
    const prodName = conv.productName || '';

    return (
      partnerName.toLowerCase().includes(q) ||
      lastMsg.toLowerCase().includes(q) ||
      prodName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full h-full flex bg-white dark:bg-[#0f0f0f] overflow-hidden min-h-0 min-w-0">
      
      {/* Left Sidebar: Conversations List (Hidden on mobile if active conversation is selected) */}
      <div
        className={`w-full md:w-80 lg:w-96 shrink-0 border-r border-neutral-200 dark:border-neutral-800 flex flex-col h-full min-h-0 bg-white dark:bg-[#0f0f0f] ${
          activeConversationId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0f0f0f] space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="w-9 h-9 rounded-full object-cover border border-neutral-200 dark:border-neutral-800"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold flex items-center justify-center text-xs">
                  {profile?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div>
                <h1 className="text-base font-bold text-neutral-900 dark:text-white leading-tight">
                  Pesan Masuk
                </h1>
                {totalUnread > 0 && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    {totalUnread} pesan belum dibaca
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => navigate('/')}
              className="p-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Beranda
            </button>
          </div>

          {/* Search Conversations Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, pesan, atau produk..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white transition-all"
            />
          </div>
        </div>

        {/* Conversations Feed */}
        <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-neutral-100 dark:divide-neutral-900 overscroll-contain">
          {loading ? (
            <div className="p-4 space-y-3 animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-neutral-100 dark:bg-neutral-900 rounded-xl" />
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="py-16 px-4 text-center space-y-3">
              <MessageSquare className="w-10 h-10 mx-auto text-neutral-400" />
              <p className="text-xs font-semibold text-neutral-900 dark:text-white">
                {searchQuery ? 'Tidak ada pesan yang cocok' : 'Belum ada percakapan'}
              </p>
              <p className="text-[11px] text-neutral-500 max-w-xs mx-auto">
                {searchQuery
                  ? 'Coba gunakan kata kunci pencarian yang lain.'
                  : 'Gunakan tombol "Chat Penjual" pada halaman detail produk untuk memulai chat.'}
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isBuyer = conv.buyerId === user?.uid;
              const partnerName = isBuyer ? conv.sellerName : conv.buyerName;
              const partnerAvatar = isBuyer ? conv.sellerAvatar : conv.buyerAvatar;
              const unreadCount = isBuyer ? conv.unreadBuyerCount : conv.unreadSellerCount;
              const partnerIsTyping = isBuyer ? conv.isSellerTyping : conv.isBuyerTyping;
              const isLastSenderMe = conv.lastMessageSenderId === user?.uid;
              const isActive = activeConversationId === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => navigate(`/chat/${conv.id}`)}
                  className={`p-3.5 transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                    isActive
                      ? 'bg-neutral-100 dark:bg-neutral-800/90 border-l-4 border-neutral-900 dark:border-white'
                      : unreadCount > 0
                      ? 'bg-neutral-50 dark:bg-neutral-900/40 font-semibold hover:bg-neutral-100/80 dark:hover:bg-neutral-800/50'
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Partner Avatar */}
                    <div className="relative shrink-0">
                      {partnerAvatar ? (
                        <img
                          src={partnerAvatar}
                          alt={partnerName}
                          className="w-11 h-11 rounded-full object-cover bg-neutral-200"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold flex items-center justify-center text-xs">
                          {partnerName?.charAt(0).toUpperCase()}
                        </div>
                      )}

                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-black text-white dark:bg-white dark:text-black rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-neutral-900 animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                    </div>

                    {/* Text Summary */}
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          {partnerName}
                        </p>
                        <span className="text-[10px] text-neutral-400 font-mono shrink-0">
                          {timeAgo(conv.lastMessageAt)}
                        </span>
                      </div>

                      {partnerIsTyping ? (
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold animate-pulse">
                          Sedang mengetik...
                        </p>
                      ) : (
                        <div className="flex items-center gap-1 text-[11px] text-neutral-500 truncate">
                          {isLastSenderMe && (
                            <span title="Mark 2 Centang" className="shrink-0 text-sky-500">
                              <CheckCheck className="w-3.5 h-3.5" />
                            </span>
                          )}
                          <span className="truncate">{conv.lastMessage || 'Tidak ada pesan'}</span>
                        </div>
                      )}

                      <div className="text-[10px] text-neutral-400 truncate">
                        Produk: {conv.productName}
                      </div>
                    </div>
                  </div>

                  {/* Product Image Thumbnail */}
                  <div className="shrink-0">
                    {conv.productImage ? (
                      <img
                        src={conv.productImage}
                        alt={conv.productName}
                        className="w-10 h-10 rounded-lg object-cover border border-neutral-200 dark:border-neutral-800"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
                        <Store className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Area: Active Chat Room or Empty Placeholder (Hidden on mobile if no active conversation) */}
      <div
        className={`flex-1 h-full flex flex-col min-h-0 min-w-0 bg-neutral-50 dark:bg-[#080808] ${
          !activeConversationId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeConversationId ? (
          <ChatRoomPanel
            conversationId={activeConversationId}
            navigate={navigate}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-neutral-200/80 dark:bg-neutral-900/80 flex items-center justify-center text-neutral-400 dark:text-neutral-600 shadow-inner">
              <MessageSquare className="w-10 h-10" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Anasagi Store Chat</h2>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Kirim dan terima pesan secara realtime dengan penjual & pembeli. Pilih salah satu percakapan di sebelah kiri untuk mulai.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-200/50 dark:bg-neutral-800/50 text-[11px] text-neutral-500 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Pesan aman & mendukung file foto / video hingga 1 GB
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
