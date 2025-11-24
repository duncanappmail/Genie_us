
import React, { useState, useEffect } from 'react';
import { useProjects } from '../context/ProjectContext';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import { Uploader } from '../components/Uploader';
import { AssetPreview } from '../components/AssetPreview';
import { GenericSelect } from '../components/GenericSelect';
import { PromptExamplesModal } from '../components/PromptExamplesModal';
import { CampaignInspirationModal } from '../components/CampaignInspirationModal';
import { AdvancedVideoSettings } from '../components/AdvancedVideoSettings';
import { ProductScraper } from '../components/ProductScraper';
import {
    SparklesIcon, LightbulbIcon, LeftArrowIcon, XMarkIcon,
    AspectRatioSquareIcon, AspectRatioTallIcon, AspectRatioWideIcon,
    PlusIcon
} from '../components/icons';
import { generateCampaignBrief } from '../services/geminiService';
import type { Project, UploadedFile } from '../types';
import { CREDIT_COSTS } from '../constants';
import { ProgressStepper } from '../components/ProgressStepper';

const IMAGE_QUALITIES = [
    { value: 'low', label: 'Standard' },
    { value: 'medium', label: 'High' },
    { value: 'high', label: 'Ultra' },
];

const VIDEO_RESOLUTIONS = [
    { value: '720p', label: '720p HD' },
    { value: '1080p', label: '1080p Full HD' },
];

const VIDEO_DURATIONS = [
    { value: 4, label: '4 Seconds' },
    { value: 7, label: '7 Seconds' },
    { value: 10, label: '10 Seconds' },
];

const VIDEO_MODELS = [
    { value: 'veo-3.1-fast-generate-preview', label: 'Veo Fast' },
    { value: 'veo-3.1-generate-preview', label: 'Veo Cinematic' },
];

const IMAGE_MODELS = [
    { value: 'gemini-2.5-flash-image', label: 'Fast (Flash)' },
    { value: 'imagen-4.0-generate-001', label: 'High Quality (Imagen)' },
];

const aspectRatios = [
    { value: '1:1', label: 'Square (1:1)', icon: <AspectRatioSquareIcon className="w-5 h-5" /> },
    { value: '9:16', label: 'Vertical (9:16)', icon: <AspectRatioTallIcon className="w-5 h-5" /> },
    { value: '16:9', label: 'Widescreen (16:9)', icon: <AspectRatioWideIcon className="w-5 h-5" /> },
    { value: '4:3', label: 'Standard (4:3)', icon: <AspectRatioSquareIcon className="w-5 h-5" /> },
    { value: '3:4', label: 'Portrait (3:4)', icon: <AspectRatioTallIcon className="w-5 h-5" /> },
];

const MinusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
    </svg>
);

const BatchSizeSelector: React.FC<{ value: number, onChange: (val: number) => void, max: number, disabled?: boolean }> = ({ value, onChange, max, disabled }) => (
    <div>
        <label className={`block mb-2 ${disabled ? 'text-gray-400' : ''}`}>Batch Size</label>
        <div className={`flex items-center justify-between h-12 border rounded-lg px-3 bg-white dark:bg-[#131517] ${disabled ? 'border-gray-200 dark:border-gray-700' : 'border-gray-300 dark:border-gray-600'}`}>
            <button 
                onClick={() => onChange(Math.max(1, value - 1))} 
                disabled={disabled || value <= 1}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30"
            >
                <MinusIcon className="w-4 h-4" />
            </button>
            <span className={`font-medium ${disabled ? 'text-gray-400' : ''}`}>{value}</span>
            <button 
                onClick={() => onChange(Math.min(max, value + 1))} 
                disabled={disabled || value >= max}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30"
            >
                <PlusIcon className="w-4 h-4" />
            </button>
        </div>
    </div>
);

