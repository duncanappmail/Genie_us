import React, { useState, useRef, useEffect } from 'react';
import type { Project, UploadedFile, CampaignBrief, AdStyle, Credits, TransitionStep } from '../types';
import { Uploader } from '../components/Uploader';
import { PromptExamplesModal } from '../components/PromptExamplesModal';
import { CampaignInspirationModal } from '../components/CampaignInspirationModal';
import { AssetPreview } from '../components/AssetPreview';
import { GenericSelect } from '../components/GenericSelect';
import { generateCampaignBrief, describeImageForPrompt, suggestOutfit, suggestEnvironment } from '../services/geminiService';
import { AspectRatioSquareIcon, AspectRatioTallIcon, AspectRatioWideIcon, LeftArrowIcon, PlusIcon, SparklesIcon, XMarkIcon, ImageIcon, UGCImage, TshirtIcon, ArrowLongDownIcon, TrashIcon } from '../components/icons';
import { CREDIT_COSTS } from '../constants';
import { ProductScraper } from '../components/ProductScraper';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useProjects } from '../context/ProjectContext';
import { TEMPLATE_LIBRARY } from '../lib/templates';
import { ProgressStepper } from '../components/ProgressStepper';
import { ProductUploadModal } from '../components/ProductUploadModal';
import { SceneSelectionModal, PRESET_SCENES } from '../components/SceneSelectionModal';
import { ErrorResolutionView } from '../components/ErrorResolutionView';

