import React, { useState, useEffect, useRef } from 'react';
import type { UploadedFile } from '../types';
import { SparklesIcon, PlayCircleIcon } from './icons';

interface AssetPreviewProps {
    asset: UploadedFile;
    objectFit?: 'contain' | 'cover';
    hoverEffect?: boolean;
    onClick?: (asset: UploadedFile) => void;
}

export const AssetPreview: React.FC<AssetPreviewProps> = React.memo(({ asset, objectFit = 'contain', hoverEffect = false, onClick }) => {
    const [objectUrl, setObjectUrl] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (asset.blob) {
            const url = URL.createObjectURL(asset.blob);
            setObjectUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [asset.blob]);
    
    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    videoElement.play().catch(error => console.error("Video autoplay failed:", error));
                } else {
                    videoElement.pause();
                }
            },
            { threshold: 0.5 } // Play when at least 50% of the video is visible
        );

        observer.observe(videoElement);

        return () => {
            if (videoElement) {
                observer.unobserve(videoElement);
            }
        };
    }, [objectUrl]);


    if (!objectUrl) {
        return <div className="w-full h-full flex items-center justify-center"><SparklesIcon className="w-12 h-12 text-gray-400" /></div>;
    }
    
    const isVideo = asset.mimeType.startsWith('video/');
    // Restrict hoverEffect to desktop (md breakpoint)
    const commonClasses = `w-full h-full object-${objectFit} ${hoverEffect ? 'transition-transform duration-300 ease-in-out md:group-hover:scale-110' : ''}`;

    const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (onClick && isVideo) {
            e.stopPropagation(); // Prevent parent onClick from firing (e.g., navigating to project)
            onClick(asset);
        }
    }

    return (
        <div 
            className={`w-full h-full relative ${isVideo && onClick ? 'cursor-pointer' : ''}`}
            onClick={handleContainerClick}
        >
            {isVideo ? (
                <>
                    <video 
                        ref={videoRef}
                        src={objectUrl} 
                        className={commonClasses}
                        muted 
                        autoPlay 
                        loop 
                        playsInline 
                    />
                    {onClick && (
                        <div className="absolute inset-0 bg-black bg-opacity-0 md:group-hover:bg-opacity-40 flex items-center justify-center transition-all duration-300">
                           <PlayCircleIcon className="w-12 h-12 text-white opacity-0 md:group-hover:opacity-80 md:group-hover:scale-110 transform transition-all duration-300" />
                        </div>
                    )}
                </>
            ) : (
                <img src={objectUrl} alt="Project preview" className={commonClasses} />
            )}
        </div>
    );
});