import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CREDIT_COSTS } from '../constants';
import { SparklesIcon, UGCImage, XMarkIcon, AspectRatioSquareIcon, AspectRatioTallIcon, AspectRatioWideIcon, LeftArrowIcon, PencilIcon, ArrowDownTrayIcon, UserCircleIcon, EyeIcon, ArrowsPointingOutIcon, ArrowPathIcon, CheckIcon, RightArrowIcon, ImageIcon } from '../components/icons';
import type { UploadedFile, Project, Template, UgcAvatarSource } from '../types';
import { Uploader } from '../components/Uploader';
import { AssetPreview } from '../components/AssetPreview';
import { GenericSelect } from '../components/GenericSelect';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useProjects } from '../context/ProjectContext';
import { AvatarTemplateModal } from '../components/AvatarTemplateModal';
import { AvatarDirectionModal } from '../components/AvatarDirectionModal';
import { ScriptGeneratorModal } from '../components/ScriptGeneratorModal';
import { ProductUploadModal } from '../components/ProductUploadModal';
import { ProductScraper } from '../components/ProductScraper';
import { generateCampaignBrief, fetchWithProxies, validateAvatarImage, suggestUGCKeyMessaging, suggestUGCSceneDescription, generateUGCPreviews } from '../services/geminiService';
import { TEMPLATE_LIBRARY } from '../lib/templates';
import { ProgressStepper } from '../components/ProgressStepper';
import { VideoLightbox } from '../components/VideoLightbox';
import { ErrorResolutionView } from '../components/ErrorResolutionView';

type TemplateStep = 'Setup' | 'Story' | 'Avatar' | 'Production';
type CustomStep = 'Setup' | 'Story' | 'Avatar' | 'Production';
type EcommerceStep = 'Concept' | 'Visuals';

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
        'Fail Compilation': 'Reacting to a many fail video compilation.',
        'Product Launch': 'Watching a live stream of a new tech product launch.',
        'Movie Trailer': 'Reacting to an intense new movie trailer.'
    },
    'pov': {
        'Walking in Park': 'Handheld camera view walking through a sunny park.',
        ' Car Dashboard': 'View from the dashboard of a car while driving (safely).',
        'Gym Mirror': 'Selfie view in a gym mirror with workout equipment behind.',
        'Desk Setup': 'Looking down at a keyboard and mouse from the user\'s perspective.'
    }
};

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

const FRAME_GENERATION_MESSAGES = [
    "Analyzing scene composition...",
    "Positioning product and avatar...",
    "Rendering lighting effects...",
    "Finalizing starting frames..."
];

const ModelSelector = ({ type, currentModel, recommendedModel, onChange }: { type: 'image' | 'video', currentModel?: string, recommendedModel?: string, onChange: (val: string) => void }) => {
  const models = VIDEO_MODELS;
  const isRecommended = recommendedModel && currentModel === recommendedModel;
  return (
    <div className="w-full">
        <GenericSelect label="AI Model" options={models} selectedValue={currentModel || models[0].value} onSelect={(v) => onChange(v as string)} />
        {isRecommended && <p className="text-xs text-gray-500 mt-2">✨ This model is optimized for your selected template.</p>}
    </div>
  );
}

const fileToUploadedFile = async (file: File | Blob, name: string): Promise<UploadedFile> => {
    const reader = new FileReader();
    const blob = file;
    return new Promise((resolve) => {
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
            const result = reader.result as string;
            const base64 = result?.split(',')[1];
            resolve({ id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, base64, mimeType: file.type || 'application/octet-stream', name, blob });
        };
    });
};

const StrategistInsightBox: React.FC<{ insight: string; onDismiss: () => void }> = ({ insight, onDismiss }) => (
    <div className="m-3 p-4 rounded-lg bg-brand-accent/5 border border-[#2B2B2B] relative animate-in fade-in slide-in-from-top-1 duration-500">
        <button 
            onClick={onDismiss}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
            <XMarkIcon className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wide text-brand-accent">Strategist Insight</span>
        </div>
        <p className="text-sm text-gray-300 italic leading-relaxed pr-10">
            "{insight}"
        </p>
    </div>
);

const RichScriptEditor = ({ value, onChange, placeholder }: { value: string, onChange: (val: string) => void, placeholder?: string }) => {
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const isEmpty = !value || value === '<br>' || value === '<div><br></div>';

    return (
        <div className="relative w-full h-full">
            <div 
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                className="w-full p-4 outline-none focus:ring-0 bg-transparent text-white min-h-[12rem] resize-none overflow-y-auto"
                style={{ whiteSpace: 'pre-wrap' }}
            />
            {isEmpty && placeholder && (
                <div className="absolute top-4 left-4 text-gray-500 pointer-events-none whitespace-pre-wrap">
                    {placeholder}
                </div>
            )}
        </div>
    );
};