const IMAGE_MODELS = [
    { value: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro (High Fidelity)' },
    { value: 'gemini-2.5-flash-image', label: 'Gemini Flash Image (Fastest)' },
];

const VIDEO_MODELS = [
    { value: 'veo-3.1-fast-generate-preview', label: 'Veo Fast (Quick Preview)' },
    { value: 'veo-3.1-generate-preview', label: 'Veo Cinematic (Highest Quality)' },
];

const VIDEO_RESOLUTIONS = [
    { value: '720p', label: '720p (Fast)' },
    { value: '1080p', label: '1080p (HD)' },
];

const VIDEO_DURATIONS = [
    { value: 4, label: '4 Seconds' },
    { value: 7, label: '7 Seconds' },
    { value: 10, label: '10 Seconds' },
];

const IMAGE_QUALITIES = [
    { value: 'high', label: 'High', description: 'Best quality, higher credit usage.' },
    { value: 'medium', label: 'Medium', description: 'Good quality, reasonable credit usage.' },
    { value: 'low', label: 'Low', description: 'Fastest and lowest credit usage.' },
];

const TRANSITION_ACTIONS = [
    { value: 'Spin', label: 'The Spin' },
    { value: 'Jump', label: 'The Jump (Coming Soon)', disabled: true },
    { value: 'Snap', label: 'The Snap (Coming Soon)', disabled: true },
    { value: 'Clap', label: 'The Clap (Coming Soon)', disabled: true },
];

// Ad Styles Configuration
const AD_STYLES: { name: AdStyle, title: string, description: string, imageUrl: string }[] = [
    { name: 'Creative Placement', title: 'Creative Product Placement', description: 'Place your product in beautiful, eye-catching scenes.', imageUrl: 'https://storage.googleapis.com/genius-images-ny/images/Screenshot%202025-11-08%20at%203.13.04%E2%80%AFPM.png' },
    { name: 'UGC', title: 'User-Generated Content (UGC)', description: 'Generate authentic content with a person presenting your product.', imageUrl: 'https://storage.googleapis.com/genius-images-ny/images/Screenshot%202025-11-08%20at%2011.01.23%E2%80%AFAM.png' },
    { name: 'Social Proof', title: 'Social Proof & Reviews', description: 'Showcase your product with compelling testimonials.', imageUrl: 'https://storage.googleapis.com/genius-images-ny/images/Screenshot%202025-11-08%20at%2010.47.47%E2%80%AFAM.png' },
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
            <label className={`block mb-2 text-xs font-semibold uppercase tracking-wide ${disabled ? 'text-gray-400 dark:text-gray-600' : 'text-gray-500'}`}>Batch Size</label>
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

const ModelSelector = ({ type, currentModel, recommendedModel, onChange, className }: { type: 'image' | 'video', currentModel?: string, recommendedModel?: string, onChange: (val: string) => void, className?: string }) => {
  // Models list
  const models = type === 'image' ? IMAGE_MODELS : VIDEO_MODELS;
  
  // Determine if current model matches recommended or if it's "auto"
  const isRecommended = recommendedModel && currentModel === recommendedModel;
  
  return (
    <div className={className || "col-span-full"}>
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
    return new Promise((resolve, reject) => {
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
            const base64 = (reader.result as string)?.split(',')[1];
            resolve({
                id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                base64,
                mimeType: file.type || 'application/octet-stream',
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
        generationError,
        setGenerationError,
        setIsLoading,
        setGenerationStatusMessages,
        navigateTo,
        productAdStep, 
        setProductAdStep,
        goBack,
        setIsProductUploadModalOpen,
        isProductUploadModalOpen,
        setProductUploadModalContext
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
    const [productModalMode, setProductModalMode] = useState<'create' | 'edit'>('create');
    const [isSuggestingOutfit, setIsSuggestingOutfit] = useState<number | null>(null);
    const [isSuggestingEnvironment, setIsSuggestingEnvironment] = useState(false);
    const [isSuggestingSingleOutfit, setIsSuggestingSingleOutfit] = useState(false);
    const [isSceneModalOpen, setIsSceneModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const promptInputRef = useRef<HTMLTextAreaElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [indicatorWidth, setIndicatorWidth] = useState(0);

    const appliedTemplate = project?.templateId 
        ? TEMPLATE_LIBRARY.find(t => t.id === project.templateId) 
        : null;

    // --- Transition Builder Effect (Sync Timeline to Prompt) ---
    useEffect(() => {
        if (appliedTemplate?.customUI === 'transition-builder' && project?.transitionSettings) {
            const steps = project.transitionSettings;
            const subjectDesc = project.productDescription || 'A person';
            const sceneDesc = project.ugcSceneDescription || 'Bedroom';
            
            // Construct the prompt
            let prompt = `A viral social media transition video. Subject: ${subjectDesc}. Scene: ${sceneDesc}.\n`;
            prompt += `**Sequence:**\n`;
            
            steps.forEach((step, index) => {
                prompt += `${index + 1}. Subject is wearing **${step.look || 'casual clothes'}**.\n`;
                if (step.action && index < steps.length - 1) {
                    prompt += `   Action: They perform a dynamic **${step.action}** transition.\n`;
                }
            });
            
            prompt += `The transition is seamless, energetic, and perfectly timed.`;
            
            // Only update if prompt has changed to avoid infinite loop
            if (project.prompt !== prompt) {
                updateProject({ prompt });
            }
        }
    }, [project?.transitionSettings, appliedTemplate, project?.productDescription, project?.ugcSceneDescription]);

    // --- Bullet Time Effect (Sync Fields to Prompt) ---
    useEffect(() => {
        if (appliedTemplate?.customUI === 'bullet-time') {
            const outfit = project.productDescription || 'casual streetwear';
            const scene = project.ugcSceneDescription || 'a dynamic urban setting';
            const productName = project.productName || 'Subject';
            
            // We use the template's structure but fill it dynamically here for the backend prompt
            let prompt = appliedTemplate.promptTemplate;
            prompt = prompt.replace('{{PRODUCT_NAME}}', productName);
            prompt = prompt.replace('{{PRODUCT_DESCRIPTION}}', outfit);
            prompt = prompt.replace('{{PROMPT}}', scene);
            
            // Only update if prompt has changed to avoid infinite loop
            if (project.prompt !== prompt) {
                updateProject({ prompt });
            }
        }
    }, [appliedTemplate, project?.productDescription, project?.ugcSceneDescription, project?.productName]);


    if (!project || !user) {
        // Or a loading state/redirect
        return <div className="text-center p-8">Error: No active project or user.</div>;
    }

    const plan = user.subscription!.plan;
    const isProductAdAndMissingFile = (project.mode === 'Product Ad' || project.mode === 'AI Agent') && !project.productFile;

    const subtitles: Record<string, React.ReactNode> = {
        'Product Ad': '',
        'Art Maker': 'Turn ideas into beautiful visuals',
        'Video Maker': (
            <>
                <span className="block md:inline">Make your next viral video —</span>
                <span className="md:inline"> or animate your image in seconds</span>
            </>
        ),
        'Create a UGC Video': 'Create authentic user-generated content',
        'AI Agent': 'Your autonomous marketing team',
        'Character Swap': 'Replace the character in the video'
    };
    const extendSubtitle = 'Describe what should happen next in your scene.';

    const updateProject = (updates: Partial<Project>) => {
        setProject((prev) => prev ? ({ ...prev, ...updates }) : null);
    };

    // Transition Builder Helpers
    const updateTransitionStep = (index: number, updates: Partial<TransitionStep>) => {
        const currentSettings = project.transitionSettings || [{ id: '1', look: '' }, { id: '2', look: '' }];
        const newSettings = [...currentSettings];
        newSettings[index] = { ...newSettings[index], ...updates };
        updateProject({ transitionSettings: newSettings });
    };

    const addTransitionStep = () => {
        const currentSettings = project.transitionSettings || [{ id: '1', look: '' }, { id: '2', look: '' }];
        // Add a default action to the previous last step
        const lastIndex = currentSettings.length - 1;
        if (!currentSettings[lastIndex].action) {
            currentSettings[lastIndex].action = 'Spin';
        }
        
        const newStep: TransitionStep = {
            id: Date.now().toString(),
            look: ''
        };
        updateProject({ transitionSettings: [...currentSettings, newStep] });
    };

    const removeTransitionStep = (index: number) => {
        const currentSettings = project.transitionSettings || [];
        if (currentSettings.length <= 2) return; // Min 2 steps
        
        const newSettings = currentSettings.filter((_, i) => i !== index);
        // Ensure the new last step has no action
        if (index === currentSettings.length - 1) {
             delete newSettings[newSettings.length - 1].action;
        }
        updateProject({ transitionSettings: newSettings });
    };

    const handleSuggestOutfit = async (index: number) => {
        if (!project.productFile) {
            setError("Please verify the subject image is uploaded first.");
            return;
        }
        
        setIsSuggestingOutfit(index);
        try {
            // Suggest an outfit based on the subject image
            const suggestion = await suggestOutfit(project.productFile);
            updateTransitionStep(index, { look: suggestion });
        } catch (e: any) {
            console.error(e);
            setError("Failed to suggest outfit. Please try again.");
        } finally {
            setIsSuggestingOutfit(null);
        }
    };

    const handleSuggestSingleOutfit = async () => {
        if (!project.productFile) {
            setError("Please upload a subject image first.");
            return;
        }
        setIsSuggestingSingleOutfit(true);
        try {
            const suggestion = await suggestOutfit(project.productFile);
            updateProject({ productDescription: suggestion });
        } catch (e: any) {
            console.error(e);
            setError("Failed to suggest outfit.");
        } finally {
            setIsSuggestingSingleOutfit(false);
        }
    }

    const handleSuggestEnvironment = async () => {
        const outfit = project.productDescription || 'casual clothes';
        const name = project.productName || 'Subject';
        setIsSuggestingEnvironment(true);
        try {
            const suggestion = await suggestEnvironment(name, outfit);
            updateProject({ ugcSceneDescription: suggestion });
        } catch (e) {
            console.error(e);
            setError("Failed to suggest environment.");
        } finally {
            setIsSuggestingEnvironment(false);
        }
    }
    
    const getSceneImageUrl = (name: string) => {
        const scene = PRESET_SCENES.find(s => s.name === name);
        return scene ? scene.url : PRESET_SCENES[0].url;
    };


    useEffect(() => {
        if (project.mode === 'Video Maker' && !['16:9', '9:16'].includes(project.aspectRatio)) {
            updateProject({ aspectRatio: '16:9' });
        }
    }, [project.mode]);

    const analyzeProductImage = async (file: UploadedFile) => {
        setIsAnalyzing(true);
        setError(null);
        try {
            const campaignBrief = await generateCampaignBrief(file);
            const updatedProject = { 
                ...project,
                productFile: file, 
                productName: campaignBrief.productName, 
                productDescription: campaignBrief.productDescription,
                campaignBrief,
            };
            
            if (templateToApply) {
                applyPendingTemplate(updatedProject);
            } else {
                setProject(updatedProject);
            }
        } catch (e: any) {
            console.error("Failed to analyze product image", e);
            setError(e.message || "Failed to analyze product image.");
            // Ensure file is still set even if analysis fails
            updateProject({ productFile: file });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleFileUpload = async (uploadedFile: UploadedFile) => {
        if (project.mode === 'Product Ad' || project.mode === 'AI Agent') {
            const hasDetails = (project.productName && project.productName.trim().length > 0) || (project.productDescription && project.productDescription.trim().length > 0);
            
            if (!hasDetails) {
                await analyzeProductImage(uploadedFile);
            } else {
                // Preserve existing details
                updateProject({ productFile: uploadedFile });
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

    const handleProductModalConfirm = (data: { file: UploadedFile | null; url?: string; name?: string; description?: string }) => {
        // Common updates
        const commonUpdates = {
            productFile: data.file,
            productName: data.name,
            productDescription: data.description,
            websiteUrl: data.url
        };

        if (project.adStyle === 'UGC') {
             // For UGC, we switch flows entirely to the specialized UGC Generator
             updateProject({
                ...commonUpdates,
                mode: 'Create a UGC Video',
                ugcType: 'product_showcase',
                ugcProductFile: data.file,
                isEcommerce: true, // Trigger the E-commerce flow in UGCGenerator
                adStyle: undefined // Clear adStyle as we are leaving the Product Ad flow
            });
            setIsProductUploadModalOpen(false);
            navigateTo('UGC_GENERATE');
        } else {
            // For other styles (Creative Placement, Social Proof), continue in GeneratorScreen
            updateProject(commonUpdates);
            setIsProductUploadModalOpen(false);
            if (productModalMode === 'create') {
                setProductAdStep(2);
            }
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
            case 'Character Swap': {
                return project.videoModel === 'veo-3.1-generate-preview' ? CREDIT_COSTS.base.characterSwapCinematic : CREDIT_COSTS.base.characterSwapFast;
            }
            default: return 0;
        }
    };
    
    const cost = calculateCost();
    
    // Determine category based on mode for credit check
    let creditCategory: keyof Credits = 'image';
    if (project.videoToExtend) creditCategory = 'video';
    else if (project.mode === 'Video Maker' || (project.mode === 'Product Ad' && project.adStyle === 'UGC') || project.mode === 'Character Swap') creditCategory = 'video';
    else if (project.mode === 'AI Agent') creditCategory = 'strategy';

    const hasEnoughCredits = (user.credits?.[creditCategory]?.current ?? 0) >= cost;
    const isGenerateDisabled = isLoading || isProductAdAndMissingFile || isAnalyzing || (!project.prompt && !project.productFile && project.referenceFiles.length === 0 && !project.ugcScript && !project.sourceVideo) || !hasEnoughCredits;

    const allAspectRatios: { value: Project['aspectRatio']; label: string; icon: React.ReactNode }[] = [
        { value: '16:9', label: '16:9', icon: <AspectRatioWideIcon className="w-5 h-5" /> },
        { value: '9:16', label: '9:16', icon: <AspectRatioTallIcon className="w-5 h-5" /> },
        { value: '1:1', label: '1:1', icon: <AspectRatioSquareIcon className="w-5 h-5" /> },
        { value: '4:3', label: '4:3', icon: <AspectRatioWideIcon className="w-5 h-5" /> },
        { value: '3:4', label: '3:4', icon: <AspectRatioTallIcon className="w-5 h-5" /> },
    ];

    const aspectRatios = (project.mode === 'Video Maker' || project.adStyle === 'UGC' || (appliedTemplate && appliedTemplate.type === 'video') || project.mode === 'Character Swap')
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
        
        if (templateToApply) {
            applyPendingTemplate(updatedProject);
        } else {
            setProject(updatedProject);
        }

        if (!data.file) {
            setError("Product details imported. Please upload an image manually to continue.");
        }
    };
    
    const isImageMode = project.mode === 'Art Maker' || (project.mode === 'Product Ad' && project.adStyle !== 'UGC');
    const isProductAdFlow = project.mode === 'Product Ad' && !project.videoToExtend;
    const isAIAgentFlow = project.mode === 'AI Agent';
    const isTemplateFlow = !!project.templateId;
    const isCharacterSwap = project.mode === 'Character Swap';


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
    
    const adCampaignSteps = ['Select Style', 'Create', 'Results'];

    const renderSettingsGrid = () => {
        const isUgcFlow = project.adStyle === 'UGC';
        const isVideoMakerMode = project.mode === 'Video Maker' && !project.videoToExtend;

        if (isVideoMakerMode) {
             return (
                <div className="grid grid-cols-1 md:grid-cols-4 items-end gap-x-4 gap-y-4">
                    <div className="w-full"><GenericSelect label="Resolution" options={VIDEO_RESOLUTIONS} selectedValue={project.videoResolution || '720p'} onSelect={(value) => updateProject({ videoResolution: value as '720p' | '1080p' })} disabled={plan === 'Free'} /></div>
                    <div className="w-full"><GenericSelect label="Duration" options={VIDEO_DURATIONS} selectedValue={project.videoDuration || 4} onSelect={(value) => updateProject({ videoDuration: value as number })} disabled={plan === 'Free' || project.adStyle === 'UGC'} /></div>
                    <div className="w-full"><GenericSelect label="Aspect Ratio" options={aspectRatios} selectedValue={project.aspectRatio} onSelect={(value) => updateProject({ aspectRatio: value as Project['aspectRatio'] })} /></div>
                    <div className="col-span-1 w-full">
                        <button onClick={onGenerate} disabled={isGenerateDisabled} className="w-full h-12 px-3 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center justify-center gap-2 text-sm sm:text-base">
                            {isLoading ? (
                                <><div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div><span>Generating...</span></>
                            ) : (
                                <><span>Generate</span><SparklesIcon className="w-5 h-5" /><span>{cost}</span></>
                            )}
                        </button>
                    </div>
                </div>
             );
        }

        if (appliedTemplate) {
            return (
                <div className="grid grid-cols-2 gap-6">
                    {appliedTemplate.type === 'image' ? (
                        <>
                        <div className="w-full">
                            <GenericSelect 
                                label="Image Quality" 
                                options={IMAGE_QUALITIES} 
                                selectedValue={project.imageQuality || 'high'} 
                                onSelect={(value) => updateProject({ imageQuality: value as 'low' | 'medium' | 'high' })} 
                                disabled={isProductAdAndMissingFile} 
                            />
                        </div>
                        <div className="w-full">
                            <GenericSelect 
                                label="Aspect Ratio" 
                                options={aspectRatios} 
                                selectedValue={project.aspectRatio} 
                                onSelect={(value) => updateProject({ aspectRatio: value as Project['aspectRatio'] })} 
                                disabled={isProductAdAndMissingFile && !project.templateId} 
                            />
                        </div>
                        <div className="w-full">
                            <BatchSizeSelector 
                                value={project.batchSize} 
                                onChange={(value) => updateProject({ batchSize: value })} 
                                max={maxBatchSize} 
                                disabled={isProductAdAndMissingFile} 
                            />
                        </div>
                        <div className="w-full flex items-end">
                                <button 
                                    onClick={onGenerate} 
                                    disabled={isGenerateDisabled} 
                                    className="w-full h-12 px-3 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                                >
                                    {isLoading ? (
                                        <><div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div><span>Generating...</span></>
                                    ) : (
                                        <><span>Generate</span><SparklesIcon className="w-5 h-5" /><span>{cost}</span></>
                                    )}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                        <div className="w-full">
                            <GenericSelect 
                                label="Aspect Ratio" 
                                options={aspectRatios} 
                                selectedValue={project.aspectRatio} 
                                onSelect={(value) => updateProject({ aspectRatio: value as Project['aspectRatio'] })} 
                            />
                        </div>
                        <div className="w-full">
                            <GenericSelect 
                                label="Resolution" 
                                options={VIDEO_RESOLUTIONS} 
                                selectedValue={project.videoResolution || '720p'} 
                                onSelect={(value) => updateProject({ videoResolution: value as '720p' | '1080p' })} 
                            />
                        </div>
                        <div className="w-full">
                            <GenericSelect 
                                label="Duration" 
                                options={VIDEO_DURATIONS} 
                                selectedValue={project.videoDuration || 4} 
                                onSelect={(value) => updateProject({ videoDuration: value as number })} 
                            />
                        </div>
                        <div className="w-full flex items-end">
                                <button 
                                    onClick={onGenerate} 
                                    disabled={isGenerateDisabled} 
                                    className="w-full h-12 px-3 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                                >
                                    {isLoading ? (
                                        <><div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div><span>Generating...</span></>
                                    ) : (
                                        <><span>Generate</span><SparklesIcon className="w-5 h-5" /><span>{cost}</span></>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            );
        }

        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 items-end gap-x-4 gap-y-4">
                {isImageMode ? (
                    <>
                        <div className="w-full"><GenericSelect label="Image Quality" options={IMAGE_QUALITIES} selectedValue={project.imageQuality || 'high'} onSelect={(value) => updateProject({ imageQuality: value as 'low' | 'medium' | 'high' })} disabled={isProductAdAndMissingFile} /></div>
                        <div className="w-full"><GenericSelect label="Aspect Ratio" options={aspectRatios} selectedValue={project.aspectRatio} onSelect={(value) => updateProject({ aspectRatio: value as Project['aspectRatio'] })} disabled={isProductAdAndMissingFile && !project.templateId} /></div>
                        <div className="w-full"><BatchSizeSelector value={project.batchSize} onChange={(value) => updateProject({ batchSize: value })} max={maxBatchSize} disabled={isProductAdAndMissingFile} /></div>
                    </>
                ) : ( 
                    <>
                        <div className="w-full"><GenericSelect label="Resolution" options={VIDEO_RESOLUTIONS} selectedValue={project.videoResolution || '720p'} onSelect={(value) => updateProject({ videoResolution: value as '720p' | '1080p' })} disabled={plan === 'Free'} /></div>
                        <div className="w-full"><GenericSelect label="Duration" options={VIDEO_DURATIONS} selectedValue={project.videoDuration || 4} onSelect={(value) => updateProject({ videoDuration: value as number })} disabled={plan === 'Free' || project.adStyle === 'UGC'} /></div>
                        <div className="w-full"><GenericSelect label="Aspect Ratio" options={aspectRatios} selectedValue={project.aspectRatio} onSelect={(value) => updateProject({ aspectRatio: value as Project['aspectRatio'] })} /></div>
                    </>
                )}
                
                <div className="col-span-1 w-full">
                    <button onClick={onGenerate} disabled={isGenerateDisabled} className="w-full h-12 px-3 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center justify-center gap-2 text-sm sm:text-base">
                        {isLoading ? (
                            <><div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div><span>Generating...</span></>
                        ) : (
                            <><span>Generate</span><SparklesIcon className="w-5 h-5" /><span>{cost}</span></>
                        )}
                    </button>
                </div>
            </div>
        );
    };
    
    const renderPromptAndSettings = () => {
        const isUgcFlow = project.adStyle === 'UGC';
        const isProductAdMode = project.mode === 'Product Ad';
        const isVideoMakerMode = project.mode === 'Video Maker' && !project.videoToExtend;
        const isTransitionBuilder = appliedTemplate?.customUI === 'transition-builder';
        const isBulletTime = appliedTemplate?.customUI === 'bullet-time';

        if (isCharacterSwap) {
            return (
                <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                    {/* Dual Upload Section - Reduced size and centered on desktop */}
                    <div className="grid grid-cols-2 gap-4 md:gap-6 md:w-1/2 mx-auto">
                        <div className="space-y-2">
                            <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wide truncate">
                                SOURCE VIDEO
                            </label>
                            {project.sourceVideo ? (
                                <div className="relative w-full aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 group">
                                    <AssetPreview asset={project.sourceVideo} objectFit="cover" />
                                    <button onClick={() => updateProject({ sourceVideo: null })} className="absolute -top-2 -right-2 z-10 bg-black text-white dark:bg-white dark:text-black rounded-full p-1 shadow-md hover:scale-110 transition-transform">
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="aspect-square">
                                    <Uploader 
                                        accept="video/*" 
                                        onUpload={(file) => updateProject({ sourceVideo: file })} 
                                        title="Upload source video"
                                        compact
                                        fill
                                    />
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wide truncate">
                                CHARACTER REFERENCE
                            </label>
                            {project.productFile ? (
                                <div className="relative w-full aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 group">
                                    <AssetPreview asset={project.productFile} objectFit="cover" />
                                    <button onClick={() => updateProject({ productFile: null })} className="absolute -top-2 -right-2 z-10 bg-black text-white dark:bg-white dark:text-black rounded-full p-1 shadow-md hover:scale-110 transition-transform">
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="aspect-square">
                                    <Uploader 
                                        accept="image/*" 
                                        onUpload={(file) => updateProject({ productFile: file })} 
                                        title="Upload character image"
                                        compact
                                        fill
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Settings - Appears only when both are uploaded */}
                    {(project.sourceVideo && project.productFile) && (
                        <div className="p-6 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-2 duration-300">
                             {generationError ? (
                                <ErrorResolutionView 
                                    error={generationError} 
                                    onClear={() => setGenerationError(null)}
                                    onRetry={onGenerate}
                                    onSwitchToFlash={() => { updateProject({ videoModel: 'veo-3.1-fast-generate-preview' }); onGenerate(); }}
                                    onNavigateToPlans={() => navigateTo('PLAN_SELECT')}
                                />
                            ) : (
                                <div className="space-y-6">
                                    <ModelSelector 
                                        type="video"
                                        currentModel={project.videoModel}
                                        onChange={(v) => updateProject({ videoModel: v })}
                                        className="w-full"
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-end">
                                        <GenericSelect label="Aspect Ratio" options={aspectRatios} selectedValue={project.aspectRatio} onSelect={(v) => updateProject({ aspectRatio: v as any })} />
                                        <GenericSelect label="Resolution" options={VIDEO_RESOLUTIONS} selectedValue={project.videoResolution || '720p'} onSelect={(v) => updateProject({ videoResolution: v as any })} />
                                        <button 
                                            onClick={onGenerate} 
                                            disabled={isLoading}
                                            className="h-12 w-full bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-accent/10 disabled:shadow-none"
                                        >
                                            {isLoading ? (
                                                <><div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div><span>Generating...</span></>
                                            ) : (
                                                <><span>Generate Swap</span><SparklesIcon className="w-5 h-5" /><span>{cost}</span></>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            );
        }

        if (appliedTemplate && !project.videoToExtend) {
             return (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-top-2 duration-300">
                     {/* Left Column: Thumbnails */}
                     <div className="md:col-span-1 space-y-6">
                         <div className="p-6 rounded-xl bg-transparent border border-gray-200 dark:border-gray-700 h-fit relative group flex justify-center">
                             {/* Special Layout for Transition Builder */}
                             {isTransitionBuilder ? (
                                <div className="flex gap-4">
                                    {/* Subject Thumbnail (User Uploaded) */}
                                    <div className="flex flex-col gap-2 w-32">
                                        <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 bg-white dark:bg-black shadow-sm">
                                            {project.productFile ? (
                                                <AssetPreview asset={project.productFile} objectFit="cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ImageIcon className="w-8 h-8 text-gray-300" />
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => {
                                                setProductModalMode('edit');
                                                setProductUploadModalContext('person');
                                                setIsProductUploadModalOpen(true);
                                            }}
                                            className="w-full py-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            Edit Subject
                                        </button>
                                    </div>

                                    {/* Scene Preview */}
                                    <div className="flex flex-col gap-2 w-32">
                                        <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 bg-white dark:bg-black shadow-sm">
                                            <img 
                                                src={getSceneImageUrl(project.ugcSceneDescription || 'Bedroom')} 
                                                alt="Scene" 
                                                className="w-full h-full object-cover" 
                                            />
                                        </div>
                                        <button
                                            onClick={() => setIsSceneModalOpen(true)}
                                            className="w-full py-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            Edit Scene
                                        </button>
                                    </div>
                                </div>
                             ) : (
                                <div className="flex gap-4">
                                    {/* Template Thumbnail */}
                                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 shadow-sm">
                                        <img src={appliedTemplate.previewImageUrl} alt={appliedTemplate.title} className="w-full h-full object-cover" />
                                    </div>

                                    {/* Product Thumbnail + Edit Button */}
                                    <div className="flex flex-col gap-2 w-32">
                                        <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 bg-white dark:bg-black shadow-sm">
                                            {project.productFile ? (
                                                <AssetPreview asset={project.productFile} objectFit="cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ImageIcon className="w-8 h-8 text-gray-300" />
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => {
                                                setProductModalMode('edit');
                                                setProductUploadModalContext(isBulletTime ? 'person' : 'product');
                                                setIsProductUploadModalOpen(true);
                                            }}
                                            className="w-full py-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            Edit {isBulletTime ? 'Subject' : 'Product'}
                                        </button>
                                    </div>
                                </div>
                             )}
                         </div>
                     </div>

                     {/* Right Column: Settings */}
                     <div className="md:col-span-2 space-y-6">
                         <div>
                             <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
                                {isTransitionBuilder || isBulletTime ? 'Create Your Look' : 'Confirm settings and then generate'}
                             </h3>
                             
                             {generationError ? (
                                <ErrorResolutionView 
                                    error={generationError} 
                                    onClear={() => setGenerationError(null)}
                                    onRetry={onGenerate}
                                    onSwitchToFlash={() => { 
                                        const updates = appliedTemplate.type === 'video' ? { videoModel: 'veo-3.1-fast-generate-preview' } : { imageModel: 'gemini-2.5-flash-image' };
                                        updateProject(updates); 
                                        onGenerate(); 
                                    }}
                                    onNavigateToPlans={() => navigateTo('PLAN_SELECT')}
                                    onFocusPrompt={() => promptInputRef.current?.focus()}
                                />
                            ) : (
                                <div className="space-y-6">
                                    
                                    {/* CUSTOM UI - TRANSITION BUILDER */}
                                    {isTransitionBuilder ? (
                                        <div className="space-y-6">
                                            {/* Timeline List */}
                                            {(project.transitionSettings || []).map((step, index) => (
                                                <React.Fragment key={step.id}>
                                                    {/* Outfit Input */}
                                                    <div className="relative">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                                Outfit {index + 1}
                                                            </label>
                                                            <button 
                                                                onClick={() => handleSuggestOutfit(index)}
                                                                disabled={isSuggestingOutfit === index}
                                                                className="text-xs font-bold text-brand-accent hover:underline disabled:opacity-50 flex items-center gap-1"
                                                            >
                                                                {isSuggestingOutfit === index ? (
                                                                    <><div className="w-3 h-3 border-2 border-brand-accent border-t-transparent rounded-full animate-spin"></div> Thinking...</>
                                                                ) : (
                                                                    <><SparklesIcon className="w-3 h-3"/> Suggest</>
                                                                )}
                                                            </button>
                                                        </div>
                                                        <div className="flex gap-2 items-center">
                                                            <input 
                                                                type="text" 
                                                                value={step.look}
                                                                onChange={(e) => updateTransitionStep(index, { look: e.target.value })}
                                                                placeholder={index === 0 ? "e.g., Grey sweatpants and hoodie" : "e.g., Gold sparkling evening gown"}
                                                                className="w-full p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-[#131517] input-focus-brand text-gray-900 dark:text-white placeholder-gray-400"
                                                            />
                                                            {(project.transitionSettings?.length || 0) > 2 && (
                                                                <button 
                                                                    onClick={() => removeTransitionStep(index)}
                                                                    className="p-3 text-gray-400 hover:text-red-500 transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-900 rounded-lg"
                                                                    title="Remove Outfit"
                                                                >
                                                                    <TrashIcon className="w-5 h-5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Transition Selector */}
                                                    {index < (project.transitionSettings?.length || 0) - 1 && (
                                                        <div className="w-full">
                                                            <GenericSelect 
                                                                label="Transition"
                                                                options={TRANSITION_ACTIONS}
                                                                selectedValue={step.action || 'Spin'}
                                                                onSelect={(v) => updateTransitionStep(index, { action: v as string })}
                                                            />
                                                        </div>
                                                    )}
                                                </React.Fragment>
                                            ))}

                                            {/* Add Step Button */}
                                            <button 
                                                onClick={addTransitionStep}
                                                className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400 font-semibold hover:border-brand-accent hover:text-brand-accent transition-colors flex items-center justify-center gap-2"
                                            >
                                                <PlusIcon className="w-5 h-5" />
                                                Add Another Look
                                            </button>
                                        </div>
                                    ) : isBulletTime ? (
                                        /* CUSTOM UI - BULLET TIME */
                                        <div className="space-y-6">
                                            {/* Subject Look */}
                                            <div className="relative">
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                        Subject Look & Outfit
                                                    </label>
                                                    <button 
                                                        onClick={handleSuggestSingleOutfit}
                                                        disabled={isSuggestingSingleOutfit}
                                                        className="text-xs font-bold text-brand-accent hover:underline disabled:opacity-50 flex items-center gap-1"
                                                    >
                                                        {isSuggestingSingleOutfit ? (
                                                            <><div className="w-3 h-3 border-2 border-brand-accent border-t-transparent rounded-full animate-spin"></div> Thinking...</>
                                                        ) : (
                                                            <><SparklesIcon className="w-3 h-3"/> Suggest</>
                                                        )}
                                                    </button>
                                                </div>
                                                <textarea 
                                                    value={project.productDescription || ''}
                                                    onChange={(e) => updateProject({ productDescription: e.target.value })}
                                                    placeholder="e.g., A white t-shirt and blue jeans"
                                                    className="w-full p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-[#131517] input-focus-brand text-gray-900 dark:text-white placeholder-gray-400 min-h-[6rem] resize-none"
                                                />
                                            </div>

                                            {/* Environment Input */}
                                            <div className="relative">
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                        Environment / Scene
                                                    </label>
                                                    <button 
                                                        onClick={handleSuggestEnvironment}
                                                        disabled={isSuggestingEnvironment}
                                                        className="text-xs font-bold text-brand-accent hover:underline disabled:opacity-50 flex items-center gap-1"
                                                    >
                                                        {isSuggestingEnvironment ? (
                                                            <><div className="w-3 h-3 border-2 border-brand-accent border-t-transparent rounded-full animate-spin"></div> Thinking...</>
                                                        ) : (
                                                            <><SparklesIcon className="w-3 h-3"/> Suggest</>
                                                        )}
                                                    </button>
                                                </div>
                                                <textarea 
                                                    value={project.ugcSceneDescription || ''}
                                                    onChange={(e) => updateProject({ ugcSceneDescription: e.target.value })}
                                                    placeholder="e.g., A neon-lit cyberpunk street in heavy rain"
                                                    className="w-full p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-[#131517] input-focus-brand text-gray-900 dark:text-white placeholder-gray-400 min-h-[6rem] resize-none"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        /* AI Model Selector for Standard Templates */
                                        !isProductAdAndMissingFile && (
                                            <ModelSelector 
                                                type={appliedTemplate.type === 'video' ? 'video' : 'image'}
                                                currentModel={appliedTemplate.type === 'video' ? project.videoModel : project.imageModel}
                                                recommendedModel={appliedTemplate?.recommendedModel}
                                                onChange={(v) => appliedTemplate.type === 'video' ? updateProject({ videoModel: v }) : updateProject({ imageModel: v })}
                                            />
                                        )
                                    )}

                                    {/* Custom UI Model Selectors (Ensuring visibility) */}
                                    {(isTransitionBuilder || isBulletTime) && (
                                        <ModelSelector 
                                            type='video'
                                            currentModel={project.videoModel}
                                            recommendedModel={appliedTemplate?.recommendedModel}
                                            onChange={(v) => updateProject({ videoModel: v })}
                                        />
                                    )}

                                    {renderSettingsGrid()}
                                </div>
                             )}
                         </div>
                     </div>
                </div>
            );
        }

        if (isProductAdMode && !isUgcFlow && !project.videoToExtend) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-top-2 duration-300">
                    {/* Left Column: Product Card */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="p-6 rounded-xl bg-transparent border border-gray-200 dark:border-gray-700 h-fit relative group">
                            <div className="flex items-start gap-4">
                                <div className="flex flex-col gap-3 flex-shrink-0">
                                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                                         {project.productFile ? (
                                             <AssetPreview asset={project.productFile} objectFit="cover" />
                                         ) : (
                                             <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                 <ImageIcon className="w-8 h-8" />
                                             </div>
                                         )}
                                    </div>
                                    <button
                                        onClick={() => {
                                            setProductModalMode('edit');
                                            setProductUploadModalContext('product');
                                            setIsProductUploadModalOpen(true);
                                        }}
                                        className="w-20 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        Edit
                                    </button>
                                </div>
                                <div className="flex-grow pt-1 flex flex-col gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">PRODUCT</label>
                                        <p className="text-gray-900 dark:text-white font-bold text-base leading-tight">
                                            {project.productName || 'Not specified'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">DESCRIPTION</label>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-3">
                                            {project.productDescription || 'Not specified'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Inputs & Settings */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Prompt Input */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label htmlFor="prompt" className={`text-xl font-bold ${isProductAdAndMissingFile ? 'text-gray-400 dark:text-gray-600' : ''}`}>
                                    {getPromptLabel()}
                                </label>
                            </div>
                            <div className={`relative border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:!bg-[#131517] input-focus-brand ${isProductAdAndMissingFile ? 'opacity-60' : ''} ${!isProductAdAndMissingFile && 'hover:border-gray-400 dark:hover:border-gray-500'} transition-colors group-focus-within:ring-2 group-focus-within:ring-brand-focus group-focus-within:border-brand-focus`}>
                                 <textarea
                                    id="prompt"
                                    ref={promptInputRef}
                                    value={project.prompt || ''}
                                    onChange={e => updateProject({ prompt: e.target.value })}
                                    placeholder="A cinematic shot of..."
                                    className="w-full border-none focus:outline-none focus:ring-0 bg-transparent dark:!bg-transparent min-h-[8rem] pb-10 resize-none"
                                    disabled={isProductAdAndMissingFile}
                                ></textarea>
                                
                                {project.referenceFiles.length > 0 && (
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

                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-700/50">
                                    <div>
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
                                    </div>
                                    <div className="flex items-center gap-4">
                                         <button 
                                            onClick={() => setIsCampaignModalOpen(true)} 
                                            className="text-sm font-bold text-brand-accent hover:underline hover:text-brand-accent-hover disabled:text-gray-400 disabled:no-underline transition-colors" 
                                            disabled={isProductAdAndMissingFile}
                                        >
                                            {getInspirationButtonText()}
                                        </button>
                                         <button 
                                            onClick={() => setIsPromptModalOpen(true)} 
                                            className="text-sm font-bold text-brand-accent hover:underline hover:text-brand-accent-hover disabled:text-gray-400 disabled:no-underline transition-colors"
                                        >
                                            Visual inspiration
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Settings Grid */}
                        <div className="mt-8">
                            {generationError ? (
                                <ErrorResolutionView 
                                    error={generationError} 
                                    onClear={() => setGenerationError(null)}
                                    onRetry={onGenerate}
                                    onSwitchToFlash={() => { updateProject({ imageModel: 'gemini-2.5-flash-image' }); onGenerate(); }}
                                    onNavigateToPlans={() => navigateTo('PLAN_SELECT')}
                                    onFocusPrompt={() => promptInputRef.current?.focus()}
                                />
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"> 
                                        {!isProductAdAndMissingFile && (
                                            <ModelSelector 
                                                type='image'
                                                currentModel={project.imageModel}
                                                recommendedModel={appliedTemplate?.recommendedModel}
                                                onChange={(v) => updateProject({ imageModel: v })}
                                            />
                                        )}
                                    </div>
                                    {renderSettingsGrid()}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <>
                {isVideoMakerMode && (
                    <div className="grid grid-cols-2 gap-4 md:gap-6 mb-6 md:w-1/2 mx-auto animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-2">
                            <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wide truncate">
                                START FRAME <span className="font-normal normal-case opacity-70">(Optional)</span>
                            </label>
                            {project.startFrame ? (
                                <div className="relative w-full aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 group">
                                    <AssetPreview asset={project.startFrame} objectFit="cover" />
                                    <button onClick={() => updateProject({ startFrame: undefined })} className="absolute -top-2 -right-2 z-10 bg-black text-white dark:bg-white dark:text-black rounded-full p-1 shadow-md hover:scale-110 transition-transform">
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="aspect-square">
                                    <Uploader onUpload={(file) => updateProject({ startFrame: file })} title="Upload start frame" compact fill />
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wide truncate">
                                END FRAME <span className="font-normal normal-case opacity-70">(Optional)</span>
                            </label>
                            {project.endFrame ? (
                                <div className="relative w-full aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 group">
                                    <AssetPreview asset={project.endFrame} objectFit="cover" />
                                    <button onClick={() => updateProject({ endFrame: undefined })} className="absolute -top-2 -right-2 z-10 bg-black text-white dark:bg-white dark:text-black rounded-full p-1 shadow-md hover:scale-110 transition-transform">
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="aspect-square">
                                    <Uploader onUpload={(file) => updateProject({ endFrame: file })} title="Upload end frame" compact fill />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {isUgcFlow ? (
                     <div className="mb-6 space-y-4">
                        <h3 className="text-xl font-bold">Avatar</h3>
                        {project.ugcAvatarSource === 'ai' && (
                            <div>
                                <label className="block mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Avatar Description</label>
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

                <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <label htmlFor="prompt" className={`text-xl font-bold ${isProductAdAndMissingFile ? 'text-gray-400 dark:text-gray-600' : ''}`}>
                            {isProductAdFlow ? '' : 'Describe your vision'}
                        </label>
                    </div>
                    <div className={`relative border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:!bg-[#131517] input-focus-brand ${isProductAdAndMissingFile ? 'opacity-60' : ''} ${!isProductAdAndMissingFile && 'hover:border-gray-400 dark:hover:border-gray-500'} transition-colors group-focus-within:ring-2 group-focus-within:ring-brand-focus group-focus-within:border-brand-focus`}>
                        
                        {/* Text Area */}
                        <textarea
                            id="prompt"
                            ref={promptInputRef}
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

                {/* Settings */}
                {!project.videoToExtend && (
                    <div className="mt-8">
                         {generationError ? (
                            <ErrorResolutionView 
                                error={generationError} 
                                onClear={() => setGenerationError(null)}
                                onRetry={onGenerate}
                                onSwitchToFlash={() => { 
                                    const updates = project.mode === 'Video Maker' ? { videoModel: 'veo-3.1-fast-generate-preview' } : { imageModel: 'gemini-2.5-flash-image' };
                                    updateProject(updates); 
                                    onGenerate(); 
                                }}
                                onNavigateToPlans={() => navigateTo('PLAN_SELECT')}
                                onFocusPrompt={() => promptInputRef.current?.focus()}
                            />
                        ) : (
                            /* Container for Video Settings (if in Video Maker mode) */
                            project.mode === 'Video Maker' ? (
                                <div className="p-6 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="space-y-6">
                                        <ModelSelector 
                                            type="video"
                                            currentModel={project.videoModel}
                                            onChange={(v) => updateProject({ videoModel: v })}
                                            className="w-full"
                                        />
                                        {renderSettingsGrid()}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Model Selector Row for Image modes */}
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
                                    {renderSettingsGrid()}
                                </>
                            )
                        )}
                    </div>
                )}
            </>
        );
    };

    const renderProductSetupStep = () => {
        const shouldShowDetails = project.productFile || project.productName || isAnalyzing;
        const agentCost = CREDIT_COSTS.base.agent;
        const hasEnoughCreditsForAgent = (user.credits?.strategy?.current ?? 0) >= agentCost;
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
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {/* Left Column: Product Upload */}
                    <div className="p-6 rounded-xl bg-white dark:bg-gray-800 shadow-sm">
                        <ProductScraper onProductScraped={handleProductScraped} setIsLoading={setIsLoading} setStatusMessages={setGenerationStatusMessages} setError={setError} initialUrl={project.websiteUrl || ''} />
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-300 dark:border-gray-600" /></div>
                            <div className="relative flex justify-center text-sm"><span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">OR</span></div>
                        </div>
                        <div>
                            <label className="block mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Upload Product Image</label>
                            {isAnalyzing ? (
                                <div className="w-48 h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center"><div style={{ borderColor: '#91EB23', borderTopColor: 'transparent' }} className="w-8 h-8 border-4 rounded-full animate-spin"></div></div>
                            ) : project.productFile ? (
                                <div className="relative w-48 h-48 bg-gray-100 dark:bg-gray-700 rounded-lg"><AssetPreview asset={project.productFile} /><button onClick={() => updateProject({ productFile: null })} className="absolute -top-2 -right-2 z-10 bg-black text-white dark:bg-white dark:text-black rounded-full p-1 shadow-md"><XMarkIcon className="w-5 h-5" /></button></div>
                            ) : ( <Uploader onUpload={handleFileUpload} /> )}
                        </div>
                    </div>

                    {/* Right Column: Product Details */}
                    {shouldShowDetails && (
                        <div className="flex flex-col gap-6 h-full">
                            <div>
                                <label htmlFor="productName" className={`block mb-2 text-xs font-semibold uppercase tracking-wide ${isProductAdAndMissingFile ? 'text-gray-400 dark:text-gray-600' : 'text-gray-500'}`}>Product Name</label>
                                {isAnalyzing ? <div className="w-full p-4 h-[58px] rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div> : <input type="text" id="productName" value={project.productName} onChange={e => updateProject({ productName: e.target.value })} placeholder="e.g., The Cozy Slipper" className="w-full p-4 border rounded-lg input-focus-brand disabled:opacity-60" disabled={isProductAdAndMissingFile} />}
                            </div>
                            <div className="flex-grow flex flex-col">
                                <div className="flex justify-between items-end mb-2">
                                    <label htmlFor="productDescription" className={`block text-xs font-semibold uppercase tracking-wide ${isProductAdAndMissingFile ? 'text-gray-400 dark:text-gray-600' : 'text-gray-500'}`}>Product Description</label>
                                    {project.productFile && !isAnalyzing && (
                                        <button 
                                            onClick={() => analyzeProductImage(project.productFile!)}
                                            className="text-sm font-bold text-brand-accent hover:underline hover:text-brand-accent-hover transition-colors"
                                            title="Overwrite details with AI analysis of the current image"
                                        >
                                            Analyze Image
                                        </button>
                                    )}
                                </div>
                                {isAnalyzing ? <div className="w-full p-4 h-24 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse flex-grow"></div> : <textarea id="productDescription" value={project.productDescription} onChange={e => updateProject({ productDescription: e.target.value })} placeholder="e.g., A warm and comfortable slipper, perfect for relaxing at home." className="w-full p-4 border rounded-lg h-full flex-grow input-focus-brand disabled:opacity-60" disabled={isProductAdAndMissingFile}></textarea>}
                            </div>
                        </div>
                    )}
                </div>
                
                {isAIAgentFlow && ( <div className="mt-8"> <label htmlFor="highLevelGoal" className="block mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Campaign Goal & Context (Optional)</label> <textarea id="highLevelGoal" value={project.highLevelGoal || ''} onChange={(e) => updateProject({ highLevelGoal: e.target.value })} placeholder="Provide any details to guide your Genie. Examples: a discount you're running, a holiday theme (e.g., 'Holiday Cheer'), a target audience (e.g., 'Gen Z shoppers'), or just leave it blank and let your Genie decide the best strategy." className="w-full p-4 border rounded-lg h-36 input-focus-brand" /> </div> )}
                
                {shouldShowDetails && (
                    <div className="flex justify-end mt-8">
                         {generationError ? (
                            <ErrorResolutionView 
                                error={generationError} 
                                onClear={() => setGenerationError(null)}
                                onRetry={runAgent}
                                onNavigateToPlans={() => navigateTo('PLAN_SELECT')}
                            />
                        ) : (
                            isAIAgentFlow && (
                                <button onClick={runAgent} disabled={isLaunchDisabled} className="px-8 py-3 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center justify-center gap-2">
                                    <span>Generate Campaign</span><SparklesIcon className="w-5 h-5" /><span>{agentCost}</span>
                                </button>
                            )
                        )}
                    </div>
                )}
            </div>
        );
    };
    
    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            const maxScroll = scrollWidth - clientWidth;
            setScrollProgress(maxScroll > 0 ? scrollLeft / maxScroll : 0);
        }
    };

    const checkScrollDimensions = () => {
        if (scrollRef.current) {
            const { clientWidth, scrollWidth } = scrollRef.current;
            const ratio = (clientWidth / scrollWidth) * 100;
            setIndicatorWidth(Math.min(100, ratio));
        }
    };

    useEffect(() => {
        checkScrollDimensions();
        window.addEventListener('resize', checkScrollDimensions);
        return () => window.removeEventListener('resize', checkScrollDimensions);
    }, []);

    const renderSelectAdStyleStep = () => {
        return (
            <div className="page-enter">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={goBack} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 -ml-2">
                            <LeftArrowIcon className="w-6 h-6" />
                        </button>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Choose an Ad Style</h2>
                    </div>
                </div>
                
                {/* Horizontal Scroll Carousel */}
                <div>
                    <div 
                        ref={scrollRef}
                        onScroll={() => { handleScroll(); checkScrollDimensions(); }}
                        className="flex overflow-x-auto pb-6 gap-4 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0"
                    >
                        {AD_STYLES.map((style) => (
                            <button 
                                key={style.name}
                                onClick={() => {
                                    updateProject({ adStyle: style.name, ugcAvatarSource: undefined });
                                    setProductModalMode('create');
                                    setProductUploadModalContext('product');
                                    setIsProductUploadModalOpen(true);
                                }}
                                className="group text-left flex flex-col flex-shrink-0 w-40 md:w-48 snap-start focus:outline-none"
                            >
                                <div className="relative overflow-hidden rounded-xl aspect-[9/16] w-full bg-gray-100 dark:bg-gray-800 transition-all duration-300">
                                    <img 
                                        src={style.imageUrl} 
                                        alt={style.title} 
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                                    />
                                </div>
                                <div className="mt-3 w-full text-left">
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white transition-colors group-hover:text-brand-accent">
                                        {style.title}
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                        {style.description}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Scroll Indicator */}
                    <div className="relative h-1 bg-gray-200 dark:bg-[#2B2B2B] rounded-full mb-6 w-full overflow-hidden mt-4">
                        <div 
                            className="absolute top-0 h-full bg-brand-accent rounded-full"
                            style={{ 
                                width: `${indicatorWidth}%`, 
                                left: `${scrollProgress * (100 - indicatorWidth)}%`,
                                transition: 'left 0.1s ease-out, width 0.1s ease-out'
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-5xl mx-auto">
             <input type="file" ref={fileInputRef} onChange={(e) => handleReferenceFileUpload(e.target.files)} className="hidden" accept="image/*" multiple />
            
            {isProductAdFlow ? (
                <>
                    {productAdStep === 1 && renderSelectAdStyleStep()}
                    {productAdStep === 2 && (
                        <div className="page-enter">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {appliedTemplate 
                                            ? `${appliedTemplate.title} Template` 
                                            : (project.adStyle === 'Creative Placement' || !project.adStyle) 
                                                ? 'Product Placement' 
                                                : getPromptLabel()
                                        }
                                    </h2>
                                </div>
                                <ProgressStepper steps={adCampaignSteps} currentStepIndex={1} />
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
                             <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{project.videoToExtend ? 'Extend Your Video' : project.mode === 'Art Maker' ? 'Create with Art Maker' : project.mode === 'Character Swap' ? 'Character Swap' : 'Create a Video'}</h2>
                             <div className="text-gray-600 dark:text-gray-300 mt-2">{project.videoToExtend ? extendSubtitle : subtitles[project.mode]}</div>
                        </div>
                        <div className="w-10"></div> {/* Spacer */}
                    </div>
                    
                    <div className="max-w-4xl mx-auto">
                        {renderPromptAndSettings()}
                    </div>
                </>
            )}

            {error && !generationError && <div className="mt-6 p-4 bg-red-50 text-red-800 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-300 dark:border-red-500/30">{error}</div>}
            {!hasEnoughCredits && !isLoading && !isCharacterSwap && ( <div className="mt-6 p-4 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-500/30 text-center">Not enough credits. <button onClick={() => navigateTo('PLAN_SELECT')} className="font-bold underline hover:text-yellow-900 dark:hover:text-yellow-200">Buy More or Upgrade Plan</button>.</div> )}
            <PromptExamplesModal isOpen={isPromptModalOpen} onClose={() => setIsPromptModalOpen(false)} onSelect={(p) => updateProject({ prompt: p })} project={project} />
            <CampaignInspirationModal isOpen={isCampaignModalOpen} onClose={() => setIsCampaignModalOpen(false)} onSelect={handleInspirationSelect} project={project} />
            {/* Fix: use handleProductModalConfirm instead of handleProductUploadConfirm */}
            <ProductUploadModal 
                isOpen={isProductUploadModalOpen} 
                onClose={() => setIsProductUploadModalOpen(false)} 
                onConfirm={handleProductModalConfirm} 
                mode={productModalMode}
                initialData={productModalMode === 'edit' ? {
                    file: project.productFile,
                    name: project.productName,
                    description: project.productDescription,
                    url: project.websiteUrl
                } : undefined}
            />
            <SceneSelectionModal 
                isOpen={isSceneModalOpen}
                onClose={() => setIsSceneModalOpen(false)}
                onSelect={(sceneName) => updateProject({ ugcSceneDescription: sceneName })}
            />
        </div>
    );
};