import React, { useState, useEffect, useRef } from 'react';
import { CREDIT_COSTS } from '../constants';
import { SparklesIcon, UGCImage, XMarkIcon, AspectRatioSquareIcon, AspectRatioTallIcon, AspectRatioWideIcon, LeftArrowIcon, PencilIcon, ArrowDownTrayIcon, UserCircleIcon } from '../components/icons';
import type { Project, UploadedFile, Template } from '../types';
import { Uploader } from '../components/Uploader';
import { AssetPreview } from '../components/AssetPreview';
import { GenericSelect } from '../components/GenericSelect';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useProjects } from '../context/ProjectContext';
import { AvatarTemplateModal } from '../components/AvatarTemplateModal';
import { ScriptGeneratorModal } from '../components/ScriptGeneratorModal';
import { ProductScraper } from '../components/ProductScraper';
import { generateCampaignBrief, fetchWithProxies, validateAvatarImage, suggestUGCKeyMessaging, suggestUGCSceneDescription } from '../services/geminiService';
import { TEMPLATE_LIBRARY } from '../lib/templates';
import { ProgressStepper } from '../components/ProgressStepper';

type TemplateStep = 'Setup' | 'Story' | 'Avatar' | 'Production';
type CustomStep = 'Setup' | 'Story' | 'Avatar' | 'Production';

// Expanded Quick Select Options
const QUICK_SCENES: Record<string, Record<string, string>> = {
    'talking_head': {
        'Modern Kitchen': 'A close-up, eye-level shot in a bright, modern kitchen. The background features clean white marble countertops, stainless steel appliances, and soft, natural light coming from a large window.',
        'Cozy Home Office': 'A medium shot in a cozy home office. The background includes a stylish wooden desk, a bookshelf filled with books, a comfortable chair, and a large window with soft, warm light.',
        'Living Room': 'A medium shot in a comfortable and stylish living room. The person is sitting on a plush sofa. The background includes a coffee table, a soft rug, and decorative plants.',
        'City Park': 'A medium shot in a beautiful city park on a sunny day. The background has green grass, lush trees, and a pathway with soft, out-of-focus details.'
    },
    'product_showcase': {
        'Studio White': 'A clean, bright studio setting with a seamless white background. Perfect for highlighting the product details.',
        'Kitchen Counter': 'A bright, modern kitchen counter with blurred appliances in the background.',
        'Wooden Table': 'A rustic wooden table top with soft, warm lighting.',
        'Outdoor Nature': 'An outdoor setting with natural sunlight and blurred greenery in the background.'
    },
    'unboxing': {
        'Clean Desk': 'A top-down or angled view of a clean, minimalist white desk with good lighting.',
        'Living Room Floor': 'Sitting on a soft, textured rug in a cozy living room.',
        'Kitchen Island': 'Standing at a spacious kitchen island with pendant lighting overhead.',
        'Bedroom': 'Sitting on a bed with a white duvet cover, cozy and casual.'
    },
    'green_screen': {
        'Tech News': 'A screenshot of a recent tech news article about AI advancements.',
        'Viral Tweet': 'A viral tweet with thousands of likes and retweets.',
        'Stock Chart': 'A stock market chart showing a sharp upward trend.',
        'Website Homepage': 'The homepage of a modern SaaS website.'
    },
    'podcast': {
        'Dark Studio': 'A dimly lit, professional podcast studio with soundproofing foam, neon accents, and a large microphone arm.',
        'Bright Studio': 'A bright, airy studio with plants, a large wooden table, and professional audio equipment.',
        'Cozy Corner': 'A comfortable armchair in a room with bookshelves and warm lamp lighting.',
        'Tech Setup': 'A modern desk setup with multiple monitors and RGB lighting in the background.'
    },
    'reaction': {
        'Viral Video': 'Split screen reaction to a viral video clip.',
        'Fail Compilation': 'Reacting to a funny fail video compilation.',
        'Product Launch': 'Watching a live stream of a new tech product launch.',
        'Movie Trailer': 'Reacting to an intense new movie trailer.'
    },
    'pov': {
        'Walking in Park': 'Handheld camera view walking through a sunny park.',
        'Car Dashboard': 'View from the dashboard of a car while driving (safely).',
        'Gym Mirror': 'Selfie view in a gym mirror with workout equipment behind.',
        'Desk Setup': 'Looking down at a keyboard and mouse from the user\'s perspective.'
    }
};

// Fallback for any types not explicitly defined
const DEFAULT_SCENES = QUICK_SCENES['talking_head'];

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

const UGC_ASPECT_RATIOS = [
    { value: '9:16', label: '9:16', icon: <AspectRatioTallIcon className="w-5 h-5" /> },
    { value: '16:9', label: '16:9', icon: <AspectRatioWideIcon className="w-5 h-5" /> },
    { value: '1:1', label: '1:1', icon: <AspectRatioSquareIcon className="w-5 h-5" /> }
];

const UGC_STYLES = [
    { type: 'talking_head', title: 'Just Talking', description: 'Classic talking head.', imageUrl: 'https://storage.googleapis.com/genius-images-ny/images/Screenshot%202025-11-08%20at%2011.04.52%E2%80%AFAM.png', comingSoon: false },
    { type: 'product_showcase', title: 'Product Showcase', description: 'Highlighting a product.', imageUrl: 'https://storage.googleapis.com/genius-images-ny/images/Screenshot%202025-11-08%20at%2011.01.23%E2%80%AFAM.png', comingSoon: false },
    { type: 'unboxing', title: 'Unboxing', description: 'Opening and revealing.', imageUrl: 'https://storage.googleapis.com/genius-images-ny/images/Screenshot%202025-11-08%20at%2010.47.47%E2%80%AFAM.png', comingSoon: false },
    { type: 'pov', title: 'POV / Vlog', description: 'Handheld, selfie style.', imageUrl: 'https://storage.googleapis.com/genius-images-ny/images/Screenshot%202025-11-08%20at%2010.47.47%E2%80%AFAM.png', comingSoon: false },
    { type: 'green_screen', title: 'Green Screen', description: 'Commentary over background.', imageUrl: 'https://storage.googleapis.com/genius-images-ny/images/Screenshot%202025-11-08%20at%2010.52.17%E2%80%AFAM.png', comingSoon: true },
    { type: 'podcast', title: 'Podcast Clip', description: 'Professional studio vibe.', imageUrl: 'https://storage.googleapis.com/genius-images-ny/images/Screenshot%202025-11-08%20at%2010.34.57%E2%80%AFAM.png', comingSoon: true },
    { type: 'reaction', title: 'Reaction', description: 'Reacting to content.', imageUrl: 'https://storage.googleapis.com/genius-images-ny/images/Screenshot%202025-11-08%20at%2010.48.56%E2%80%AFAM.png', comingSoon: true },
];

