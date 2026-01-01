import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CREDIT_COSTS } from '../constants';
import { SparklesIcon, UGCImage, XMarkIcon, AspectRatioSquareIcon, AspectRatioTallIcon, AspectRatioWideIcon, LeftArrowIcon, PencilIcon, ArrowDownTrayIcon, UserCircleIcon, EyeIcon, ArrowsPointingOutIcon, ArrowPathIcon, CheckIcon, RightArrowIcon, ImageIcon } from '../components/icons';
import type { Project, UploadedFile, Template } from '../types';
import { Uploader } from '../components/Uploader';
import { AssetPreview } from '../components/AssetPreview';
import { GenericSelect } from '../components/GenericSelect';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useProjects } from '../context/ProjectContext';
import { AvatarTemplateModal } from '../components/AvatarTemplateModal';
import { ScriptGeneratorModal } from '../components/ScriptGeneratorModal';
import { ProductUploadModal } from '../components/ProductUploadModal';
import { ProductScraper } from '../components/ProductScraper';
import { generateCampaignBrief, fetchWithProxies, validateAvatarImage, suggestUGCKeyMessaging, suggestUGCSceneDescription, generateUGCPreviews } from '../services/geminiService';
import { TEMPLATE_LIBRARY } from '../lib/templates';
import { ProgressStepper } from '../components/ProgressStepper';
import { VideoLightbox } from '../components/VideoLightbox';

type TemplateStep = 'Setup' | 'Story' | 'Avatar' | 'Production';
type CustomStep = 'Setup' | 'Story' | 'Avatar' | 'Production';
type EcommerceStep = 'Concept' | 'Visuals';

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
    { type: 'talking_head', title: 'Just Talking', description: 'Classic talking head.', imageUrl: 'https://storage.googleapis.com/genius-images-ny/images/Screenshot%202025-11-08%20at%11.04.52%E2%80%AFAM.png', comingSoon: false },
    { type: 'product_showcase', title: 'Product Showcase', description: 'Highlighting a product.', imageUrl: 'https://storage.googleapis.com/genius-images-ny/images/Screenshot%202025-11-08%20at%2011.01.23%E2%80%AFAM.png', comingSoon: false },
    { type: 'unboxing', title: 'Unboxing', description: 'Opening and revealing.', imageUrl: 'https://storage.googleapis.com/genius-images-ny/images/Screenshot%202025-11-08%20at%2010.47.47%E2%80%AFAM.png', comingSoon: false },
    { type: 'pov', title: 'POV / Vlog', description: 'Handheld, selfie style.', imageUrl: 'https://storage.googleapis.com/genius-images-ny/images/Screenshot%202025-11-08%20at%2010.47.47%E2%80%AFAM.png', comingSoon: false },
    { type: 'green_screen', title: 'Green Screen', description: 'Commentary over background.', imageUrl: 'https://storage.googleapis.com/genius-images-ny/images/Screenshot%202025-11-08%20at%2010.52.17%E2%80%AFAM.png', comingSoon: true },
    { type: 'podcast', title: 'Podcast Clip', description: 'Professional studio vibe.', imageUrl: 'https://storage.googleapis.com/genius-images-ny/images/Screenshot%202025-11-08%20at%2010.34.57%E2%80%AFAM.png', comingSoon: true },
    { type: 'reaction', title: 'Reaction', description: 'Reacting to content.', imageUrl: 'https://storage.googleapis.com/genius-images-ny/images/Screenshot%202025-11-08%20at%2010.48.56%E2%80%AFAM.png', comingSoon: true },
];

const FRAME_GENERATION_MESSAGES = [
    "Analyzing scene composition...",
    "Positioning product and avatar...",
    "Rendering lighting effects...",
    "Finalizing starting frames..."
];