export const GeneratorScreen: React.FC = () => {
    const { 
        currentProject: project, 
        setCurrentProject: setProject, 
        handleGenerate, 
        applyPendingTemplate 
    } = useProjects();
    const { isLoading, setIsLoading, setError, setGenerationStatusMessages, productAdStep, setProductAdStep, goBack } = useUI();
    const { user } = useAuth();

    const [isExamplesModalOpen, setIsExamplesModalOpen] = useState(false);
    const [isInspirationModalOpen, setIsInspirationModalOpen] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isScraping, setIsScraping] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    if (!project || !user) return <div className="text-center p-8">No active project.</div>;

    const updateProject = (updates: Partial<Project>) => {
        setProject(prev => prev ? { ...prev, ...updates } : null);
    };

    const handleProductUpload = async (file: UploadedFile) => {
        setIsAnalyzing(true);
        setError(null);
        // Immediate update to show image and skeletons
        updateProject({ productFile: file });

        try {
            const brief = await generateCampaignBrief(file);
            
            const updatedProjectData = { 
                ...project, 
                productFile: file,
                productName: brief.productName,
                productDescription: brief.productDescription,
                campaignBrief: brief 
            };

            updateProject({ 
                productName: brief.productName,
                productDescription: brief.productDescription,
                campaignBrief: brief 
            });
            
            applyPendingTemplate(updatedProjectData);
        } catch (e: any) {
            console.error("Analysis failed", e);
            setError(e.message || "Failed to analyze product image.");
            // productFile is already set, so no need to revert
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleProductScraped = (data: { name: string, description: string, file: UploadedFile | null, url: string }) => {
        updateProject({
            productName: data.name,
            productDescription: data.description,
            websiteUrl: data.url,
            productFile: data.file
        });
        if (data.file) {
             handleProductUpload(data.file);
        }
    };

    const handleScraperLoading = (loading: boolean) => {
        setIsScraping(loading);
        // Optionally handle global loading if needed, but keeping it local prevents overlay blocking
    };

    const handleNextStep = () => {
        setProductAdStep(prev => prev + 1);
    };

    const handlePrevStep = () => {
        if (productAdStep > 1) {
            setProductAdStep(prev => prev - 1);
        } else {
            goBack();
        }
    };

    const onGenerate = () => {
        handleGenerate();
    }

    const isImageMode = project.mode === 'Product Ad' || project.mode === 'Art Maker';
    const isVideoMode = project.mode === 'Video Maker' || project.mode === 'Create a UGC Video';
    const isProductAd = project.mode === 'Product Ad';
    const isProductAdAndMissingFile = isProductAd && !project.productFile;
    
    const plan = user.subscription?.plan || 'Free';
    const maxBatchSize = plan === 'Pro' ? 4 : 1;

    let cost = 0;
    if (project.mode === 'Product Ad') cost = CREDIT_COSTS.base.productAd * project.batchSize;
    else if (project.mode === 'Art Maker') cost = CREDIT_COSTS.base.artMaker * project.batchSize;
    else if (project.mode === 'Video Maker') cost = project.useCinematicQuality ? CREDIT_COSTS.base.videoCinematic : CREDIT_COSTS.base.videoFast;
    else if (project.mode === 'Create a UGC Video') cost = project.videoModel === 'veo-3.1-generate-preview' ? CREDIT_COSTS.base.ugcVideoCinematic : CREDIT_COSTS.base.ugcVideoFast;
    
    const isGenerateDisabled = isLoading || (isProductAd && !project.productFile) || !project.prompt;

    const isTemplateFlow = !!project.templateId;
    const steps = isTemplateFlow 
        ? ['Add Product', 'Results']
        : ['Add Product', 'Select Style', 'Create', 'Results'];
    
    if (isProductAd && productAdStep === 1) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={goBack} className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-brand-accent">
                            <LeftArrowIcon className="w-4 h-4"/> Back
                        </button>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Add Your Product</h2>
                    </div>
                    <ProgressStepper steps={steps} currentStepIndex={0} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-fit">
                        <ProductScraper
                            onProductScraped={handleProductScraped}
                            setIsLoading={handleScraperLoading}
                            setStatusMessages={setGenerationStatusMessages}
                            setError={setError}
                        />
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-300 dark:border-gray-600" /></div>
                            <div className="relative flex justify-center text-sm"><span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">OR</span></div>
                        </div>
                        {project.productFile ? (
                            <div className="relative w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <AssetPreview asset={project.productFile} objectFit="contain" />
                                <button 
                                    onClick={() => updateProject({ productFile: null, productName: '', productDescription: '', campaignBrief: null })}
                                    className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <Uploader onUpload={handleProductUpload} title="Upload image" subtitle="Drag & drop or click to browse"/>
                        )}
                    </div>

                    {(project.productFile || isAnalyzing || isScraping) && (
                        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
                            <div>
                                <label className="block mb-2 font-semibold">Product Name</label>
                                {isAnalyzing || isScraping ? (
                                    <div className="w-full p-4 h-[50px] rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                                ) : (
                                    <input 
                                        type="text" 
                                        value={project.productName} 
                                        onChange={(e) => updateProject({ productName: e.target.value })}
                                        placeholder="e.g. The Super Sneaker"
                                        className="w-full p-3 border rounded-lg input-focus-brand"
                                    />
                                )}
                            </div>
                            <div className="flex-grow flex flex-col">
                                <label className="block mb-2 font-semibold">Product Description</label>
                                {isAnalyzing || isScraping ? (
                                    <div className="w-full p-4 h-full min-h-[12rem] rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                                ) : (
                                    <textarea 
                                        value={project.productDescription} 
                                        onChange={(e) => updateProject({ productDescription: e.target.value })}
                                        placeholder="Describe your product..."
                                        className="w-full p-3 border rounded-lg h-full min-h-[12rem] resize-none input-focus-brand"
                                    />
                                )}
                            </div>
                            <div className="mt-4 flex justify-end">
                                <button 
                                    onClick={handleNextStep} 
                                    disabled={!project.productFile || isAnalyzing || isScraping}
                                    className="px-8 py-3 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={isProductAd ? handlePrevStep : goBack} className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-brand-accent">
                        <LeftArrowIcon className="w-4 h-4"/> Back
                    </button>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {isProductAd ? (isTemplateFlow ? 'Review & Create' : 'Creative Direction') : project.mode}
                    </h2>
                </div>
                {isProductAd && <ProgressStepper steps={steps} currentStepIndex={isTemplateFlow ? 0 : 1} />}
            </div>

            <div className="flex flex-col gap-8">
                
                {/* Prompt Section - Updated Style */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {isProductAd ? 'Describe the scene' : 'What do you want to create?'}
                        </h3>
                        <div className="flex gap-2">
                            {isProductAd && (
                                <button onClick={() => setIsInspirationModalOpen(true)} className="flex items-center gap-1 text-xs font-medium text-brand-accent hover:underline">
                                    <LightbulbIcon className="w-4 h-4" /> Get Ideas
                                </button>
                            )}
                            <button onClick={() => setIsExamplesModalOpen(true)} className="flex items-center gap-1 text-xs font-medium text-brand-accent hover:underline">
                                <SparklesIcon className="w-4 h-4" /> Examples
                            </button>
                        </div>
                    </div>
                    
                    <div className="relative border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:!bg-[#131517] input-focus-brand hover:border-gray-400 dark:hover:border-gray-500 transition-colors group-focus-within:ring-2 group-focus-within:ring-brand-focus group-focus-within:border-brand-focus">
                        <textarea
                            value={project.prompt}
                            onChange={(e) => updateProject({ prompt: e.target.value })}
                            placeholder={isProductAd ? "e.g. A minimalist podium with soft lighting..." : "Describe your idea..."}
                            className="w-full border-none focus:outline-none focus:ring-0 bg-transparent dark:!bg-transparent h-40 text-gray-900 dark:text-white resize-none p-0 text-base"
                        />
                    </div>
                </div>

                {/* Settings Section - Restored AI Model Selector & 5 Columns */}
                <div className="flex flex-col gap-4">
                    {/* Row 1: AI Model */}
                    <div className="w-full">
                        {isImageMode ? (
                            <GenericSelect 
                                label="AI Model" 
                                options={IMAGE_MODELS} 
                                selectedValue={project.imageModel || 'gemini-2.5-flash-image'} 
                                onSelect={(value) => updateProject({ imageModel: value as string })} 
                                disabled={isProductAdAndMissingFile} 
                            />
                        ) : (
                            <GenericSelect 
                                label="AI Model" 
                                options={VIDEO_MODELS} 
                                selectedValue={project.videoModel || 'veo-3.1-fast-generate-preview'} 
                                onSelect={(value) => updateProject({ videoModel: value as string })} 
                                disabled={plan === 'Free'} 
                            />
                        )}
                    </div>

                    {/* Row 2: Settings & Generate */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 items-end gap-4">
                        {isImageMode ? (
                            <>
                                <div className="min-w-[120px]">
                                    <GenericSelect label="Image Quality" options={IMAGE_QUALITIES} selectedValue={project.imageQuality || 'high'} onSelect={(value) => updateProject({ imageQuality: value as 'low' | 'medium' | 'high' })} disabled={isProductAdAndMissingFile} />
                                </div>
                                <div className="min-w-[120px]">
                                    <GenericSelect label="Aspect Ratio" options={aspectRatios} selectedValue={project.aspectRatio} onSelect={(value) => updateProject({ aspectRatio: value as Project['aspectRatio'] })} disabled={isProductAdAndMissingFile && !!project.templateId} />
                                </div>
                                <div className="min-w-[120px]">
                                    <BatchSizeSelector value={project.batchSize} onChange={(value) => updateProject({ batchSize: value })} max={maxBatchSize} disabled={isProductAdAndMissingFile} />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="min-w-[120px]">
                                    <GenericSelect label="Resolution" options={VIDEO_RESOLUTIONS} selectedValue={project.videoResolution || '720p'} onSelect={(value) => updateProject({ videoResolution: value as '720p' | '1080p' })} disabled={plan === 'Free'} />
                                </div>
                                <div className="min-w-[120px]">
                                    <GenericSelect label="Duration" options={VIDEO_DURATIONS} selectedValue={project.videoDuration || 4} onSelect={(value) => updateProject({ videoDuration: value as number })} disabled={plan === 'Free' || project.adStyle === 'UGC'} />
                                </div>
                                <div className="min-w-[120px]">
                                    <GenericSelect label="Aspect Ratio" options={aspectRatios} selectedValue={project.aspectRatio} onSelect={(value) => updateProject({ aspectRatio: value as Project['aspectRatio'] })} />
                                </div>
                            </>
                        )}
                        
                        <div>
                            <button onClick={onGenerate} disabled={isGenerateDisabled} className="w-full h-12 px-6 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center justify-center gap-2 text-base">
                                {isLoading ? (
                                    <><div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div><span>Generating...</span></>
                                ) : (
                                    <><span>Generate</span><SparklesIcon className="w-5 h-5" /><span>{cost}</span></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
                
                {isVideoMode && (
                    <AdvancedVideoSettings project={project} updateProject={updateProject} />
                )}
            </div>

            <PromptExamplesModal 
                isOpen={isExamplesModalOpen} 
                onClose={() => setIsExamplesModalOpen(false)} 
                onSelect={(prompt) => updateProject({ prompt })}
                project={project}
            />
            
            <CampaignInspirationModal 
                isOpen={isInspirationModalOpen}
                onClose={() => setIsInspirationModalOpen(false)}
                onSelect={(val, type) => updateProject({ prompt: val })}
                project={project}
            />
        </div>
    );
};
