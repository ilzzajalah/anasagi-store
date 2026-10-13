import React, { useState, useEffect } from 'react';
import { Message, Conversation } from '../../types';
import { formatRupiah, timeAgo } from '../../lib/utils';
import { getLocalMediaBlob, formatFileSize } from '../../lib/mediaStorage';
import { CheckCheck, Store, Play, FileVideo, Image as ImageIcon, Download } from 'lucide-react';
import { MediaViewerModal } from './MediaViewerModal';

interface ChatMessageItemProps {
  msg: Message;
  isMe: boolean;
  conversation: Conversation;
  navigate: (path: string) => void;
}

export function ChatMessageItem({ msg, isMe, conversation, navigate }: ChatMessageItemProps) {
  const [localMediaUrl, setLocalMediaUrl] = useState<string | null>(msg.mediaUrl || null);
  const [showMediaModal, setShowMediaModal] = useState(false);

  useEffect(() => {
    let active = true;
    // If it's media and we don't have a direct mediaUrl, check IndexedDB for local blob
    if (msg.mediaType && !localMediaUrl) {
      getLocalMediaBlob(msg.id).then((blob) => {
        if (active && blob) {
          const url = URL.createObjectURL(blob);
          setLocalMediaUrl(url);
        }
      });
    }

    return () => {
      active = false;
    };
  }, [msg.id, msg.mediaType, localMediaUrl]);

  const activeMediaUrl = localMediaUrl || msg.thumbnailUrl || msg.mediaUrl;

  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} my-1`}>
      {/* Product Card for initial inquiry */}
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
            <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center">
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

      {/* Message Content Bubble */}
      <div
        className={`max-w-[85%] sm:max-w-md rounded-2xl text-xs sm:text-sm shadow-xs overflow-hidden ${
          isMe
            ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-br-xs'
            : 'bg-neutral-200/90 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-bl-xs'
        }`}
      >
        {/* Media Preview Attachment (Image / Video) */}
        {msg.mediaType && (
          <div className="p-1">
            {msg.mediaType === 'image' && activeMediaUrl && (
              <div
                onClick={() => setShowMediaModal(true)}
                className="relative group cursor-pointer overflow-hidden rounded-xl bg-neutral-950"
              >
                <img
                  src={activeMediaUrl}
                  alt={msg.mediaName || 'Foto'}
                  className="w-full max-h-72 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <ImageIcon className="w-8 h-8 drop-shadow" />
                </div>
              </div>
            )}

            {msg.mediaType === 'video' && (
              <div className="relative group rounded-xl overflow-hidden bg-black p-1">
                {localMediaUrl ? (
                  <video
                    src={localMediaUrl}
                    controls
                    poster={msg.thumbnailUrl}
                    className="w-full max-h-72 rounded-lg object-contain bg-black"
                  />
                ) : msg.thumbnailUrl ? (
                  <div
                    onClick={() => setShowMediaModal(true)}
                    className="relative cursor-pointer group"
                  >
                    <img
                      src={msg.thumbnailUrl}
                      alt={msg.mediaName || 'Video'}
                      className="w-full max-h-72 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/90 text-neutral-900 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 fill-current ml-1" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 flex items-center gap-3 text-white">
                    <FileVideo className="w-8 h-8 text-neutral-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{msg.mediaName || 'Video'}</p>
                      {msg.mediaSize && (
                        <p className="text-[10px] opacity-75">{formatFileSize(msg.mediaSize)}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Video Info Badge */}
                <div className="px-2 py-1 text-[10px] flex items-center justify-between opacity-80 pt-1">
                  <span className="truncate">{msg.mediaName || 'Video'}</span>
                  {msg.mediaSize && <span>{formatFileSize(msg.mediaSize)}</span>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Text Body */}
        {msg.content && (
          <div className="px-3.5 py-2 whitespace-pre-wrap leading-relaxed break-words">
            {msg.content}
          </div>
        )}
      </div>

      {/* Timestamp & Mark 2 Read Status */}
      <div
        className={`flex items-center gap-1 text-[10px] text-neutral-400 mt-1 ${
          isMe ? 'pr-1' : 'pl-1'
        }`}
      >
        <span>{timeAgo(msg.createdAt)}</span>
        {isMe && (
          msg.isRead ? (
            <span title="Dibaca (Mark 2 - Centang 2 Biru)" className="flex items-center gap-0.5 text-sky-500 font-bold">
              <CheckCheck className="w-3.5 h-3.5" />
            </span>
          ) : (
            <span title="Terkirim (Mark 2 - Centang 2 Abu)" className="flex items-center gap-0.5 text-neutral-400 font-medium">
              <CheckCheck className="w-3.5 h-3.5" />
            </span>
          )
        )}
      </div>

      {/* Lightbox Modal */}
      {showMediaModal && activeMediaUrl && msg.mediaType && (
        <MediaViewerModal
          mediaUrl={activeMediaUrl}
          mediaType={msg.mediaType}
          mediaName={msg.mediaName}
          mediaSize={msg.mediaSize}
          onClose={() => setShowMediaModal(false)}
        />
      )}
    </div>
  );
}
