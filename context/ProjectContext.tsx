
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import type { Project, UploadedFile, Template, CampaignBrief, PublishingPackage, Credits } from '../types';
import { CreativeMode } from '../types';
import * as dbService from '../services/dbService';
import * as geminiService from '../services/geminiService';
import { useAuth } from './AuthContext';
import { useUI } from './UIContext';
import { CREDIT_COSTS } from '../constants';

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

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, deductCredits } = useAuth();
    const { 
        navigateTo, 
        setIsLoading, 
        setError, 
        setIsExtendModalOpen,
        setGenerationStatusMessages,
        setAgentStatusMessages,
        setProductAdStep,
        setIsPlatformSelectorOpen,
        setIsProductUploadModalOpen
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
        
        // Clear any lingering template state when starting fresh
        setTemplateToApply(null);
        
        // Reset the wizard step for Product Ad flow
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
            aspectRatio: '9:16', // Default for UGC
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
            // Set default models
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
            if (!initialData?.aspectRatio) newProject.aspectRatio = '1:1';
            navigateTo('GENERATE');
        }
    }, [user, navigateTo, setProductAdStep]);

    const selectTemplate = useCallback((template: Template, isEcommerce: boolean = false) => {
        if (!user) return;
        
        // Store template for later application
        setTemplateToApply(template);

        // If it's an E-commerce template AND it's a video template, use the specialized E-commerce flow (Product Upload Modal first)
        if (isEcommerce && template.type === 'video') {
            setIsProductUploadModalOpen(true);
            return;
        }

        // If it's a UGC/Video template (standard flow), open the platform selector first
        if (template.category === 'UGC' || template.type === 'video') {
            setIsPlatformSelectorOpen(true);
            return;
        }

        // Image Flow (Product Ad): Used for image templates (standard or e-commerce section)
        // We do NOT start the project here anymore. We just open the modal.
        // The project will be started in handleEcommerceProductConfirm or after user interaction.
        setIsProductUploadModalOpen(true);

    }, [user, setIsPlatformSelectorOpen, setIsProductUploadModalOpen]);

    const confirmTemplateSelection = useCallback((aspectRatio: Project['aspectRatio']) => {
        if (!user || !templateToApply) return;
        
        const template = templateToApply;
        // Start the project with the selected aspect ratio
        startNewProject('Create a UGC Video', { aspectRatio });
        // Restore template so applyPendingTemplate can run
        setTemplateToApply(template);
        setIsPlatformSelectorOpen(false);
    }, [user, templateToApply, startNewProject, setIsPlatformSelectorOpen]);

    const applyPendingTemplate = useCallback((project: Project) => {
        if (templateToApply) {
            const updates: Partial<Project> = {
                templateId: templateToApply.id
            };

            // Apply recommended model
            if (templateToApply.recommendedModel) {
                if (templateToApply.type === 'video') {
                    updates.videoModel = templateToApply.recommendedModel;
                } else {
                    updates.imageModel = templateToApply.recommendedModel;
                }
            }

            if (templateToApply.category === 'UGC') {
                // For UGC, we can apply immediately as it doesn't depend on a brief scan
                updates.ugcSceneDescription = templateToApply.sceneDescription;
                updates.ugcAvatarDescription = templateToApply.defaultAvatarDescription || project.ugcAvatarDescription;
                updates.mode = 'Create a UGC Video';
                
                setCurrentProject({
                    ...project,
                    ...updates
                });
            } else if (project.campaignBrief) {
                // For Image templates, we need the brief to fill placeholders
                let prompt = templateToApply.promptTemplate;
                prompt = prompt.replace('{{PRODUCT_NAME}}', project.campaignBrief.productName);
                prompt = prompt.replace('{{BRAND_VIBE}}', project.campaignBrief.brandVibe);
                prompt = prompt.replace('{{TARGET_AUDIENCE}}', project.campaignBrief.targetAudience);
                updates.prompt = prompt;
                
                setCurrentProject({ ...project, ...updates });
            } else {
                // Fallback
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
        
        if (template.type === 'video' || template.category === 'UGC') {
             // Existing UGC E-com logic
            startNewProject('Create a UGC Video', {
                aspectRatio: '9:16', // Default for UGC E-com
                ugcType: 'product_showcase', // Default to selling product
                ugcProductFile: data.file,
                productFile: data.file, // Also set main product file
                productName: data.name || '',
                productDescription: data.description || '',
                websiteUrl: data.url,
                isEcommerce: true // Flag to trigger 2-step flow
            });
            setTemplateToApply(template);
        } else {
            // Logic for Image Templates (Product Ad)
            
            // Construct a temporary brief if we have enough info to fill placeholders
            const tempBrief: CampaignBrief = {
                productName: data.name || 'Product',
                productDescription: data.description || '',
                targetAudience: 'General Audience', // Fallback
                brandVibe: 'Modern', // Fallback
                keySellingPoints: []
            };

            // Pre-calculate prompt filling placeholders with what we have
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
                prompt: prompt, // Set the pre-filled prompt
                campaignBrief: tempBrief, // Set brief so we don't think we're missing data
                // Apply recommended model from template if available
                imageModel: template.recommendedModel || 'gemini-2.5-flash-image'
            };

            // Start the project directly with this data. 
            // This will navigate to GENERATE screen.
            startNewProject('Product Ad', initialData);
            
            // Skip the "Choose Ad Style" step and go straight to Generator (Results View)
            setProductAdStep(2);
            
            // Clear template to apply since we manually applied it above
            setTemplateToApply(null);
        }
        
        setIsProductUploadModalOpen(false);
    }, [user, templateToApply, startNewProject, setIsProductUploadModalOpen, setProductAdStep]);

    const handleGenerate = useCallback(async () => {
        if (!currentProject || !user || !user.credits) return;

        const cost = {
            'Product Ad': CREDIT_COSTS.base.productAd * currentProject.batchSize,
            'Art Maker': CREDIT_COSTS.base.artMaker * currentProject.batchSize,
            'Video Maker': currentProject.useCinematicQuality ? CREDIT_COSTS.base.videoCinematic : CREDIT_COSTS.base.videoFast,
            'Create a UGC Video': currentProject.videoModel === 'veo-3.1-generate-preview' ? CREDIT_COSTS.base.ugcVideoCinematic : CREDIT_COSTS.base.ugcVideoFast,
            'AI Agent': CREDIT_COSTS.base.agent,
        }[currentProject.mode];

        let category: keyof Credits = 'image';
        if (['Video Maker', 'Create a UGC Video'].includes(currentProject.mode)) category = 'video';
        if (currentProject.mode === 'AI Agent') category = 'strategy';

        if (user.credits[category].current < cost) {
            setError(`Not enough ${category} credits.`);
            return;
        }

        setIsLoading(true);
        setGenerationStatusMessages([]);
        setError(null);

        try {
            deductCredits(cost, category);
            let updatedProject = { ...currentProject };
            
            const addMsg = (msg: string, isDone = false) => setGenerationStatusMessages(prev => {
                if (isDone) {
                    return prev; 
                }
                return [...prev, msg];
            });

            addMsg("Preparing your vision...");
            await new Promise(res => setTimeout(res, 300));
            addMsg("Preparing your vision...", true);
            addMsg("Conjuring your assets...");

            if (currentProject.mode === 'Create a UGC Video') {
                const newVideo = await geminiService.generateUGCVideo(currentProject);
                updatedProject.generatedVideos = [...updatedProject.generatedVideos, newVideo];
            } else if (currentProject.mode === 'Video Maker') {
                 // Mock Video Maker for now until fully implemented with Veo
                 await new Promise(res => setTimeout(res, 3000));
                 const newVideo: UploadedFile = { id: `file_${Date.now()}`, mimeType: 'video/mp4', name: 'video.mp4', blob: new Blob() };
                 updatedProject.generatedVideos = [...updatedProject.generatedVideos, newVideo];
            } else { // Art Maker or Product Ad (Image)
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                let newImages: UploadedFile[] = [];
                
                // Fallback prompt logic
                let finalPrompt = currentProject.prompt;
                if (!finalPrompt) {
                    if (currentProject.productName) {
                        finalPrompt = `A professional product shot of ${currentProject.productName}`;
                    } else {
                        finalPrompt = "A high quality product advertisement";
                    }
                }

                const isImagen = (currentProject.imageModel || '').includes('imagen');

                if (currentProject.productFile && currentProject.productFile.base64) {
                    // Has Product File (Image-to-Image / Editing)
                    // Imagen doesn't support this via generateContent. Force Gemini if needed.
                    let model = currentProject.imageModel || 'gemini-2.5-flash-image';
                    if (isImagen) model = 'gemini-3-pro-image-preview';

                    const imagePart = { inlineData: { data: currentProject.productFile.base64, mimeType: currentProject.productFile.mimeType } };
                    const textPart = { text: finalPrompt };

                    for (let i = 0; i < currentProject.batchSize; i++) {
                        const response = await ai.models.generateContent({
                            model: model,
                            contents: { parts: [imagePart, textPart] },
                            config: { responseModalities: [Modality.IMAGE] },
                        });
                        
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
                    // Text-to-Image
                    if (isImagen) {
                        const response = await ai.models.generateImages({
                            model: currentProject.imageModel || 'imagen-4.0-generate-001',
                            prompt: finalPrompt,
                            config: { numberOfImages: currentProject.batchSize, aspectRatio: currentProject.aspectRatio },
                        });
                        if (response.generatedImages) {
                            newImages = await Promise.all(
                                response.generatedImages.map(async (img) => {
                                    const blob = await (await fetch(`data:image/png;base64,${img.image.imageBytes}`)).blob();
                                    return fileToUploadedFile(blob, 'generated_image.png');
                                })
                            );
                        }
                    } else {
                        // Use Gemini for Text-to-Image
                        const textPart = { text: finalPrompt };
                        for (let i = 0; i < currentProject.batchSize; i++) {
                            const response = await ai.models.generateContent({
                                model: currentProject.imageModel || 'gemini-2.5-flash-image',
                                contents: { parts: [textPart] },
                                config: { responseModalities: [Modality.IMAGE] },
                            });
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
                
                if (newImages.length === 0) {
                    throw new Error("The AI model could not generate an image from your prompt. Please try refining your prompt and trying again.");
                }
                
                updatedProject.generatedImages = [...updatedProject.generatedImages, ...newImages];
                updatedProject.prompt = finalPrompt;
            }
            
            addMsg("Conjuring your assets...", true);
            
            // Generate Copy
            let briefForCopy: CampaignBrief | null = updatedProject.campaignBrief;
            const promptForCopy = updatedProject.prompt || updatedProject.ugcScript || "A creative visual";
            if (!briefForCopy && promptForCopy) {
                briefForCopy = {
                    productName: updatedProject.mode,
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
                    console.warn("Failed to generate social media copy", copyError);
                    addMsg("Writing social media copy...", true);
                }
            }
            
            setCurrentProject(updatedProject);
            await dbService.saveProject(updatedProject);
            if (user) await loadProjects(user.email);
            navigateTo('PREVIEW');

        } catch (e: any) {
            console.error(e);
            setError(e.message || "Generation failed.");
        } finally {
            setIsLoading(false);
            setGenerationStatusMessages([]);
        }

    }, [currentProject, user, navigateTo, deductCredits, setIsLoading, setGenerationStatusMessages, setError, loadProjects]);

    const handleRegenerate = useCallback(async (type: 'image' | 'video') => {
         if (!currentProject || !user || !user.credits) return;
         const cost = currentProject.mode === 'Product Ad' ? CREDIT_COSTS.base.productAd : CREDIT_COSTS.base.artMaker;
         
         // Assuming Product Ad/Art Maker uses Image credits for now. Video regen logic would use video.
         const creditCategory: keyof Credits = type === 'image' ? 'image' : 'video';

         if (user.credits[creditCategory].current < cost) {
            setError(`Not enough ${creditCategory} credits.`);
            return;
        }

        setIsRegenerating(type);
        setError(null);

        try {
            deductCredits(cost, creditCategory);
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            let newImage: UploadedFile | null = null;
            const isImagen = (currentProject.imageModel || '').includes('imagen');

            if (currentProject.productFile && currentProject.productFile.base64) {
                 let model = currentProject.imageModel || 'gemini-2.5-flash-image';
                 if (isImagen) model = 'gemini-3-pro-image-preview';

                 const imagePart = {
                    inlineData: {
                        data: currentProject.productFile.base64,
                        mimeType: currentProject.productFile.mimeType,
                    },
                };
                const textPart = { text: currentProject.prompt };

                const response = await ai.models.generateContent({
                    model: model,
                    contents: { parts: [imagePart, textPart] },
                    config: { responseModalities: [Modality.IMAGE] },
                });

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
                     const response = await ai.models.generateImages({
                        model: currentProject.imageModel || 'imagen-4.0-generate-001',
                        prompt: currentProject.prompt,
                        config: { numberOfImages: 1, aspectRatio: currentProject.aspectRatio }
                    });
                    const img = response.generatedImages[0];
                    const blob = await(await fetch(`data:image/png;base64,${img.image.imageBytes}`)).blob();
                    newImage = await fileToUploadedFile(blob, 'regenerated_image.png');
                } else {
                    // Gemini Text-to-Image
                    const textPart = { text: currentProject.prompt };
                    const response = await ai.models.generateContent({
                        model: currentProject.imageModel || 'gemini-2.5-flash-image',
                        contents: { parts: [textPart] },
                        config: { responseModalities: [Modality.IMAGE] },
                    });
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
            setError(e.message || "Regeneration failed.");
        } finally {
            setIsRegenerating(null);
        }

    }, [currentProject, user, deductCredits, setError, loadProjects]);

    const handleAnimate = useCallback(async (imageIndex: number, prompt?: string) => { 
        if (!user || !user.credits) return;
        const cost = CREDIT_COSTS.base.animate;
        
        if (user.credits.video.current < cost) {
            setError("Not enough video credits.");
            return;
        }
        
        // Placeholder for future implementation. 
        console.log("Animating image index:", imageIndex, "with prompt:", prompt);
        deductCredits(cost, 'video');
    }, [user, deductCredits, setError]);
    
    const handleRefine = useCallback(async (imageIndex: number, refinePrompt: string) => { 
        if (!user || !user.credits) return;
        const cost = CREDIT_COSTS.base.refine;
        if (user.credits.image.current < cost) {
            setError("Not enough image credits.");
            return;
        }
        // Placeholder
        deductCredits(cost, 'image');
    }, [user, deductCredits, setError]);

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
        try {
            deductCredits(cost, 'video');
            // Mock extension
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
             setError(e.message || 'Failed to extend video.');
        } finally {
            setIsLoading(false);
        }
    }, [currentProject, user, deductCredits, setError, setIsLoading, setIsExtendModalOpen, loadProjects, navigateTo]);

    const runAgent = useCallback(async () => {
         if (!currentProject || !user || !user.credits || !currentProject.productFile) return;
        const cost = CREDIT_COSTS.base.agent;
        if (user.credits.strategy.current < cost) {
            setError("Not enough AI Strategy credits.");
            return;
        }
        
        setIsLoading(true);
        setAgentStatusMessages([]);
        
        try {
            deductCredits(cost, 'strategy');
            
            const addMsg = (msg: string, isDone = false) => setAgentStatusMessages(prev => {
                 if (isDone) {
                    const newMsgs = [...prev];
                    const lastMsg = newMsgs.pop();
                    if (lastMsg) {
                        return [...newMsgs, { ...lastMsg, type: 'done' }];
                    }
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
            const imagePart = {
                inlineData: {
                    data: currentProject.productFile.base64!,
                    mimeType: currentProject.productFile.mimeType,
                }
            };
            const textPart = { text: finalPrompt };

            const imageResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [imagePart, textPart] },
                config: {
                    responseModalities: [Modality.IMAGE],
                }
            });
            
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
             setError(e.message || "Agent failed.");
        } finally {
            setIsLoading(false);
            setAgentStatusMessages([]);
        }
    }, [currentProject, user, deductCredits, setError, setIsLoading, setAgentStatusMessages, loadProjects, navigateTo]);

    const handleAgentUrlRetrieval = useCallback(async (url: string) => {
        if (!user) return;
        setIsLoading(true);
        setError(null);
        try {
            const products = await geminiService.scrapeProductDetailsFromUrl(url);
            if (products.length === 0) {
                 throw new Error("No products found.");
            }
            
            const product = products[0];
            let productFile: UploadedFile | null = null;

            if (product.imageUrl) {
                productFile = await geminiService.fetchScrapedProductImage(product.imageUrl, url, product.productName);
            }
            
            const minimalBrief: CampaignBrief = {
                productName: product.productName,
                productDescription: product.productDescription,
                targetAudience: '',
                keySellingPoints: [],
                brandVibe: 'Neutral',
            };

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
            setError(e.message || "Failed to retrieve product.");
        } finally {
            setIsLoading(false);
        }
    }, [user, setIsLoading, setError, navigateTo]);

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
