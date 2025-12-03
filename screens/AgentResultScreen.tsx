
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useProjects } from '../context/ProjectContext';
import { AssetPreview } from '../components/AssetPreview';
import {
    ArrowDownTrayIcon, LeftArrowIcon, LightbulbIcon,
    SparklesIcon
} from '../components/icons';
import type { CampaignPackage, UploadedFile } from '../types';
import { PromptDisplayModal } from '../components/PromptDisplayModal';
import { CREDIT_COSTS } from '../constants';
import { SocialCopyEditor } from '../components/SocialCopyEditor';
import { VideoLightbox } from '../components/VideoLightbox';

export const AgentResultScreen: React.FC = () => {
    const { user } = useAuth();
    const { navigateTo, error, setError } = useUI();
    const { 
        currentProject,
        handleRegenerate,
        handleAnimate,
        handleRefine,
        isRegenerating,
        isAnimating,
        isRefining,
    } = useProjects();
    
    const [imageIndex, setImageIndex] = useState(0);
    const [videoIndex, setVideoIndex] = useState(0);
    const [refinePrompt, setRefinePrompt] = useState('');
    const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
    const [lightboxAsset, setLightboxAsset] = useState<UploadedFile | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const campaignPackage: CampaignPackage | null = (currentProject && currentProject.mode === 'AI Agent' && currentProject.campaignBrief && currentProject.campaignInspiration && currentProject.publishingPackage && currentProject.generatedImages.length > 0)
        ? {
            brief: currentProject.campaignBrief,
            inspiration: currentProject.campaignInspiration,
            finalImage: currentProject.generatedImages[0],
            publishingPackage: currentProject.publishingPackage,
            strategy: currentProject.campaignStrategy || currentProject.campaignInspiration.strategy,
          }
        : null;

    useEffect(() => {
        if(currentProject?.generatedImages?.length > 0) setImageIndex(currentProject.generatedImages.length -1);
    }, [currentProject?.generatedImages?.length]);
     useEffect(() => {
        if(currentProject?.generatedVideos?.length > 0) setVideoIndex(currentProject.generatedVideos.length -1);
    }, [currentProject?.generatedVideos?.length]);
     useEffect(() => {
        if(error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
     }, [error, setError]);

    if (!campaignPackage || !currentProject || !user) {
        return (
            <div className="text-center p-8">
                <h2 className="text-2xl font-bold">No Campaign Data</h2>
                <p className="mt-2 text-gray-500">Could not load campaign data for this project.</p>
                <button onClick={() => navigateTo('HOME')} className="mt-6 px-6 py-2 bg-[#91EB23] text-[#050C26] font-bold rounded-lg hover:bg-[#75CB0C]">
                    Back to Home
                </button>
            </div>
        );
    }
    
    const { inspiration, strategy } = campaignPackage;
    const plan = user.subscription!.plan;
    const imageCredits = user.credits?.image?.current ?? 0;
    const videoCredits = user.credits?.video?.current ?? 0;

    const downloadAsset = (asset: UploadedFile) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(asset.blob);
        link.download = asset.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };

    const handleRefineSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleRefine(imageIndex, refinePrompt);
        setRefinePrompt('');
    };

    const handleRefineInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setRefinePrompt(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };
    
    const handlePreviewClick = (asset: UploadedFile) => {
        if (asset.mimeType.startsWith('video/')) {
            setLightboxAsset(asset);
        }
    };

    const currentImage = currentProject.generatedImages[imageIndex];
    const currentVideo = currentProject.generatedVideos[videoIndex];
    const assetToShow = currentVideo || currentImage;
    const isImage = !currentVideo;

    const renderVisualSection = (asset: UploadedFile, isImage: boolean) => (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => navigateTo('AGENT')} className="flex items-center gap-1 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-brand-accent">
                    <LeftArrowIcon className="w-4 h-4" />
                    Back
                </button>
                <button onClick={() => setIsPromptModalOpen(true)} className="text-sm font-semibold text-brand-accent hover:underline">
                    Show Prompt
                </button>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center aspect-square flex-grow group overflow-hidden">
                <AssetPreview asset={asset} onClick={handlePreviewClick} />
            </div>
            
            {/* Thumbnails for Agent Result */}
            {isImage && currentProject.generatedImages.length > 1 && (
                <div className="mt-4 flex gap-2 overflow-x-auto hide-scrollbar">
                    {currentProject.generatedImages.map((img, idx) => (
                        <div 
                            key={img.id} 
                            onClick={() => setImageIndex(idx)}
                            className={`w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${idx === imageIndex ? 'border-brand-accent' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'}`}
                        >
                            <AssetPreview asset={img} objectFit="cover" />
                        </div>
                    ))}
                </div>
            )}
            
            {isImage && (
                <div className="mt-4">
                     <form onSubmit={handleRefineSubmit} className="relative">
                        <textarea
                            ref={textareaRef}
                            rows={2}
                            value={refinePrompt}
                            onChange={handleRefineInputChange}
                            placeholder="Want changes? Please describe"
                            className="w-full p-3 pr-44 border rounded-lg resize-none overflow-hidden transition-all dark:border-gray-600 min-h-[4.5rem] hover:border-gray-400 dark:hover:border-gray-500 input-focus-brand force-bg-black"
                            disabled={imageCredits < CREDIT_COSTS.base.refine}
                        />
                        <button
                            type="submit"
                            disabled={isRefining || !refinePrompt || imageCredits < CREDIT_COSTS.base.refine}
                            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors text-sm"
                        >
                            {isRefining ? (
                                <div className="w-5 h-5 border-2 border-on-accent border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                `Generate (${CREDIT_COSTS.base.refine} credit)`
                            )}
                        </button>
                    </form>
                </div>
            )}
            
             <div className="mt-6 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => handleRegenerate(isImage ? 'image' : 'video')} 
                        disabled={isRegenerating === (isImage ? 'image' : 'video')} 
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 border rounded-lg font-semibold transition-colors text-sm border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-transparent disabled:border-gray-200 disabled:text-gray-400 dark:disabled:bg-transparent dark:disabled:border-gray-700 dark:disabled:text-gray-500"
                    >
                        {(isRegenerating === 'image' && isImage) || (isRegenerating === 'video' && !isImage)
                            ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            : 'Regenerate'
                        }
                    </button>
                    {isImage ? (
                        <button 
                            onClick={() => handleAnimate(imageIndex)} 
                            disabled={isAnimating === imageIndex || plan !== 'Business' || videoCredits < CREDIT_COSTS.base.animate} 
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 border rounded-lg font-semibold transition-colors text-sm border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-transparent disabled:border-gray-200 disabled:text-gray-400 dark:disabled:bg-transparent dark:disabled:border-gray-700 dark:disabled:text-gray-500"
                        >
                            {isAnimating === imageIndex
                                ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                : `Animate${plan !== 'Business' ? ' (Business)' : ''}`
                            }
                        </button>
                    ) : (
                         <button disabled={true} className="action-btn">
                             Extend (Coming Soon)
                        </button>
                    )}
                </div>
                 <div className="grid grid-cols-1 gap-3">
                    <button onClick={() => downloadAsset(asset)} className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors">
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        Download
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto">
            <button onClick={() => navigateTo('HOME')} className="flex items-center gap-2 text-sm font-semibold mb-6 text-brand-accent hover:text-brand-accent-hover">
                <LeftArrowIcon className="w-4 h-4"/> Back to Home
            </button>
            <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold">Ta-da! As You Wished</h2>
                {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3">
                    {assetToShow ? renderVisualSection(assetToShow, isImage) : <div className="text-center p-8">No visual asset found.</div>}
                </div>

                <div className="lg:col-span-2 space-y-8">
                     <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-brand-accent/20 dark:bg-brand-accent/10 p-2 rounded-full">
                                <LightbulbIcon className="w-5 h-5 text-brand-accent" />
                            </div>
                            <h3 className="text-lg font-bold">Campaign Strategy</h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2"><strong>Concept:</strong> {inspiration.concept}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Reasoning:</strong> {strategy}</p>
                     </div>
                     <SocialCopyEditor project={currentProject} />
                </div>
            </div>
            <PromptDisplayModal isOpen={isPromptModalOpen} onClose={() => setIsPromptModalOpen(false)} prompt={currentProject.prompt} />
            <VideoLightbox
                isOpen={!!lightboxAsset}
                onClose={() => setLightboxAsset(null)}
                asset={lightboxAsset}
            />
        </div>
    );
};
