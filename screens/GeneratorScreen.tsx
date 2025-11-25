
import React, { useState, useRef, useEffect } from 'react';
import type { Project, UploadedFile, CampaignBrief, AdStyle } from '../types';
import { Uploader } from '../components/Uploader';
import { PromptExamplesModal } from '../components/PromptExamplesModal';
import { CampaignInspirationModal } from '../components/CampaignInspirationModal';
import { AssetPreview } from '../components/AssetPreview';
import { GenericSelect } from '../components/GenericSelect';
import { AdvancedVideoSettings } from '../components/AdvancedVideoSettings';
import { generateCampaignBrief, describeImageForPrompt } from '../services/geminiService';
import { AspectRatioSquareIcon, AspectRatioTallIcon, AspectRatioWideIcon, LeftArrowIcon, PlusIcon, SparklesIcon, XMarkIcon, ImageIcon, UGCImage, TshirtIcon } from '../components/icons';
import { CREDIT_COSTS } from '../constants';
import { ProductScraper } from '../components/ProductScraper';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useProjects } from '../context/ProjectContext';
import { TEMPLATE_LIBRARY } from '../lib/templates';
import { ProgressStepper } from '../components/ProgressStepper';

const IMAGE_MODELS = [
    { value: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro (High Fidelity)' },
    { value: 'gemini-2.5-flash-image', label: 'Gemini Flash Image (Fastest)' },
];

const VIDEO_MODELS = [
    { value: 'veo-3.1-fast-generate-preview', label: 'Veo Fast (Quick Preview)' },
    { value: 'veo-3.1-generate-preview', label: 'Veo Cinematic (Highest Quality)' },
];

const VIDEO_DURATIONS = [
    { value: 4, label: '4 Seconds' },
    { value: 7, label: '7 Seconds' },
    { value: 10, label: '10 Seconds' },
];

const VIDEO_RESOLUTIONS = [
    { value: '720p', label: '720p (Fast)' },
    { value: '1080p', label: '1080p (HD)' },
];

const IMAGE_QUALITIES = [
    { value: 'high', label: 'High', description: 'Best quality, higher credit usage.' },
    { value: 'medium', label: 'Medium', description: 'Good quality, reasonable credit usage.' },
    { value: 'low', label: 'Low', description: 'Fastest and lowest credit usage.' },
];


const MinusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
    </svg>
);

