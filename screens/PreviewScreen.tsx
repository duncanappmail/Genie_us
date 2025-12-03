
import React, { useState, useEffect, useRef } from 'react';
import { useProjects } from '../context/ProjectContext';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import { AssetPreview } from '../components/AssetPreview';
import {
    ArrowDownTrayIcon, LeftArrowIcon, SparklesIcon, VideoIcon
} from '../components/icons';
import { SocialCopyEditor } from '../components/SocialCopyEditor';
import { VideoLightbox } from '../components/VideoLightbox';
import { ProgressStepper } from '../components/ProgressStepper';
import { AnimateModal } from '../components/AnimateModal';
import { CREDIT_COSTS } from '../constants';
import type { UploadedFile } from '../types';
import { TEMPLATE_LIBRARY } from '../lib/templates';

export const PreviewScreen: React.FC = () => {
    const { currentProject, handleRegenerate, isRegenerating, handleAnimate, isAnimating } = useProjects();
    const { navigateTo, setIsExtendModalOpen, goBack } = useUI();
    const { user } = useAuth();
    
    const [activeIndex, setActiveIndex] = useState(0);
    const [lightboxAsset, setLightboxAsset] = useState<UploadedFile | null>(null);
    const [isAnimateModalOpen, setIsAnimateModalOpen] = useState(false);
    
    // Ref to track previous asset count for auto-selection
    const prevAssetCountRef = useRef(0);

    if (!currentProject) return <div className="p-8 text-center">No project loaded.</div>;
    
    const assets = [...currentProject.generatedImages, ...currentProject.generatedVideos];
    
    // Auto-select new asset when count increases
    useEffect(() => {
        if (assets.length > prevAssetCountRef.current) {
            setActiveIndex(assets.length - 1);
        }
        prevAssetCountRef.current = assets.length;
    }, [assets.length]);
    
    // Handle case where no assets exist (e.g. failed generation)
    if (assets.length === 0) {
        return (
             <div className="max-w-4xl mx-auto p-8 text-center">
                <h3 className="text-xl font-bold mb-2">No visual asset found</h3>
                <p className="text-gray-500 mb-6">It seems something went wrong during generation.</p>
                <button 
                    onClick={goBack}
                    className="px-6 py-2 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors"
                >
                    Back to Generator
                </button>
            </div>
        );
    }

    const activeAsset = assets[activeIndex] || assets[0];
    const isVideo = activeAsset.mimeType.startsWith('video/');
    
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(activeAsset.blob);
        link.download = activeAsset.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePreviewClick = (asset: UploadedFile) => {
        if (asset.mimeType.startsWith('video/')) {
            setLightboxAsset(asset);
        }
    };
    
    const plan = user?.subscription?.plan;
    const videoCredits = user?.credits?.video?.current || 0;
    const canExtend = isVideo && plan === 'Business';
    const canAnimate = !isVideo && plan === 'Business' && videoCredits >= CREDIT_COSTS.base.animate;

    const isTemplateFlow = !!currentProject.templateId;
    const isProductAd = currentProject.mode === 'Product Ad';
    
    const activeTemplate = currentProject.templateId 
        ? TEMPLATE_LIBRARY.find(t => t.id === currentProject.templateId)
        : null;

    const onAnimateClick = () => {
        setIsAnimateModalOpen(true);
    };

    const onAnimateConfirm = (prompt: string) => {
        handleAnimate(activeIndex, prompt);
        setIsAnimateModalOpen(false);
    };

    return (
        <div className="max-w-7xl mx-auto pb-32">
            <div className="flex justify-between items-center mb-6">
                 {isProductAd ? (
                     // Product Ad & Template Flow Header
                    <>
                        <div className="flex items-center gap-2 sm:gap-4">
                             <button onClick={goBack} className="flex items-center gap-1 text-sm font-semibold text-brand-accent hover:text-brand-accent-hover">
                                <LeftArrowIcon className="w-4 h-4"/> <span className="hidden sm:inline">Back</span>
                            </button>
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Ta-da! As You Wished</h2>
                        </div>
                        <ProgressStepper steps={isTemplateFlow ? ['Add Product', 'Results'] : ['Add Product', 'Select Style', 'Create', 'Results']} currentStepIndex={isTemplateFlow ? 1 : 3} />
                    </>
                 ) : (
                     // Default Header for other modes
                    <div className="w-full flex justify-between items-center">
                        <button onClick={goBack} className="flex items-center gap-2 text-sm font-semibold text-brand-accent hover:text-brand-accent-hover">
                            <LeftArrowIcon className="w-4 h-4"/> <span className="hidden sm:inline">Back</span>
                        </button>
                        <h2 className="text-2xl md:text-3xl font-bold text-center">Ta-da! As You Wished</h2>
                        <div className="w-8 sm:w-24"></div> {/* Spacer to balance the back button */}
                    </div>
                 )}
            </div>

            <div className={`grid grid-cols-1 ${currentProject.publishingPackage ? 'lg:grid-cols-5' : 'lg:grid-cols-1 max-w-4xl mx-auto'} gap-8`}>
                {/* Main Preview Area */}
                <div className={`${currentProject.publishingPackage ? 'lg:col-span-3' : ''} flex flex-col gap-4`}>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700 w-full">
                         {/* Card Header with Animate Button for Images */}
                         {!isVideo && (
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-end">
                                <button 
                                    onClick={onAnimateClick}
                                    disabled={isAnimating === activeIndex || !canAnimate}
                                    className="flex items-center gap-1 text-sm font-semibold text-brand-accent hover:text-brand-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    title={plan !== 'Business' ? "Available on Business Plan" : videoCredits < CREDIT_COSTS.base.animate ? "Not enough video credits" : ""}
                                >
                                    {isAnimating === activeIndex ? (
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <VideoIcon className="w-4 h-4" />
                                    )}
                                    Animate
                                </button>
                            </div>
                        )}
                        
                        <div className="flex-grow bg-gray-100 dark:bg-gray-900 relative flex items-center justify-center p-6 min-h-[300px] sm:min-h-[400px]">
                            <div className="relative w-full h-full flex items-center justify-center">
                                <AssetPreview asset={activeAsset} objectFit="contain" onClick={handlePreviewClick} />
                            </div>
                        </div>
                        
                        {/* Thumbnails */}
                        {assets.length > 1 && (
                            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                                    {assets.map((asset, idx) => (
                                        <div 
                                            key={asset.id} 
                                            onClick={() => setActiveIndex(idx)}
                                            className={`w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${idx === activeIndex ? 'border-brand-accent' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'}`}
                                        >
                                            <AssetPreview asset={asset} objectFit="cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions Row */}
                    <div className={`grid gap-4 ${isVideo ? 'grid-cols-3' : 'grid-cols-2'} flex-shrink-0`}>
                         <button 
                            onClick={() => handleRegenerate(isVideo ? 'video' : 'image')} 
                            disabled={isRegenerating !== null}
                            className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 bg-white dark:bg-gray-800"
                        >
                            {isRegenerating ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : <><SparklesIcon className="w-5 h-5" /> Regenerate</>}
                        </button>

                        {isVideo && (
                            <button 
                                onClick={() => setIsExtendModalOpen(true)}
                                disabled={!canExtend}
                                className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 bg-white dark:bg-gray-800"
                                title={!canExtend ? "Available on Business Plan" : ""}
                            >
                                <VideoIcon className="w-5 h-5" /> Extend
                            </button>
                        )}
                        
                         <button onClick={handleDownload} className="flex items-center justify-center gap-2 py-3 px-4 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors">
                            <ArrowDownTrayIcon className="w-5 h-5" /> Download
                        </button>
                    </div>
                </div>

                {/* Right Sidebar: Social Copy */}
                {currentProject.publishingPackage && (
                    <div className="lg:col-span-2">
                        <SocialCopyEditor project={currentProject} />
                    </div>
                )}
            </div>
            
            <VideoLightbox
                isOpen={!!lightboxAsset}
                onClose={() => setLightboxAsset(null)}
                asset={lightboxAsset}
            />
            <AnimateModal
                isOpen={isAnimateModalOpen}
                onClose={() => setIsAnimateModalOpen(false)}
                onConfirm={onAnimateConfirm}
                defaultPrompt={activeTemplate?.animationPrompt}
            />
        </div>
    );
};