const ModelSelector = ({ type, currentModel, recommendedModel, onChange }: { type: 'image' | 'video', currentModel?: string, recommendedModel?: string, onChange: (val: string) => void }) => {
  const models = VIDEO_MODELS;
  
  // Determine if current model matches recommended or if it's "auto"
  const isRecommended = recommendedModel && currentModel === recommendedModel;
  
  return (
    <div className="mb-6">
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

// Basic file util
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
                mimeType: file.type || 'application/octet-stream',
                name,
                blob,
            });
        };
    });
};

export const UGCGeneratorScreen: React.FC = () => {
    const { user } = useAuth();
    const { isLoading, error, setError, setIsLoading, setGenerationStatusMessages, goBack } = useUI();
    const {
        currentProject: project,
        setCurrentProject: setProject,
        handleGenerate,
        applyPendingTemplate,
        templateToApply
    } = useProjects();
    
    // Flow state
    const [templateStep, setTemplateStep] = useState<TemplateStep>('Setup');
    
    // Track if we entered from the Product Ad flow (skipped setup) using a Ref to ensure it persists regardless of state changes
    const isProductAdFlowRef = useRef(!!(project?.ugcProductFile && project?.ugcType === 'product_showcase'));

    const [customStep, setCustomStep] = useState<CustomStep>(() => {
        if (isProductAdFlowRef.current) {
            return 'Story';
        }
        return 'Setup';
    });
    
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Scroll to top when step changes
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [templateStep, customStep]);

    // Trigger applyPendingTemplate on mount if one exists
    useEffect(() => {
        if (templateToApply && project) {
            applyPendingTemplate(project);
        }
    }, [templateToApply, project, applyPendingTemplate]);

    if (!project || !user) {
        return <div className="text-center p-8">Error: No active project.</div>;
    }

    const isTemplateMode = !!project.templateId;
    const currentTemplate = isTemplateMode ? TEMPLATE_LIBRARY.find(t => t.id === project.templateId) : null;

    const updateProject = (updates: Partial<Project>) => {
        if (project) {
            setProject({ ...project, ...updates });
        }
    };

    const handleUGCProductUpload = async (uploadedFile: UploadedFile) => {
        setIsAnalyzing(true);
        setError(null);
        try {
            const brief = await generateCampaignBrief(uploadedFile);
            updateProject({ 
                ugcProductFile: uploadedFile, 
                productName: brief.productName, 
                productDescription: brief.productDescription,
            });
        } catch (e: any) {
            console.error("Failed to analyze product image", e);
            setError(e.message || "Failed to analyze product image.");
            updateProject({ ugcProductFile: uploadedFile, productName: '', productDescription: '' });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleUGCProductScraped = (data: { name: string; description: string; file: UploadedFile | null; url: string; }) => {
        updateProject({
            ugcProductFile: data.file,
            productName: data.name,
            productDescription: data.description,
            websiteUrl: data.url,
        });
        if (!data.file) {
            setError("Product details imported. Please upload an image manually to continue.");
        }
    };

    const handleSelectTemplateCharacter = async (character: { name: string, url: string }) => {
        try {
            // Use fetchWithProxies to handle CORS when downloading the avatar image
            const response = await fetchWithProxies(character.url);
            const blob = await response.blob();
            const file = await fileToUploadedFile(blob, `${character.name}.jpg`);
            
            updateProject({ ugcAvatarFile: file, ugcAvatarDescription: '', ugcAvatarSource: 'template' });
            setIsAvatarModalOpen(false);
        } catch (e) {
            console.error("Failed to fetch template character:", e);
            setError("Could not download the selected avatar. Please try again.");
            setIsAvatarModalOpen(false);
        }
    };

    const handleAvatarUpload = async (file: UploadedFile): Promise<boolean> => {
        const isValid = await validateAvatarImage(file);
        if(isValid) {
            updateProject({ ugcAvatarFile: file, ugcAvatarSource: 'upload' });
            return true;
        } else {
            return false;
        }
    };
    
    const cost = project.videoModel === 'veo-3.1-generate-preview'
        ? CREDIT_COSTS.base.ugcVideoCinematic
        : CREDIT_COSTS.base.ugcVideoFast;

    // --- Template Mode Navigation ---
    const skipsAvatarStep = project.ugcAvatarSource !== 'upload' && project.ugcAvatarSource !== 'ai' && project.ugcAvatarSource !== 'template';
    const templateSteps = skipsAvatarStep 
        ? ['Setup', 'Story', 'Production'] 
        : ['Setup', 'Story', 'Avatar', 'Production'];

    const getTemplateStepIndex = (step: TemplateStep) => templateSteps.indexOf(step);
    
    const handleTemplateNext = () => {
         if (templateStep === 'Setup') setTemplateStep('Story');
         else if (templateStep === 'Story') {
             if (skipsAvatarStep) {
                  setTemplateStep('Production');
             } else {
                  setTemplateStep('Avatar');
             }
         }
         else if (templateStep === 'Avatar') setTemplateStep('Production');
    };

    const handleTemplateBack = () => {
        if (templateStep === 'Production') {
            if (skipsAvatarStep) setTemplateStep('Story');
            else setTemplateStep('Avatar');
        }
        else if (templateStep === 'Avatar') setTemplateStep('Story');
        else if (templateStep === 'Story') setTemplateStep('Setup');
    };

    const getTemplateHeaderTitle = () => {
        switch (templateStep) {
            case 'Setup': return currentTemplate ? `${currentTemplate.title} Template` : 'Create Video';
            case 'Story': return "Craft the Script";
            case 'Avatar': return "Customize Avatar";
            case 'Production': return "Video Settings";
            default: return currentTemplate ? `${currentTemplate.title} Template` : 'Create Video';
        }
    };

    // --- Custom Mode Navigation ---
    const getCustomStepIndex = (step: CustomStep) => ['Setup', 'Story', 'Avatar', 'Production'].indexOf(step);

    const handleCustomNext = () => {
        if (customStep === 'Setup') setCustomStep('Story');
        else if (customStep === 'Story') setCustomStep('Avatar');
        else if (customStep === 'Avatar') setCustomStep('Production');
    };

    const handleCustomBack = () => {
        if (customStep === 'Production') setCustomStep('Avatar');
        else if (customStep === 'Avatar') setCustomStep('Story');
        else if (customStep === 'Story') {
            if (isProductAdFlowRef.current) {
                // Revert mode to 'Product Ad' so that GeneratorScreen renders the correct flow (Step 2)
                updateProject({ mode: 'Product Ad' });
                goBack();
            } else {
                setCustomStep('Setup');
            }
        }
        else if (customStep === 'Setup') goBack();
    };

    const getCustomHeaderTitle = () => {
        switch (customStep) {
            case 'Setup': return "Create a UGC Video";
            case 'Story': return "Scene & Story";
            case 'Avatar': return "Create Your Persona";
            case 'Production': return "Final Polish";
            default: return "Create a UGC Video";
        }
    };
    
    // --- Validation Logic ---
    const isTemplateNextDisabled = isLoading || 
        (templateStep === 'Setup' && (!project.ugcType || (project.ugcType === 'product_showcase' && !project.ugcProductFile))) ||
        (templateStep === 'Avatar' && (project.ugcAvatarSource || 'ai') !== 'ai' && !project.ugcAvatarFile);
    
    const isProductCentric = ['product_showcase', 'unboxing'].includes(project.ugcType || '');

    const isCustomNextDisabled = isLoading ||
        (customStep === 'Setup' && (!project.ugcType || (isProductCentric && !project.ugcProductFile))) ||
        (customStep === 'Story' && (!project.ugcSceneDescription || !project.ugcScript)) || // Require scene and script
        (customStep === 'Avatar' && (project.ugcAvatarSource || 'ai') !== 'ai' && !project.ugcAvatarFile);

    // --- Render Logic ---

    if (isTemplateMode) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        {templateStep !== 'Setup' && (
                            <button onClick={handleTemplateBack} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 -ml-2">
                                <LeftArrowIcon className="w-6 h-6" />
                            </button>
                        )}
                         <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {getTemplateHeaderTitle()}
                        </h2>
                    </div>
                    <ProgressStepper steps={templateSteps} currentStepIndex={getTemplateStepIndex(templateStep)} />
                </div>

                <div className="max-w-4xl mx-auto">
                    {templateStep === 'Setup' && (
                        <TemplateSetupStep 
                            project={project} 
                            updateProject={updateProject}
                            isAnalyzing={isAnalyzing}
                            handleUGCProductUpload={handleUGCProductUpload}
                            handleUGCProductScraped={handleUGCProductScraped}
                            setIsLoading={setIsLoading}
                            setGenerationStatusMessages={setGenerationStatusMessages}
                            setError={setError}
                            currentTemplate={currentTemplate}
                        />
                    )}
                    {templateStep === 'Story' && (
                        <TemplateStoryStep 
                            project={project} 
                            updateProject={updateProject} 
                            isLoading={isLoading}
                        />
                    )}
                    {templateStep === 'Avatar' && (
                         <TemplateAvatarStep 
                            project={project} 
                            updateProject={updateProject}
                            handleAvatarUpload={handleAvatarUpload}
                            onOpenTemplateModal={() => setIsAvatarModalOpen(true)}
                         />
                    )}
                    {templateStep === 'Production' && (
                        <TemplateProductionStep
                            project={project}
                            updateProject={updateProject}
                            handleGenerate={handleGenerate}
                            isLoading={isLoading}
                            cost={cost}
                        />
                    )}

                    {/* Navigation Actions (Only for Steps 1, 2, 3) */}
                    {templateStep !== 'Production' && (
                        <div className="mt-10 flex items-center justify-end">
                            <button 
                                onClick={handleTemplateNext} 
                                disabled={isTemplateNextDisabled}
                                className="h-12 px-8 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Continue
                            </button>
                        </div>
                    )}
                     {error && <p className="text-right text-sm text-red-500 mt-2">{error}</p>}
                </div>
                
                 <AvatarTemplateModal
                    isOpen={isAvatarModalOpen}
                    onClose={() => setIsAvatarModalOpen(false)}
                    onSelect={handleSelectTemplateCharacter}
                />
            </div>
        );
    }

    // --- Custom Flow Render ---
    const customSteps = ['Goal', 'Scene', 'Avatar', 'Production'];

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={handleCustomBack} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 -ml-2">
                        <LeftArrowIcon className="w-6 h-6" />
                    </button>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {getCustomHeaderTitle()}
                    </h2>
                </div>
                <ProgressStepper steps={customSteps} currentStepIndex={getCustomStepIndex(customStep)} />
            </div>

            <div className="max-w-5xl mx-auto">
                {customStep === 'Setup' && (
                    <CustomSetupStep
                        project={project}
                        updateProject={updateProject}
                        isAnalyzing={isAnalyzing}
                        handleUGCProductUpload={handleUGCProductUpload}
                        handleUGCProductScraped={handleUGCProductScraped}
                        setIsLoading={setIsLoading}
                        setGenerationStatusMessages={setGenerationStatusMessages}
                        setError={setError}
                    />
                )}
                {customStep === 'Story' && (
                    <CustomStoryStep
                        project={project}
                        updateProject={updateProject}
                        isLoading={isLoading}
                    />
                )}
                {customStep === 'Avatar' && (
                    <CustomAvatarStep
                        project={project}
                        updateProject={updateProject}
                        handleAvatarUpload={handleAvatarUpload}
                        onOpenTemplateModal={() => setIsAvatarModalOpen(true)}
                    />
                )}
                {customStep === 'Production' && (
                     <CustomProductionStep
                        project={project}
                        updateProject={updateProject}
                        handleGenerate={handleGenerate}
                        isLoading={isLoading}
                        cost={cost}
                     />
                )}

                {customStep !== 'Production' && (
                     <div className="mt-10 flex items-center justify-end">
                        <button
                            onClick={handleCustomNext}
                            disabled={isCustomNextDisabled}
                            className="h-12 px-8 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Continue
                        </button>
                    </div>
                )}
                 {error && <p className="text-right text-sm text-red-500 mt-2">{error}</p>}
            </div>
            
            <AvatarTemplateModal
                isOpen={isAvatarModalOpen}
                onClose={() => setIsAvatarModalOpen(false)}
                onSelect={handleSelectTemplateCharacter}
            />
        </div>
    );
};