const BatchSizeSelector: React.FC<{ value: number; onChange: (newValue: number) => void; max: number; disabled?: boolean; }> = ({ value, onChange, max, disabled = false }) => {
    const increment = () => onChange(Math.min(max, value + 1));
    const decrement = () => onChange(Math.max(1, value - 1));
    return (
        <div>
            <label className={`block mb-2 ${disabled ? 'text-gray-400 dark:text-gray-600' : ''}`}>Batch Size</label>
            <div className={`flex items-center justify-between p-2 border rounded-lg h-12 ${disabled ? 'bg-transparent border-gray-200 dark:border-[#2B2B2B]' : 'bg-white dark:bg-[#171717] border-gray-300 dark:border-gray-600'}`}>
                <button onClick={decrement} disabled={disabled || value <= 1} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent disabled:text-gray-400 dark:disabled:text-gray-600" aria-label="Decrease batch size">
                    <MinusIcon className="w-5 h-5" />
                </button>
                <span className={`text-center w-12 ${disabled ? 'text-gray-400 dark:text-gray-600' : 'dark:text-gray-300'}`} aria-live="polite">{value}</span>
                <button onClick={increment} disabled={disabled || value >= max} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent disabled:text-gray-400 dark:disabled:text-gray-600" aria-label="Increase batch size">
                    <PlusIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

const ModelSelector = ({ type, currentModel, recommendedModel, onChange }: { type: 'image' | 'video', currentModel?: string, recommendedModel?: string, onChange: (val: string) => void }) => {
  // Models list
  const models = type === 'image' ? IMAGE_MODELS : VIDEO_MODELS;
  
  // Determine if current model matches recommended or if it's "auto"
  const isRecommended = recommendedModel && currentModel === recommendedModel;
  
  return (
    <div className="col-span-full">
        <GenericSelect 
            label="AI Model" 
            options={models} 
            selectedValue={currentModel || models[0].value} 
            onSelect={(v) => onChange(v as string)} 
        />
        {isRecommended && (
            <p className="text-xs text-gray-500 mt-2">✨ This model is optimized for your selected template.</p>
        )}
    </div>
  );
}

const fileToUploadedFile = async (file: File | Blob, name: string): Promise<UploadedFile> => {
    const reader = new FileReader();
    const blob = file;
    return new Promise((resolve) => {
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
            const base64 = (reader.result as string)?.split(',')[1];
            resolve({
                id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                base64,
                mimeType: file.type,
                name: name,
                blob: blob,
            });
        };
    });
};

export const GeneratorScreen: React.FC = () => {
    const { user } = useAuth();
    const {
        isLoading,
        error,
        setError,
        setIsLoading,
        setGenerationStatusMessages,
        navigateTo,
        productAdStep, 
        setProductAdStep,
        goBack,
    } = useUI();
    const {
        currentProject: project,
        setCurrentProject: setProject,
        handleGenerate: onGenerate,
        runAgent,
        templateToApply,
        applyPendingTemplate,
    } = useProjects();

    const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
    const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isDescribing, setIsDescribing] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!project || !user) {
        // Or a loading state/redirect
        return <div className="text-center p-8">Error: No active project or user.</div>;
    }

    const plan = user.subscription!.plan;
    const isProductAdAndMissingFile = (project.mode === 'Product Ad' || project.mode === 'AI Agent') && !project.productFile;

    const subtitles = {
        'Product Ad': '',
        'Art Maker': 'Turn ideas into beautiful visuals',
        'Video Maker': 'Make your next viral video — or animate your image in seconds',
        'Create a UGC Video': 'Create authentic user-generated content',
        'AI Agent': 'Your autonomous marketing team'
    };
    const extendSubtitle = 'Describe what should happen next in your scene.';

    const updateProject = (updates: Partial<Project>) => {
        setProject({ ...project, ...updates });
    };

    useEffect(() => {
        if (project.mode === 'Video Maker' && !['16:9', '9:16'].includes(project.aspectRatio)) {
            updateProject({ aspectRatio: '16:9' });
        }
    }, [project.mode]);

    const handleFileUpload = async (uploadedFile: UploadedFile) => {
        if (project.mode === 'Product Ad' || project.mode === 'AI Agent') {
            setIsAnalyzing(true);
            setError(null);
            try {
                const campaignBrief = await generateCampaignBrief(uploadedFile);
                const updatedProject = { 
                    ...project,
                    productFile: uploadedFile, 
                    productName: campaignBrief.productName, 
                    productDescription: campaignBrief.productDescription,
                    campaignBrief,
                };
                applyPendingTemplate(updatedProject);
            } catch (e: any) {
                console.error("Failed to analyze product image", e);
                setError(e.message || "Failed to analyze product image.");
                updateProject({ productFile: uploadedFile });
            } finally {
                setIsAnalyzing(false);
            }
        } else {
            updateProject({ productFile: uploadedFile });
        }
    };
    
    const handleReferenceFileUpload = (files: FileList | null) => {
        if (!files) return;
        const newFiles = Array.from(files).slice(0, 4 - project.referenceFiles.length);
        Promise.all(newFiles.map(file => fileToUploadedFile(file, file.name))).then(uploadedFiles => {
            updateProject({ referenceFiles: [...project.referenceFiles, ...uploadedFiles] });
        });
    };

    const handleDescribeImage = async (index: number) => {
        const fileToDescribe = project.referenceFiles[index];
        if (!fileToDescribe) return;
        setIsDescribing(index);
        setError(null);
        try {
            const description = await describeImageForPrompt(fileToDescribe);
            updateProject({ prompt: project.prompt ? `${project.prompt}, ${description}` : description });
        } catch (e: any) {
            console.error("Failed to describe image", e);
            setError(e.message || "Failed to describe image.");
        } finally {
            setIsDescribing(null);
        }
    };
    
    const calculateCost = (): number => {
        if (project.videoToExtend) return CREDIT_COSTS.base.videoExtend;
        
        const isUgcInProductAdFlow = project.mode === 'Product Ad' && project.adStyle === 'UGC';
        if (isUgcInProductAdFlow) {
             return project.videoModel === 'veo-3.1-generate-preview' ? CREDIT_COSTS.base.ugcVideoCinematic : CREDIT_COSTS.base.ugcVideoFast;
        }

        switch (project.mode) {
            case 'Product Ad':
            case 'Art Maker': {
                const base = project.mode === 'Product Ad' ? CREDIT_COSTS.base.productAd : CREDIT_COSTS.base.artMaker;
                const qualityModifier = CREDIT_COSTS.modifiers.imageQuality[project.imageQuality || 'high'];
                return (base + qualityModifier) * project.batchSize;
            }
            case 'Video Maker': {
                const base = project.videoModel === 'veo-3.1-generate-preview' ? CREDIT_COSTS.base.videoCinematic : CREDIT_COSTS.base.videoFast;
                const resolutionModifier = CREDIT_COSTS.modifiers.videoResolution[project.videoResolution || '720p'];
                const durationModifier = CREDIT_COSTS.modifiers.videoDuration[project.videoDuration || 4];
                return base + resolutionModifier + durationModifier;
            }
            default: return 0;
        }
    };
    
    const cost = calculateCost();
    const hasEnoughCredits = (user.credits?.current ?? 0) >= cost;
    const isGenerateDisabled = isLoading || isProductAdAndMissingFile || isAnalyzing || (!project.prompt && !project.productFile && project.referenceFiles.length === 0 && !project.ugcScript) || !hasEnoughCredits;

    const allAspectRatios: { value: Project['aspectRatio']; label: string; icon: React.ReactNode }[] = [
        { value: '16:9', label: '16:9', icon: <AspectRatioWideIcon className="w-5 h-5" /> },
        { value: '9:16', label: '9:16', icon: <AspectRatioTallIcon className="w-5 h-5" /> },
        { value: '1:1', label: '1:1', icon: <AspectRatioSquareIcon className="w-5 h-5" /> },
        { value: '4:3', label: '4:3', icon: <AspectRatioWideIcon className="w-5 h-5" /> },
        { value: '3:4', label: '3:4', icon: <AspectRatioTallIcon className="w-5 h-5" /> },
    ];

    const aspectRatios = project.mode === 'Video Maker' || project.adStyle === 'UGC'
        ? allAspectRatios.filter(r => ['16:9', '9:16', '1:1'].includes(r.value))
        : allAspectRatios;
    
    const maxBatchSize = 4;

    const handleProductScraped = async (data: { name: string; description: string; file: UploadedFile | null; url: string }) => {
        const minimalBrief: CampaignBrief = {
            productName: data.name,
            productDescription: data.description,
            targetAudience: '',
            keySellingPoints: [],
            brandVibe: 'Neutral',
        };
        
        const updatedProject = {
            ...project,
            productFile: data.file,
            productName: data.name,
            productDescription: data.description,
            campaignBrief: minimalBrief,
            websiteUrl: data.url,
        };
        applyPendingTemplate(updatedProject);
        if (!data.file) {
            setError("Product details imported. Please upload an image manually to continue.");
        }
    };
    
    const isImageMode = project.mode === 'Art Maker' || (project.mode === 'Product Ad' && project.adStyle !== 'UGC');
    const isProductAdFlow = project.mode === 'Product Ad' && !project.videoToExtend;
    const isAIAgentFlow = project.mode === 'AI Agent';
    const isTemplateFlow = !!project.templateId;


    const handleInspirationSelect = (value: string, type: 'artDirection' | 'script' | 'review') => {
        if (type === 'script') {
            updateProject({ ugcScript: value });
        } else {
            updateProject({ prompt: value });
        }
        setIsCampaignModalOpen(false);
    };

    const getPromptLabel = () => {
        switch(project.adStyle) {
            case 'UGC': return 'Write your script';
            case 'Social Proof': return 'Write your review';
            default: return 'Describe your vision';
        }
    };
    
    const getInspirationButtonText = () => {
         switch(project.adStyle) {
            case 'UGC': return 'Script Ideas';
            case 'Social Proof': return 'Review Ideas';
            default: return 'Campaign Inspiration';
        }
    }
    
    const adCampaignSteps = ['Add Product', 'Select Style', 'Create', 'Results'];
    const templateSteps = ['Add Product', 'Results'];
    
    const renderPromptAndSettings = () => {
        const appliedTemplate = project.templateId 
            ? TEMPLATE_LIBRARY.find(t => t.id === project.templateId) 
            : null;
        
        const isUgcFlow = project.adStyle === 'UGC';

        return (
            <>
                {appliedTemplate && !project.videoToExtend ? (
                     <div className="mb-8 p-6 bg-gray-100 dark:bg-gray-800 rounded-xl text-center border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-bold" style={{color: '#91EB23'}}>{appliedTemplate.title} Applied</h3>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            You can adjust the settings below before generating your visual.
                        </p>
                    </div>
                ) : (
                    <>
                    {isUgcFlow ? (
                         <div className="mb-6 space-y-4">
                            <h3 className="text-xl font-bold">Avatar</h3>
                            {project.ugcAvatarSource === 'ai' && (
                                <div>
                                    <label className="block mb-2">Avatar Description</label>
                                    <textarea
                                        value={project.ugcAvatarDescription || ''}
                                        onChange={e => updateProject({ ugcAvatarDescription: e.target.value })}
                                        placeholder="e.g., A friendly woman in her late 30s with blonde hair, wearing a casual sweater..."
                                        className="w-full border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-gray-50 input-focus-brand min-h-[6rem] hover:border-gray-400 dark:hover:border-gray-500"
                                    />
                                </div>
                            )}
                            {(project.ugcAvatarSource === 'upload' || project.ugcAvatarSource === 'template') && project.ugcAvatarFile && (
                                <div className="relative w-48 h-48 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                    <AssetPreview asset={project.ugcAvatarFile} />
                                </div>
                            )}
                         </div>
                    ) : null}

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label htmlFor="prompt" className={`text-xl font-bold ${isProductAdAndMissingFile ? 'text-gray-400 dark:text-gray-600' : ''}`}>
                                {isProductAdFlow ? '' : 'Describe your vision'}
                            </label>
                        </div>
                        <div className={`relative border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:!bg-[#131517] input-focus-brand ${isProductAdAndMissingFile ? 'opacity-60' : ''} ${!isProductAdAndMissingFile && 'hover:border-gray-400 dark:hover:border-gray-500'} transition-colors group-focus-within:ring-2 group-focus-within:ring-brand-focus group-focus-within:border-brand-focus`}>
                            
                            {/* Text Area */}
                            <textarea
                                id="prompt"
                                value={isUgcFlow ? project.ugcScript || '' : project.prompt || ''}
                                onChange={e => {
                                    if (isUgcFlow) updateProject({ ugcScript: e.target.value });
                                    else updateProject({ prompt: e.target.value });
                                }}
                                placeholder={project.videoToExtend ? "e.g., and then it starts to rain" : isUgcFlow ? "Write the full script here..." : "A cinematic shot of..."}
                                className="w-full border-none focus:outline-none focus:ring-0 bg-transparent dark:!bg-transparent min-h-[8rem] pb-10 resize-none"
                                disabled={isProductAdAndMissingFile}
                            ></textarea>

                            {/* Preview Row for Reference Images */}
                            {project.referenceFiles.length > 0 && !project.videoToExtend && (
                                <div className="flex flex-wrap gap-2 mb-4 mt-2">
                                    {project.referenceFiles.map((file, index) => (
                                        <div key={index} className="relative group w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                                            <AssetPreview asset={file} objectFit="cover" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                                                <button onClick={() => updateProject({ referenceFiles: project.referenceFiles.filter((_, i) => i !== index) })} className="p-1 bg-white/20 rounded-full hover:bg-white/40 text-white">
                                                    <XMarkIcon className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Bottom Controls Row */}
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-700/50">
                                {/* Left: Attachment Button */}
                                <div>
                                    {!project.videoToExtend && !isUgcFlow && (
                                        <div className="relative group">
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-brand-accent hover:bg-brand-accent/10 transition-colors disabled:opacity-50"
                                                disabled={isProductAdAndMissingFile || project.referenceFiles.length >= 4}
                                                aria-label="Add Reference Image"
                                            >
                                                <PlusIcon className="w-5 h-5" />
                                            </button>
                                            <div className="absolute bottom-full mb-2 left-0 px-2 py-1 bg-black text-white text-xs font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                                Add Reference Image ({project.referenceFiles.length}/4)
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right: Inspiration Buttons */}
                                <div className="flex items-center gap-4">
                                    {isProductAdFlow && (
                                        <button 
                                            onClick={() => setIsCampaignModalOpen(true)} 
                                            className="text-sm font-bold text-brand-accent hover:underline hover:text-brand-accent-hover disabled:text-gray-400 disabled:no-underline transition-colors" 
                                            disabled={isProductAdAndMissingFile}
                                        >
                                            {getInspirationButtonText()}
                                        </button>
                                    )}
                                     {project.mode !== 'Product Ad' && (
                                        <button 
                                            onClick={() => setIsPromptModalOpen(true)} 
                                            className="text-sm font-bold text-brand-accent hover:underline hover:text-brand-accent-hover disabled:text-gray-400 disabled:no-underline transition-colors"
                                        >
                                            {project.mode === 'Video Maker' ? 'Video inspiration' : 'Visual inspiration'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    </>
                )}

                {/* Settings */}
                {!project.videoToExtend && (
                    <div className="mt-8">
                        
                        {/* Model Selector Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
                            {!isProductAdAndMissingFile && (
                                <ModelSelector 
                                    type={isImageMode ? 'image' : 'video'}
                                    currentModel={isImageMode ? project.imageModel : project.videoModel}
                                    recommendedModel={appliedTemplate?.recommendedModel}
                                    onChange={(v) => isImageMode ? updateProject({ imageModel: v }) : updateProject({ videoModel: v })}
                                />
                            )}
                        </div>

                        {/* Other Settings Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 items-end gap-x-6 gap-y-4">
                            {isImageMode ? (
                                <>
                                    <div className="min-w-[150px]"><GenericSelect label="Image Quality" options={IMAGE_QUALITIES} selectedValue={project.imageQuality || 'high'} onSelect={(value) => updateProject({ imageQuality: value as 'low' | 'medium' | 'high' })} disabled={isProductAdAndMissingFile} /></div>
                                    <div className="min-w-[150px]"><GenericSelect label="Aspect Ratio" options={aspectRatios} selectedValue={project.aspectRatio} onSelect={(value) => updateProject({ aspectRatio: value as Project['aspectRatio'] })} disabled={isProductAdAndMissingFile && !project.templateId} /></div>
                                    <div className="min-w-[150px]"><BatchSizeSelector value={project.batchSize} onChange={(value) => updateProject({ batchSize: value })} max={maxBatchSize} disabled={isProductAdAndMissingFile} /></div>
                                </>
                            ) : ( // Video Mode or UGC in Product Ad Flow
                                <>
                                    <div className="min-w-[150px]"><GenericSelect label="Resolution" options={VIDEO_RESOLUTIONS} selectedValue={project.videoResolution || '720p'} onSelect={(value) => updateProject({ videoResolution: value as '720p' | '1080p' })} disabled={plan === 'Free'} /></div>
                                    <div className="min-w-[150px]"><GenericSelect label="Duration" options={VIDEO_DURATIONS} selectedValue={project.videoDuration || 4} onSelect={(value) => updateProject({ videoDuration: value as number })} disabled={plan === 'Free' || project.adStyle === 'UGC'} /></div>
                                    <div className="min-w-[150px]"><GenericSelect label="Aspect Ratio" options={aspectRatios} selectedValue={project.aspectRatio} onSelect={(value) => updateProject({ aspectRatio: value as Project['aspectRatio'] })} /></div>
                                </>
                            )}
                            
                            <div className="col-span-2 lg:col-span-1">
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
                )}
            </>
        );
    }

    const renderProductSetupStep = () => {
        const shouldShowDetails = project.productFile || project.productName || isAnalyzing;
        const agentCost = CREDIT_COSTS.base.agent;
        const hasEnoughCreditsForAgent = (user.credits?.current ?? 0) >= agentCost;
        const isLaunchDisabled = isLoading || !project.productFile || !hasEnoughCreditsForAgent;

        return (
            <div className="page-enter">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {isAIAgentFlow ? 'Confirm Product Details' : 'Add Your Product'}
                        </h2>
                        {isAIAgentFlow && <p className="mt-2 text-gray-500 dark:text-gray-300">Your agent needs to understand the product before it can build your campaign.</p>}
                    </div>
                    <ProgressStepper steps={project.templateId ? templateSteps : adCampaignSteps} currentStepIndex={0} />
                </div>
                
                {templateToApply && (
                    <div className="mb-6 p-4 bg-brand-accent/10 text-brand-accent border border-brand-accent/20 rounded-lg text-center dark:bg-brand-accent/10 dark:text-brand-accent" style={{ borderColor: '#2B2B2B' }}>
                        Upload a product image to apply the <strong>"{templateToApply.title}"</strong> template.
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {/* Left Column: Product Upload */}
                    <div className="p-6 rounded-xl bg-white dark:bg-gray-800 shadow-sm">
                        <ProductScraper onProductScraped={handleProductScraped} setIsLoading={setIsLoading} setStatusMessages={setGenerationStatusMessages} setError={setError} initialUrl={project.websiteUrl || ''} />
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-300 dark:border-gray-700" /></div>
                            <div className="relative flex justify-center text-sm"><span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">OR</span></div>
                        </div>
                        <div>
                            <label className="block mb-2">Upload Product Image</label>
                            {isAnalyzing ? (
                                <div className="w-48 h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center"><div style={{ borderColor: '#91EB23', borderTopColor: 'transparent' }} className="w-8 h-8 border-4 rounded-full animate-spin"></div></div>
                            ) : project.productFile ? (
                                <div className="relative w-48 h-48 bg-gray-100 dark:bg-gray-700 rounded-lg"><AssetPreview asset={project.productFile} /><button onClick={() => updateProject({ productFile: null, productName: '', productDescription: '', campaignBrief: null })} className="absolute -top-2 -right-2 z-10 bg-black text-white dark:bg-white dark:text-black rounded-full p-1 shadow-md"><XMarkIcon className="w-5 h-5" /></button></div>
                            ) : ( <Uploader onUpload={handleFileUpload} /> )}
                        </div>
                    </div>

                    {/* Right Column: Product Details */}
                    {shouldShowDetails && (
                        <div className="flex flex-col gap-6 h-full">
                            <div>
                                <label htmlFor="productName" className={`block mb-2 ${isProductAdAndMissingFile ? 'text-gray-400 dark:text-gray-600' : ''}`}>Product Name</label>
                                {isAnalyzing ? <div className="w-full p-4 h-[58px] rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div> : <input type="text" id="productName" value={project.productName} onChange={e => updateProject({ productName: e.target.value })} placeholder="e.g., The Cozy Slipper" className="w-full p-4 border rounded-lg input-focus-brand disabled:opacity-60" disabled={isProductAdAndMissingFile} />}
                            </div>
                            <div className="flex-grow flex flex-col">
                                <label htmlFor="productDescription" className={`block mb-2 ${isProductAdAndMissingFile ? 'text-gray-400 dark:text-gray-600' : ''}`}>Product Description</label>
                                {isAnalyzing ? <div className="w-full p-4 h-24 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse flex-grow"></div> : <textarea id="productDescription" value={project.productDescription} onChange={e => updateProject({ productDescription: e.target.value })} placeholder="e.g., A warm and comfortable slipper, perfect for relaxing at home." className="w-full p-4 border rounded-lg h-full flex-grow input-focus-brand disabled:opacity-60" disabled={isProductAdAndMissingFile}></textarea>}
                            </div>
                        </div>
                    )}
                </div>
                
                {isAIAgentFlow && ( <div className="mt-8"> <label htmlFor="highLevelGoal" className="block mb-2 font-semibold">Campaign Goal & Context (Optional)</label> <textarea id="highLevelGoal" value={project.highLevelGoal || ''} onChange={(e) => updateProject({ highLevelGoal: e.target.value })} placeholder="Provide any details to guide your Genie. Examples: a discount you're running, a holiday theme (e.g., 'Holiday Cheer'), a target audience (e.g., 'Gen Z shoppers'), or just leave it blank and let your Genie decide the best strategy." className="w-full p-4 border rounded-lg h-36 input-focus-brand" /> </div> )}
                
                {shouldShowDetails && (
                    <div className="flex justify-end mt-8">
                        {isAIAgentFlow ? (
                            <button onClick={runAgent} disabled={isLaunchDisabled} className="px-8 py-3 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center justify-center gap-2">
                                <span>Generate Campaign</span><SparklesIcon className="w-5 h-5" /><span>{agentCost}</span>
                            </button>
                        ) : project.templateId ? (
                            <button onClick={onGenerate} disabled={isGenerateDisabled} className="px-8 py-3 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center justify-center gap-2">
                                {isLoading ? (
                                    <><div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div><span>Generating...</span></>
                                ) : (
                                    <><span>Generate</span><SparklesIcon className="w-5 h-5" /><span>{cost}</span></>
                                )}
                            </button>
                        ) : (
                            <button onClick={() => setProductAdStep(2)} disabled={isProductAdAndMissingFile} className="px-8 h-12 flex items-center bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors">
                                Continue
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    };
    
    const renderSelectAdStyleStep = () => {
        const adStyles: { name: AdStyle, title: string, description: string, imageUrl: string }[] = [
            { name: 'Creative Placement', title: 'Creative Product Placement', description: 'Place your product in beautiful, eye-catching scenes.', imageUrl: 'https://storage.googleapis.com/genius-images-ny/images/Screenshot%202025-11-08%20at%203.13.04%E2%80%AFPM.png' },
            { name: 'UGC', title: 'User-Generated Content (UGC)', description: 'Generate authentic content with a person presenting your product.', imageUrl: 'https://storage.googleapis.com/genius-images-ny/images/Screenshot%202025-11-08%20at%2011.01.23%E2%80%AFAM.png' },
            { name: 'Social Proof', title: 'Social Proof & Reviews', description: 'Showcase your product with compelling testimonials.', imageUrl: 'https://storage.googleapis.com/genius-images-ny/images/Screenshot%202025-11-08%20at%2010.47.47%E2%80%AFAM.png' },
        ];
        return (
            <div className="page-enter">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setProductAdStep(1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"><LeftArrowIcon className="w-6 h-6" /></button>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Select an Ad Style</h2>
                    </div>
                    <ProgressStepper steps={adCampaignSteps} currentStepIndex={1} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {adStyles.map(style => (
                        <button 
                            key={style.name} 
                            onClick={() => {
                                if (style.name === 'UGC') {
                                    updateProject({ 
                                        mode: 'Create a UGC Video',
                                        ugcType: 'product_showcase',
                                        ugcProductFile: project.productFile,
                                        adStyle: undefined
                                    });
                                    navigateTo('UGC_GENERATE');
                                } else {
                                    updateProject({ adStyle: style.name, ugcAvatarSource: undefined });
                                    setProductAdStep(3);
                                }
                            }} 
                            className="group text-left"
                            onMouseEnter={(e) => e.currentTarget.setAttribute('data-hovering', 'true')}
                            onMouseLeave={(e) => e.currentTarget.removeAttribute('data-hovering')}
                        >
                            <div className="relative overflow-hidden rounded-xl aspect-[9/16] cursor-pointer bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 group-hover:border-brand-accent transition-colors">
                                <img 
                                    src={style.imageUrl} 
                                    alt={style.title} 
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                                />
                            </div>
                            <div className="mt-3 cursor-default">
                                <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 transition-colors card-title">{style.title}</h3>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 transition-colors group-hover:text-brand-accent">{style.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto">
             <input type="file" ref={fileInputRef} onChange={(e) => handleReferenceFileUpload(e.target.files)} className="hidden" accept="image/*" multiple />
            
            {isProductAdFlow ? (
                <>
                    {productAdStep === 1 && renderProductSetupStep()}
                    {productAdStep === 2 && renderSelectAdStyleStep()}
                    {productAdStep === 3 && (
                        <div className="page-enter">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => {
                                            setProductAdStep(2);
                                        }}
                                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                                    >
                                        <LeftArrowIcon className="w-6 h-6" />
                                    </button>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{project.templateId ? 'Confirm Settings' : getPromptLabel()}</h2>
                                </div>
                                <ProgressStepper steps={adCampaignSteps} currentStepIndex={2} />
                            </div>
                            {renderPromptAndSettings()}
                        </div>
                    )}
                </>
            ) : isAIAgentFlow ? (
                renderProductSetupStep()
            ) : (
                <>
                     <div className="flex justify-between items-center mb-8">
                        <button onClick={goBack} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 -ml-2"><LeftArrowIcon className="w-6 h-6" /></button>
                        <div className="text-center flex-grow">
                             <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{project.videoToExtend ? 'Extend Your Video' : project.mode === 'Art Maker' ? 'Create with Art Maker' : 'Create a Video'}</h2>
                             <p className="text-gray-600 dark:text-gray-300 mt-2">{project.videoToExtend ? extendSubtitle : subtitles[project.mode]}</p>
                        </div>
                        <div className="w-10"></div> {/* Spacer */}
                    </div>
                    {renderPromptAndSettings()}
                    {project.mode === 'Video Maker' && !project.videoToExtend && plan === 'Pro' && <AdvancedVideoSettings project={project} updateProject={updateProject} />}
                </>
            )}

            {error && <div className="mt-6 p-4 bg-red-50 text-red-800 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-300 dark:border-red-500/30">{error}</div>}
            {!hasEnoughCredits && !isLoading && ( <div className="mt-6 p-4 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-500/30 text-center">Not enough credits. <button onClick={() => navigateTo('SUBSCRIPTION')} className="font-bold underline hover:text-yellow-900 dark:hover:text-yellow-200">Buy More or Upgrade Plan</button>.</div> )}
            <PromptExamplesModal isOpen={isPromptModalOpen} onClose={() => setIsPromptModalOpen(false)} onSelect={(p) => updateProject({ prompt: p })} project={project} />
            <CampaignInspirationModal isOpen={isCampaignModalOpen} onClose={() => setIsCampaignModalOpen(false)} onSelect={handleInspirationSelect} project={project} />
        </div>
    );
};
