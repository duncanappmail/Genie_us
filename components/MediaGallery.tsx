
import React, { useState } from 'react';
import type { UploadedFile } from '../types';
import { AssetPreview } from './AssetPreview';
import { VideoLightbox } from './VideoLightbox';
import { 
    EyeIcon, ArrowPathIcon, VideoCameraIcon, VideoIcon, ArrowDownTrayIcon
} from './icons';

interface MediaGalleryProps {
    assets: UploadedFile[];
    onRegenerate?: (asset: UploadedFile) => void;
    onAnimate?: (asset: UploadedFile) => void;
    onExtend?: (asset: UploadedFile) => void;
    onDownload?: (asset: UploadedFile) => void;
    isRegenerating?: 'image' | 'video' | null;
    primaryFormat?: 'image' | 'video';
}

const ActionButton: React.FC<{ 
    icon: React.ReactNode; 
    label: string; 
    onClick: (e: React.MouseEvent) => void;
    danger?: boolean;
}> = ({ icon, label, onClick, danger }) => (
    <div className="relative group/btn">
        <button 
            onClick={onClick}
            className={`p-2 rounded-full backdrop-blur-md transition-all duration-200 border border-white/20 hover:scale-110 active:scale-95 shadow-lg ${
                danger 
                ? 'bg-red-500/20 hover:bg-red-500/40 text-red-200' 
                : 'bg-white/10 hover:bg-white/30 text-white'
            }`}
        >
            {React.cloneElement(icon as React.ReactElement, { className: "w-4 h-4" })}
        </button>
        <div className="hidden md:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs font-semibold rounded-md opacity-0 pointer-events-none group-hover/btn:opacity-100 transition-opacity whitespace-nowrap z-[60] shadow-xl">
            {label}
        </div>
    </div>
);

const SectionHeader: React.FC<{ label: string }> = ({ label }) => (
    <div className="mb-4">
        <label className="block text-xs font-black uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500">
            {label}
        </label>
    </div>
);

const GenieSpinner: React.FC<{ size?: string }> = ({ size = "w-10 h-10" }) => (
    <div className={size}>
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="g-mini" x1="0" y1="0" x2="1" y2="1">
                    <stop stopColor="#91EB23" offset="0%"/>
                    <stop stopColor="#86DB1E" offset="100%"/>
                </linearGradient>
            </defs>
            <path d="M 50,50 m 0,-48 a 48,48 0 1 1 0,96 a 48,48 0 1 1 0,-96" fill="none" stroke="url(#g-mini)" strokeWidth="8">
                <animateTransform 
                    attributeName="transform"
                    type="rotate"
                    from="0 50 50"
                    to="360 50 50"
                    dur="1.5s"
                    repeatCount="indefinite"
                />
                <animate 
                    attributeName="stroke-dasharray" 
                    values="150.8, 150.8; 1, 300; 150.8, 150.8" 
                    dur="1.5s" 
                    repeatCount="indefinite" 
                />
            </path>
        </svg>
    </div>
);

