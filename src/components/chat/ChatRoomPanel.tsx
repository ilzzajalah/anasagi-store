import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChatRoom } from '../../hooks/useConversations';
import { formatRupiah } from '../../lib/utils';
import { formatFileSize } from '../../lib/mediaStorage';
import {
  ArrowLeft,
  Send,
  Store,
  Package,
  ExternalLink,
  Paperclip,
  X,
  FileVideo,
  Image as ImageIcon,
  Loader2,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessageItem } from './ChatMessageItem';

interface ChatRoomPanelProps {
  conversationId: string;
  navigate: (path: string) => void;
  isMobile?: boolean;
}

export function ChatRoomPanel({ conversationId, navigate }: ChatRoomPanelProps) {
  const { user, profile } = useAuth();
  const { conversation, messages, partnerIsTyping, handleTyping, loading, sendMessage } = useChatRoom(
    conversationId,
    user?.uid
  );

  const [inputMsg, setInputMsg] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chatFeedRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const isAtBottomRef = useRef<boolean>(true);
  const prevMessagesCountRef = useRef<number>(0);
  const initialLoadRef = useRef<string | null>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (chatFeedRef.current) {
      chatFeedRef.current.scrollTo({
        top: chatFeedRef.current.scrollHeight,
        behavior,
      });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }
  };

  const handleScroll = () => {
    if (!chatFeedRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatFeedRef.current;
    // User is at bottom if distance to bottom is less than 120px
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    const atBottom = distanceToBottom < 120;
    isAtBottomRef.current = atBottom;
    setShowScrollBottomBtn(!atBottom);
  };

  // Initial load or conversation change -> scroll to bottom automatically
  useEffect(() => {
    if (conversationId !== initialLoadRef.current) {
      initialLoadRef.current = conversationId;
      prevMessagesCountRef.current = messages.length;
      isAtBottomRef.current = true;
      setShowScrollBottomBtn(false);

      const timer = setTimeout(() => {
        scrollToBottom('auto');
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [conversationId, messages]);

  // Smart auto-scroll when new messages arrive or when typing state changes
  useEffect(() => {
    if (messages.length === 0) return;

    const isNewMsgAdded = messages.length > prevMessagesCountRef.current;
    const lastMsg = messages[messages.length - 1];
    const isMyMessage = lastMsg?.senderId === user?.uid;

    // Scroll to bottom if user just sent a message OR if user was already at the bottom
    if (isMyMessage || isAtBottomRef.current) {
      scrollToBottom('smooth');
    }

    prevMessagesCountRef.current = messages.length;
  }, [messages, partnerIsTyping, user?.uid]);

  // Handle media file select (up to 1GB)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1GB limit = 1024 * 1024 * 1024 bytes
    const maxSizeBytes = 1024 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error('Ukuran file maksimal 1 GB.');
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl(null);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMsg(e.target.value);
    handleTyping();
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputMsg.trim() && !selectedFile) || !profile) return;

    if (inputMsg.length > 1000) {
      toast.error('Pesan teks maksimal 1000 karakter.');
      return;
    }

    const text = inputMsg;
    const file = selectedFile;

    setInputMsg('');
    clearSelectedFile();
    setSending(true);

    try {
      await sendMessage(text, profile, file);
      // Ensure we scroll to bottom after sending
      isAtBottomRef.current = true;
      setTimeout(() => scrollToBottom('smooth'), 100);
    } catch (err) {
      toast.error('Gagal mengirim pesan.');
      setInputMsg(text);
      if (file) setSelectedFile(file);
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
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3 animate-pulse bg-neutral-50 dark:bg-[#080808]">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        <p className="text-xs text-neutral-500 font-medium">Memuat percakapan...</p>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 bg-neutral-50 dark:bg-[#080808]">
        <Package className="w-12 h-12 text-neutral-400" />
        <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Percakapan Tidak Ditemukan</h2>
        <button
          onClick={() => navigate('/inbox')}
          className="px-4 py-2 text-xs font-bold text-white bg-neutral-900 rounded-xl"
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
    <div className="flex-1 flex flex-col h-full bg-neutral-100/50 dark:bg-[#080808] overflow-hidden relative min-h-0 min-w-0">
      
      {/* Header: Partner & Product Bar */}
      <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800/80 bg-white/90 dark:bg-[#0f0f0f]/90 backdrop-blur-md flex items-center justify-between gap-3 shrink-0 shadow-2xs z-10">
        <div className="flex items-center gap-3 min-w-0">
          {/* Back button on mobile */}
          <button
            onClick={() => navigate('/inbox')}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-lg transition-transform active:scale-95 md:hidden shrink-0"
            title="Kembali ke Inbox"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="relative shrink-0">
            {partnerAvatar ? (
              <img
                src={partnerAvatar}
                alt={partnerName}
                className="w-10 h-10 rounded-full object-cover bg-neutral-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold flex items-center justify-center text-sm">
                {partnerName?.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-neutral-900 rounded-full" />
          </div>

          <div className="min-w-0">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white truncate leading-tight">
              {partnerName}
            </h2>
            {partnerIsTyping ? (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold animate-pulse">
                Sedang mengetik...
              </p>
            ) : (
              <p className="text-[11px] text-neutral-500 flex items-center gap-1">
                <span>{isBuyer ? 'Penjual' : 'Pembeli'}</span>
                <span>·</span>
                <span className="text-emerald-500 font-medium">Online</span>
              </p>
            )}
          </div>
        </div>

        {/* Product Card shortcut */}
        <button
          onClick={() => navigate(`/product/${conversation.productId}`)}
          className="flex items-center gap-2.5 p-1.5 pl-2.5 pr-3 bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700/80 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-left shrink-0"
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

          <div className="hidden sm:block text-xs min-w-0">
            <p className="font-semibold text-neutral-900 dark:text-white truncate max-w-[130px]">
              {conversation.productName}
            </p>
            <p className="text-[10px] font-mono text-neutral-500">
              {formatRupiah(conversation.productPrice)}
            </p>
          </div>

          <ExternalLink className="w-3.5 h-3.5 text-neutral-400 ml-1 shrink-0" />
        </button>
      </div>

      {/* Messages Feed */}
      <div
        ref={chatFeedRef}
        onScroll={handleScroll}
        className="flex-1 p-4 overflow-y-auto min-h-0 space-y-3 bg-[#e5ddd5]/10 dark:bg-[#0a0a0a] overscroll-contain"
      >
        
        {/* Security Banner */}
        <div className="text-center my-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/70 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-400 text-[11px] rounded-full font-medium shadow-2xs border border-neutral-200/50 dark:border-neutral-700/50">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Pesan terenkripsi & dipantau oleh Anasagi Store
          </span>
        </div>

        {/* Message Items */}
        {messages.map((msg) => (
          <ChatMessageItem
            key={msg.id}
            msg={msg}
            isMe={msg.senderId === user?.uid}
            conversation={conversation}
            navigate={navigate}
          />
        ))}

        {/* Realtime Partner Typing Bubble */}
        <AnimatePresence>
          {partnerIsTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="flex items-center gap-2 my-2"
            >
              {partnerAvatar ? (
                <img
                  src={partnerAvatar}
                  alt={partnerName}
                  className="w-6 h-6 rounded-full object-cover bg-neutral-200 shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-neutral-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {partnerName?.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl rounded-bl-xs flex items-center gap-1.5 shadow-2xs">
                <span className="text-xs text-neutral-600 dark:text-neutral-300 font-medium">
                  {partnerName} sedang mengetik
                </span>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottomBtn && (
        <button
          type="button"
          onClick={() => {
            scrollToBottom('smooth');
            setShowScrollBottomBtn(false);
          }}
          className="absolute bottom-20 right-6 p-2.5 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-white rounded-full shadow-lg border border-neutral-200 dark:border-neutral-700 hover:scale-110 active:scale-95 transition-all z-20 flex items-center justify-center"
          title="Ke pesan terbaru"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}

      {/* Attached Media File Preview Area (before sending) */}
      {selectedFile && (
        <div className="px-4 py-2.5 bg-neutral-100 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {filePreviewUrl ? (
              <img
                src={filePreviewUrl}
                alt="Preview"
                className="w-12 h-12 rounded-lg object-cover border border-neutral-300 dark:border-neutral-700 shrink-0"
              />
            ) : selectedFile.type.startsWith('video/') ? (
              <div className="w-12 h-12 rounded-lg bg-neutral-800 text-white flex items-center justify-center shrink-0">
                <FileVideo className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center shrink-0 text-neutral-500">
                <ImageIcon className="w-6 h-6" />
              </div>
            )}

            <div className="text-xs min-w-0">
              <p className="font-bold text-neutral-900 dark:text-white truncate max-w-xs">
                {selectedFile.name}
              </p>
              <p className="text-[10px] text-neutral-500 font-mono">
                {formatFileSize(selectedFile.size)} · Siap dikirim (Maks 1 GB)
              </p>
            </div>
          </div>

          <button
            onClick={clearSelectedFile}
            className="p-1.5 text-neutral-500 hover:text-red-500 dark:hover:text-red-400 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
            title="Hapus Lampiran"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sending Spinner Overlay Bar */}
      {sending && (
        <div className="px-4 py-1.5 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 text-xs flex items-center gap-2 border-t border-sky-100 dark:border-sky-900 shrink-0">
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          <span>Mengirim pesan & memproses media...</span>
        </div>
      )}

      {/* Input Form Bar */}
      <form
        onSubmit={handleSend}
        className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0f0f0f] flex items-end gap-2 shrink-0 z-10"
      >
        {/* Attachment Button */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,video/*"
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors shrink-0"
          title="Lampirkan Foto/Video (hingga 1GB)"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Text Area Input */}
        <div className="flex-1 relative">
          <textarea
            value={inputMsg}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Tulis pesan... (Enter kirim, Shift+Enter baris baru)"
            rows={1}
            maxLength={1000}
            className="w-full pl-3.5 pr-10 py-2.5 text-xs sm:text-sm bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white resize-none max-h-24"
          />
          <span className="absolute right-3 bottom-2 text-[10px] text-neutral-400 font-mono">
            {inputMsg.length}/1000
          </span>
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={(!inputMsg.trim() && !selectedFile) || sending}
          className={`p-2.5 rounded-xl transition-all duration-200 shrink-0 ${
            (inputMsg.trim() || selectedFile) && !sending
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
