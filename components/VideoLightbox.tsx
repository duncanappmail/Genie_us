
import React, { useEffect, useState } from 'react';
import type { UploadedFile } from '../types';
import { ModalWrapper } from './ModalWrapper';
import { 
    ArrowPathIcon, VideoCameraIcon, VideoIcon, ArrowDownTrayIcon 
} from './icons';

interface VideoLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  asset: UploadedFile | null;
  onRegenerate?: (asset: UploadedFile) => void;
  onAnimate?: (asset: UploadedFile) => void;
  onExtend?: (asset: UploadedFile) => void;
  onDownload?: (asset: UploadedFile) => void;
}

const LightboxActionButton: React.FC<{ 
    icon: React.ReactNode; 
    label: string; 
    onClick: () => void;
}> = ({ icon, label, onClick }) => (
    <button 
        onClick={onClick}
        className="flex-1 min-w-0 flex flex-col items-center justify-center gap-2 py-4 border border-white/20 bg-white/10 active:scale-95 transition-all rounded-lg shadow-lg"
    >
        <div className="text-white">
            {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5" })}
        </div>
        <span className="text-xs font-normal text-white text-center leading-tight">
            {label}
        </span>
    </button>
);

export const VideoLightbox: React.FC<VideoLightboxProps> = ({ 
    isOpen, onClose, asset, onRegenerate, onAnimate, onExtend, onDownload 
}) => {
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

  const handleDownloadInternal = () => {
    if (onDownload) {
        onDownload(asset);
    } else {
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = asset.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
      <div className="relative w-full max-w-4xl flex flex-col items-center">
        
        {/* Media Container - Spans full width on mobile to align with buttons */}
        <div className="relative w-full md:w-fit flex justify-center group/media">
            {isVideo ? (
                <video 
                  src={objectUrl} 
                  className="w-full h-auto md:w-auto md:h-auto rounded-2xl shadow-2xl max-h-[70vh] md:max-h-[75vh]" 
                  controls 
                  autoPlay 
                  aria-label={asset.name}
                />
            ) : (
                <img 
                  src={objectUrl} 
                  className="w-full h-auto md:w-auto md:h-auto rounded-2xl shadow-2xl max-w-full max-h-[70vh] md:max-h-[75vh] object-contain" 
                  alt={asset.name}
                />
            )}
            
            {/* Close Button - Integrated into top-right of media area */}
            <button 
              onClick={onClose} 
              className="absolute top-3 right-3 bg-black/40 backdrop-blur-xl text-white border border-white/20 rounded-full p-2 shadow-2xl hover:bg-[#91EB23] hover:text-[#050C26] dark:hover:bg-[#91EB23] dark:hover:text-[#050C26] transition-all z-50 hover:scale-110 active:scale-95"
              aria-label="Close viewer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
        </div>

        {/* Action Center Dock - Only visible on Mobile (md:hidden), fills screen width */}
        <div className="w-full mt-6 flex md:hidden">
            <div className="flex w-full gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {onRegenerate && (
                    <LightboxActionButton 
                        icon={<ArrowPathIcon />} 
                        label="Regenerate" 
                        onClick={() => { onRegenerate(asset); onClose(); }} 
                    />
                )}

                {isVideo ? (
                    onExtend && (
                        <LightboxActionButton 
                            icon={<VideoIcon />} 
                            label="Extend" 
                            onClick={() => { onExtend(asset); onClose(); }} 
                        />
                    )
                ) : (
                    onAnimate && (
                        <LightboxActionButton 
                            icon={<VideoCameraIcon />} 
                            label="Animate" 
                            onClick={() => { onAnimate(asset); onClose(); }} 
                        />
                    )
                )}

                <LightboxActionButton 
                    icon={<ArrowDownTrayIcon />} 
                    label="Download" 
                    onClick={handleDownloadInternal} 
                />
            </div>
        </div>
      </div>
    </ModalWrapper>
  );
};
