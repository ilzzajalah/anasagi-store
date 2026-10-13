import React from 'react';
import { X, Download, FileVideo, Image as ImageIcon } from 'lucide-react';
import { formatFileSize } from '../../lib/mediaStorage';

interface MediaViewerModalProps {
  mediaUrl: string;
  mediaType: 'image' | 'video';
  mediaName?: string;
  mediaSize?: number;
  onClose: () => void;
}

export function MediaViewerModal({
  mediaUrl,
  mediaType,
  mediaName = 'Media',
  mediaSize,
  onClose,
}: MediaViewerModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 animate-fadeIn">
      {/* Top Bar */}
      <div className="flex items-center justify-between text-white z-10">
        <div className="flex items-center gap-3 min-w-0">
          {mediaType === 'image' ? (
            <ImageIcon className="w-5 h-5 text-neutral-400 shrink-0" />
          ) : (
            <FileVideo className="w-5 h-5 text-neutral-400 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-bold truncate max-w-xs sm:max-w-md">{mediaName}</p>
            {mediaSize && (
              <p className="text-xs text-neutral-400 font-mono">{formatFileSize(mediaSize)}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={mediaUrl}
            download={mediaName}
            target="_blank"
            rel="noreferrer"
            className="p-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full transition-all"
            title="Unduh File"
          >
            <Download className="w-5 h-5" />
          </a>
          <button
            onClick={onClose}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full transition-all"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-2 overflow-hidden my-auto">
        {mediaType === 'image' ? (
          <img
            src={mediaUrl}
            alt={mediaName}
            className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl"
          />
        ) : (
          <video
            src={mediaUrl}
            controls
            autoPlay
            className="max-h-[85vh] max-w-full rounded-lg shadow-2xl bg-black"
          />
        )}
      </div>

      {/* Footer Info */}
      <div className="text-center text-xs text-neutral-400 py-2">
        Anasagi Store Media Viewer · Maksimal file hingga 1 GB
      </div>
    </div>
  );
}
