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
            return () => {
                URL.revokeObjectURL(url);
            };
        }
    }, [asset.blob]);
    
    // Explicitly load the video when the source URL changes
    useEffect(() => {
        if (videoRef.current && objectUrl) {
            videoRef.current.load();
        }
    }, [objectUrl]);

    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement || !objectUrl) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    // Only attempt to play if we have a valid source and the element is ready or loading
                    const playPromise = videoElement.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(error => {
                            // Suppress AbortError which occurs when a play request is interrupted (e.g. by scrolling away)
                            if (error.name !== 'AbortError') {
                                console.warn("Video playback deferred:", error.message);
                            }
                        });
                    }
                } else {
                    videoElement.pause();
                }
            },
            { threshold: 0.1 } // Start playing as soon as a sliver is visible for better UX
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
    const commonClasses = `w-full h-full object-${objectFit} ${hoverEffect ? 'transition-transform duration-300 ease-in-out md:group-hover:scale-110' : ''}`;

    const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (onClick && isVideo) {
            e.stopPropagation(); 
            onClick(asset);
        }
    };

    return (
        <div 
            className={`w-full h-full relative ${isVideo && onClick ? 'cursor-pointer' : ''}`}
            onClick={handleContainerClick}
        >
            {isVideo ? (
                <>
                    <video 
                        ref={videoRef}
                        className={commonClasses}
                        muted 
                        loop 
                        playsInline 
                        preload="metadata"
                    >
                        <source src={objectUrl} type={asset.mimeType} />
                        Your browser does not support the video tag.
                    </video>
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