const ModelSelector = ({ type, currentModel, recommendedModel, onChange }: { type: 'image' | 'video', currentModel?: string, recommendedModel?: string, onChange: (val: string) => void }) => {
  const models = VIDEO_MODELS;
  
  // Determine if current model matches recommended or if it's "auto"
  const isRecommended = recommendedModel && currentModel === recommendedModel;
  
  return (
    <div className="w-full">
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
    const [ecommerceStep, setEcommerceStep] = useState<EcommerceStep>('Concept');
    const [isProductUploadModalOpen, setIsProductUploadModalOpen] = useState(false);
    const [productModalMode, setProductModalMode] = useState<'create' | 'edit'>('create');
    
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
    }, [templateStep, customStep, ecommerceStep]);

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
    const isEcommerceFlow = project.isEcommerce;
    const currentTemplate = isTemplateMode ? TEMPLATE_LIBRARY.find(t => t.id === project.templateId) : null;

    const updateProject = useCallback((updates: Partial<Project>) => {
        setProject(prev => prev ? ({ ...prev, ...updates }) : null);
    }, [setProject]);

    const handleUGCProductUpload = useCallback(async (uploadedFile: UploadedFile) => {
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
    }, [updateProject, setError]);

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

    const handleProductUploadConfirm = (data: { file: UploadedFile | null; url?: string; name?: string; description?: string }) => {
        if (productModalMode === 'create') {
            updateProject({
                ugcType: 'product_showcase',
                ugcProductFile: data.file,
                productName: data.name,
                productDescription: data.description,
                websiteUrl: data.url,
                isEcommerce: true, // Switch to E-commerce flow
            });
            setEcommerceStep('Concept');
        } else {
            // Edit Mode - Just update fields
            updateProject({
                ugcProductFile: data.file,
                productName: data.name,
                productDescription: data.description,
                websiteUrl: data.url,
            });
        }
        setIsProductUploadModalOpen(false);
    };

    const handleSelectTemplateCharacter = async (character: { name: string, url: string }) => {
        try {
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

    const ecommerceSteps = ['Concept', 'Visuals', 'Results'];
    const getEcommerceStepIndex = (step: EcommerceStep) => ecommerceSteps.indexOf(step);

    const handleEcommerceNext = () => {
        if (ecommerceStep === 'Concept') setEcommerceStep('Visuals');
    };

    const handleEcommerceBack = () => {
        if (ecommerceStep === 'Visuals') setEcommerceStep('Concept');
    };

    const getEcommerceHeaderTitle = () => {
        if (ecommerceStep === 'Visuals') return 'Starting Frame';
        return currentTemplate ? `${currentTemplate.title} Template` : 'UGC Product Showcase';
    };

    const skipsAvatarStep = project.ugcAvatarSource !== 'upload' && project.ugcAvatarSource !== 'ai' && project.ugcAvatarSource !== 'template';
    const templateSteps = skipsAvatarStep 
        ? ['Setup', 'Story', 'Production', 'Results'] 
        : ['Setup', 'Story', 'Avatar', 'Production', 'Results'];

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

    const customSteps = ['Goal', 'Scene', 'Avatar', 'Production', 'Results'];
    const getCustomStepIndex = (step: CustomStep) => customSteps.indexOf(step);

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
            case 'Setup': return "Create UGC Video";
            case 'Story': return "Scene & Story";
            case 'Avatar': return "Create Your Persona";
            case 'Production': return "Final Polish";
            default: return "Create UGC Video";
        }
    };
    
    const isEcommerceNextDisabled = isLoading || isAnalyzing || !project.ugcScript || !project.productName;

    const isTemplateNextDisabled = isLoading || 
        (templateStep === 'Setup' && (!project.ugcType || (project.ugcType === 'product_showcase' && !project.ugcProductFile))) ||
        (templateStep === 'Avatar' && (project.ugcAvatarSource || 'ai') !== 'ai' && !project.ugcAvatarFile);
    
    const isCustomNextDisabled = isLoading ||
        (customStep === 'Setup' && (!project.ugcType)) ||
        (customStep === 'Story' && (!project.ugcSceneDescription || !project.ugcScript)) || 
        (customStep === 'Avatar' && (project.ugcAvatarSource || 'ai') !== 'ai' && !project.ugcAvatarFile);

    if (isEcommerceFlow) {
        return (
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        {ecommerceStep !== 'Concept' && (
                            <button onClick={handleEcommerceBack} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 -ml-2">
                                <LeftArrowIcon className="w-6 h-6" />
                            </button>
                        )}
                         <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {getEcommerceHeaderTitle()}
                        </h2>
                    </div>
                    <ProgressStepper steps={ecommerceSteps} currentStepIndex={getEcommerceStepIndex(ecommerceStep)} />
                </div>

                {ecommerceStep === 'Concept' && (
                    <EcommerceConceptStep 
                        project={project} 
                        updateProject={updateProject}
                        isLoading={isLoading}
                        onEditProduct={() => {
                            setProductModalMode('edit');
                            setIsProductUploadModalOpen(true);
                        }}
                    />
                )}

                {ecommerceStep === 'Visuals' && (
                    <EcommerceVisualsStep
                        project={project}
                        updateProject={updateProject}
                        handleGenerate={handleGenerate}
                        isLoading={isLoading}
                        cost={cost}
                        handleAvatarUpload={handleAvatarUpload}
                        setError={setError}
                        error={error}
                        currentTemplate={currentTemplate}
                    />
                )}

                {ecommerceStep === 'Concept' && (
                    <div className="mt-10 flex items-center justify-end">
                        <button 
                            onClick={handleEcommerceNext} 
                            disabled={isEcommerceNextDisabled}
                            className="h-12 px-8 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isAnalyzing ? (
                                <><div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div> Analyzing...</>
                            ) : "Continue"}
                        </button>
                    </div>
                )}
                {ecommerceStep === 'Concept' && error && <p className="text-right text-sm text-red-500 mt-2">{error}</p>}

                <AvatarTemplateModal
                    isOpen={isAvatarModalOpen}
                    onClose={() => setIsAvatarModalOpen(false)}
                    onSelect={handleSelectTemplateCharacter}
                />
                
                <ProductUploadModal
                    isOpen={isProductUploadModalOpen}
                    onClose={() => setIsProductUploadModalOpen(false)}
                    onConfirm={handleProductUploadConfirm}
                    mode={productModalMode}
                    initialData={productModalMode === 'edit' ? {
                        file: project.ugcProductFile,
                        name: project.productName,
                        description: project.productDescription,
                        url: project.websiteUrl
                    } : undefined}
                />
            </div>
        );
    }

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
                    {/* Hide navigation dots on Setup screen */}
                    {templateStep !== 'Setup' && (
                        <ProgressStepper steps={templateSteps} currentStepIndex={getTemplateStepIndex(templateStep)} />
                    )}
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
                {/* Hide navigation dots on Setup screen */}
                {customStep !== 'Setup' && (
                    <ProgressStepper steps={customSteps} currentStepIndex={getCustomStepIndex(customStep)} />
                )}
            </div>

            <div className="max-w-5xl mx-auto">
                {customStep === 'Setup' && (
                    <CustomSetupStep
                        project={project}
                        updateProject={updateProject}
                        onOpenProductModal={() => {
                            setProductModalMode('create');
                            setIsProductUploadModalOpen(true);
                        }}
                        onNext={handleCustomNext}
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

                {/* Hide Continue button on Setup step as the cards handle navigation */}
                {customStep !== 'Production' && customStep !== 'Setup' && (
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
            
            <ProductUploadModal
                isOpen={isProductUploadModalOpen}
                onClose={() => setIsProductUploadModalOpen(false)}
                onConfirm={handleProductUploadConfirm}
            />
        </div>
    );
};

const EcommerceConceptStep: React.FC<{
    project: Project;
    updateProject: (u: Partial<Project>) => void;
    isLoading: boolean;
    onEditProduct: () => void;
}> = ({ 
    project, updateProject, isLoading, onEditProduct
}) => {
    const { user } = useAuth();
    const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
    const [isSuggestingScript, setIsSuggestingScript] = useState(false);
    const [isSuggestingScene, setIsSuggestingScene] = useState(false);

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
    
    const showSceneInput = !project.templateId;
    const currentQuickScenes = QUICK_SCENES[project.ugcType || 'product_showcase'] || DEFAULT_SCENES;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="md:col-span-1 space-y-6">
                <div className="p-6 rounded-xl bg-transparent border border-gray-200 dark:border-gray-700 h-fit relative group">
                    <div className="flex items-start gap-4">
                        <div className="flex flex-col gap-3 flex-shrink-0">
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                                 {project.ugcProductFile ? (
                                     <AssetPreview asset={project.ugcProductFile} objectFit="cover" />
                                 ) : (
                                     <div className="w-full h-full flex items-center justify-center text-gray-400">
                                         <ImageIcon className="w-8 h-8" />
                                     </div>
                                 )}
                            </div>
                            <button
                                onClick={onEditProduct}
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

            <div className="md:col-span-2 space-y-6">
                <div>
                    <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Script & Concept</h3>
                    
                    <div className="flex flex-col md:flex-row gap-4 items-end mb-6">
                        <div className="flex-grow w-full">
                            <GenericSelect 
                                label="Campaign Objective" 
                                options={['Brand Awareness', 'Product Launch', 'Sales & Conversion', 'Educational', 'Social Engagement', 'Customer Testimonial'].map(v => ({ value: v, label: v }))} 
                                selectedValue={project.ugcTopic || 'Sales & Conversion'} 
                                onSelect={(v) => updateProject({ ugcTopic: v as string })} 
                            />
                        </div>
                        <button 
                            onClick={() => setIsScriptModalOpen(true)}
                            className="h-12 px-6 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center justify-center gap-2 whitespace-nowrap w-full md:w-auto"
                        >
                            <SparklesIcon className="w-5 h-5" />
                            Generate Concepts
                        </button>
                    </div>

                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Key Messaging & Talking Points</label>
                        <button 
                            onClick={handleSuggestScript}
                            disabled={isSuggestingScript}
                            className="text-sm font-semibold text-brand-accent hover:underline disabled:opacity-50"
                        >
                            {isSuggestingScript ? 'Suggesting...' : 'Suggest'}
                        </button>
                    </div>
                    <textarea
                        value={project.ugcScript || ''}
                        onChange={(e) => updateProject({ ugcScript: e.target.value })}
                        placeholder={"e.g., \n• The product's key features\n• Highlight 50% off discount\n• CTA: Shop now link in bio"}
                        className="w-full p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-[#131517] text-white input-focus-brand min-h-[12rem] resize-none placeholder-gray-500"
                    />
                </div>

                {showSceneInput && (
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Scene Description</label>
                            <button 
                                onClick={handleSuggestScene}
                                disabled={isSuggestingScene}
                                className="text-sm font-semibold text-brand-accent hover:underline disabled:opacity-50"
                            >
                                {isSuggestingScene ? 'Suggesting...' : 'Suggest'}
                            </button>
                        </div>
                        <textarea
                            value={project.ugcSceneDescription || ''}
                            onChange={(e) => updateProject({ ugcSceneDescription: e.target.value })}
                            placeholder="e.g., A bright, modern kitchen with marble countertops..."
                            className="w-full p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-[#131517] text-white input-focus-brand min-h-[6rem] resize-none placeholder-gray-500"
                        />
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
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <GenericSelect label="Language" options={['English', 'Spanish', 'French', 'German', 'Japanese'].map(v => ({ value: v, label: v }))} selectedValue={project.ugcLanguage || 'English'} onSelect={(v) => updateProject({ ugcLanguage: v as string })} />
                    <GenericSelect label="Accent" options={['American', 'British', 'Australian'].map(v => ({ value: v, label: v }))} selectedValue={project.ugcAccent || 'American'} onSelect={(v) => updateProject({ ugcAccent: v as string })} />
                    <GenericSelect label="Emotion" options={['Auto', 'Happy', 'Excited', 'Serious', 'Calm'].map(v => ({ value: v, label: v }))} selectedValue={project.ugcEmotion || 'Auto'} onSelect={(v) => updateProject({ ugcEmotion: v as string })} />
                </div>
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

const EcommerceVisualsStep: React.FC<{
    project: Project;
    updateProject: (u: Partial<Project>) => void;
    handleGenerate: () => void;
    isLoading: boolean;
    cost: number;
    handleAvatarUpload: (file: UploadedFile) => Promise<boolean>;
    onOpenTemplateModal?: () => void;
    setError: (e: string | null) => void;
    error: string | null;
    currentTemplate?: Template | null;
}> = ({ project, updateProject, handleGenerate, isLoading, cost, handleAvatarUpload, setError, error, currentTemplate }) => {
    
    // Default to 'default' (Template's Avatar) initially, unless it's a non-template flow, then 'ai'
    const [activeTab, setActiveTab] = useState<'default' | 'upload' | 'ai'>(() => {
        if (project.ugcAvatarSource === 'upload') return 'upload';
        if (project.ugcAvatarSource === 'ai') return 'ai';
        if (!currentTemplate) return 'ai'; // Default to AI if no template
        return 'default';
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const [frameBatches, setFrameBatches] = useState<UploadedFile[][]>([]);
    const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
    const [isGeneratingFrames, setIsGeneratingFrames] = useState(false);
    const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
    const [lightboxAsset, setLightboxAsset] = useState<UploadedFile | null>(null);
    const [frameGenerationMessage, setFrameGenerationMessage] = useState(FRAME_GENERATION_MESSAGES[0]);

    const [scrollProgress, setScrollProgress] = useState(0);
    const [indicatorWidth, setIndicatorWidth] = useState(0);

    // Sync project state when tab changes
    useEffect(() => {
        if (activeTab === 'default') {
            updateProject({ ugcAvatarSource: 'template', ugcAvatarFile: null }); 
        } else if (activeTab === 'upload') {
            updateProject({ ugcAvatarSource: 'upload' });
        } else if (activeTab === 'ai') {
            updateProject({ ugcAvatarSource: 'ai', ugcAvatarFile: null });
        }
    }, [activeTab]);

    // Reset frame batches when avatar source/file changes
    useEffect(() => {
        setFrameBatches([]);
        setCurrentBatchIndex(0);
        setSelectedFrameId(null);
        updateProject({ startFrame: null });
    }, [project.ugcAvatarFile, project.ugcAvatarSource]);

    // Message cycling effect for frame generation
    useEffect(() => {
        let interval: number;
        if (isGeneratingFrames) {
            let index = 0;
            setFrameGenerationMessage(FRAME_GENERATION_MESSAGES[0]);
            interval = window.setInterval(() => {
                index = (index + 1) % FRAME_GENERATION_MESSAGES.length;
                setFrameGenerationMessage(FRAME_GENERATION_MESSAGES[index]);
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [isGeneratingFrames]);

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
    
    const handleRemoveUploadedAvatar = (e: React.MouseEvent) => {
        e.stopPropagation();
        updateProject({ ugcAvatarFile: null });
    };

    const handleGenerateFrames = async () => {
        setIsGeneratingFrames(true);
        setError(null);
        setSelectedFrameId(null);
        updateProject({ startFrame: null });

        try {
            const frames = await generateUGCPreviews(project);
            if (frames.length > 0) {
                setFrameBatches(prev => [...prev, frames]);
                setCurrentBatchIndex(prev => prev.length); // Point to the new badge
                
                // Auto-select the first frame
                const firstFrame = frames[0];
                setSelectedFrameId(firstFrame.id);
                updateProject({ startFrame: firstFrame });
            } else {
                setError("Failed to generate preview frames.");
            }
        } catch (e: any) {
            console.error("Frame generation error:", e);
            setError(e.message || "Failed to generate frames.");
        } finally {
            setIsGeneratingFrames(false);
        }
    };

    const handleFrameSelect = (frame: UploadedFile) => {
        setSelectedFrameId(frame.id);
        updateProject({ startFrame: frame });
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
        if (frameBatches.length > 0) {
            checkScrollDimensions();
            window.addEventListener('resize', checkScrollDimensions);
            return () => window.removeEventListener('resize', checkScrollDimensions);
        }
    }, [frameBatches]);

    const currentFrames = frameBatches[currentBatchIndex] || [];

    const handlePrevBatch = () => setCurrentBatchIndex(i => Math.max(0, i - 1));
    const handleNextBatch = () => setCurrentBatchIndex(i => Math.min(frameBatches.length - 1, i + 1));

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2 duration-300 items-stretch">
            
            {/* LEFT COLUMN: Avatar Selection (1 Col) */}
            <div className="md:col-span-1 space-y-4 flex flex-col h-full">
                <div className="p-6 rounded-xl bg-transparent border border-gray-200 dark:border-gray-700 flex flex-col flex-1">
                    <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-900/50 p-1 rounded-full">
                        {currentTemplate ? (
                            <button 
                                onClick={() => setActiveTab('default')}
                                className={`flex-1 py-2 px-1 text-xs font-semibold rounded-full transition-all ${activeTab === 'default' ? 'bg-brand-accent text-[#050C26]' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                            >
                                Template Avatar
                            </button>
                        ) : (
                            <button 
                                onClick={() => setActiveTab('ai')}
                                className={`flex-1 py-2 px-1 text-xs font-semibold rounded-full transition-all ${activeTab === 'ai' ? 'bg-brand-accent text-[#050C26]' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                            >
                                AI Avatar
                            </button>
                        )}
                        <button 
                            onClick={() => { setActiveTab('upload'); }}
                            className={`flex-1 py-2 px-1 text-xs font-semibold rounded-full transition-all ${activeTab === 'upload' ? 'bg-brand-accent text-[#050C26]' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                        >
                            Upload Photo
                        </button>
                    </div>

                    <div className="flex-grow flex flex-col items-center justify-center">
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
                        
                        <div 
                            className={`w-full relative aspect-square rounded-lg overflow-hidden ${
                                activeTab === 'upload' 
                                ? 'border-2 border-dashed border-gray-300 dark:border-gray-600 bg-transparent' 
                                : 'border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
                            }`}
                        >
                            {/* Render Template Avatar if in default tab */}
                            {activeTab === 'default' && currentTemplate && (
                                <img src={currentTemplate.previewImageUrl} className="w-full h-full object-cover" alt="Template Avatar" />
                            )}

                            {/* Render AI Avatar Placeholder */}
                            {activeTab === 'ai' && (
                                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                    <SparklesIcon className="w-6 h-6 text-brand-accent mb-2" />
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Avatar Based on Script</p>
                                </div>
                            )}
                            
                            {/* Render Upload Placeholder/File */}
                            {activeTab === 'upload' && (
                                <>
                                    {!project.ugcAvatarFile && (
                                        <div 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer group hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            {isValidating ? (
                                                <div className="flex flex-col items-center">
                                                    <div className="w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full animate-spin mb-2"></div>
                                                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Validating...</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <UserCircleIcon className="w-10 h-10 text-gray-400 dark:text-gray-500 mb-3 group-hover:scale-110 transition-transform" />
                                                    <p className="font-semibold text-base text-gray-600 dark:text-[#525252]">Click to upload image</p>
                                                    <p className="text-xs text-gray-500 dark:text-[#525252] mt-2 hidden sm:block">or drag & drop an image</p>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {project.ugcAvatarFile && (
                                        <div className="w-full h-full group relative">
                                            <AssetPreview asset={project.ugcAvatarFile} objectFit="cover" />
                                            {/* Remove Button */}
                                            <button 
                                                onClick={handleRemoveUploadedAvatar}
                                                className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white p-1.5 rounded-full shadow-md transition-colors z-10"
                                                title="Remove image"
                                            >
                                                <XMarkIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        {uploadError && <p className="text-red-500 text-xs mt-2 text-center">{uploadError}</p>}
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Director's Monitor & Production (2 Cols) */}
            <div className="md:col-span-2 flex flex-col gap-6 h-full">
                <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-end mb-4 px-1">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Combine Product & Avatar</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {frameBatches.length > 0 ? "Select your favorite starting frame" : "Generate starting frames, then select your favorite"}
                            </p>
                        </div>
                        {frameBatches.length > 0 && !isGeneratingFrames && (
                            <div className="flex items-center gap-3">
                                {frameBatches.length > 1 && (
                                    <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
                                        <button onClick={handlePrevBatch} disabled={currentBatchIndex === 0} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30">
                                            <LeftArrowIcon className="w-4 h-4" />
                                        </button>
                                        <span className="text-xs font-mono w-8 text-center">{currentBatchIndex + 1}/{frameBatches.length}</span>
                                        <button onClick={handleNextBatch} disabled={currentBatchIndex === frameBatches.length - 1} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30">
                                            <RightArrowIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                                <button 
                                    onClick={handleGenerateFrames} 
                                    className="text-sm font-semibold text-brand-accent hover:underline flex items-center gap-1 disabled:opacity-50"
                                    title="Regenerate frames"
                                >
                                    <ArrowPathIcon className="w-4 h-4" />
                                    <span className="hidden md:inline">Regenerate</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {isGeneratingFrames ? (
                        <div className="w-full flex-1 border-2 border-gray-300 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-[#131517] p-6 relative">
                             <div className="flex flex-col items-center justify-center space-y-4">
                                <div className="relative">
                                    <div className="w-12 h-12 border-4 border-brand-accent/30 rounded-full"></div>
                                    <div className="absolute top-0 left-0 w-12 h-12 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <SparklesIcon className="w-5 h-5 text-brand-accent animate-pulse" />
                                    </div>
                                </div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white animate-pulse">
                                    {frameGenerationMessage}
                                </p>
                            </div>
                        </div>
                    ) : frameBatches.length === 0 ? (
                        <div className="w-full flex-1 border-2 border-gray-300 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center text-center bg-white dark:bg-[#131517] p-6 relative">
                            <button 
                                onClick={handleGenerateFrames}
                                className="px-6 py-3 bg-brand-accent text-[#050C26] rounded-lg font-bold shadow-md hover:bg-brand-accent-hover transition-colors flex items-center gap-2"
                            >
                                <SparklesIcon className="w-5 h-5" />
                                Generate 4 Starting Frames
                            </button>
                            {/* Error Notification for Frame Generation */}
                            {error && (
                                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 max-w-sm mx-auto">
                                    <XMarkIcon className="w-4 h-4 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            <div 
                                ref={scrollRef}
                                onScroll={() => { handleScroll(); checkScrollDimensions(); }}
                                className="flex md:grid md:grid-cols-4 gap-4 overflow-x-auto md:overflow-visible pb-4 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0"
                            >
                                {currentFrames.map((frame) => {
                                    const isSelected = selectedFrameId === frame.id;
                                    return (
                                        <div 
                                            key={frame.id}
                                            onClick={() => handleFrameSelect(frame)}
                                            className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 flex-shrink-0 w-[70vw] md:w-full snap-start aspect-[9/16] border-4 ${isSelected ? 'border-brand-accent ring-2 ring-brand-accent/50' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'}`}
                                        >
                                            <AssetPreview asset={frame} objectFit="cover" />
                                            {isSelected && (
                                                <div className="absolute top-2 left-2 bg-brand-accent text-[#050C26] px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-md z-10">
                                                    <CheckIcon className="w-3 h-3" /> Selected
                                                </div>
                                            )}
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setLightboxAsset(frame); }}
                                                className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-20"
                                            >
                                                <ArrowsPointingOutIcon className="w-3 h-3" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            {/* Scroll Indicator (Mobile only) */}
                            <div className="md:hidden relative h-1 bg-gray-200 dark:bg-[#2B2B2B] rounded-full mb-6 w-full overflow-hidden mt-2">
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
                    )}
                </div>

                {frameBatches.length > 0 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex flex-col gap-6">
                            <div className="flex gap-6 w-full">
                                <ModelSelector 
                                    type="video"
                                    currentModel={project.videoModel}
                                    onChange={(v) => updateProject({ videoModel: v })}
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-6">
                                <GenericSelect label="Aspect Ratio" options={UGC_ASPECT_RATIOS} selectedValue={project.aspectRatio} onSelect={(v) => updateProject({ aspectRatio: v as any })} />
                                <GenericSelect label="Resolution" options={VIDEO_RESOLUTIONS} selectedValue={project.videoResolution || '720p'} onSelect={(v) => updateProject({ videoResolution: v as any })} />
                                <GenericSelect label="Duration" options={VIDEO_DURATIONS} selectedValue={project.videoDuration || 4} onSelect={(v) => updateProject({ videoDuration: v as number })} />
                            </div>
                        </div>
                        
                        <div>
                            <button 
                                onClick={handleGenerate} 
                                disabled={isLoading || !selectedFrameId}
                                className="w-full h-14 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-accent/10 disabled:shadow-none"
                            >
                                {isLoading ? (
                                    <><div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div> Generating Video...</>
                                ) : (
                                    <><span>Generate Video</span><SparklesIcon className="w-5 h-5" /><span>{cost}</span></>
                                )}
                            </button>
                            
                            {/* Error Notification for Video Generation */}
                            {error && frameBatches.length > 0 && (
                                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                                    <XMarkIcon className="w-4 h-4 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <VideoLightbox 
                isOpen={!!lightboxAsset} 
                onClose={() => setLightboxAsset(null)} 
                asset={lightboxAsset} 
            />
        </div>
    );
};

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
                <div className={`relative overflow-hidden rounded-xl aspect-[9/16] w-full bg-gray-100 dark:bg-gray-800 transition-all duration-300 ${isSelected ? 'ring-2 ring-brand-accent' : ''}`}>
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
                                     {project.ugcProductFile ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="relative w-40 h-40 group">
                                                <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                                                    <AssetPreview asset={project.ugcProductFile} objectFit="cover" />
                                                </div>
                                                {!isAnalyzing && (
                                                    <button 
                                                        onClick={() => updateProject({ ugcProductFile: null, productName: '', productDescription: '' })} 
                                                        className="absolute -top-2 -right-2 z-10 flex items-center justify-center w-6 h-6 bg-black text-white dark:bg-white dark:text-black rounded-full shadow-md hover:bg-gray-800 transition-colors"
                                                    >
                                                        <XMarkIcon className="w-3 h-3" />
                                                    </button>
                                                )}
                                                {isAnalyzing && (
                                                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-lg z-20">
                                                        <div className="text-white font-semibold flex items-center gap-2 text-xs">
                                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                            Analyzing...
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
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
                                    <label htmlFor="productName" className="block mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product Name</label>
                                    {isAnalyzing ? (
                                        <div className="w-full p-4 h-[58px] rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                                    ) : (
                                        <input type="text" id="productName" value={project.productName || ''} onChange={e => updateProject({ productName: e.target.value })} placeholder="e.g., The Cozy Slipper" 
                                        className="w-full p-4 border rounded-lg input-focus-brand" />
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="productDescription" className="block mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product Description</label>
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

const TemplateProductionStep: React.FC<{
    project: Project;
    updateProject: (u: Partial<Project>) => void;
    handleGenerate: () => void;
    isLoading: boolean;
    cost: number;
}> = ({
    project, updateProject, handleGenerate, isLoading, cost
}) => {
    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="text-center">
                <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Production Settings</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Finalize your video parameters before generating.</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700 space-y-6">
                 <div>
                    <ModelSelector 
                        type="video"
                        currentModel={project.videoModel}
                        onChange={(v) => updateProject({ videoModel: v })}
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <GenericSelect label="Aspect Ratio" options={UGC_ASPECT_RATIOS} selectedValue={project.aspectRatio} onSelect={(v) => updateProject({ aspectRatio: v as any })} />
                    <GenericSelect label="Resolution" options={VIDEO_RESOLUTIONS} selectedValue={project.videoResolution || '720p'} onSelect={(v) => updateProject({ videoResolution: v as any })} />
                    <GenericSelect label="Duration" options={VIDEO_DURATIONS} selectedValue={project.videoDuration || 4} onSelect={(v) => updateProject({ videoDuration: v as number })} />
                </div>
            </div>

            <div>
                 <button 
                    onClick={handleGenerate} 
                    disabled={isLoading}
                    className="w-full h-14 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-accent/10 disabled:shadow-none"
                >
                    {isLoading ? (
                        <><div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div> Generating Video...</>
                    ) : (
                        <><span>Generate Video</span><SparklesIcon className="w-5 h-5" /><span>{cost}</span></>
                    )}
                </button>
            </div>
        </div>
    );
};

const TemplateAvatarStep: React.FC<{
    project: Project;
    updateProject: (u: Partial<Project>) => void;
    handleAvatarUpload: (file: UploadedFile) => Promise<boolean>;
    onOpenTemplateModal: () => void;
}> = ({
    project, updateProject, handleAvatarUpload, onOpenTemplateModal
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const isTemplateMode = !!project.templateId;

    const [activeTab, setActiveTab] = useState<'default' | 'upload' | 'ai'>(() => {
        if (project.ugcAvatarSource === 'upload') return 'upload';
        if (project.ugcAvatarSource === 'ai') return 'ai';
        if (isTemplateMode) return 'default';
        return 'ai';
    });

    useEffect(() => {
        if (activeTab === 'default') {
            updateProject({ ugcAvatarSource: 'template', ugcAvatarFile: null }); 
        } else if (activeTab === 'upload') {
            updateProject({ ugcAvatarSource: 'upload' });
        } else if (activeTab === 'ai') {
            updateProject({ ugcAvatarSource: 'ai', ugcAvatarFile: null });
        }
    }, [activeTab]);

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

    const currentTemplate = isTemplateMode ? TEMPLATE_LIBRARY.find(t => t.id === project.templateId) : null;

    return (
        <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Choose Your Avatar</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Select who will present your video</p>
            </div>

            <div className="p-6 rounded-xl bg-transparent border border-gray-200 dark:border-gray-700 flex flex-col h-fit">
                <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-900/50 p-1 rounded-full">
                    {currentTemplate && (
                        <button 
                            onClick={() => setActiveTab('default')}
                            className={`flex-1 py-2 px-1 text-xs font-semibold rounded-full transition-all ${activeTab === 'default' ? 'bg-brand-accent text-[#050C26]' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                        >
                            Template Avatar
                        </button>
                    )}
                    <button 
                        onClick={() => setActiveTab('ai')}
                        className={`flex-1 py-2 px-1 text-xs font-semibold rounded-full transition-all ${activeTab === 'ai' ? 'bg-brand-accent text-[#050C26]' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    >
                        AI Avatar
                    </button>
                    <button 
                        onClick={() => setActiveTab('upload')}
                        className={`flex-1 py-2 px-1 text-xs font-semibold rounded-full transition-all ${activeTab === 'upload' ? 'bg-brand-accent text-[#050C26]' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    >
                        Upload Photo
                    </button>
                </div>

                <div className="flex-grow flex flex-col items-center justify-center min-h-[300px]">
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
                    
                    <div 
                        className={`w-full max-w-sm relative aspect-square rounded-lg overflow-hidden ${
                            activeTab === 'upload' 
                            ? 'border-2 border-dashed border-gray-300 dark:border-gray-600 bg-transparent' 
                            : 'border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
                        }`}
                    >
                        {activeTab === 'default' && currentTemplate && (
                            <img src={currentTemplate.previewImageUrl} className="w-full h-full object-cover" alt="Template Avatar" />
                        )}

                        {activeTab === 'ai' && (
                            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                <SparklesIcon className="w-12 h-12 text-brand-accent mb-2" />
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">AI Generated</p>
                                <p className="text-xs text-gray-500">Avatar will be created based on your script.</p>
                                <div className="mt-4 w-full">
                                     <label className="block mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</label>
                                     <textarea
                                        value={project.ugcAvatarDescription || ''}
                                        onChange={e => updateProject({ ugcAvatarDescription: e.target.value })}
                                        placeholder="e.g., A friendly woman in her 30s..."
                                        className="w-full p-2 border rounded-lg bg-white dark:bg-[#1C1E20] input-focus-brand text-sm"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'upload' && (
                            <>
                                {!project.ugcAvatarFile && (
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer group hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        {isValidating ? (
                                            <div className="flex flex-col items-center">
                                                <div className="w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full animate-spin mb-2"></div>
                                                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Validating...</p>
                                            </div>
                                        ) : (
                                            <>
                                                <UserCircleIcon className="w-10 h-10 text-gray-400 dark:text-gray-500 mb-3 group-hover:scale-110 transition-transform" />
                                                <p className="font-semibold text-base text-gray-600 dark:text-[#525252]">Click to upload image</p>
                                                <p className="text-xs text-gray-500 dark:text-[#525252] mt-2 hidden sm:block">or drag & drop an image</p>
                                            </>
                                        )}
                                    </div>
                                )}

                                {project.ugcAvatarFile && (
                                    <div className="w-full h-full group relative">
                                        <AssetPreview asset={project.ugcAvatarFile} objectFit="cover" />
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); updateProject({ ugcAvatarFile: null }); }}
                                            className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white p-1.5 rounded-full shadow-md transition-colors z-10"
                                        >
                                            <XMarkIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    {uploadError && <p className="text-red-500 text-xs mt-2 text-center">{uploadError}</p>}
                </div>
            </div>
        </div>
    );
};

const CustomSetupStep: React.FC<{
    project: Project;
    updateProject: (u: Partial<Project>) => void;
    onOpenProductModal: () => void;
    onNext: () => void;
}> = ({
    project, updateProject, onOpenProductModal, onNext
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [indicatorWidth, setIndicatorWidth] = useState(0);

    useEffect(() => {
        if (scrollRef.current && project.ugcType) {
            // Find the index of the selected type in UGC_STYLES
            const selectedIndex = UGC_STYLES.findIndex(style => style.type === project.ugcType);
            if (selectedIndex !== -1) {
                // Calculate scroll position: (card width 160px/192px + gap 16px) * index
                // Using 192 (desktop size) for simplicity, it will center roughly on mobile too
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

    return (
        <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Main Selection Carousel */}
            <div>
                <h2 className="text-xl font-bold mb-6 text-left text-gray-900 dark:text-white">Choose a Video Style</h2>
                
                <div 
                    ref={scrollRef}
                    onScroll={() => { handleScroll(); checkScrollDimensions(); }}
                    className="flex overflow-x-auto pb-6 gap-4 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0"
                >
                    {UGC_STYLES.map((style) => {
                         const isSelected = project.ugcType === style.type;
                         const comingSoon = style.comingSoon;
                         return (
                             <button 
                                key={style.type}
                                onClick={() => {
                                    if (comingSoon) return;
                                    if (style.type === 'product_showcase') {
                                        onOpenProductModal();
                                    } else {
                                        updateProject({ ugcType: style.type as any });
                                        onNext();
                                    }
                                }}
                                disabled={comingSoon}
                                className={`group text-left flex flex-col flex-shrink-0 w-40 md:w-48 snap-start focus:outline-none ${comingSoon ? 'cursor-not-allowed opacity-60' : ''}`}
                            >
                                <div className={`relative overflow-hidden rounded-xl aspect-[9/16] w-full bg-gray-100 dark:bg-gray-800 transition-all duration-300 
                                    ${isSelected ? 'ring-2 ring-brand-accent' : ''} 
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

const CustomStoryStep: React.FC<{ project: Project; updateProject: (u: Partial<Project>) => void; isLoading: boolean; }> = ({ project, updateProject, isLoading }) => {
    const { user } = useAuth();
    const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
    const [isSuggestingScript, setIsSuggestingScript] = useState(false);
    const [isSuggestingScene, setIsSuggestingScene] = useState(false);

    const isProductCentric = ['product_showcase', 'unboxing'].includes(project.ugcType || '');
    // Define quick scenes based on the current project type
    const currentQuickScenes = QUICK_SCENES[project.ugcType || 'product_showcase'] || DEFAULT_SCENES;

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
                            <label className="block mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Topic</label>
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
                    disabled={isLoading}
                    className="h-12 px-6 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center justify-center gap-2 whitespace-nowrap w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <SparklesIcon className="w-5 h-5" />
                    Generate Concepts
                </button>
            </div>

            {/* Key Messaging Input */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Key Messaging & Talking Points</label>
                    <button 
                        onClick={handleSuggestScript}
                        disabled={isSuggestingScript}
                        className="text-sm font-semibold text-brand-accent hover:underline disabled:opacity-50"
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
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Scene Description</label>
                    <button 
                        onClick={handleSuggestScene}
                        disabled={isSuggestingScene}
                        className="text-sm font-semibold text-brand-accent hover:underline disabled:opacity-50"
                    >
                        {isSuggestingScene ? 'Suggesting...' : 'Suggest'}
                    </button>
                </div>
                <textarea
                    value={project.ugcSceneDescription || ''}
                    onChange={(e) => updateProject({ ugcSceneDescription: e.target.value })}
                    placeholder="e.g., A bright, modern kitchen with marble countertops..."
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

const TemplateStoryStep = CustomStoryStep;
const CustomAvatarStep = TemplateAvatarStep; 
const CustomProductionStep = TemplateProductionStep;