export const MediaGallery: React.FC<MediaGalleryProps> = ({ 
    assets, onRegenerate, onAnimate, onExtend, onDownload, isRegenerating, primaryFormat = 'image' 
}) => {
    const [selectedAsset, setSelectedAsset] = useState<UploadedFile | null>(null);

    const imageAssets = assets.filter(a => a.mimeType.startsWith('image/')).reverse();
    const videoAssets = assets.filter(a => a.mimeType.startsWith('video/')).reverse();

    const showImages = imageAssets.length > 0 || isRegenerating === 'image';
    const showVideos = videoAssets.length > 0 || isRegenerating === 'video';

    if (!showImages && !showVideos) return null;

    const handleDownloadClick = (e: React.MouseEvent, asset: UploadedFile) => {
        e.stopPropagation();
        if (onDownload) {
            onDownload(asset);
        } else {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(asset.blob);
            link.download = asset.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        }
    };

    const renderAssetGrid = (items: UploadedFile[], type: 'image' | 'video') => (
        <div className="grid grid-cols-3 gap-3 md:gap-4">
            {isRegenerating === type && (
                <div className="relative aspect-square rounded-xl bg-gray-50 dark:bg-[#131517] border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center overflow-hidden">
                    <GenieSpinner size="w-8 h-8" />
                    <span className="mt-3 text-sm font-normal text-gray-600 dark:text-gray-400 animate-pulse">Regenerating...</span>
                </div>
            )}

            {items.map((asset) => {
                const isVideo = asset.mimeType.startsWith('video/');
                const isLatest = asset.id === assets[assets.length - 1].id;
                
                return (
                    <div 
                        key={asset.id}
                        onClick={() => setSelectedAsset(asset)}
                        className="relative aspect-square group cursor-pointer"
                    >
                        <div className="w-full h-full rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-900 shadow-sm">
                            <AssetPreview asset={asset} objectFit="cover" hoverEffect={true} />
                        </div>

                        <div className="absolute inset-0 z-10 hidden md:flex items-end justify-center p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-xl" />
                            <div className="relative z-20 flex items-center justify-center gap-1.5">
                                <ActionButton 
                                    icon={<EyeIcon />} 
                                    label="Preview" 
                                    onClick={(e) => { e.stopPropagation(); setSelectedAsset(asset); }} 
                                />
                                
                                {onRegenerate && (
                                    <ActionButton 
                                        icon={<ArrowPathIcon />} 
                                        label="Regenerate" 
                                        onClick={(e) => { e.stopPropagation(); onRegenerate(asset); }} 
                                    />
                                )}

                                {isVideo ? (
                                    onExtend && (
                                        <ActionButton 
                                            icon={<VideoIcon />} 
                                            label="Extend" 
                                            onClick={(e) => { e.stopPropagation(); onExtend(asset); }} 
                                        />
                                    )
                                ) : (
                                    onAnimate && (
                                        <ActionButton 
                                            icon={<VideoCameraIcon />} 
                                            label="Animate" 
                                            onClick={(e) => { e.stopPropagation(); onAnimate(asset); }} 
                                        />
                                    )
                                )}

                                <ActionButton 
                                    icon={<ArrowDownTrayIcon />} 
                                    label="Download" 
                                    onClick={(e) => handleDownloadClick(e, asset)} 
                                />
                            </div>
                        </div>
                        
                        {isLatest && (
                            <div className="absolute top-2 left-2 bg-brand-accent text-[#050C26] text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm z-[15] uppercase tracking-tighter ring-1 ring-white/20">
                                NEW
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );

    const sectionData = {
        image: {
            visible: showImages,
            header: "Visuals",
            content: renderAssetGrid(imageAssets, 'image'),
            // "Visuals" hugs content (h-fit) IF a motion section is present.
            // Otherwise, it takes all available space to align with the copy column.
            className: showVideos ? 'h-fit flex-none' : 'flex-1'
        },
        video: {
            visible: showVideos,
            header: "Motion",
            content: renderAssetGrid(videoAssets, 'video'),
            // "Motion" always tries to occupy the remaining space to push the bottom edge down.
            className: 'flex-1'
        }
    };

    const firstKey = primaryFormat;
    const secondKey = primaryFormat === 'image' ? 'video' : 'image';

    return (
        <div className="w-full flex flex-col h-full gap-6">
            {/* Primary Section Card */}
            {sectionData[firstKey].visible && (
                <div className={`bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-top-4 duration-500 ${sectionData[firstKey].className}`}>
                    <SectionHeader label={sectionData[firstKey].header} />
                    {sectionData[firstKey].content}
                </div>
            )}

            {/* Secondary Section Card */}
            {sectionData[secondKey].visible && (
                <div className={`bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-top-4 duration-500 delay-150 ${sectionData[secondKey].className}`}>
                    <SectionHeader label={sectionData[secondKey].header} />
                    {sectionData[secondKey].content}
                </div>
            )}
            
            <VideoLightbox 
                isOpen={!!selectedAsset} 
                onClose={() => setSelectedAsset(null)} 
                asset={selectedAsset}
                onRegenerate={onRegenerate}
                onAnimate={onAnimate}
                onExtend={onExtend}
                onDownload={onDownload}
            />
        </div>
    );
};
