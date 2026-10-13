import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChatRoom } from '../hooks/useConversations';
import { formatRupiah, timeAgo } from '../lib/utils';
import {
  ArrowLeft,
  Send,
  Store,
  Check,
  CheckCheck,
  Package,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface ChatRoomPageProps {
  conversationId: string;
  navigate: (path: string) => void;
}

export function ChatRoomPage({ conversationId, navigate }: ChatRoomPageProps) {
  const { user, profile } = useAuth();
  const { conversation, messages, partnerIsTyping, handleTyping, loading, sendMessage } = useChatRoom(
    conversationId,
    user?.uid
  );

  const [inputMsg, setInputMsg] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, partnerIsTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMsg(e.target.value);
    handleTyping();
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMsg.trim() || !profile) return;

    if (inputMsg.length > 1000) {
      toast.error('Pesan maksimal 1000 karakter.');
      return;
    }

    const text = inputMsg;
    setInputMsg('');
    setSending(true);

    try {
      await sendMessage(text, profile);
    } catch (err) {
      toast.error('Gagal mengirim pesan.');
      setInputMsg(text);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 space-y-4 animate-pulse">
        <div className="h-16 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
        <div className="h-80 bg-neutral-100 dark:bg-neutral-900 rounded-2xl" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-4">
        <Package className="w-12 h-12 mx-auto text-neutral-400" />
        <h2 className="text-base font-bold text-neutral-900 dark:text-white">Percakapan Tidak Ditemukan</h2>
        <button
          onClick={() => navigate('/inbox')}
          className="px-4 py-2 text-xs font-bold text-white bg-neutral-900 rounded-lg"
        >
          Kembali ke Inbox
        </button>
      </div>
    );
  }

  const isBuyer = conversation.buyerId === user?.uid;
  const partnerName = isBuyer ? conversation.sellerName : conversation.buyerName;
  const partnerAvatar = isBuyer ? conversation.sellerAvatar : conversation.buyerAvatar;

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-120px)] flex flex-col bg-white dark:bg-neutral-900/60 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
      
      {/* Header: Partner & Product Summary */}
      <div className="p-3.5 sm:p-4 border-b border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/inbox')}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-lg transition-transform active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="relative">
            {partnerAvatar ? (
              <img
                src={partnerAvatar}
                alt={partnerName}
                className="w-9 h-9 rounded-full object-cover bg-neutral-200"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold flex items-center justify-center text-xs">
                {partnerName?.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-neutral-900 rounded-full" />
          </div>

          <div>
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white leading-tight">
              {partnerName}
            </h2>
            {partnerIsTyping ? (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold animate-pulse">
                Sedang mengetik...
              </p>
            ) : (
              <p className="text-[11px] text-neutral-500">
                {isBuyer ? 'Penjual' : 'Pembeli'}
              </p>
            )}
          </div>
        </div>

        {/* Product Card summary */}
        <button
          onClick={() => navigate(`/product/${conversation.productId}`)}
          className="flex items-center gap-2 p-1.5 pl-2 pr-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-all hover:scale-105 active:scale-95 text-left"
        >
          {conversation.productImage ? (
            <img
              src={conversation.productImage}
              alt={conversation.productName}
              className="w-8 h-8 rounded-lg object-cover bg-neutral-200"
            />
          ) : (
            <Store className="w-8 h-8 text-neutral-400 p-1" />
          )}

          <div className="hidden sm:block text-xs">
            <p className="font-semibold text-neutral-900 dark:text-white truncate max-w-[140px]">
              {conversation.productName}
            </p>
            <p className="text-[11px] font-mono text-neutral-500">
              {formatRupiah(conversation.productPrice)}
            </p>
          </div>

          <ExternalLink className="w-3.5 h-3.5 text-neutral-400 ml-1" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-neutral-50/50 dark:bg-neutral-950/50">
        
        {/* Security / System Info Banner */}
        <div className="text-center my-2">
          <span className="px-3 py-1 bg-neutral-200/60 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-400 text-[10px] rounded-full font-medium">
            Pesan terenkripsi & dipantau oleh Anasagi Store
          </span>
        </div>

        {messages.map((msg) => {
          const isMe = msg.senderId === user?.uid;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              
              {/* Product Card First Message */}
              {msg.isProductCard && (
                <div
                  onClick={() => navigate(`/product/${conversation.productId}`)}
                  className="mb-2 max-w-sm p-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-2xl shadow-xs cursor-pointer hover:border-neutral-500 transition-all flex items-center gap-3"
                >
                  {conversation.productImage ? (
                    <img
                      src={conversation.productImage}
                      alt={conversation.productName}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center">
                      <Store className="w-6 h-6 text-neutral-400" />
                    </div>
                  )}

                  <div className="text-xs space-y-0.5 min-w-0">
                    <p className="font-bold text-neutral-900 dark:text-white truncate">
                      {conversation.productName}
                    </p>
                    <p className="font-bold text-neutral-900 dark:text-white tabular-nums">
                      {formatRupiah(conversation.productPrice)}
                    </p>
                    <p className="text-[10px] text-neutral-500">Klik untuk melihat rincian produk</p>
                  </div>
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-[80%] sm:max-w-md px-4 py-2.5 rounded-2xl text-xs sm:text-sm whitespace-pre-wrap leading-relaxed shadow-xs ${
                  isMe
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-br-xs'
                    : 'bg-neutral-200/90 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-bl-xs'
                }`}
              >
                {msg.content}
              </div>

              {/* Timestamp & Read Receipts Mark 2 Indicator */}
              <div
                className={`flex items-center gap-1 text-[10px] text-neutral-400 mt-1 ${
                  isMe ? 'pr-1' : 'pl-1'
                }`}
              >
                <span>{timeAgo(msg.createdAt)}</span>
                {isMe && (
                  msg.isRead ? (
                    <span title="Dibaca (Centang 2 Biru)" className="flex items-center gap-0.5 text-sky-500 dark:text-sky-400 font-bold">
                      <CheckCheck className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span title="Terkirim (Centang 2 Abu)" className="flex items-center gap-0.5 text-neutral-400 font-medium">
                      <CheckCheck className="w-3.5 h-3.5" />
                    </span>
                  )
                )}
              </div>

            </div>
          );
        })}

        {/* Realtime Partner Typing Indicator Bubble */}
        <AnimatePresence>
          {partnerIsTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="flex items-center gap-2"
            >
              {partnerAvatar ? (
                <img
                  src={partnerAvatar}
                  alt={partnerName}
                  className="w-6 h-6 rounded-full object-cover bg-neutral-200"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-neutral-900 text-white text-[10px] font-bold flex items-center justify-center">
                  {partnerName?.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="px-3 py-2 bg-neutral-200/80 dark:bg-neutral-800 rounded-2xl rounded-bl-xs flex items-center gap-1">
                <span className="text-xs text-neutral-600 dark:text-neutral-300 font-medium mr-1">
                  {partnerName} sedang mengetik
                </span>
                <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={handleSend}
        className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex items-end gap-2 shrink-0"
      >
        <div className="flex-1 relative">
          <textarea
            value={inputMsg}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Tulis pesan... (Enter untuk kirim, Shift+Enter untuk baris baru)"
            rows={1}
            maxLength={1000}
            className="w-full pl-3 pr-10 py-2.5 text-xs sm:text-sm bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white resize-none max-h-24"
          />
          <span className="absolute right-3 bottom-2 text-[10px] text-neutral-400">
            {inputMsg.length}/1000
          </span>
        </div>

        <button
          type="submit"
          disabled={!inputMsg.trim() || sending}
          className={`p-2.5 rounded-xl transition-all duration-200 shrink-0 ${
            inputMsg.trim() && !sending
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm hover:scale-105 active:scale-95'
              : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}