// --- TEMPLATE WIZARD STEPS ---

const TemplateSetupStep: React.FC<{
    project: Project;
    updateProject: (u: Partial<Project>) => void;
    isAnalyzing: boolean;
    handleUGCProductUpload: (file: UploadedFile) => void;
    handleUGCProductScraped: (data: { name: string; description: string; file: UploadedFile | null; url: string; }) => void;
    setIsLoading: (loading: boolean) => void;
    setGenerationStatusMessages: (messages: string[]) => void;
    setError: (error: string | null) => void;
    currentTemplate: Template | null | undefined;
}> = ({
    project, updateProject, isAnalyzing, handleUGCProductUpload, handleUGCProductScraped, setIsLoading, setGenerationStatusMessages, setError, currentTemplate
}) => {
    const isShowcase = project.ugcType === 'product_showcase';
    const useTemplateAvatar = project.ugcAvatarSource !== 'upload' && project.ugcAvatarSource !== 'ai';
    const shouldShowDetails = project.ugcProductFile || project.productName || isAnalyzing;
    
    const SelectionCard = ({ type, title, description, imageUrl }: { type: 'talking_head' | 'product_showcase', title: string, description: string, imageUrl?: string }) => {
         const isSelected = project.ugcType === type;
         return (
             <button 
                onClick={() => updateProject({ ugcType: type })}
                className={`group text-left flex flex-col items-center flex-shrink-0 w-full`}
            >
                <div className={`relative overflow-hidden rounded-xl aspect-[9/16] w-full bg-gray-100 dark:bg-gray-800 border-2 transition-all duration-300 ${isSelected ? 'border-brand-accent ring-1 ring-brand-accent' : 'border-gray-200 dark:border-gray-700 group-hover:border-gray-300 dark:group-hover:border-gray-600'}`}>
                    <img 
                        src={imageUrl} 
                        alt={title} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                    />
                </div>
                <div className="mt-3 text-left w-full">
                    <h3 className={`text-base font-bold transition-colors ${isSelected ? 'text-brand-accent' : 'text-gray-800 dark:text-gray-100'} group-hover:text-brand-accent`}>
                        {title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {description}
                    </p>
                </div>
            </button>
         );
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Main Selection Section */}
            <div>
                <h2 className="text-xl font-bold text-center mb-6 text-gray-900 dark:text-white">What is the goal of this video?</h2>
                <div className="grid grid-cols-2 gap-4 w-full max-w-[30rem] mx-auto"> 
                    <SelectionCard 
                        type="talking_head" 
                        title="Just Talking" 
                        description="Avatar delivers a message."
                        imageUrl={currentTemplate?.previewImageUrl}
                    />
                    <SelectionCard 
                        type="product_showcase" 
                        title="Selling a Product" 
                        description="Avatar showcases a product."
                        imageUrl="https://storage.googleapis.com/genius-images-ny/images/Screenshot%202025-11-08%20at%2011.01.23%E2%80%AFAM.png"
                    />
                </div>
            </div>

            {isShowcase && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300 max-w-2xl mx-auto">
                    <h4 className="font-bold mb-4 text-xl text-gray-900 dark:text-white text-center">Product Details</h4>
                    <div className="flex flex-col gap-6">
                        {/* Upload Card */}
                        <div className="flex flex-col items-center max-w-md mx-auto w-full">
                            <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 w-full">
                                 <div className="space-y-4">
                                     <ProductScraper
                                        onProductScraped={handleUGCProductScraped}
                                        setIsLoading={setIsLoading}
                                        setStatusMessages={setGenerationStatusMessages}
                                        setError={setError}
                                    />
                                    <div className="relative my-2">
                                        <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-300 dark:border-gray-600" /></div>
                                        <div className="relative flex justify-center text-sm"><span className="bg-gray-50 dark:bg-gray-700 px-2 text-gray-500 dark:text-gray-400">OR</span></div>
                                    </div>
                                     {isAnalyzing ? (
                                        <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                            <div style={{ borderColor: '#91EB23', borderTopColor: 'transparent' }} className="w-8 h-8 border-4 rounded-full animate-spin"></div>
                                        </div>
                                    ) : project.ugcProductFile ? (
                                        <div className="relative w-full h-48 group">
                                            {/* Image Container */}
                                            <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                                                <AssetPreview asset={project.ugcProductFile} objectFit="contain" />
                                            </div>
                                            {/* Remove Button (Outside clipped area) */}
                                            <button 
                                                onClick={() => updateProject({ ugcProductFile: null, productName: '', productDescription: '' })} 
                                                className="absolute -top-2 -right-2 z-10 flex items-center justify-center w-6 h-6 bg-black text-white rounded-full shadow-md hover:bg-gray-800 transition-colors"
                                            >
                                                <XMarkIcon className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <Uploader onUpload={handleUGCProductUpload} title="Upload Product Image" subtitle="" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Product Details Inputs - Vertically Stacked */}
                        {shouldShowDetails && (
                            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-top-2 duration-300 w-full max-w-md mx-auto">
                                <div>
                                    <label htmlFor="productName" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Product Name</label>
                                    {isAnalyzing ? (
                                        <div className="w-full p-4 h-[58px] rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                                    ) : (
                                        <input type="text" id="productName" value={project.productName || ''} onChange={e => updateProject({ productName: e.target.value })} placeholder="e.g., The Cozy Slipper" 
                                        className="w-full p-4 border rounded-lg input-focus-brand" />
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="productDescription" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Product Description</label>
                                    {isAnalyzing ? (
                                        <div className="w-full p-4 h-24 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                                    ) : (
                                        <textarea id="productDescription" value={project.productDescription || ''} onChange={e => updateProject({ productDescription: e.target.value })} placeholder="e.g., A warm and comfortable slipper..."
                                            className="w-full p-4 border rounded-lg input-focus-brand min-h-[8rem]"></textarea>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 mx-auto w-full max-w-[30rem]">
                <div>
                    <span className="font-bold block text-gray-900 dark:text-gray-200">Use Avatar in the Template?</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Uncheck to customize the avatar</span>
                </div>
                 <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={useTemplateAvatar} 
                        onChange={() => {
                            if (useTemplateAvatar) {
                                updateProject({ ugcAvatarSource: 'ai' });
                            } else {
                                updateProject({ ugcAvatarSource: 'template', ugcAvatarFile: null, ugcAvatarDescription: '' });
                            }
                        }} 
                        className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-black rounded-full peer peer-checked:bg-[#91EB23] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
            </div>
        </div>
    );
};

const TemplateStoryStep: React.FC<{ project: Project; updateProject: (u: Partial<Project>) => void; isLoading: boolean; }> = ({ project, updateProject, isLoading }) => {
    const { user } = useAuth();
    const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
    const [isSuggestingScript, setIsSuggestingScript] = useState(false);
    const [isSuggestingScene, setIsSuggestingScene] = useState(false);

    const isProductCentric = ['product_showcase', 'unboxing'].includes(project.ugcType || '');

    const getSceneLabel = () => {
        switch(project.ugcType) {
            case 'green_screen': return 'Background Description';
            case 'reaction': return 'What are you reacting to?';
            case 'podcast': return 'Studio Setting';
            default: return 'Scene Description';
        }
    };
    
    const getScenePlaceholder = () => {
        switch(project.ugcType) {
             case 'green_screen': return 'e.g., A news article about AI trends, a screenshot of a viral tweet...';
             case 'reaction': return 'e.g., A funny cat video, a competitor\'s product launch...';
             case 'podcast': return 'e.g., A moody, dimly lit studio with neon accents and soundproofing foam...';
             default: return 'e.g., A bright, modern kitchen with marble countertops...';
        }
    }

    // Get relevant quick scenes for the current type
    const currentQuickScenes = QUICK_SCENES[project.ugcType || 'talking_head'] || DEFAULT_SCENES;
    
    const handleSuggestScript = async () => {
        setIsSuggestingScript(true);
        try {
            const suggestion = await suggestUGCKeyMessaging(
                project.productName || 'the product', 
                project.productDescription || 'a great product', 
                project.ugcTopic || 'Sales & Conversion'
            );
            updateProject({ ugcScript: suggestion });
        } catch (e) {
            console.error("Failed to suggest script", e);
        } finally {
            setIsSuggestingScript(false);
        }
    }

    const handleSuggestScene = async () => {
        setIsSuggestingScene(true);
        try {
            const suggestion = await suggestUGCSceneDescription(
                project.productName || 'the product', 
                project.productDescription || 'a great product', 
                project.ugcTopic || 'Sales & Conversion'
            );
            updateProject({ ugcSceneDescription: suggestion });
        } catch (e) {
            console.error("Failed to suggest scene", e);
        } finally {
            setIsSuggestingScene(false);
        }
    }
    
    return (
        <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-top-2 duration-300">
            
            {/* Top Row: Objective & Auto-Generate */}
            <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-grow w-full">
                    {!isProductCentric ? (
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Topic</label>
                            <input
                                type="text"
                                value={project.ugcTopic === 'Sales & Conversion' ? '' : project.ugcTopic || ''}
                                onChange={(e) => updateProject({ ugcTopic: e.target.value })}
                                placeholder="e.g., My Morning Routine, Top Tips for Productivity..."
                                className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-[#131517] text-white input-focus-brand placeholder-gray-500"
                            />
                        </div>
                    ) : (
                        <GenericSelect 
                            label="Campaign Objective" 
                            options={['Brand Awareness', 'Product Launch', 'Sales & Conversion', 'Educational', 'Social Engagement', 'Customer Testimonial'].map(v => ({ value: v, label: v }))} 
                            selectedValue={project.ugcTopic || 'Sales & Conversion'} 
                            onSelect={(v) => updateProject({ ugcTopic: v as string })} 
                        />
                    )}
                </div>
                <button 
                    onClick={() => setIsScriptModalOpen(true)} 
                    disabled={isLoading || (!isProductCentric && !project.ugcTopic)}
                    className="h-12 px-6 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center justify-center gap-2 whitespace-nowrap w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <SparklesIcon className="w-5 h-5" />
                    Auto-Generate Concepts
                </button>
            </div>

            {/* Key Messaging Input */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="font-bold text-lg text-gray-900 dark:text-white">Key Messaging & Talking Points</label>
                    <button 
                        onClick={handleSuggestScript}
                        disabled={isSuggestingScript}
                        className="text-sm font-semibold text-brand-accent hover:underline disabled:opacity-50 disabled:no-underline"
                    >
                        {isSuggestingScript ? 'Suggesting...' : 'Suggest'}
                    </button>
                </div>
                <textarea
                    value={project.ugcScript || ''}
                    onChange={(e) => updateProject({ ugcScript: e.target.value })}
                    placeholder={!isProductCentric 
                        ? "e.g., \n• 3 Tips for staying productive\n• Storytime: That time I...\n• Opinion on the latest news"
                        : "e.g., \n• The product's key features\n• Highlight 50% off discount\n• CTA: Shop now link in bio"
                    }
                    className="w-full p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-[#131517] text-white input-focus-brand min-h-[8rem] resize-none placeholder-gray-500"
                />
            </div>

            {/* Scene Description Input */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="font-bold text-lg text-gray-900 dark:text-white">{getSceneLabel()}</label>
                    <button 
                        onClick={handleSuggestScene}
                        disabled={isSuggestingScene}
                        className="text-sm font-semibold text-brand-accent hover:underline disabled:opacity-50 disabled:no-underline"
                    >
                        {isSuggestingScene ? 'Suggesting...' : 'Suggest'}
                    </button>
                </div>
                <textarea
                    value={project.ugcSceneDescription || ''}
                    onChange={(e) => updateProject({ ugcSceneDescription: e.target.value })}
                    placeholder={getScenePlaceholder()}
                    className="w-full p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-[#131517] text-white input-focus-brand min-h-[6rem] resize-none placeholder-gray-500"
                />
                {/* Quick Select Tags */}
                <div className="mt-3 flex flex-wrap gap-2">
                    {Object.keys(currentQuickScenes).map(key => (
                        <button
                            key={key}
                            onClick={() => updateProject({ ugcSceneDescription: currentQuickScenes[key] })}
                            className="px-3 py-1.5 text-xs font-medium rounded-full border bg-gray-100 dark:bg-[#1C1E20] border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                        >
                            {key}
                        </button>
                    ))}
                </div>
            </div>

             {/* Bottom Row: Voice Settings */}
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <GenericSelect label="Language" options={['English', 'Spanish', 'French', 'German', 'Japanese'].map(v => ({ value: v, label: v }))} selectedValue={project.ugcLanguage || 'English'} onSelect={(v) => updateProject({ ugcLanguage: v as string })} />
                <GenericSelect label="Accent" options={['American', 'British', 'Australian'].map(v => ({ value: v, label: v }))} selectedValue={project.ugcAccent || 'American'} onSelect={(v) => updateProject({ ugcAccent: v as string })} />
                <GenericSelect label="Emotion" options={['Auto', 'Happy', 'Excited', 'Serious', 'Calm'].map(v => ({ value: v, label: v }))} selectedValue={project.ugcEmotion || 'Auto'} onSelect={(v) => updateProject({ ugcEmotion: v as string })} />
            </div>

            <ScriptGeneratorModal 
                isOpen={isScriptModalOpen}
                onClose={() => setIsScriptModalOpen(false)}
                onSelect={(script, scene, action) => updateProject({ ugcScript: script, ugcSceneDescription: scene, ugcAction: action })}
                project={project}
                brandProfile={user?.brandProfile}
            />
        </div>
    );
};

const TemplateAvatarStep: React.FC<{ 
    project: Project; 
    updateProject: (u: Partial<Project>) => void; 
    handleAvatarUpload: (file: UploadedFile) => Promise<boolean>;
    onOpenTemplateModal: () => void;
}> = ({ project, updateProject, handleAvatarUpload, onOpenTemplateModal }) => {
    const {
        ugcAvatarSource,
        ugcAvatarFile,
    } = project;

    const activeSource = ugcAvatarSource || 'ai';
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIsValidating(true);
            setUploadError(null);
            try {
                const uploaded = await fileToUploadedFile(file, file.name);
                const valid = await handleAvatarUpload(uploaded);
                if (!valid) {
                    setUploadError("Image doesn't look like a person. Please try another.");
                }
            } catch(err) {
                console.error(err);
                setUploadError("Failed to process image.");
            } finally {
                setIsValidating(false);
            }
        }
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-top-2 duration-300">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Customize Avatar</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Card 1: AI Generated */}
                <div
                    onClick={() => updateProject({ ugcAvatarSource: 'ai', ugcAvatarFile: null })}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all flex flex-col h-full text-left ${activeSource === 'ai' ? 'border-brand-accent bg-brand-accent/5' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <SparklesIcon className="w-6 h-6 text-brand-accent" />
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">AI Generated</h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">The AI will generate an avatar that best fits your script.</p>
                    {/* Spacing filler to match height */}
                    <div className="flex-grow min-h-[50px]"></div>
                </div>

                {/* Card 2: Upload Photo */}
                <div
                    onClick={() => {
                        updateProject({ ugcAvatarSource: 'upload' });
                    }}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all flex flex-col h-full text-left ${activeSource === 'upload' ? 'border-brand-accent bg-brand-accent/5' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                >
                    <div className="flex items-center gap-3 mb-1">
                        <ArrowDownTrayIcon className="w-6 h-6 text-brand-accent" />
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">Use My Avatar</h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Use your own photo</p>
                    
                    {/* Inner Dashed Box */}
                    <div 
                        className="w-full aspect-square border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center bg-gray-50 dark:bg-black/20 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative overflow-hidden group"
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent parent card click if needed, though redundant here as parent sets same mode
                            updateProject({ ugcAvatarSource: 'upload' });
                            fileInputRef.current?.click();
                        }}
                    >
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
                        
                        {ugcAvatarFile && activeSource === 'upload' ? (
                            <>
                                <AssetPreview asset={ugcAvatarFile} objectFit="cover" />
                                {/* Re-upload overlay */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <span className="text-white text-xs font-bold">Click to change</span>
                                </div>
                            </>
                        ) : (
                            <div className="text-center p-4">
                                {isValidating ? (
                                    <div className="flex flex-col items-center">
                                        <div className="w-6 h-6 border-2 border-brand-accent border-t-transparent rounded-full animate-spin mb-2"></div>
                                        <p className="text-xs text-gray-500">Checking...</p>
                                    </div>
                                ) : (
                                    <>
                                        <p className="font-bold text-gray-400 dark:text-gray-500">Upload photo</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-600 mt-1">Click to browse</p>
                                    </>
                                )}
                            </div>
                        )}
                        
                        {/* Validation Error Display Inside Box */}
                        {uploadError && (
                            <div className="absolute bottom-2 left-2 right-2 bg-red-500/90 text-white text-xs p-1 rounded text-center backdrop-blur-sm">
                                {uploadError}
                            </div>
                        )}
                    </div>
                </div>

                {/* Card 3: Select Template */}
                <div
                    onClick={() => {
                        updateProject({ ugcAvatarSource: 'template' });
                        // If this card is clicked, and we are in template mode but haven't picked one, prompt it.
                        // But per restored design, clicking the inner box is primary. 
                        // We will make the whole card trigger it for better UX if empty.
                        if (!ugcAvatarFile) {
                            onOpenTemplateModal();
                        }
                    }}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all flex flex-col h-full text-left ${activeSource === 'template' ? 'border-brand-accent bg-brand-accent/5' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                >
                    <div className="flex items-center gap-3 mb-1">
                        <UserCircleIcon className="w-6 h-6 text-brand-accent" />
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">Select Avatar</h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Select from avatar template</p>
                    
                    {/* Inner Dashed Box */}
                    <div 
                        className="w-full aspect-square border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center bg-gray-50 dark:bg-black/20 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative overflow-hidden group"
                        onClick={(e) => {
                            e.stopPropagation();
                            updateProject({ ugcAvatarSource: 'template' });
                            onOpenTemplateModal();
                        }}
                    >
                        {ugcAvatarFile && activeSource === 'template' ? (
                            <>
                                <AssetPreview asset={ugcAvatarFile} objectFit="cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <span className="text-white text-xs font-bold">Click to change</span>
                                </div>
                            </>
                        ) : (
                            <div className="text-center p-4">
                                <p className="font-bold text-gray-400 dark:text-gray-500">Select from template</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const TemplateProductionStep: React.FC<{ 
    project: Project; 
    updateProject: (u: Partial<Project>) => void; 
    handleGenerate: () => void; 
    isLoading: boolean;
    cost: number;
}> = ({ project, updateProject, handleGenerate, isLoading, cost }) => {
    return (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
             <ModelSelector 
                type="video"
                currentModel={project.videoModel}
                onChange={(v) => updateProject({ videoModel: v })}
             />
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <GenericSelect label="Resolution" options={VIDEO_RESOLUTIONS} selectedValue={project.videoResolution || '720p'} onSelect={(v) => updateProject({ videoResolution: v as any })} />
                <GenericSelect label="Duration" options={VIDEO_DURATIONS} selectedValue={project.videoDuration || 4} onSelect={(v) => updateProject({ videoDuration: v as number })} />
                <GenericSelect label="Aspect Ratio" options={UGC_ASPECT_RATIOS} selectedValue={project.aspectRatio} onSelect={(value) => updateProject({ aspectRatio: value as Project['aspectRatio'] })} />
                 <button 
                    onClick={handleGenerate} 
                    disabled={isLoading}
                    className="h-12 px-8 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center gap-2 whitespace-nowrap w-full justify-center"
                >
                    {isLoading ? (
                        <><div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div> Generating...</>
                    ) : (
                         <><span>Generate</span><SparklesIcon className="w-5 h-5" /><span>{cost}</span></>
                    )}
                </button>
            </div>
        </div>
    );
};


// --- NEW CUSTOM WIZARD STEPS ---

const CustomSetupStep: React.FC<{
    project: Project;
    updateProject: (u: Partial<Project>) => void;
    isAnalyzing: boolean;
    handleUGCProductUpload: (file: UploadedFile) => void;
    handleUGCProductScraped: (data: { name: string; description: string; file: UploadedFile | null; url: string; }) => void;
    setIsLoading: (loading: boolean) => void;
    setGenerationStatusMessages: (messages: string[]) => void;
    setError: (error: string | null) => void;
}> = ({
    project, updateProject, isAnalyzing, handleUGCProductUpload, handleUGCProductScraped, setIsLoading, setGenerationStatusMessages, setError
}) => {
    const isProductCentric = ['product_showcase', 'unboxing'].includes(project.ugcType || '');
    const shouldShowDetails = project.ugcProductFile || project.productName || isAnalyzing;
    
    const scrollRef = useRef<HTMLDivElement>(null);
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        if (scrollRef.current && project.ugcType) {
            // Find the index of the selected type in UGC_STYLES
            const selectedIndex = UGC_STYLES.findIndex(style => style.type === project.ugcType);
            if (selectedIndex !== -1) {
                // Calculate scroll position: (card width 192px + gap 16px) * index
                const cardWidth = 192 + 16; 
                const scrollPos = selectedIndex * cardWidth;
                
                // Scroll smoothly to the position
                scrollRef.current.scrollTo({ left: scrollPos, behavior: 'smooth' });
            }
        }
    }, []); // Only run on mount to restore position

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            const maxScroll = scrollWidth - clientWidth;
            setScrollProgress(maxScroll > 0 ? scrollLeft / maxScroll : 0);
        }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Main Selection Carousel */}
            <div>
                <h2 className="text-xl font-bold mb-6 text-left text-gray-900 dark:text-white">Choose a Video Style</h2>
                
                <div 
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex overflow-x-auto pb-6 gap-4 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0"
                >
                    {UGC_STYLES.map((style) => {
                         const isSelected = project.ugcType === style.type;
                         const comingSoon = style.comingSoon;
                         return (
                             <button 
                                key={style.type}
                                onClick={() => !comingSoon && updateProject({ ugcType: style.type as any })}
                                disabled={comingSoon}
                                className={`group text-left flex flex-col flex-shrink-0 w-48 snap-start ${comingSoon ? 'cursor-not-allowed opacity-60' : ''}`}
                            >
                                <div className={`relative overflow-hidden rounded-xl aspect-[9/16] w-full bg-gray-100 dark:bg-gray-800 border-2 transition-all duration-300 
                                    ${isSelected ? 'border-brand-accent ring-1 ring-brand-accent' : 'border-gray-200 dark:border-gray-700'} 
                                    ${!comingSoon ? 'group-hover:border-brand-accent group-hover:ring-1 group-hover:ring-brand-accent' : ''}
                                `}>
                                    {style.imageUrl && (
                                        <img 
                                            src={style.imageUrl} 
                                            alt={style.title} 
                                            className={`w-full h-full object-cover transition-transform duration-300 ${!comingSoon ? 'group-hover:scale-105' : ''}`} 
                                        />
                                    )}
                                    {comingSoon && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/30">
                                                Coming Soon
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-3 w-full text-left">
                                    <h3 className={`text-base font-bold transition-colors ${isSelected ? 'text-brand-accent' : 'text-gray-800 dark:text-gray-100'} ${!comingSoon ? 'group-hover:text-brand-accent' : ''}`}>
                                        {style.title}
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                        {style.description}
                                    </p>
                                </div>
                            </button>
                         );
                    })}
                </div>

                 {/* Scroll Indicator */}
                <div className="relative h-1 bg-gray-200 dark:bg-[#2B2B2B] rounded-full -mt-2 mb-6 w-full max-w-md overflow-hidden">
                    <div 
                        className="absolute top-0 h-full bg-brand-accent rounded-full"
                        style={{ 
                            width: '20%', 
                            left: `${scrollProgress * 80}%`,
                            transition: 'left 0.1s ease-out'
                        }}
                    />
                </div>
            </div>

            {isProductCentric && (
                <div>
                    <div className="max-w-5xl">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left Column: Upload Card */}
                            <div className="w-full">
                                <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 w-full">
                                     <div className="space-y-4">
                                         <div className="flex justify-between items-center mb-2">
                                             <h4 className="font-bold text-xl text-gray-900 dark:text-white text-left">Product Details</h4>
                                         </div>
                                         <ProductScraper
                                            onProductScraped={handleUGCProductScraped}
                                            setIsLoading={setIsLoading}
                                            setStatusMessages={setGenerationStatusMessages}
                                            setError={setError}
                                        />
                                        <div className="relative my-2">
                                            <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-300 dark:border-gray-600" /></div>
                                            <div className="relative flex justify-center text-sm"><span className="bg-gray-50 dark:bg-gray-700 px-2 text-gray-500 dark:text-gray-400">OR</span></div>
                                        </div>
                                         {isAnalyzing ? (
                                            <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                                <div style={{ borderColor: '#91EB23', borderTopColor: 'transparent' }} className="w-8 h-8 border-4 rounded-full animate-spin"></div>
                                            </div>
                                        ) : project.ugcProductFile ? (
                                            <div className="relative w-full h-48 group">
                                                {/* Wrapper Pattern for Remove Button Positioning */}
                                                <div className="relative w-full h-full">
                                                    {/* Image Container (Clipped) */}
                                                    <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                                                        <AssetPreview asset={project.ugcProductFile} objectFit="contain" />
                                                    </div>
                                                    {/* Remove Button (Outside clipped area) */}
                                                    <button 
                                                        onClick={() => updateProject({ ugcProductFile: null, productName: '', productDescription: '' })} 
                                                        className="absolute -top-2 -right-2 z-10 flex items-center justify-center w-6 h-6 bg-black text-white rounded-full shadow-md hover:bg-gray-800 transition-colors"
                                                    >
                                                        <XMarkIcon className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <Uploader onUpload={handleUGCProductUpload} title="Upload Product Image" subtitle="" />
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                             {/* Right Column: Inputs */}
                            {shouldShowDetails && (
                                <div className="flex flex-col gap-6 w-full h-full">
                                    <div>
                                        <label htmlFor="productName" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Product Name</label>
                                        {isAnalyzing ? (
                                            <div className="w-full p-4 h-[58px] rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                                        ) : (
                                            <input type="text" id="productName" value={project.productName || ''} onChange={e => updateProject({ productName: e.target.value })} placeholder="e.g., The Cozy Slipper" 
                                            className="w-full p-4 border rounded-lg input-focus-brand" />
                                        )}
                                    </div>
                                    <div className="flex-grow flex flex-col">
                                        <label htmlFor="productDescription" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Product Description</label>
                                        {isAnalyzing ? (
                                            <div className="w-full p-4 h-full min-h-[8rem] rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                                        ) : (
                                            <textarea id="productDescription" value={project.productDescription || ''} onChange={e => updateProject({ productDescription: e.target.value })} placeholder="e.g., A warm and comfortable slipper..."
                                                className="w-full p-4 border rounded-lg input-focus-brand h-full resize-none"></textarea>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const CustomAvatarStep = TemplateAvatarStep; // Reuse logic directly
const CustomStoryStep = TemplateStoryStep; // Reuse logic directly

const CustomProductionStep: React.FC<{ 
    project: Project; 
    updateProject: (u: Partial<Project>) => void; 
    handleGenerate: () => void; 
    isLoading: boolean;
    cost: number;
}> = ({ project, updateProject, handleGenerate, isLoading, cost }) => {
    return (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
             <ModelSelector 
                type="video"
                currentModel={project.videoModel}
                onChange={(v) => updateProject({ videoModel: v })}
             />
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <GenericSelect label="Resolution" options={VIDEO_RESOLUTIONS} selectedValue={project.videoResolution || '720p'} onSelect={(v) => updateProject({ videoResolution: v as any })} />
                <GenericSelect label="Duration" options={VIDEO_DURATIONS} selectedValue={project.videoDuration || 4} onSelect={(v) => updateProject({ videoDuration: v as number })} />
                <GenericSelect label="Aspect Ratio" options={UGC_ASPECT_RATIOS} selectedValue={project.aspectRatio} onSelect={(value) => updateProject({ aspectRatio: value as Project['aspectRatio'] })} />
                 <button 
                    onClick={handleGenerate} 
                    disabled={isLoading}
                    className="h-12 px-8 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center gap-2 whitespace-nowrap w-full justify-center"
                >
                    {isLoading ? (
                        <><div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div> Generating...</>
                    ) : (
                         <><span>Generate</span><SparklesIcon className="w-5 h-5" /><span>{cost}</span></>
                    )}
                </button>
            </div>
        </div>
    );
};
