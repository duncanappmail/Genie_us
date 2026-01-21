import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { GoogleGenAI, Modality, GenerateContentResponse } from '@google/genai';
import type { Project, UploadedFile, Template, CampaignBrief, PublishingPackage, Credits, TransitionStep, GenerationErrorType } from '../types';
import { CreativeMode } from '../types';
import * as dbService from '../services/dbService';
import * as geminiService from '../services/geminiService';
import { useAuth } from './AuthContext';
import { useUI } from './UIContext';
import { CREDIT_COSTS } from '../constants';
import { TEMPLATE_LIBRARY } from '../lib/templates';

type ProjectContextType = {
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    currentProject: Project | null;
    setCurrentProject: React.Dispatch<React.SetStateAction<Project | null>>;
    projectToDelete: Project | null;
    setProjectToDelete: (project: Project | null) => void;
    loadProjects: (userId: string) => Promise<void>;
    startNewProject: (mode: CreativeMode, initialData?: Partial<Project>) => void;
    handleGenerate: () => Promise<void>;
    handleRegenerate: (type: 'image' | 'video') => Promise<void>;
    handleAnimate: (imageIndex: number, prompt?: string) => Promise<void>;
    handleRefine: (imageIndex: number, refinePrompt: string) => Promise<void>;
    handleConfirmDelete: () => Promise<void>;
    handleConfirmExtend: (prompt: string) => Promise<void>;
    runAgent: () => Promise<void>;
    isRegenerating: 'image' | 'video' | null;
    isAnimating: number | null;
    isRefining: boolean;
    templateToApply: Template | null;
    selectTemplate: (template: Template, isEcommerce?: boolean) => void;
    confirmTemplateSelection: (aspectRatio: Project['aspectRatio']) => void;
    applyPendingTemplate: (project: Project) => void;
    handleAgentUrlRetrieval: (url: string) => Promise<void>;
    handleEcommerceProductConfirm: (data: { file: UploadedFile | null; url?: string; name?: string; description?: string }) => void;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const fileToUploadedFile = async (file: File | Blob, name: string): Promise<UploadedFile> => {
    const reader = new FileReader();
    const blob = file;
    return new Promise((resolve, reject) => {
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
            const result = reader.result as string;
             if (!result) {
                 reject(new Error("Failed to read file"));
                 return;
             }
            const base64 = result.split(',')[1];
            resolve({
                id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                base64,
                mimeType: file.type || 'application/octet-stream',
                name,
                blob,
            });
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
    });
};

const parseGenerationError = (err: any): { type: GenerationErrorType; message: string } => {
    const msg = err.message?.toLowerCase() || '';
    if (msg.includes('429') || msg.includes('quota') || msg.includes('limit') || msg.includes('exhausted')) {
        return { type: 'quota', message: "Your current plan's magic reserves are depleted. Upgrade for more wishes!" };
    }
    // Updated default message for failures to match user request style with extra guidance
    return { 
        type: msg.includes('safety') || msg.includes('candidate') || msg.includes('blocked') || msg.includes('policy') ? 'safety' : 'downtime', 
        message: "This may be due to the AI model’s content guidelines, or a temporary system issue. Please try again, revise the prompt, or try a different AI model." 
    };
};

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, deductCredits } = useAuth();
    const { 
        navigateTo, 
        setIsLoading, 
        setError, 
        setGenerationError,
        setIsExtendModalOpen,
        setGenerationStatusMessages,
        setAgentStatusMessages,
        setProductAdStep,
        setIsPlatformSelectorOpen,
        setIsProductUploadModalOpen,
        setProductUploadModalContext
    } = useUI();

    const [projects, setProjects] = useState<Project[]>([]);
    const [currentProject, setCurrentProject] = useState<Project | null>(null);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [isRegenerating, setIsRegenerating] = useState<'image' | 'video' | null>(null);
    const [isAnimating, setIsAnimating] = useState<number | null>(null);
    const [isRefining, setIsRefining] = useState(false);
    const [templateToApply, setTemplateToApply] = useState<Template | null>(null);

    const loadProjects = useCallback(async (userId: string) => {
        const userProjects = await dbService.getProjectsForUser(userId);
        setProjects(userProjects);
    }, []);

    const startNewProject = useCallback((mode: CreativeMode, initialData?: Partial<Project>) => {
        if (!user) return;
        
        setTemplateToApply(null);
        setProductAdStep(1);

        const newProject: Project = {
            id: `proj_${Date.now()}`,
            userId: user.email,
            createdAt: Date.now(),
            mode,
            prompt: '',
            productFile: null,
            productName: '',
            productDescription: '',
            campaignBrief: null,
            generatedImages: [],
            generatedVideos: [],
            aspectRatio: '9:16', 
            batchSize: 1,
            useCinematicQuality: false,
            negativePrompt: '',
            referenceFiles: [],
            publishingPackage: null,
            ugcScript: '',
            ugcAction: '',
            ugcTopic: 'Sales & Conversion',
            ugcVoice: 'Auto',
            ugcEmotion: 'Auto',
            ugcLanguage: 'English',
            ugcSceneDescription: '',
            ugcAvatarFile: null,
            ugcProductFile: null,
            imageModel: 'gemini-2.5-flash-image',
            videoModel: 'veo-3.1-fast-generate-preview',
            ...initialData
        };
        setCurrentProject(newProject);
        if (mode === 'AI Agent') {
            navigateTo('AGENT');
        } else if (mode === 'Create a UGC Video') {
            navigateTo('UGC_GENERATE');
        } else {
            if (!initialData?.aspectRatio && mode !== 'Character Swap') newProject.aspectRatio = '1:1';
            if (mode === 'Character Swap') newProject.aspectRatio = '9:16';
            navigateTo('GENERATE');
        }
    }, [user, navigateTo, setProductAdStep]);

    const selectTemplate = useCallback((template: Template, isEcommerce?: boolean) => {
        if (!user) return;
        
        setTemplateToApply(template);

        if (template.customUI === 'transition-builder' || template.customUI === 'bullet-time') {
            setProductUploadModalContext('person');
            setIsProductUploadModalOpen(true);
            return;
        } 
        
        setProductUploadModalContext('product');

        if (isEcommerce && template.type === 'video') {
            setIsProductUploadModalOpen(true);
            return;
        }

        if (template.category === 'UGC' || template.type === 'video') {
            setIsPlatformSelectorOpen(true);
            return;
        }

        setIsProductUploadModalOpen(true);

    }, [user, setIsPlatformSelectorOpen, setIsProductUploadModalOpen, setProductUploadModalContext]);

    const confirmTemplateSelection = useCallback((aspectRatio: Project['aspectRatio']) => {
        if (!user || !templateToApply) return;
        
        const template = templateToApply;
        startNewProject('Create a UGC Video', { aspectRatio });
        setTemplateToApply(template);
        setIsPlatformSelectorOpen(false);
    }, [user, templateToApply, startNewProject, setIsPlatformSelectorOpen]);

    const applyPendingTemplate = useCallback((project: Project) => {
        if (templateToApply) {
            const updates: Partial<Project> = {
                templateId: templateToApply.id
            };

            if (templateToApply.recommendedModel) {
                if (templateToApply.type === 'video') {
                    updates.videoModel = templateToApply.recommendedModel;
                } else {
                    updates.imageModel = templateToApply.recommendedModel;
                }
            }

            if (templateToApply.customUI === 'transition-builder') {
                if (!project.transitionSettings) {
                    updates.transitionSettings = [
                        { id: '1', look: '' },
                        { id: '2', look: '' }
                    ];
                }
            }

            if (templateToApply.category === 'UGC') {
                updates.ugcSceneDescription = templateToApply.sceneDescription;
                updates.ugcAvatarDescription = templateToApply.defaultAvatarDescription || project.ugcAvatarDescription;
                updates.mode = 'Create a UGC Video';
                
                setCurrentProject({
                    ...project,
                    ...updates
                });
            } else if (project.campaignBrief) {
                let prompt = templateToApply.promptTemplate;
                prompt = prompt.replace('{{PRODUCT_NAME}}', project.campaignBrief.productName);
                prompt = prompt.replace('{{BRAND_VIBE}}', project.campaignBrief.brandVibe);
                prompt = prompt.replace('{{TARGET_AUDIENCE}}', project.campaignBrief.targetAudience);
                updates.prompt = prompt;
                
                setCurrentProject({ ...project, ...updates });
            } else {
                 setCurrentProject({ ...project, ...updates });
            }
            setTemplateToApply(null);
        } else {
             setCurrentProject(project);
        }
    }, [templateToApply]);

    const handleEcommerceProductConfirm = useCallback((data: { file: UploadedFile | null; url?: string; name?: string; description?: string }) => {
        if (!user || !templateToApply) return;
        
        const template = templateToApply;
        
        if (template.customUI === 'transition-builder' || template.customUI === 'bullet-time') {
            const initialData: Partial<Project> = {
                productFile: data.file,
                productName: data.name,
                productDescription: data.description,
                websiteUrl: data.url,
                templateId: template.id,
                transitionSettings: template.customUI === 'transition-builder' ? [
                    { id: '1', look: '' },
                    { id: '2', look: '' }
                ] : undefined,
                videoModel: template.recommendedModel || 'veo-3.1-generate-preview',
                aspectRatio: '9:16'
            };
            
            startNewProject('Product Ad', initialData);
            setProductAdStep(2); 
            setTemplateToApply(null); 
            
        } else if (template.type === 'video' || template.category === 'UGC') {
            startNewProject('Create a UGC Video', {
                aspectRatio: '9:16',
                ugcType: 'product_showcase',
                ugcProductFile: data.file,
                productFile: data.file,
                productName: data.name || '',
                productDescription: data.description || '',
                websiteUrl: data.url,
                isEcommerce: true
            });
            setTemplateToApply(template);
        } else {
            const tempBrief: CampaignBrief = {
                productName: data.name || 'Product',
                productDescription: data.description || '',
                targetAudience: 'General Audience',
                brandVibe: 'Modern',
                keySellingPoints: []
            };

            let prompt = template.promptTemplate;
            prompt = prompt.replace('{{PRODUCT_NAME}}', tempBrief.productName);
            prompt = prompt.replace('{{BRAND_VIBE}}', tempBrief.brandVibe);
            prompt = prompt.replace('{{TARGET_AUDIENCE}}', tempBrief.targetAudience);

            const initialData: Partial<Project> = {
                productFile: data.file,
                productName: data.name,
                productDescription: data.description,
                websiteUrl: data.url,
                adStyle: 'Creative Placement',
                templateId: template.id,
                prompt: prompt,
                campaignBrief: tempBrief,
                imageModel: template.recommendedModel || 'gemini-2.5-flash-image'
            };

            startNewProject('Product Ad', initialData);
            setProductAdStep(2);
            setTemplateToApply(null);
        }
        
        setIsProductUploadModalOpen(false);
    }, [user, templateToApply, startNewProject, setIsPlatformSelectorOpen, setIsProductUploadModalOpen, setProductAdStep]);

    const handleGenerate = useCallback(async () => {
        if (!currentProject || !user || !user.credits) return;

        let cost = 0;
        let category: keyof Credits = 'image';

        if (currentProject.mode === 'Character Swap') {
            cost = currentProject.videoModel === 'veo-3.1-generate-preview' 
                ? CREDIT_COSTS.base.characterSwapCinematic 
                : CREDIT_COSTS.base.characterSwapFast;
            category = 'video';
        } else {
            cost = {
                'Product Ad': CREDIT_COSTS.base.productAd * currentProject.batchSize,
                'Art Maker': CREDIT_COSTS.base.artMaker * currentProject.batchSize,
                'Video Maker': currentProject.useCinematicQuality ? CREDIT_COSTS.base.videoCinematic : CREDIT_COSTS.base.videoFast,
                'Create a UGC Video': currentProject.videoModel === 'veo-3.1-generate-preview' ? CREDIT_COSTS.base.ugcVideoCinematic : CREDIT_COSTS.base.ugcVideoFast,
                'AI Agent': CREDIT_COSTS.base.agent,
            }[currentProject.mode] || 0;

            if (['Video Maker', 'Create a UGC Video'].includes(currentProject.mode) || (currentProject.mode === 'Product Ad' && currentProject.templateId && currentProject.videoModel)) category = 'video';
            if (currentProject.mode === 'AI Agent') category = 'strategy';
        }

        if (user.credits[category].current < cost) {
            setError(`Not enough ${category} credits.`);
            return;
        }

        setIsLoading(true);
        setGenerationStatusMessages([]);
        setError(null);
        setGenerationError(null);

        try {
            deductCredits(cost, category);
            let updatedProject = { ...currentProject };
            
            const addMsg = (msg: string, isDone = false) => setGenerationStatusMessages(prev => {
                if (isDone) return prev; 
                return [...prev, msg];
            });

            addMsg("Preparing your vision...");
            await new Promise(res => setTimeout(res, 300));
            addMsg("Preparing your vision...", true);
            addMsg("Conjuring your assets...");

            if (currentProject.mode === 'Character Swap') {
                if (!currentProject.sourceVideo || !currentProject.productFile) {
                    throw new Error("Source video and character reference are required.");
                }
                
                const swapPrompt = `
                    TASK: Character Swap.
                    REFERENCE VIDEO: Use the attached video for motion, lighting, and environmental context.
                    REFERENCE CHARACTER: Replace the main subject/character in the video with the person shown in the reference image.
                    REQUIREMENTS: 
                    - Maintain exact motion and timing from the source video.
                    - Seamlessly blend the new character identity into the scene.
                    - Retain high fidelity, cinematic lighting, and 9:16 aspect ratio.
                    - Identity should match facial features and build of the reference image.
                `;
                
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                let operation = await geminiService.withRetry<any>(() => ai.models.generateVideos({
                    model: currentProject.videoModel || 'veo-3.1-fast-generate-preview',
                    prompt: swapPrompt,
                    video: {
                        uri: URL.createObjectURL(currentProject.sourceVideo!.blob)
                    },
                    image: {
                        imageBytes: currentProject.productFile!.base64!,
                        mimeType: currentProject.productFile!.mimeType
                    },
                    config: {
                        numberOfVideos: 1,
                        resolution: currentProject.videoResolution || '720p',
                        aspectRatio: currentProject.aspectRatio,
                    }
                }));

                while (!operation.done) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    operation = await geminiService.withRetry<any>(() => ai.operations.getVideosOperation({ operation: operation }));
                }

                const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
                if (!videoUri) throw new Error("Video swap failed.");

                const videoRes = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
                const videoBlob = await videoRes.blob();
                
                updatedProject.generatedVideos = [...updatedProject.generatedVideos, {
                    id: `swap_${Date.now()}`,
                    name: 'character_swap.mp4',
                    mimeType: 'video/mp4',
                    blob: videoBlob
                }];

            } else if (currentProject.mode === 'Create a UGC Video') {
                const newVideo = await geminiService.generateUGCVideo(currentProject);
                updatedProject.generatedVideos = [...updatedProject.generatedVideos, newVideo];
            } else if (currentProject.mode === 'Video Maker' || (currentProject.templateId && TEMPLATE_LIBRARY.find(t => t.id === currentProject.templateId)?.type === 'video')) {
                 await new Promise(res => setTimeout(res, 3000));
                 const newVideo: UploadedFile = { id: `file_${Date.now()}`, mimeType: 'video/mp4', name: 'video.mp4', blob: new Blob() };
                 updatedProject.generatedVideos = [...updatedProject.generatedVideos, newVideo];
            } else { 
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                let newImages: UploadedFile[] = [];
                
                let finalPrompt = currentProject.prompt;
                if (!finalPrompt) {
                    if (currentProject.productName) finalPrompt = `A professional product shot of ${currentProject.productName}`;
                    else finalPrompt = "A high quality product advertisement";
                }

                const isImagen = (currentProject.imageModel || '').includes('imagen');

                if (currentProject.productFile && currentProject.productFile.base64) {
                    let model = currentProject.imageModel || 'gemini-2.5-flash-image';
                    if (isImagen) model = 'gemini-3-pro-image-preview';
                    const imagePart = { inlineData: { data: currentProject.productFile.base64, mimeType: currentProject.productFile.mimeType } };
                    const textPart = { text: finalPrompt };
                    for (let i = 0; i < currentProject.batchSize; i++) {
                        const response = await geminiService.withRetry<GenerateContentResponse>(() => ai.models.generateContent({
                            model: model,
                            contents: { parts: [imagePart, textPart] },
                            config: { responseModalities: [Modality.IMAGE] },
                        }));
                        if (response.candidates?.[0]?.content?.parts) {
                            for (const part of response.candidates[0].content.parts) {
                                if (part.inlineData) {
                                    const blob = await (await fetch(`data:image/png;base64,${part.inlineData.data}`)).blob();
                                    newImages.push(await fileToUploadedFile(blob, `generated_image_${i}.png`));
                                }
                            }
                        }
                    }
                } else {
                    if (isImagen) {
                        const response = await geminiService.withRetry<any>(() => ai.models.generateImages({
                            model: currentProject.imageModel || 'imagen-4.0-generate-001',
                            prompt: finalPrompt,
                            config: { numberOfImages: currentProject.batchSize, aspectRatio: currentProject.aspectRatio },
                        }));
                        if (response.generatedImages) {
                            newImages = await Promise.all(
                                response.generatedImages.map(async (img: any) => {
                                    const blob = await (await fetch(`data:image/png;base64,${img.image.imageBytes}`)).blob();
                                    return fileToUploadedFile(blob, 'generated_image.png');
                                })
                            );
                        }
                    } else {
                        const textPart = { text: finalPrompt };
                        for (let i = 0; i < currentProject.batchSize; i++) {
                            const response = await geminiService.withRetry<GenerateContentResponse>(() => ai.models.generateContent({
                                model: currentProject.imageModel || 'gemini-2.5-flash-image',
                                contents: { parts: [textPart] },
                                config: { responseModalities: [Modality.IMAGE] },
                            }));
                            if (response.candidates?.[0]?.content?.parts) {
                                for (const part of response.candidates[0].content.parts) {
                                    if (part.inlineData) {
                                        const blob = await (await fetch(`data:image/png;base64,${part.inlineData.data}`)).blob();
                                        newImages.push(await fileToUploadedFile(blob, `generated_image_${i}.png`));
                                    }
                                }
                            }
                        }
                    }
                }
                
                if (newImages.length === 0) throw new Error("This may be due to the AI model’s content guidelines, or a temporary system issue. Please try again, revise the prompt, or try a different AI model.");
                updatedProject.generatedImages = [...updatedProject.generatedImages, ...newImages];
                updatedProject.prompt = finalPrompt;
            }
            
            addMsg("Conjuring your assets...", true);
            
            let briefForCopy: CampaignBrief | null = updatedProject.campaignBrief;
            const promptForCopy = updatedProject.prompt || updatedProject.ugcScript || (currentProject.mode === 'Character Swap' ? "A creative character swap video" : "A creative visual");
            if (!briefForCopy && promptForCopy) {
                briefForCopy = {
                    productName: updatedProject.productName || updatedProject.mode,
                    productDescription: promptForCopy,
                    targetAudience: 'a general audience',
                    keySellingPoints: ['visually stunning', 'creative', 'unique'],
                    brandVibe: 'modern',
                };
                updatedProject.campaignBrief = briefForCopy;
            }
            
            if (briefForCopy) {
                addMsg("Writing social media copy...");
                try {
                    const pkg = await geminiService.generatePublishingPackage(briefForCopy, promptForCopy, updatedProject.highLevelGoal);
                    updatedProject.publishingPackage = pkg;
                    addMsg("Writing social media copy...", true);
                } catch (copyError) {
                    addMsg("Writing social media copy...", true);
                }
            }
            
            setCurrentProject(updatedProject);
            await dbService.saveProject(updatedProject);
            if (user) await loadProjects(user.email);
            navigateTo('PREVIEW');

        } catch (e: any) {
            console.error(e);
            setGenerationError(parseGenerationError(e));
        } finally {
            setIsLoading(false);
            setGenerationStatusMessages([]);
        }

    }, [currentProject, user, navigateTo, deductCredits, setIsLoading, setGenerationStatusMessages, setError, setGenerationError, loadProjects]);

    const handleRegenerate = useCallback(async (type: 'image' | 'video') => {
         if (!currentProject || !user || !user.credits) return;
         const cost = currentProject.mode === 'Product Ad' ? CREDIT_COSTS.base.productAd : CREDIT_COSTS.base.artMaker;
         const creditCategory: keyof Credits = type === 'image' ? 'image' : 'video';

         if (user.credits[creditCategory].current < cost) {
            setError(`Not enough ${creditCategory} credits.`);
            return;
        }

        setIsRegenerating(type);
        setError(null);
        setGenerationError(null);

        try {
            deductCredits(cost, creditCategory);
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            let newImage: UploadedFile | null = null;
            const isImagen = (currentProject.imageModel || '').includes('imagen');

            if (currentProject.productFile && currentProject.productFile.base64) {
                 let model = currentProject.imageModel || 'gemini-2.5-flash-image';
                 if (isImagen) model = 'gemini-3-pro-image-preview';
                 const imagePart = { inlineData: { data: currentProject.productFile.base64, mimeType: currentProject.productFile.mimeType } };
                const textPart = { text: currentProject.prompt };
                const response = await geminiService.withRetry<GenerateContentResponse>(() => ai.models.generateContent({
                    model: model,
                    contents: { parts: [imagePart, textPart] },
                    config: { responseModalities: [Modality.IMAGE] },
                }));
                if (response.candidates?.[0]?.content?.parts) {
                    for (const part of response.candidates[0].content.parts) {
                        if (part.inlineData) {
                            const blob = await (await fetch(`data:image/png;base64,${part.inlineData.data}`)).blob();
                            newImage = await fileToUploadedFile(blob, `regenerated_image.png`);
                            break;
                        }
                    }
                }
            } else {
                if (isImagen) {
                     const response = await geminiService.withRetry<any>(() => ai.models.generateImages({
                        model: currentProject.imageModel || 'imagen-4.0-generate-001',
                        prompt: currentProject.prompt,
                        config: { numberOfImages: 1, aspectRatio: currentProject.aspectRatio }
                    }));
                    const img = response.generatedImages[0];
                    const base64 = img.image.imageBytes;
                    const blob = await(await fetch(`data:image/png;base64,${base64}`)).blob();
                    newImage = await fileToUploadedFile(blob, 'regenerated_image.png');
                } else {
                    const textPart = { text: currentProject.prompt };
                    const response = await geminiService.withRetry<GenerateContentResponse>(() => ai.models.generateContent({
                        model: currentProject.imageModel || 'gemini-2.5-flash-image',
                        contents: { parts: [textPart] },
                        config: { responseModalities: [Modality.IMAGE] },
                    }));
                    if (response.candidates?.[0]?.content?.parts) {
                        for (const part of response.candidates[0].content.parts) {
                            if (part.inlineData) {
                                const blob = await (await fetch(`data:image/png;base64,${part.inlineData.data}`)).blob();
                                newImage = await fileToUploadedFile(blob, `regenerated_image.png`);
                                break;
                            }
                        }
                    }
                }
            }

             if (newImage) {
                const updatedProject = {
                    ...currentProject,
                    generatedImages: [...currentProject.generatedImages, newImage]
                };
                setCurrentProject(updatedProject);
                await dbService.saveProject(updatedProject);
                if (user) await loadProjects(user.email);
            }
        } catch (e: any) {
            setGenerationError(parseGenerationError(e));
        } finally {
            setIsRegenerating(null);
        }

    }, [currentProject, user, deductCredits, setError, setGenerationError, loadProjects]);

    const handleAnimate = useCallback(async (imageIndex: number, prompt?: string) => { 
        if (!user || !user.credits) return;
        const cost = CREDIT_COSTS.base.animate;
        if (user.credits.video.current < cost) {
            setError("Not enough video credits.");
            return;
        }
        setGenerationError(null);
        try {
            deductCredits(cost, 'video');
        } catch (e) {
            setGenerationError(parseGenerationError(e));
        }
    }, [user, deductCredits, setError, setGenerationError]);
    
    const handleRefine = useCallback(async (imageIndex: number, refinePrompt: string) => { 
        if (!user || !user.credits) return;
        const cost = CREDIT_COSTS.base.refine;
        if (user.credits.image.current < cost) {
            setError("Not enough image credits.");
            return;
        }
        setGenerationError(null);
        try {
            deductCredits(cost, 'image');
        } catch (e) {
            setGenerationError(parseGenerationError(e));
        }
    }, [user, deductCredits, setError, setGenerationError]);

    const handleConfirmDelete = useCallback(async () => {
        if (projectToDelete && user) {
            await dbService.deleteProject(projectToDelete.id);
            setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
            setProjectToDelete(null);
            if (currentProject?.id === projectToDelete.id) {
                setCurrentProject(null);
                navigateTo('HOME');
            }
        }
    }, [projectToDelete, user, currentProject, navigateTo]);

    const handleConfirmExtend = useCallback(async (prompt: string) => {
        if (!currentProject || !user || !user.credits) return;
        const cost = CREDIT_COSTS.base.videoExtend;
        if (user.credits.video.current < cost) {
            setError("Not enough video credits.");
            return;
        }
        
        setIsLoading(true);
        setIsExtendModalOpen(false);
        setGenerationError(null);
        try {
            deductCredits(cost, 'video');
            await new Promise(res => setTimeout(res, 3000));
             const newVideo: UploadedFile = {
                 id: `file_${Date.now()}`,
                 mimeType: 'video/mp4',
                 name: 'extended_video.mp4',
                 blob: new Blob([]), 
            };
            const updatedProject = { ...currentProject, generatedVideos: [...currentProject.generatedVideos, newVideo], prompt: '' };
            setCurrentProject(updatedProject);
            await dbService.saveProject(updatedProject);
            if (user) await loadProjects(user.email);
            navigateTo('PREVIEW');
        } catch (e: any) {
             setGenerationError(parseGenerationError(e));
        } finally {
            setIsLoading(false);
        }
    }, [currentProject, user, deductCredits, setError, setGenerationError, setIsLoading, setIsExtendModalOpen, loadProjects, navigateTo]);

    const runAgent = useCallback(async () => {
         if (!currentProject || !user || !user.credits || !currentProject.productFile) return;
        const cost = CREDIT_COSTS.base.agent;
        if (user.credits.strategy.current < cost) {
            setError("Not enough AI Strategy credits.");
            return;
        }
        
        setIsLoading(true);
        setAgentStatusMessages([]);
        setGenerationError(null);
        
        try {
            deductCredits(cost, 'strategy');
            const addMsg = (msg: string, isDone = false) => setAgentStatusMessages(prev => {
                 if (isDone) {
                    const newMsgs = [...prev];
                    const lastMsg = newMsgs.pop();
                    if (lastMsg) return [...newMsgs, { ...lastMsg, type: 'done' }];
                    return newMsgs;
                }
                return [...prev, { type: 'action', content: msg }];
            });
            addMsg("Analyzing product image...");
            const brief = await geminiService.generateCampaignBrief(currentProject.productFile);
            addMsg("Analyzing product image...", true);
            addMsg("Brainstorming campaign concepts...");
            const inspirations = await geminiService.generateCampaignInspiration(brief, currentProject.highLevelGoal);
            const inspiration = inspirations[0];
            addMsg("Brainstorming campaign concepts...", true);
            addMsg("Generating asset...");
            const finalPrompt = await geminiService.elaborateArtDirection(inspiration.artDirection, brief);
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const imagePart = { inlineData: { data: currentProject.productFile.base64!, mimeType: currentProject.productFile.mimeType } };
            const textPart = { text: finalPrompt };
            const imageResponse = await geminiService.withRetry<GenerateContentResponse>(() => ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [imagePart, textPart] },
                config: { responseModalities: [Modality.IMAGE] },
            }));
            let base64 = '';
             if (imageResponse.candidates?.[0]?.content?.parts) {
                for (const part of imageResponse.candidates[0].content.parts) {
                    if (part.inlineData) {
                        base64 = part.inlineData.data;
                        break;
                    }
                }
            }
            if (!base64) throw new Error("AI Agent failed to generate visual.");
            const blob = await (await fetch(`data:image/jpeg;base64,${base64}`)).blob();
            const finalImage = await fileToUploadedFile(blob, 'agent_image.jpg');
            addMsg("Generating asset...", true);
            addMsg("Writing social media copy...");
            const pkg: PublishingPackage = await geminiService.generatePublishingPackage(brief, finalPrompt, currentProject.highLevelGoal);
            addMsg("Writing social media copy...", true);
            const updatedProject: Project = {
                ...currentProject,
                prompt: finalPrompt,
                productName: brief.productName,
                productDescription: brief.productDescription,
                campaignBrief: brief,
                generatedImages: [finalImage],
                publishingPackage: pkg,
                campaignInspiration: inspiration,
                campaignStrategy: inspiration.strategy,
            };
            setCurrentProject(updatedProject);
            await dbService.saveProject(updatedProject);
            await loadProjects(user.email);
            navigateTo('AGENT_RESULT');
        } catch (e: any) {
             setGenerationError(parseGenerationError(e));
        } finally {
            setIsLoading(false);
            setAgentStatusMessages([]);
        }
    }, [currentProject, user, deductCredits, setError, setGenerationError, setIsLoading, setAgentStatusMessages, loadProjects, navigateTo]);

    const handleAgentUrlRetrieval = useCallback(async (url: string) => {
        if (!user) return;
        setIsLoading(true);
        setError(null);
        setGenerationError(null);
        try {
            const products = await geminiService.scrapeProductDetailsFromUrl(url);
            if (products.length === 0) throw new Error("No products found.");
            const product = products[0];
            let productFile: UploadedFile | null = null;
            if (product.imageUrl) productFile = await geminiService.fetchScrapedProductImage(product.imageUrl, url, product.productName);
            const minimalBrief: CampaignBrief = { productName: product.productName, productDescription: product.productDescription, targetAudience: '', keySellingPoints: [], brandVibe: 'Neutral' };
            const newProject: Project = {
                id: `proj_${Date.now()}`,
                userId: user.email,
                createdAt: Date.now(),
                mode: 'AI Agent',
                prompt: '',
                productFile: productFile,
                productName: product.productName,
                productDescription: product.productDescription,
                websiteUrl: url,
                campaignBrief: minimalBrief,
                generatedImages: [],
                generatedVideos: [],
                aspectRatio: '1:1',
                batchSize: 1,
                useCinematicQuality: false,
                negativePrompt: '',
                referenceFiles: [],
            };
            setCurrentProject(newProject);
            navigateTo('AGENT_SETUP_PRODUCT');
        } catch (e: any) {
            setGenerationError(parseGenerationError(e));
        } finally {
            setIsLoading(false);
        }
    }, [user, setIsLoading, setError, setGenerationError, navigateTo]);

    const value: ProjectContextType = {
        projects, setProjects, currentProject, setCurrentProject, projectToDelete, setProjectToDelete,
        loadProjects, startNewProject, handleGenerate, handleRegenerate, handleAnimate, handleRefine,
        handleConfirmDelete, handleConfirmExtend, runAgent,
        isRegenerating, isAnimating, isRefining,
        templateToApply, selectTemplate, confirmTemplateSelection, applyPendingTemplate, handleAgentUrlRetrieval,
        handleEcommerceProductConfirm
    };

    return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

export const useProjects = () => {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProjects must be used within a ProjectProvider');
    }
    return context;
};