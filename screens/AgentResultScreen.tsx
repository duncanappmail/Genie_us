
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useProjects } from '../context/ProjectContext';
import {
    LeftArrowIcon, LightbulbIcon
} from '../components/icons';
import type { CampaignPackage, UploadedFile } from '../types';
import { PromptDisplayModal } from '../components/PromptDisplayModal';
import { CREDIT_COSTS } from '../constants';
import { SocialCopyEditor } from '../components/SocialCopyEditor';
import { MediaGallery } from '../components/MediaGallery';

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
    
    const [refinePrompt, setRefinePrompt] = useState('');
    const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
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
    
    const assets = [...currentProject.generatedImages, ...currentProject.generatedVideos];
    const { inspiration, strategy } = campaignPackage;
    const plan = user.subscription!.plan;
    const imageCredits = user.credits?.image?.current ?? 0;
    const videoCredits = user.credits?.video?.current ?? 0;

    const handleRefineSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Refine the most recent image
        const lastImageIdx = currentProject.generatedImages.length - 1;
        handleRefine(lastImageIdx, refinePrompt);
        setRefinePrompt('');
    };

    const handleRefineInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setRefinePrompt(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };

    const handleRegenerateAction = (asset: UploadedFile) => {
        handleRegenerate(asset.mimeType.startsWith('video/') ? 'video' : 'image');
    };

    const handleAnimateAction = (asset: UploadedFile) => {
        if (plan !== 'Business' || videoCredits < CREDIT_COSTS.base.animate) return;
        const idx = currentProject.generatedImages.findIndex(img => img.id === asset.id);
        if (idx !== -1) handleAnimate(idx);
    };

    const renderVisualSection = () => (
        <div className="flex flex-col h-full gap-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <button onClick={() => navigateTo('AGENT')} className="flex items-center gap-1 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-brand-accent">
                    <LeftArrowIcon className="w-4 h-4" />
                    Back
                </button>
                <button onClick={() => setIsPromptModalOpen(true)} className="text-sm font-semibold text-brand-accent hover:underline">
                    Show Prompt
                </button>
            </div>
            
            <div className="flex-1 min-h-0">
                <MediaGallery 
                    assets={assets} 
                    onRegenerate={handleRegenerateAction}
                    onAnimate={handleAnimateAction}
                    isRegenerating={isRegenerating}
                    primaryFormat="image"
                />
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                 <form onSubmit={handleRefineSubmit} className="relative">
                    <textarea
                        ref={textareaRef}
                        rows={2}
                        value={refinePrompt}
                        onChange={handleRefineInputChange}
                        placeholder="Describe any adjustments..."
                        className="w-full p-3 pr-44 border rounded-lg resize-none overflow-hidden transition-all dark:border-gray-600 min-h-[4.5rem] hover:border-gray-400 dark:hover:border-gray-500 input-focus-brand force-bg-black text-sm"
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
                            `Refine (${CREDIT_COSTS.base.refine})`
                        )}
                    </button>
                </form>
            </div>

            {(isRegenerating || isAnimating !== null) && (
                <div className="p-3 bg-brand-accent/5 border border-brand-accent/20 rounded-lg flex items-center justify-center gap-2 animate-pulse">
                    <div className="w-4 h-4 border-2 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-bold text-brand-accent uppercase tracking-wider">Agent is updating assets...</span>
                </div>
            )}
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto">
            <button onClick={() => navigateTo('HOME')} className="flex items-center gap-2 text-sm font-semibold mb-6 text-brand-accent hover:text-brand-accent-hover">
                <LeftArrowIcon className="w-4 h-4"/> Back to Home
            </button>
            <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Ta-da! As You Wished</h2>
                {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch">
                <div className="lg:col-span-3">
                    {renderVisualSection()}
                </div>

                <div className="lg:col-span-2 flex flex-col gap-8">
                     <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-brand-accent/20 dark:bg-brand-accent/10 p-2 rounded-full">
                                <LightbulbIcon className="w-5 h-5 text-brand-accent" />
                            </div>
                            <h3 className="text-lg font-bold">Campaign Strategy</h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2"><strong>Concept:</strong> {inspiration.concept}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Reasoning:</strong> {strategy}</p>
                     </div>
                     <div className="flex-1">
                        <SocialCopyEditor project={currentProject} />
                     </div>
                </div>
            </div>
            <PromptDisplayModal isOpen={isPromptModalOpen} onClose={() => setIsPromptModalOpen(false)} prompt={currentProject.prompt} />
        </div>
    );
};
