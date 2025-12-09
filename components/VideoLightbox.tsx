
import React, { useEffect, useState } from 'react';
import type { UploadedFile } from '../types';
import { ModalWrapper } from './ModalWrapper';

interface VideoLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  asset: UploadedFile | null;
}

export const VideoLightbox: React.FC<VideoLightboxProps> = ({ isOpen, onClose, asset }) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (asset?.blob) {
      const url = URL.createObjectURL(asset.blob);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setObjectUrl(null);
  }, [asset]);

  if (!asset || !objectUrl) return null;

  const isVideo = asset.mimeType.startsWith('video/');

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
      <div className="relative w-full max-w-4xl flex justify-center">
        {isVideo ? (
            <video 
              src={objectUrl} 
              className="w-full h-auto rounded-lg shadow-2xl max-h-[85vh]" 
              controls 
              autoPlay 
              aria-label={asset.name}
            />
        ) : (
            <img 
              src={objectUrl} 
              className="w-auto h-auto rounded-lg shadow-2xl max-w-full max-h-[85vh] object-contain" 
              alt={asset.name}
            />
        )}
        <button 
          onClick={onClose} 
          className="absolute -top-12 right-0 bg-white text-gray-800 rounded-full p-2 shadow-lg hover:bg-gray-200 transition-colors"
          aria-label="Close viewer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </ModalWrapper>
  );
};
