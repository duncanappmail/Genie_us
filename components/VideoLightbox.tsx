import React, { useEffect, useState, useCallback } from 'react';
import type { UploadedFile } from '../types';
import { ModalWrapper } from './ModalWrapper';
import { 
    ArrowPathIcon, VideoCameraIcon, VideoIcon, ArrowDownTrayIcon,
    LeftArrowIcon, RightArrowIcon
} from './icons';

interface VideoLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  items: UploadedFile[];
  initialIndex: number;
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

const NavArrow: React.FC<{ 
    direction: 'left' | 'right'; 
    onClick: () => void;
    disabled?: boolean;
}> = ({ direction, onClick, disabled }) => (
    <button 
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        disabled={disabled}
        className={`hidden md:flex absolute top-1/2 -translate-y-1/2 z-[100] p-4 rounded-full bg-black/40 text-white border border-white/20 backdrop-blur-lg hover:bg-[#91EB23] hover:text-[#050C26] hover:scale-110 transition-all disabled:opacity-0 disabled:pointer-events-none shadow-2xl ${
            direction === 'left' ? '-left-20' : '-right-20'
        }`}
    >
        {direction === 'left' ? (
            <LeftArrowIcon className="w-6 h-6" />
        ) : (
            <RightArrowIcon className="w-6 h-6" />
        )}
    </button>
);

export const VideoLightbox: React.FC<VideoLightboxProps> = ({ 
    isOpen, onClose, items = [], initialIndex, onRegenerate, onAnimate, onExtend, onDownload 
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
        // Defend against out-of-bounds initial index
        const safeIndex = Math.min(Math.max(0, initialIndex), Math.max(0, items.length - 1));
        setCurrentIndex(safeIndex);
    }
  }, [isOpen, initialIndex, items.length]);

  const asset = items[currentIndex];

  useEffect(() => {
    if (asset?.blob) {
      const url = URL.createObjectURL(asset.blob);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setObjectUrl(null);
  }, [asset]);

  const handleNext = useCallback(() => {
    if (items.length <= 1) return;
    setCurrentIndex(prev => (prev + 1) % items.length);
  }, [items.length]);

  const handlePrev = useCallback(() => {
    if (items.length <= 1) return;
    setCurrentIndex(prev => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!isOpen) return;
        if (e.key === 'ArrowRight') handleNext();
        if (e.key === 'ArrowLeft') handlePrev();
        if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  if (!asset || !objectUrl) return null;

  const isVideo = asset.mimeType.startsWith('video/');
  const hasMultiple = items.length > 1;

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
      <div className="relative w-full max-w-4xl flex flex-col items-center group/lightbox">
        
        {/* Desktop Side Navigation */}
        {hasMultiple && (
            <>
                <NavArrow direction="left" onClick={handlePrev} />
                <NavArrow direction="right" onClick={handleNext} />
            </>
        )}

        {/* Media Container */}
        <div className="relative w-full md:w-fit flex flex-col items-center group/media max-w-full">
            <div className="relative">
                {isVideo ? (
                    <video 
                      key={asset.id} // Re-mount video on asset change
                      src={objectUrl} 
                      className="w-full h-auto md:w-auto md:h-auto rounded-2xl shadow-2xl max-h-[70vh] md:max-h-[75vh] bg-black" 
                      controls 
                      autoPlay 
                      aria-label={asset.name}
                    />
                ) : (
                    <img 
                      key={asset.id} // Re-mount img on asset change
                      src={objectUrl} 
                      className="w-full h-auto md:w-auto md:h-auto rounded-2xl shadow-2xl max-w-full max-h-[70vh] md:max-h-[75vh] object-contain bg-black" 
                      alt={asset.name}
                    />
                )}
                
                {/* Close Button */}
                <button 
                  onClick={onClose} 
                  className="absolute top-4 right-4 bg-black/40 backdrop-blur-xl text-white border border-white/20 rounded-full p-2 shadow-2xl hover:bg-[#91EB23] hover:text-[#050C26] transition-all z-[110] hover:scale-110 active:scale-95"
                  aria-label="Close viewer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
            </div>

            {/* Counter Badge (Standardized at the bottom) */}
            {hasMultiple && (
                <div className="mt-4 px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-[11px] font-black tracking-widest text-white shadow-lg">
                    {currentIndex + 1} <span className="mx-0.5 lowercase font-normal text-white">of</span> {items.length}
                </div>
            )}
        </div>

        {/* Mobile Action Controls */}
        <div className="w-full mt-6 flex md:hidden px-2">
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

        {/* Mobile Navigation Arrows */}
        {hasMultiple && (
            <div className="flex md:hidden items-center justify-center gap-12 mt-8">
                <button 
                    onClick={handlePrev} 
                    className="p-4 bg-white/10 border border-white/20 rounded-full text-white active:scale-90 transition-transform"
                >
                    <LeftArrowIcon className="w-6 h-6" />
                </button>
                <button 
                    onClick={handleNext} 
                    className="p-4 bg-white/10 border border-white/20 rounded-full text-white active:scale-90 transition-transform"
                >
                    <RightArrowIcon className="w-6 h-6" />
                </button>
            </div>
        )}
      </div>
    </ModalWrapper>
  );
};