export const UGCGeneratorScreen: React.FC = () => {
    const { user } = useAuth();
    const { isLoading, error, setError, generationError, setGenerationError, setIsLoading, setLoadingTitle, setGenerationStatusMessages, setAgentStatusMessages, goBack, navigateTo } = useUI();
    const { currentProject: project, setCurrentProject: setProject, handleGenerate, applyPendingTemplate, templateToApply } = useProjects();
    const [templateStep, setTemplateStep] = useState<TemplateStep>('Setup');
    const [ecommerceStep, setEcommerceStep] = useState<EcommerceStep>('Concept');
    const [isProductUploadModalOpen, setIsProductUploadModalOpen] = useState(false);
    const [productModalMode, setProductModalMode] = useState<'create' | 'edit'>('create');
    const isProductAdFlowRef = useRef(!!(project?.ugcProductFile && project?.ugcType === 'product_showcase'));
    const [customStep, setCustomStep] = useState<CustomStep>(() => isProductAdFlowRef.current ? 'Story' : 'Setup');
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => { window.scrollTo(0, 0); }, [templateStep, customStep, ecommerceStep]);
    useEffect(() => { if (templateToApply && project) applyPendingTemplate(project); }, [templateToApply, project, applyPendingTemplate]);
    if (!project || !user) return <div className="text-center p-8">Error: No active project.</div>;
    const isTemplateMode = !!project.templateId;
    const isEcommerceFlow = project.isEcommerce;
    const currentTemplate = isTemplateMode ? TEMPLATE_LIBRARY.find(t => t.id === project.templateId) : null;
    const updateProject = useCallback((updates: Partial<Project>) => setProject(prev => prev ? ({ ...prev, ...updates }) : null), [setProject]);

    const handleUGCProductUpload = useCallback(async (uploadedFile: UploadedFile) => {
        setIsAnalyzing(true); setError(null);
        try {
            const brief = await generateCampaignBrief(uploadedFile);
            updateProject({ ugcProductFile: uploadedFile, productName: brief.productName, productDescription: brief.productDescription });
        } catch (e: any) {
            console.error("Failed to analyze product image", e);
            setError(e.message || "Failed to analyze product image.");
            updateProject({ ugcProductFile: uploadedFile, productName: '', productDescription: '' });
        } finally { setIsAnalyzing(false); }
    }, [updateProject, setError]);

    const handleUGCProductScraped = (data: { name: string; description: string; file: UploadedFile | null; url: string; }) => {
        updateProject({ ugcProductFile: data.file, productName: data.name, productDescription: data.description, websiteUrl: data.url });
        if (!data.file) setError("Product details imported. Please upload an image manually to continue.");
    };

    const handleProductUploadConfirm = (data: { file: UploadedFile | null; url?: string; name?: string; description?: string }) => {
        if (productModalMode === 'create') {
            updateProject({ ugcType: 'product_showcase', ugcProductFile: data.file, productName: data.name, productDescription: data.description, websiteUrl: data.url, isEcommerce: true });
            setEcommerceStep('Concept');
        } else {
            updateProject({ ugcProductFile: data.file, productName: data.name, productDescription: data.description, websiteUrl: data.url });
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
        } else return false;
    };
    
    const cost = project.videoModel === 'veo-3.1-generate-preview' ? CREDIT_COSTS.base.ugcVideoCinematic : CREDIT_COSTS.base.ugcVideoFast;
    const ecommerceSteps = ['Concept', 'Visuals', 'Results'];
    const getEcommerceStepIndex = (step: EcommerceStep) => ecommerceSteps.indexOf(step);
    const handleEcommerceNext = () => { if (ecommerceStep === 'Concept') setEcommerceStep('Visuals'); };
    const handleEcommerceBack = () => { if (ecommerceStep === 'Visuals') setEcommerceStep('Concept'); };
    const getEcommerceHeaderTitle = () => ecommerceStep === 'Visuals' ? 'Starting Frame' : (currentTemplate ? `${currentTemplate.title} Template` : 'UGC Product Showcase');
    const skipsAvatarStep = project.ugcAvatarSource !== 'upload' && project.ugcAvatarSource !== 'ai' && project.ugcAvatarSource !== 'template';
    const templateSteps = skipsAvatarStep ? ['Setup', 'Story', 'Production', 'Results'] : ['Setup', 'Story', 'Avatar', 'Production', 'Results'];
    const getTemplateStepIndex = (step: TemplateStep) => templateSteps.indexOf(step);
    const handleTemplateNext = () => {
         if (templateStep === 'Setup') setTemplateStep('Story');
         else if (templateStep === 'Story') skipsAvatarStep ? setTemplateStep('Production') : setTemplateStep('Avatar');
         else if (templateStep === 'Avatar') setTemplateStep('Production');
    };
    const handleTemplateBack = () => {
        if (templateStep === 'Production') skipsAvatarStep ? setTemplateStep('Story') : setTemplateStep('Avatar');
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
            if (isProductAdFlowRef.current) { updateProject({ mode: 'Product Ad' }); goBack(); }
            else setCustomStep('Setup');
        } else if (customStep === 'Setup') goBack();
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
    const isTemplateNextDisabled = isLoading || (templateStep === 'Setup' && (!project.ugcType || (project.ugcType === 'product_showcase' && !project.ugcProductFile))) || (templateStep === 'Avatar' && (project.ugcAvatarSource || 'ai') !== 'ai' && !project.ugcAvatarFile);
    const isCustomNextDisabled = isLoading || (customStep === 'Setup' && (!project.ugcType)) || (customStep === 'Story' && (!project.ugcSceneDescription || !project.ugcScript)) || (customStep === 'Avatar' && (project.ugcAvatarSource || 'ai') !== 'ai' && !project.ugcAvatarFile);

    if (isEcommerceFlow) {
        return (
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        {ecommerceStep !== 'Concept' && (
                            <button onClick={handleEcommerceBack} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 -ml-2"><LeftArrowIcon className="w-6 h-6" /></button>
                        )}
                         <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{getEcommerceHeaderTitle()}</h2>
                    </div>
                    <ProgressStepper steps={ecommerceSteps} currentStepIndex={getEcommerceStepIndex(ecommerceStep)} />
                </div>
                {ecommerceStep === 'Concept' && <EcommerceConceptStep project={project} updateProject={updateProject} isLoading={isLoading} onEditProduct={() => { setProductModalMode('edit'); setIsProductUploadModalOpen(true); }} />}
                {ecommerceStep === 'Visuals' && <EcommerceVisualsStep project={project} updateProject={updateProject} handleGenerate={handleGenerate} isLoading={isLoading} cost={cost} handleAvatarUpload={handleAvatarUpload} setError={setError} error={error} generationError={generationError} setGenerationError={setGenerationError} currentTemplate={currentTemplate} navigateTo={navigateTo} />}
                {ecommerceStep === 'Concept' && (
                    <div className="mt-10 flex items-center justify-end">
                        <button onClick={handleEcommerceNext} disabled={isEcommerceNextDisabled} className="h-12 px-8 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isAnalyzing ? <><div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div> Analyzing...</> : "Continue"}
                        </button>
                    </div>
                )}
                {ecommerceStep === 'Concept' && error && <p className="text-right text-sm text-red-500 mt-2">{error}</p>}
                <AvatarTemplateModal isOpen={isAvatarModalOpen} onClose={() => setIsAvatarModalOpen(false)} onSelect={handleSelectTemplateCharacter} />
                <ProductUploadModal isOpen={isProductUploadModalOpen} onClose={() => setIsProductUploadModalOpen(false)} onConfirm={handleProductUploadConfirm} mode={productModalMode} initialData={productModalMode === 'edit' ? { file: project.ugcProductFile, name: project.productName, description: project.description, url: project.websiteUrl } : undefined} />
            </div>
        );
    }

    if (isTemplateMode) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        {templateStep !== 'Setup' && (
                            <button onClick={handleTemplateBack} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 -ml-2"><LeftArrowIcon className="w-6 h-6" /></button>
                        )}
                         <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{getTemplateHeaderTitle()}</h2>
                    </div>
                    {templateStep !== 'Setup' && <ProgressStepper steps={templateSteps} currentStepIndex={getTemplateStepIndex(templateStep)} />}
                </div>
                <div className="max-w-4xl mx-auto">
                    {templateStep === 'Setup' && <TemplateSetupStep project={project} updateProject={updateProject} isAnalyzing={isAnalyzing} handleUGCProductUpload={handleUGCProductUpload} handleUGCProductScraped={handleUGCProductScraped} setIsLoading={setIsLoading} setGenerationStatusMessages={setGenerationStatusMessages} setError={setError} currentTemplate={currentTemplate} />}
                    {templateStep === 'Story' && <TemplateStoryStep project={project} updateProject={updateProject} isLoading={isLoading} />}
                    {templateStep === 'Avatar' && <TemplateAvatarStep project={project} updateProject={updateProject} handleAvatarUpload={handleAvatarUpload} onOpenTemplateModal={() => setIsAvatarModalOpen(true)} />}
                    {templateStep === 'Production' && <TemplateProductionStep project={project} updateProject={updateProject} handleGenerate={handleGenerate} isLoading={isLoading} cost={cost} generationError={generationError} setGenerationError={setGenerationError} navigateTo={navigateTo} />}
                    {templateStep !== 'Production' && (
                        <div className="mt-10 flex items-center justify-end">
                            <button onClick={handleTemplateNext} disabled={isTemplateNextDisabled} className="h-12 px-8 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">Continue</button>
                        </div>
                    )}
                     {error && !generationError && <p className="text-right text-sm text-red-500 mt-2">{error}</p>}
                </div>
                 <AvatarTemplateModal isOpen={isAvatarModalOpen} onClose={() => setIsAvatarModalOpen(false)} onSelect={handleSelectTemplateCharacter} />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={handleCustomBack} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 -ml-2"><LeftArrowIcon className="w-6 h-6" /></button>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{getCustomHeaderTitle()}</h2>
                </div>
                {customStep !== 'Setup' && <ProgressStepper steps={customSteps} currentStepIndex={getCustomStepIndex(customStep)} />}
            </div>
            <div className="max-w-5xl mx-auto">
                {customStep === 'Setup' && <CustomSetupStep project={project} updateProject={updateProject} onOpenProductModal={() => { setProductModalMode('create'); setIsProductUploadModalOpen(true); }} onNext={handleCustomNext} />}
                {customStep === 'Story' && <CustomStoryStep project={project} updateProject={updateProject} isLoading={isLoading} />}
                {customStep === 'Avatar' && <CustomAvatarStep project={project} updateProject={updateProject} handleAvatarUpload={handleAvatarUpload} onOpenTemplateModal={() => setIsAvatarModalOpen(true)} />}
                {customStep === 'Production' && <CustomProductionStep project={project} updateProject={updateProject} handleGenerate={handleGenerate} isLoading={isLoading} cost={cost} generationError={generationError} setGenerationError={setGenerationError} navigateTo={navigateTo} />}
                {customStep !== 'Production' && customStep !== 'Setup' && (
                     <div className="mt-10 flex items-center justify-end">
                        <button onClick={handleCustomNext} disabled={isCustomNextDisabled} className="h-12 px-8 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">Continue</button>
                    </div>
                )}
                 {error && !generationError && <p className="text-right text-sm text-red-500 mt-2">{error}</p>}
            </div>
            <AvatarTemplateModal isOpen={isAvatarModalOpen} onClose={() => setIsAvatarModalOpen(false)} onSelect={handleSelectTemplateCharacter} />
            <ProductUploadModal isOpen={isProductUploadModalOpen} onClose={() => setIsProductUploadModalOpen(false)} onConfirm={handleProductUploadConfirm} />
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
    const { setIsLoading, setAgentStatusMessages, setLoadingTitle } = useUI();
    const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
    const [strategistInsight, setStrategistInsight] = useState<string | null>(null);

    const runSuggestWorkflow = async (task: 'script' | 'scene') => {
        setIsLoading(true);
        setLoadingTitle(task === 'script' ? "Generating Key Messaging..." : "Designing Scene Layout...");
        
        // Start empty and add agents sequentially
        setAgentStatusMessages([]);

        const addAgent = (role: string, content: string, status: 'active' | 'done') => {
            setAgentStatusMessages(prev => {
                const updatedPrev = prev.map(m => m.status === 'active' ? { ...m, status: 'done' as const } : m);
                return [...updatedPrev, { role, content, status }];
            });
        };

        try {
            // Agent 1: Supervisor
            addAgent('Supervisor Agent', 'Orchestrating the workflow and coordinating agent tasks', 'active');
            await new Promise(r => setTimeout(r, 2000));

            // Agent 2: Strategist
            addAgent('Strategist Agent', 'Defining the content direction based on trends, timings and goals', 'active');
            await new Promise(r => setTimeout(r, 2000));

            // Agent 3: Copywriter
            addAgent('Copy & Scriptwriter Agent', 'Crafting scroll-stopping hooks, scripts, and captions', 'active');
            
            const apiCall = (task === 'script' 
                ? suggestUGCKeyMessaging(project.productName || 'product', project.productDescription || '', project.ugcTopic || 'Sales & Conversion') 
                : suggestUGCSceneDescription(project.productName || 'product', project.productDescription || '', project.ugcTopic || 'Sales & Conversion'));
            
            const [result] = await Promise.all([
                apiCall,
                new Promise(r => setTimeout(r, 2500))
            ]);

            if (task === 'script') {
                updateProject({ ugcScript: (result as any).messaging_points });
                setStrategistInsight((result as any).strategist_insight);
            } else {
                updateProject({ ugcSceneDescription: result as string });
            }
            
            // Finalize last agent
            setAgentStatusMessages(prev => prev.map(m => m.role === 'Copy & Scriptwriter Agent' ? { ...m, status: 'done' } : m));
            await new Promise(r => setTimeout(r, 500));
        } catch (e) {
            console.error("Suggest workflow failed", e);
        } finally {
            setIsLoading(false);
            setAgentStatusMessages([]);
        }
    };

    const handleSuggestScript = () => runSuggestWorkflow('script');
    const handleSuggestScene = () => runSuggestWorkflow('scene');
    
    const showSceneInput = !project.templateId;
    const currentQuickScenes = QUICK_SCENES[project.ugcType || 'product_showcase'] || DEFAULT_SCENES;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="md:col-span-1 space-y-6">
                <div className="p-6 rounded-xl bg-transparent border border-gray-200 dark:border-gray-700 h-fit relative group">
                    <div className="flex items-start gap-4">
                        <div className="flex flex-col gap-3 flex-shrink-0">
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                                 {project.ugcProductFile ? <AssetPreview asset={project.ugcProductFile} objectFit="cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon className="w-8 h-8" /></div>}
                            </div>
                            <button onClick={onEditProduct} className="w-20 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Edit</button>
                        </div>
                        <div className="flex-grow pt-1 flex flex-col gap-4">
                            <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">PRODUCT</label><p className="text-gray-900 dark:text-white font-bold text-base leading-tight">{project.productName || 'Not specified'}</p></div>
                            <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">DESCRIPTION</label><p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-3">{project.productDescription || 'Not specified'}</p></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="md:col-span-2 space-y-6">
                <div>
                    <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Script & Concept</h3>
                    <div className="flex flex-col md:flex-row gap-4 items-end mb-6">
                        <div className="flex-grow w-full"><GenericSelect label="Campaign Objective" options={['Brand Awareness', 'Product Launch', 'Sales & Conversion', 'Educational', 'Social Engagement', 'Customer Testimonial'].map(v => ({ value: v, label: v }))} selectedValue={project.ugcTopic || 'Sales & Conversion'} onSelect={(v) => updateProject({ ugcTopic: v as string })} /></div>
                        <button onClick={() => setIsScriptModalOpen(true)} className="h-12 px-6 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center justify-center gap-2 whitespace-nowrap w-full md:w-auto"><SparklesIcon className="w-5 h-5" />Generate Concepts</button>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Key Messaging & Talking Points</label>
                            <button onClick={handleSuggestScript} className="text-sm font-semibold text-brand-accent hover:underline flex items-center gap-1"><SparklesIcon className="w-3 h-3"/> Suggest</button>
                        </div>
                        <div className="w-full border border-gray-300 dark:border-gray-700 rounded-lg bg-[#131517] overflow-hidden transition-all focus-within:ring-2 focus-within:ring-[#C4C4C4] focus-within:border-[#C4C4C4] outline-none">
                            {strategistInsight && (
                                <StrategistInsightBox insight={strategistInsight} onDismiss={() => setStrategistInsight(null)} />
                            )}
                            <RichScriptEditor 
                                value={project.ugcScript || ''} 
                                onChange={(val) => updateProject({ ugcScript: val })} 
                                placeholder={"e.g., \n[HOOK]: Stop scrolling!\n[VALUE]: This product changes everything.\n[CTA]: Click the link below."} 
                            />
                        </div>
                    </div>
                </div>
                {showSceneInput && (
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Scene Description</label>
                            <button onClick={handleSuggestScene} className="text-sm font-semibold text-brand-accent hover:underline flex items-center gap-1"><SparklesIcon className="w-3 h-3"/> Suggest</button>
                        </div>
                        <textarea value={project.ugcSceneDescription || ''} onChange={(e) => updateProject({ ugcSceneDescription: e.target.value })} placeholder="e.g., A bright, modern kitchen with marble countertops..." className="w-full p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-[#131517] text-white input-focus-brand min-h-[6rem] resize-none placeholder-gray-500" />
                        <div className="mt-3 flex flex-wrap gap-2">
                            {Object.keys(currentQuickScenes).map(key => (
                                <button key={key} onClick={() => updateProject({ ugcSceneDescription: currentQuickScenes[key] })} className="px-3 py-1.5 text-xs font-medium rounded-full border bg-gray-100 dark:bg-[#1C1E20] border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors">{key}</button>
                            ))}
                        </div>
                    </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <GenericSelect label="Language" options={['English', 'Spanish', 'French', 'German', 'Japanese'].map(v => ({ value: v, label: v }))} selectedValue={project.ugcLanguage || 'English'} onSelect={(v) => updateProject({ ugcLanguage: v as string })} /><GenericSelect label="Accent" options={['American', 'British', 'Australian'].map(v => ({ value: v, label: v }))} selectedValue={project.ugcAccent || 'American'} onSelect={(v) => updateProject({ ugcAccent: v as string })} /><GenericSelect label="Emotion" options={['Auto', 'Happy', 'Excited', 'Serious', 'Calm'].map(v => ({ value: v, label: v }))} selectedValue={project.ugcEmotion || 'Auto'} onSelect={(v) => updateProject({ ugcEmotion: v as string })} />
                </div>
            </div>
            <ScriptGeneratorModal isOpen={isScriptModalOpen} onClose={() => setIsScriptModalOpen(false)} onSelect={(script, scene, action) => updateProject({ ugcScript: script, ugcSceneDescription: scene, ugcAction: action })} project={project} brandProfile={user?.brandProfile} />
        </div>
    );
};

const CustomStoryStep: React.FC<{ project: Project; updateProject: (u: Partial<Project>) => void; isLoading: boolean; }> = ({ project, updateProject, isLoading }) => {
    const { user } = useAuth();
    const { setIsLoading, setAgentStatusMessages, setLoadingTitle } = useUI();
    const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
    const [strategistInsight, setStrategistInsight] = useState<string | null>(null);
    const isProductCentric = ['product_showcase', 'unboxing'].includes(project.ugcType || '');
    const currentQuickScenes = QUICK_SCENES[project.ugcType || 'product_showcase'] || DEFAULT_SCENES;

    const runSuggestWorkflow = async (task: 'script' | 'scene') => {
        setIsLoading(true);
        setLoadingTitle(task === 'script' ? "Generating Key Messaging..." : "Designing Scene Layout...");
        
        setAgentStatusMessages([]);
        const addAgent = (role: string, content: string, status: 'active' | 'done') => {
            setAgentStatusMessages(prev => {
                const updatedPrev = prev.map(m => m.status === 'active' ? { ...m, status: 'done' as const } : m);
                return [...updatedPrev, { role, content, status }];
            });
        };

        try {
            addAgent('Supervisor Agent', 'Orchestrating the workflow and coordinating agent tasks', 'active');
            await new Promise(r => setTimeout(r, 2000));

            addAgent('Strategist Agent', 'Defining the content direction based on trends, timings and goals', 'active');
            await new Promise(r => setTimeout(r, 2000));

            addAgent('Copy & Scriptwriter Agent', 'Crafting scroll-stopping hooks, scripts, and captions', 'active');
            
            const apiCall = (task === 'script' 
                ? suggestUGCKeyMessaging(project.productName || 'product', project.productDescription || '', project.ugcTopic || 'Sales & Conversion') 
                : suggestUGCSceneDescription(project.productName || 'product', project.productDescription || '', project.ugcTopic || 'Sales & Conversion'));
            
            const [result] = await Promise.all([
                apiCall,
                new Promise(r => setTimeout(r, 2500))
            ]);

            if (task === 'script') {
                updateProject({ ugcScript: (result as any).messaging_points });
                setStrategistInsight((result as any).strategist_insight);
            } else {
                updateProject({ ugcSceneDescription: result as string });
            }
            
            setAgentStatusMessages(prev => prev.map(m => m.role === 'Copy & Scriptwriter Agent' ? { ...m, status: 'done' } : m));
            await new Promise(r => setTimeout(r, 500));
        } catch (e) {
            console.error("Suggest workflow failed", e);
        } finally {
            setIsLoading(false);
            setAgentStatusMessages([]);
        }
    };

    const handleSuggestScript = () => runSuggestWorkflow('script');
    const handleSuggestScene = () => runSuggestWorkflow('scene');
    
    return (
        <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-top-2 duration-300"><div className="flex flex-col md:flex-row gap-4 items-end"><div className="flex-grow w-full">{!isProductCentric ? <div><label className="block mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Topic</label><input type="text" value={project.ugcTopic === 'Sales & Conversion' ? '' : project.ugcTopic || ''} onChange={(e) => updateProject({ ugcTopic: e.target.value })} placeholder="e.g., My Morning Routine, Top Tips for Productivity..." className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-[#131517] text-white input-focus-brand placeholder-gray-500" /></div>
                : <GenericSelect label="Campaign Objective" options={['Brand Awareness', 'Product Launch', 'Sales & Conversion', 'Educational', 'Social Engagement', 'Customer Testimonial'].map(v => ({ value: v, label: v }))} selectedValue={project.ugcTopic || 'Sales & Conversion'} onSelect={(v) => updateProject({ ugcTopic: v as string })} />}</div><button onClick={() => setIsScriptModalOpen(true)} disabled={isLoading} className="h-12 px-6 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center justify-center gap-2 whitespace-nowrap w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"><SparklesIcon className="w-5 h-5" />Generate Concepts</button></div>
        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Key Messaging & Talking Points</label>
                <button onClick={handleSuggestScript} className="text-sm font-semibold text-brand-accent hover:underline flex items-center gap-1"><SparklesIcon className="w-3 h-3"/> Suggest</button>
            </div>
            <div className="w-full border border-gray-300 dark:border-gray-700 rounded-lg bg-[#131517] overflow-hidden transition-all focus-within:ring-2 focus-within:ring-[#C4C4C4] focus-within:border-[#C4C4C4] outline-none">
                {strategistInsight && (
                    <StrategistInsightBox insight={strategistInsight} onDismiss={() => setStrategistInsight(null)} />
                )}
                <RichScriptEditor 
                    value={project.ugcScript || ''} 
                    onChange={(val) => updateProject({ ugcScript: val })} 
                    placeholder={!isProductCentric ? "e.g., \n[HOOK]: Here are my top tips...\n[CONTENT]: Focus on consistency.\n[OUTRO]: Follow for more!" : "e.g., \n[HOOK]: Stop scrolling!\n[VALUE]: This product changes everything.\n[CTA]: Click the link below."} 
                />
            </div>
        </div>
        <div><div className="flex justify-between items-center mb-2"><label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Scene Description</label><button onClick={handleSuggestScene} className="text-sm font-semibold text-brand-accent hover:underline flex items-center gap-1"><SparklesIcon className="w-3 h-3"/> Suggest</button></div><textarea value={project.ugcSceneDescription || ''} onChange={(e) => updateProject({ ugcSceneDescription: e.target.value })} placeholder="e.g., A bright, modern kitchen with marble countertops..." className="w-full p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-[#131517] text-white input-focus-brand min-h-[6rem] resize-none placeholder-gray-500" /><div className="mt-3 flex flex-wrap gap-2">{Object.keys(currentQuickScenes).map(key => (<button key={key} onClick={() => updateProject({ ugcSceneDescription: currentQuickScenes[key] })} className="px-3 py-1.5 text-xs font-medium rounded-full border bg-gray-100 dark:bg-[#1C1E20] border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors">{key}</button>))}</div></div><div className="grid grid-cols-1 sm:grid-cols-3 gap-4"><GenericSelect label="Language" options={['English', 'Spanish', 'French', 'German', 'Japanese'].map(v => ({ value: v, label: v }))} selectedValue={project.ugcLanguage || 'English'} onSelect={(v) => updateProject({ ugcLanguage: v as string })} /><GenericSelect label="Accent" options={['American', 'British', 'Australian'].map(v => ({ value: v, label: v }))} selectedValue={project.ugcAccent || 'American'} onSelect={(v) => updateProject({ ugcAccent: v as string })} /><GenericSelect label="Emotion" options={['Auto', 'Happy', 'Excited', 'Serious', 'Calm'].map(v => ({ value: v, label: v }))} selectedValue={project.ugcEmotion || 'Auto'} onSelect={(v) => updateProject({ ugcEmotion: v as string })} /></div><ScriptGeneratorModal isOpen={isScriptModalOpen} onClose={() => setIsScriptModalOpen(false)} onSelect={(script, scene, action) => updateProject({ ugcScript: script, ugcSceneDescription: scene, ugcAction: action })} project={project} brandProfile={user?.brandProfile} /></div>
    );
};

const EcommerceVisualsStep: React.FC<{
    project: Project;
    updateProject: (u: Partial<Project>) => void;
    handleGenerate: () => Promise<void>;
    isLoading: boolean;
    cost: number;
    handleAvatarUpload: (file: UploadedFile) => Promise<boolean>;
    setError: (err: string | null) => void;
    error: string | null;
    generationError: any;
    setGenerationError: (err: any) => void;
    currentTemplate: Template | null;
    navigateTo: (step: any) => void;
}> = ({ project, updateProject, handleGenerate, isLoading, cost, handleAvatarUpload, setError, error, generationError, setGenerationError, currentTemplate, navigateTo }) => {
    const { setIsLoading, setGenerationStatusMessages, setLoadingTitle } = useUI();
    const [previews, setPreviews] = useState<UploadedFile[]>([]);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

    const handleGeneratePreviews = async () => {
        setIsLoading(true);
        setLoadingTitle("Creating Starting Frames...");
        setGenerationStatusMessages(FRAME_GENERATION_MESSAGES);
        try {
            const results = await generateUGCPreviews(project);
            setPreviews(results);
        } catch (e) {
            console.error(e);
            setError("Failed to generate preview frames.");
        } finally {
            setIsLoading(false);
            setGenerationStatusMessages([]);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="md:col-span-1 space-y-6">
                <div className="p-6 rounded-xl bg-transparent border border-gray-200 dark:border-gray-700 h-fit">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">Avatar Settings</h3>
                    <div className="space-y-4">
                        <div 
                            className="aspect-square w-full rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group"
                            onClick={() => setIsAvatarModalOpen(true)}
                        >
                            {project.ugcAvatarFile ? (
                                <AssetPreview asset={project.ugcAvatarFile} objectFit="cover" />
                            ) : (
                                <>
                                    <UserCircleIcon className="w-10 h-10 text-gray-400" />
                                    <span className="text-xs font-semibold text-gray-500 mt-2">Select Avatar</span>
                                </>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <PencilIcon className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        
                        <GenericSelect 
                            label="Avatar Source"
                            options={[
                                { value: 'ai', label: 'AI Generated' },
                                { value: 'upload', label: 'My Photo' },
                                { value: 'template', label: 'Template' }
                            ]}
                            selectedValue={project.ugcAvatarSource || 'ai'}
                            onSelect={(v) => updateProject({ ugcAvatarSource: v as any })}
                        />

                        {project.ugcAvatarSource === 'ai' && (
                            <textarea
                                value={project.ugcAvatarDescription || ''}
                                onChange={e => updateProject({ ugcAvatarDescription: e.target.value })}
                                placeholder="Describe the persona..."
                                className="w-full p-3 border rounded-lg bg-[#131517] text-white dark:border-gray-700 text-sm h-24 resize-none"
                            />
                        )}
                    </div>
                </div>
            </div>

            <div className="md:col-span-2 space-y-8">
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Choose your starting look</h3>
                        <button 
                            onClick={handleGeneratePreviews}
                            disabled={isLoading || !project.ugcScript}
                            className="text-sm font-bold text-brand-accent hover:underline flex items-center gap-1 disabled:opacity-50"
                        >
                            <ArrowPathIcon className="w-4 h-4" /> {previews.length > 0 ? 'Regenerate Options' : 'Generate Options'}
                        </button>
                    </div>

                    {previews.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {previews.map((frame) => (
                                <button 
                                    key={frame.id}
                                    onClick={() => updateProject({ startFrame: frame })}
                                    className={`relative aspect-[9/16] rounded-xl overflow-hidden border-4 transition-all ${project.startFrame?.id === frame.id ? 'border-brand-accent scale-[1.02]' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                >
                                    <AssetPreview asset={frame} objectFit="cover" />
                                    {project.startFrame?.id === frame.id && (
                                        <div className="absolute top-2 right-2 bg-brand-accent text-[#050C26] rounded-full p-0.5">
                                            <CheckIcon className="w-4 h-4" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="aspect-video w-full rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 flex flex-col items-center justify-center text-center p-8">
                             <ImageIcon className="w-12 h-12 text-gray-300 mb-4" />
                             <p className="text-gray-500 font-medium">Generate starting frames to see how your video will look</p>
                             <button 
                                onClick={handleGeneratePreviews}
                                disabled={isLoading}
                                className="mt-4 px-6 py-2 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors"
                             >
                                Generate Options
                             </button>
                        </div>
                    )}
                </div>

                {generationError ? (
                    <ErrorResolutionView 
                        error={generationError} 
                        onClear={() => setGenerationError(null)}
                        onRetry={handleGenerate}
                        onNavigateToPlans={() => navigateTo('PLAN_SELECT')}
                    />
                ) : (
                    <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
                            <ModelSelector 
                                type="video"
                                currentModel={project.videoModel}
                                onChange={(v) => updateProject({ videoModel: v })}
                            />
                            <GenericSelect label="Aspect Ratio" options={UGC_ASPECT_RATIOS} selectedValue={project.aspectRatio} onSelect={(v) => updateProject({ aspectRatio: v as any })} />
                            <button 
                                onClick={handleGenerate}
                                disabled={isLoading || !project.startFrame}
                                className="h-12 w-full bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-accent/10 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <><div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div> Generating...</>
                                ) : (
                                    <>Generate Video <SparklesIcon className="w-5 h-5" /> {cost}</>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            <AvatarDirectionModal 
                isOpen={isAvatarModalOpen} 
                onClose={() => setIsAvatarModalOpen(false)}
                onConfirm={() => setIsAvatarModalOpen(false)}
                onOpenTemplateModal={() => setIsAvatarModalOpen(false)}
                selectedDirection={project.ugcAvatarSource}
                avatarFile={project.ugcAvatarFile}
                onDirectionSelect={(d) => updateProject({ ugcAvatarSource: d })}
                onFileUpload={handleAvatarUpload}
                onFileRemove={() => updateProject({ ugcAvatarFile: null })}
            />
        </div>
    );
};

const TemplateSetupStep: React.FC<{
    project: Project;
    updateProject: (u: Partial<Project>) => void;
    isAnalyzing: boolean;
    handleUGCProductUpload: (file: UploadedFile) => Promise<void>;
    handleUGCProductScraped: (data: any) => void;
    setIsLoading: (loading: boolean) => void;
    setGenerationStatusMessages: (msgs: string[]) => void;
    setError: (err: string | null) => void;
    currentTemplate: Template | null;
}> = ({ project, updateProject, isAnalyzing, handleUGCProductUpload, handleUGCProductScraped, setIsLoading, setGenerationStatusMessages, setError, currentTemplate }) => {
    const isProductShowcase = project.ugcType === 'product_showcase';

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="p-8 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-bold mb-4">{currentTemplate?.title} Setup</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{currentTemplate?.description}</p>

                {isProductShowcase && (
                    <div className="space-y-6">
                        <ProductScraper 
                            onProductScraped={handleUGCProductScraped} 
                            setIsLoading={setIsLoading} 
                            setStatusMessages={setGenerationStatusMessages} 
                            setError={setError} 
                            initialUrl={project.websiteUrl || ''} 
                        />
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-300 dark:border-gray-600" /></div>
                            <div className="relative flex justify-center text-sm"><span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400 font-bold">OR</span></div>
                        </div>
                        <div>
                            <label className="block mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product Image</label>
                            {isAnalyzing ? (
                                <div className="w-48 h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                    <div className="w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : project.ugcProductFile ? (
                                <div className="relative w-48 h-48 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                    <AssetPreview asset={project.ugcProductFile} />
                                    <button onClick={() => updateProject({ ugcProductFile: null })} className="absolute -top-2 -right-2 z-10 bg-black text-white dark:bg-white dark:text-black rounded-full p-1 shadow-md">
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <Uploader onUpload={handleUGCProductUpload} />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const TemplateStoryStep: React.FC<{
    project: Project;
    updateProject: (u: Partial<Project>) => void;
    isLoading: boolean;
}> = ({ project, updateProject, isLoading }) => {
    return (
        <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-top-2 duration-300">
            <div>
                <label className="block mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Video Script</label>
                <div className="w-full border border-gray-300 dark:border-gray-700 rounded-lg bg-[#131517] overflow-hidden">
                    <RichScriptEditor 
                        value={project.ugcScript || ''} 
                        onChange={(val) => updateProject({ ugcScript: val })} 
                        placeholder="Write your script here..." 
                    />
                </div>
            </div>
        </div>
    );
};

const TemplateAvatarStep: React.FC<{
    project: Project;
    updateProject: (u: Partial<Project>) => void;
    handleAvatarUpload: (file: UploadedFile) => Promise<boolean>;
    onOpenTemplateModal: () => void;
}> = ({ project, updateProject, handleAvatarUpload, onOpenTemplateModal }) => {
    const [isDirectionModalOpen, setIsDirectionModalOpen] = useState(true);

    return (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
             <AvatarDirectionModal 
                isOpen={isDirectionModalOpen} 
                onClose={() => setIsDirectionModalOpen(false)}
                onConfirm={() => setIsDirectionModalOpen(false)}
                onOpenTemplateModal={onOpenTemplateModal}
                selectedDirection={project.ugcAvatarSource}
                avatarFile={project.ugcAvatarFile}
                onDirectionSelect={(d) => updateProject({ ugcAvatarSource: d })}
                onFileUpload={handleAvatarUpload}
                onFileRemove={() => updateProject({ ugcAvatarFile: null })}
            />
            <div className="p-8 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                 <UserCircleIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                 <h3 className="text-xl font-bold mb-2">Avatar configured</h3>
                 <p className="text-gray-500 mb-6">Source: {project.ugcAvatarSource || 'AI'}</p>
                 <button onClick={() => setIsDirectionModalOpen(true)} className="px-6 py-2 border border-brand-accent text-brand-accent font-bold rounded-lg hover:bg-brand-accent/5">Change Avatar</button>
            </div>
        </div>
    );
};

const TemplateProductionStep: React.FC<{
    project: Project;
    updateProject: (u: Partial<Project>) => void;
    handleGenerate: () => Promise<void>;
    isLoading: boolean;
    cost: number;
    generationError: any;
    setGenerationError: (err: any) => void;
    navigateTo: (step: any) => void;
}> = ({ project, updateProject, handleGenerate, isLoading, cost, generationError, setGenerationError, navigateTo }) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
            {generationError ? (
                <ErrorResolutionView 
                    error={generationError} 
                    onClear={() => setGenerationError(null)}
                    onRetry={handleGenerate}
                    onNavigateToPlans={() => navigateTo('PLAN_SELECT')}
                />
            ) : (
                <div className="p-8 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                        <ModelSelector 
                            type="video"
                            currentModel={project.videoModel}
                            onChange={(v) => updateProject({ videoModel: v })}
                        />
                        <GenericSelect label="Resolution" options={VIDEO_RESOLUTIONS} selectedValue={project.videoResolution || '720p'} onSelect={(v) => updateProject({ videoResolution: v as any })} />
                        <GenericSelect label="Aspect Ratio" options={UGC_ASPECT_RATIOS} selectedValue={project.aspectRatio} onSelect={(v) => updateProject({ aspectRatio: v as any })} />
                        <GenericSelect label="Duration" options={VIDEO_DURATIONS} selectedValue={project.videoDuration || 4} onSelect={(v) => updateProject({ videoDuration: v as any })} />
                    </div>
                    <button 
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-full py-4 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-accent/20"
                    >
                        {isLoading ? (
                            <><div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div> Generating Video...</>
                        ) : (
                            <>Start Production <SparklesIcon className="w-5 h-5" /> {cost}</>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

const CustomSetupStep: React.FC<{
    project: Project;
    updateProject: (u: Partial<Project>) => void;
    onOpenProductModal: () => void;
    onNext: () => void;
}> = ({ project, updateProject, onOpenProductModal, onNext }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [indicatorWidth, setIndicatorWidth] = useState(0);

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
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white text-left">Choose a video style</h3>
            
            <div className="relative group/carousel">
                <div 
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex overflow-x-auto pb-6 gap-4 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0"
                >
                    {UGC_STYLES.map((style) => (
                        <button
                            key={style.type}
                            onClick={() => {
                                updateProject({ ugcType: style.type as any });
                                if (style.type === 'product_showcase' || style.type === 'unboxing') {
                                    onOpenProductModal();
                                } else {
                                    onNext();
                                }
                            }}
                            disabled={style.comingSoon}
                            className={`group relative flex flex-col flex-shrink-0 w-40 md:w-48 snap-start focus:outline-none ${style.comingSoon ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div className={`relative overflow-hidden rounded-xl aspect-[9/16] w-full bg-gray-100 dark:bg-gray-800 transition-all duration-300 ${
                                project.ugcType === style.type ? 'ring-4 ring-brand-accent' : 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600'
                            }`}>
                                <img src={style.imageUrl} alt={style.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                {style.comingSoon && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded uppercase">Coming Soon</span>
                                    </div>
                                )}
                            </div>
                            <div className="mt-3 text-left">
                                <h4 className={`font-bold text-sm transition-colors ${project.ugcType === style.type ? 'text-brand-accent' : 'text-gray-900 dark:text-white'}`}>{style.title}</h4>
                                <p className="text-[10px] text-gray-500 mt-1">{style.description}</p>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Scroll Indicator */}
                <div className="relative h-1 bg-gray-200 dark:bg-[#2B2B2B] rounded-full w-full overflow-hidden mt-4">
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

const CustomAvatarStep: React.FC<{
    project: Project;
    updateProject: (u: Partial<Project>) => void;
    handleAvatarUpload: (file: UploadedFile) => Promise<boolean>;
    onOpenTemplateModal: () => void;
}> = ({ project, updateProject, handleAvatarUpload, onOpenTemplateModal }) => {
    const [isDirectionModalOpen, setIsDirectionModalOpen] = useState(true);

    return (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
             <AvatarDirectionModal 
                isOpen={isDirectionModalOpen} 
                onClose={() => setIsDirectionModalOpen(false)}
                onConfirm={() => setIsDirectionModalOpen(false)}
                onOpenTemplateModal={onOpenTemplateModal}
                selectedDirection={project.ugcAvatarSource}
                avatarFile={project.ugcAvatarFile}
                onDirectionSelect={(d) => updateProject({ ugcAvatarSource: d })}
                onFileUpload={handleAvatarUpload}
                onFileRemove={() => updateProject({ ugcAvatarFile: null })}
            />
            <div className="p-8 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                 <UserCircleIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                 <h3 className="text-xl font-bold mb-2">Avatar configured</h3>
                 <p className="text-gray-500 mb-6">Source: {project.ugcAvatarSource || 'AI'}</p>
                 <button onClick={() => setIsDirectionModalOpen(true)} className="px-6 py-2 border border-brand-accent text-brand-accent font-bold rounded-lg hover:bg-brand-accent/5">Change Avatar</button>
            </div>
        </div>
    );
};

const CustomProductionStep: React.FC<{
    project: Project;
    updateProject: (u: Partial<Project>) => void;
    handleGenerate: () => Promise<void>;
    isLoading: boolean;
    cost: number;
    generationError: any;
    setGenerationError: (err: any) => void;
    navigateTo: (step: any) => void;
}> = ({ project, updateProject, handleGenerate, isLoading, cost, generationError, setGenerationError, navigateTo }) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
             {generationError ? (
                <ErrorResolutionView 
                    error={generationError} 
                    onClear={() => setGenerationError(null)}
                    onRetry={handleGenerate}
                    onNavigateToPlans={() => navigateTo('PLAN_SELECT')}
                />
            ) : (
                <div className="p-8 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                        <ModelSelector 
                            type="video"
                            currentModel={project.videoModel}
                            onChange={(v) => updateProject({ videoModel: v })}
                        />
                        <GenericSelect label="Resolution" options={VIDEO_RESOLUTIONS} selectedValue={project.videoResolution || '720p'} onSelect={(v) => updateProject({ videoResolution: v as any })} />
                        <GenericSelect label="Aspect Ratio" options={UGC_ASPECT_RATIOS} selectedValue={project.aspectRatio} onSelect={(v) => updateProject({ aspectRatio: v as any })} />
                        <GenericSelect label="Duration" options={VIDEO_DURATIONS} selectedValue={project.videoDuration || 4} onSelect={(v) => updateProject({ videoDuration: v as any })} />
                    </div>
                    <button 
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-full py-4 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-accent/20"
                    >
                        {isLoading ? (
                            <><div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div> Producing Video...</>
                        ) : (
                            <>Generate Video <SparklesIcon className="w-5 h-5" /> {cost}</>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};
