import React, { useState } from 'react';
import { useProjects } from '../context/ProjectContext';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import {
    LeftArrowIcon
} from '../components/icons';
import { SocialCopyEditor } from '../components/SocialCopyEditor';
import { ProgressStepper } from '../components/ProgressStepper';
import { AnimateModal } from '../components/AnimateModal';
import { MediaGallery } from '../components/MediaGallery';
import { CREDIT_COSTS } from '../constants';
import type { UploadedFile } from '../types';
import { TEMPLATE_LIBRARY } from '../lib/templates';

export const PreviewScreen: React.FC = () => {
    const { currentProject, handleRegenerate, handleAnimate, isAnimating, isRegenerating } = useProjects();
    const { setIsExtendModalOpen, goBack } = useUI();
    const { user } = useAuth();
    
    const [isAnimateModalOpen, setIsAnimateModalOpen] = useState(false);
    const [pendingAnimateAsset, setPendingAnimateAsset] = useState<UploadedFile | null>(null);
    
    if (!currentProject) return <div className="p-8 text-center">No project loaded.</div>;
    
    const assets = [...currentProject.generatedImages, ...currentProject.generatedVideos];
    
    if (assets.length === 0 && !isRegenerating) {
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

    const plan = user?.subscription?.plan;
    const videoCredits = user?.credits?.video?.current || 0;
    const canExtend = plan === 'Business';
    const canAnimate = plan === 'Business' && videoCredits >= CREDIT_COSTS.base.animate;

    const isTemplateFlow = !!currentProject.templateId;
    const isProductAd = currentProject.mode === 'Product Ad';
    const isUGC = currentProject.mode === 'Create a UGC Video';
    
    const activeTemplate = currentProject.templateId 
        ? TEMPLATE_LIBRARY.find(t => t.id === currentProject.templateId)
        : null;

    const handleAnimateAction = (asset: UploadedFile) => {
        if (!canAnimate) return;
        setPendingAnimateAsset(asset);
        setIsAnimateModalOpen(true);
    };

    const handleExtendAction = (asset: UploadedFile) => {
        if (!canExtend) return;
        setIsExtendModalOpen(true);
    };

    const handleRegenerateAction = (asset: UploadedFile) => {
        const isVideo = asset.mimeType.startsWith('video/');
        handleRegenerate(isVideo ? 'video' : 'image');
    };

    const onAnimateConfirm = (config: any) => {
        if (!pendingAnimateAsset) return;
        const idx = currentProject.generatedImages.findIndex(img => img.id === pendingAnimateAsset.id);
        if (idx !== -1) {
            handleAnimate(idx, config);
        }
        setIsAnimateModalOpen(false);
        setPendingAnimateAsset(null);
    };

    let ugcSteps: string[] = [];
    if (isUGC) {
        if (currentProject.isEcommerce) {
            ugcSteps = ['Concept', 'Visuals', 'Results'];
        } else if (isTemplateFlow) {
            ugcSteps = ['Setup', 'Story', 'Avatar', 'Production', 'Results'];
        } else {
            ugcSteps = ['Goal', 'Scene', 'Avatar', 'Production', 'Results'];
        }
    }

    // Determine primary format based on the creation mode
    const primaryFormat = (currentProject.mode === 'Create a UGC Video' || currentProject.mode === 'Video Maker') ? 'video' : 'image';

    return (
        <div className="max-w-7xl mx-auto pb-32">
            <div className="flex justify-between items-center mb-6">
                 {isProductAd ? (
                    <>
                        <div className="flex items-center gap-2 sm:gap-4">
                             <button onClick={goBack} className="flex items-center gap-1 text-sm font-semibold text-brand-accent hover:text-brand-accent-hover">
                                <LeftArrowIcon className="w-4 h-4"/> <span className="hidden sm:inline">Back</span>
                            </button>
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Ta-da! As You Wished</h2>
                        </div>
                        <ProgressStepper steps={isTemplateFlow ? ['Add Product', 'Results'] : ['Add Product', 'Select Style', 'Create', 'Results']} currentStepIndex={isTemplateFlow ? 1 : 3} />
                    </>
                 ) : isUGC ? (
                    <>
                        <div className="flex items-center gap-2 sm:gap-4">
                             <button onClick={goBack} className="flex items-center gap-1 text-sm font-semibold text-brand-accent hover:text-brand-accent-hover">
                                <LeftArrowIcon className="w-4 h-4"/> <span className="hidden sm:inline">Back</span>
                            </button>
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Ta-da! As You Wished</h2>
                        </div>
                        <ProgressStepper steps={ugcSteps} currentStepIndex={ugcSteps.length - 1} />
                    </>
                 ) : (
                    <div className="w-full flex justify-between items-center">
                        <button onClick={goBack} className="flex items-center gap-1 text-sm font-semibold text-brand-accent hover:text-brand-accent-hover">
                            <LeftArrowIcon className="w-4 h-4"/> <span className="hidden sm:inline">Back</span>
                        </button>
                        <h2 className="text-2xl md:text-3xl font-bold text-center">Ta-da! As You Wished</h2>
                        <div className="w-8 sm:w-24"></div>
                    </div>
                 )}
            </div>

            <div className={`grid grid-cols-1 ${currentProject.publishingPackage ? 'lg:grid-cols-5' : 'lg:grid-cols-1 max-w-4xl mx-auto'} gap-8 items-stretch`}>
                {/* Main Preview Area */}
                <div className={`${currentProject.publishingPackage ? 'lg:col-span-3' : ''} flex flex-col gap-6 h-full`}>
                    <div className="w-full h-full">
                        <MediaGallery 
                            assets={assets} 
                            onRegenerate={handleRegenerateAction}
                            onAnimate={handleAnimateAction}
                            onExtend={handleExtendAction}
                            isRegenerating={isRegenerating}
                            primaryFormat={primaryFormat}
                        />
                    </div>
                    
                    {/* Floating Status Indicator for global tasks */}
                    {(isAnimating !== null) && (
                        <div className="p-4 bg-brand-accent/10 border border-brand-accent/20 rounded-xl flex items-center justify-center gap-3 animate-pulse">
                            <div className="w-5 h-5 border-2 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm font-bold text-brand-accent">Processing asset animation...</span>
                        </div>
                    )}
                </div>

                {/* Right Sidebar: Social Copy */}
                {currentProject.publishingPackage && (
                    <div className="lg:col-span-2 h-full">
                        <SocialCopyEditor project={currentProject} />
                    </div>
                )}
            </div>
            
            <AnimateModal
                isOpen={isAnimateModalOpen}
                onClose={() => setIsAnimateModalOpen(false)}
                onConfirm={onAnimateConfirm}
                defaultPrompt={activeTemplate?.animationPrompt}
                asset={pendingAnimateAsset}
            />
        </div>
    );
};