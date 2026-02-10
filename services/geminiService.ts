
import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";
import type {
    CreativeMode, UploadedFile, CampaignBrief, CampaignInspiration,
    UGCScriptIdea, SocialProofIdea, ScrapedProductDetails, PublishingPackage,
    Project, BrandProfile
} from '../types';

// --- UGC Style Presets ---
const UGC_STYLE_PRESETS: Record<string, string> = {
    'talking_head': "Camera: Shot on iPhone 15 Pro, Front-Facing Selfie Camera. Vertical 9:16. Lens: 24mm wide. Movement: Handheld with natural stabilization (slight breathing sway). Lighting: High-key beauty lighting (Ring light reflection in eyes). Evenly lit face.",
    'product_showcase': "Camera: Commercial Product Videography. Sharp focus on the object. Shallow depth of field (f/2.8) to blur background. Movement: Smooth, deliberate movements (simulated gimbal or slider). Focus pulls between face and product. Lighting: Bright, clean studio lighting. Specular highlights on the product.",
    'green_screen': "Composition: Visual Style: 'Green Screen' effect. The subject is superimposed over the background. Lighting: Subject Lighting: Studio bright, distinct from background. Background: Flat, 2D texture (as described in Scene).",
    'podcast': "Camera: Cinema Camera (Sony FX6), 50mm lens. Angle: Slightly off-center (45 degrees), looking at a host off-camera. Props: Large dynamic microphone (Shure SM7B style) on a boom arm in frame. Over-ear headphones. Lighting: Moody, high-contrast 'Dark Mode' studio lighting. Neon accent lights in background.",
    'pov': "Camera: Action Camera / Wide Angle Smartphone Lens. Distorted perspective at edges. Movement: Raw, shaky handheld motion. Walking movement. Lighting: Natural, uncontrolled environment lighting (Sun flares, variable exposure).",
    'unboxing': "Camera: High angle or chest-level POV. Focus is on the hands and the item. Action: Two-handed interaction, tearing packaging, lifting lid.",
    'reaction': "Camera: Split screen composition or Picture-in-Picture style. Front-facing camera. Expression: Highly expressive facial reactions responding to visual content.",
};

/**
 * Robust retry helper for handling transient Gemini API errors.
 */
export async function withRetry<T>(operation: () => Promise<T>, retries = 3, baseDelay = 2000): Promise<T> {
    let lastError: any;
    for (let i = 0; i <= retries; i++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;
            
            const errorMessage = (error.message || '').toLowerCase();
            const errorStatus = error.status || error.code || (error.error && error.error.code);
            
            const isTransient = errorStatus === 503 || 
                                errorStatus === 504 ||
                                errorMessage.includes('overloaded') || 
                                errorMessage.includes('503') ||
                                errorMessage.includes('unavailable') ||
                                errorMessage.includes('deadline exceeded');
            
            const isQuota = errorStatus === 429 || errorMessage.includes('quota') || errorMessage.includes('limit') || errorMessage.includes('exhausted');

            if (i < retries && isTransient) {
                const delay = baseDelay * Math.pow(2, i);
                console.warn(`Gemini API busy (${errorStatus}). Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            if (isQuota) {
                error.isQuotaError = true;
            }
            throw error;
        }
    }
    throw lastError;
}

export const generatePromptSuggestions = async (mode: CreativeMode, product: { productName: string; productDescription: string }): Promise<{ title: string; prompt: string; }[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `You are a world-class commercial photographer and videographer. Generate 3 creative, high-fidelity prompt suggestions for a ${mode} project featuring ${product.productName} (${product.productDescription}).
    
    The prompts must use technical photography terms. 
    Structure: [Subject] + [Environment] + [Lighting Setup] + [Camera Specs] + [Texture/Details].
    Example terms to use: 'Softbox lighting', 'Rim light', 'f/1.8 aperture', 'Macro lens', '8k resolution', 'Subsurface scattering'.
    
    Return JSON format with an array of objects containing 'title' and 'prompt'.`;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        prompt: { type: Type.STRING },
                    },
                    required: ['title', 'prompt'],
                },
            },
        },
    }));

    return JSON.parse(response.text || '[]');
};

export const generateCampaignBrief = async (file: UploadedFile): Promise<CampaignBrief> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    if (!file.base64) throw new Error("Image data missing");

    const prompt = `Analyze this product image and generate a campaign brief.
    Return JSON with productName, productDescription, targetAudience, keySellingPoints (array of strings), and brandVibe.`;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
            parts: [
                { inlineData: { mimeType: file.mimeType, data: file.base64 } },
                { text: prompt }
            ]
        },
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    productName: { type: Type.STRING },
                    productDescription: { type: Type.STRING },
                    targetAudience: { type: Type.STRING },
                    keySellingPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                    brandVibe: { type: Type.STRING },
                },
                required: ['productName', 'productDescription', 'targetAudience', 'keySellingPoints', 'brandVibe'],
            },
        },
    }));

    return JSON.parse(response.text || '{}');
};

export const describeImageForPrompt = async (file: UploadedFile): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    if (!file.base64) throw new Error("Image data missing");

    const prompt = "Analyze this image as a professional photographer. Reverse engineer the prompt. Identify the likely: 1. Focal length (e.g. 85mm, 24mm), 2. Lighting setup (e.g. Rembrandt, Butterfly, Softbox), 3. Color grading, 4. Film stock or digital aesthetic. Output a concise keyword-rich description suitable for generating a similar image.";

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
            parts: [
                { inlineData: { mimeType: file.mimeType, data: file.base64 } },
                { text: prompt }
            ]
        },
    }));

    return response.text || "";
};

export const suggestOutfit = async (file: UploadedFile, context?: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    if (!file.base64) throw new Error("Image data missing");

    const vibes = ['Streetwear', 'Formal Elegance', 'Cyberpunk', 'Cozy Autumn', 'Athleisure', 'High Fashion Avant-Garde', 'Vintage 90s', 'Business Casual', 'Summer Beach'];
    const randomVibe = vibes[Math.floor(Math.random() * vibes.length)];

    const prompt = `Analyze the person in this image (pay attention to gender, age, and build). 
    Suggest a complete, stylish outfit description for them.
    Style: ${randomVibe}.
    Context: It is for a viral social media transition video.
    Keep the description concise and visual (e.g., "A neon green oversized hoodie with black cargo pants and chunky sneakers").
    Do not include intro text.`;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
            parts: [
                { inlineData: { mimeType: file.mimeType, data: file.base64 } },
                { text: prompt }
            ]
        },
    }));

    return response.text?.trim() || "";
};

export const suggestEnvironment = async (productName: string, productDescription: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Suggest a creative, cinematic environment description for a video featuring: ${productName} (${productDescription}).
    The video involves the subject jumping and freezing in mid-air (Matrix style).
    The environment should be visually striking (e.g., "A neon-lit cyberpunk street in rain", "A sun-drenched skate park", "A futuristic white void").
    Return ONLY the description text. Keep it under 20 words.`;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
    }));
    return response.text?.trim() || "";
}

export const fetchWithProxies = async (url: string): Promise<Response> => {
    try {
        const response = await fetch(url);
        if (response.ok) return response;
    } catch (e) {}

    const proxies = [
        (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
        (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`
    ];

    for (const proxy of proxies) {
        try {
            const proxiedUrl = proxy(url);
            const response = await fetch(proxiedUrl);
            if (response.ok) return response;
        } catch (e) {
            console.warn(`Proxy failed for ${url}`, e);
        }
    }

    throw new Error(`Failed to fetch ${url} after trying all methods.`);
};

export const validateAvatarImage = async (file: UploadedFile): Promise<boolean> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    if (!file.base64) return false;

    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType: file.mimeType, data: file.base64 } },
                    { text: "Does this image contain a clear human face suitable for avatar animation? Answer with JSON: { \"isValid\": boolean }." }
                ]
            },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isValid: { type: Type.BOOLEAN },
                    },
                    required: ['isValid'],
                },
            },
        }));
        const result = JSON.parse(response.text || '{}');
        return result.isValid === true;
    } catch (e: any) {
        console.error("Avatar validation failed", e);
        // Propagate technical errors (Quota or Server errors)
        if (e.isQuotaError || (e.status >= 500)) throw e;
        return false;
    }
};

export const validateProductImage = async (file: UploadedFile): Promise<boolean> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    if (!file.base64) return false;

    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType: file.mimeType, data: file.base64 } },
                    { text: "Does this image clearly feature a product as the main subject? It should be recognizable and suitable for professional advertising visuals. Answer with JSON: { \"isValid\": boolean }." }
                ]
            },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isValid: { type: Type.BOOLEAN },
                    },
                    required: ['isValid'],
                },
            },
        }));
        const result = JSON.parse(response.text || '{}');
        return result.isValid === true;
    } catch (e: any) {
        console.error("Product image validation failed", e);
        // Propagate technical errors (Quota or Server errors)
        if (e.isQuotaError || (e.status >= 500)) throw e;
        return false;
    }
};

export const generateCampaignInspiration = async (brief: CampaignBrief, goal?: string): Promise<CampaignInspiration[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Generate 3 creative campaign inspirations for ${brief.productName}.
    Context/Goal: ${goal || 'General awareness'}.
    Target Audience: ${brief.targetAudience}.
    Vibe: ${brief.brandVibe}.
    Return JSON array.`;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        hook: { type: Type.STRING },
                        strategy: { type: Type.STRING },
                        concept: { type: Type.STRING },
                        artDirection: { type: Type.STRING },
                    },
                    required: ['hook', 'strategy', 'concept', 'artDirection'],
                },
            },
        },
    }));

    return JSON.parse(response.text || '[]');
};

export const elaborateArtDirection = async (direction: string, brief: CampaignBrief): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `You are a world-class commercial photographer and prompt engineer. Convert this Art Direction into a high-fidelity image generation prompt.
    
    **Structure the prompt exactly like this:**
    \`[Subject Definition] + [Environment/Set Design] + [Lighting Setup] + [Camera/Lens Specs] + [Material/Texture Details]\`
    
    **Rules:**
    1. **Lighting:** Use technical terms (e.g., 'Rembrandt lighting', 'God rays', 'Studio strobe', 'Softbox').
    2. **Camera:** Specify lens type (e.g., 'Macro lens for texture details', 'Wide angle for scale', '85mm portrait lens').
    3. **Quality:** Append '8k resolution, highly detailed, photorealistic, octane render'.
    
    **Input Art Direction:** ${direction}
    **Product:** ${brief.productName} - ${brief.productDescription}
    **Vibe:** ${brief.brandVibe}`;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
    }));

    return response.text || direction;
};

export const generateUGCScripts = async (brief: CampaignBrief): Promise<UGCScriptIdea[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Generate 3 UGC video script ideas for ${brief.productName}.
    Audience: ${brief.targetAudience}.
    Return JSON array with hook, script, scene, and action.`;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        hook: { type: Type.STRING },
                        script: { type: Type.STRING },
                        scene: { type: Type.STRING },
                        action: { type: Type.STRING },
                    },
                    required: ['hook', 'script', 'scene', 'action'],
                },
            },
        },
    }));

    return JSON.parse(response.text || '[]');
};

export const generateSocialProofIdeas = async (brief: CampaignBrief): Promise<SocialProofIdea[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Generate 3 social proof/review ideas for ${brief.productName}.
    Return JSON array with hook and review text.`;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        hook: { type: Type.STRING },
                        review: { type: Type.STRING },
                    },
                    required: ['hook', 'review'],
                },
            },
        },
    }));

    return JSON.parse(response.text || '[]');
};

export const scrapeProductDetailsFromUrl = async (url: string): Promise<ScrapedProductDetails[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Find product details for the product at this URL: ${url}.
    Extract product name, description, and if possible a main image URL.
    Return JSON array of found products (usually 1).`;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    }));

    const extractionPrompt = `Extract product details from the following text into a JSON array.
    Text: ${response.text}
    JSON Schema: Array of objects with productName, productDescription, imageUrl (optional).`;
    
    const jsonResponse = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: extractionPrompt,
        config: {
            responseMimeType: 'application/json',
             responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        productName: { type: Type.STRING },
                        productDescription: { type: Type.STRING },
                        imageUrl: { type: Type.STRING },
                    },
                    required: ['productName', 'productDescription'],
                },
            },
        }
    }));

    return JSON.parse(jsonResponse.text || '[]');
};

export const generatePublishingPackage = async (brief: CampaignBrief, prompt: string, goal?: string): Promise<PublishingPackage> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const userGoal = goal ? `Campaign Goal: ${goal}` : '';
    const instructions = `Generate a social media publishing package for ${brief.productName}.
    Context: ${prompt}.
    ${userGoal}
    Platforms: Instagram, TikTok, YouTube Shorts, X (Twitter).
    For each platform, provide: caption, hashtags (array), and for TikTok/YouTube also include title and audioSuggestion.
    Return JSON.`;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: instructions,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    instagram: {
                        type: Type.OBJECT,
                        properties: {
                            caption: { type: Type.STRING },
                            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        },
                        required: ['caption', 'hashtags'],
                    },
                    tiktok: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            caption: { type: Type.STRING },
                            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                            audioSuggestion: { type: Type.STRING },
                        },
                        required: ['caption', 'hashtags', 'title', 'audioSuggestion'],
                    },
                    youtube: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            caption: { type: Type.STRING },
                            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                            audioSuggestion: { type: Type.STRING },
                        },
                        required: ['caption', 'hashtags', 'title', 'audioSuggestion'],
                    },
                    x: {
                        type: Type.OBJECT,
                        properties: {
                            caption: { type: Type.STRING },
                            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        },
                        required: ['caption', 'hashtags'],
                    },
                },
                required: ['instagram', 'tiktok', 'youtube'],
            },
        },
    }));

    return JSON.parse(response.text || '{}');
};

export const suggestAvatarFromContext = async (scene: string, productInfo?: { productName: string; productDescription: string }): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let prompt = `Suggest a visual description for a UGC avatar (person) suitable for this scene: "${scene}".`;
    if (productInfo) {
        prompt += ` Product: ${productInfo.productName} - ${productInfo.productDescription}.`;
    }
    prompt += ` Keep it brief (e.g., "A young man in athletic wear").`;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
    }));

    return response.text || "A friendly presenter.";
};

export const suggestUGCKeyMessaging = async (productName: string, productDescription: string, objective: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Generate a list of 3 key messaging points for a short video ad about ${productName} - ${productDescription}.
    Campaign Objective: ${objective}.
    Format: Bullet points. concise.`;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
    }));
    return response.text || "";
};

export const suggestUGCSceneDescription = async (productName: string, productDescription: string, objective: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Describe a visual background setting for a UGC video ad about ${productName}.
    Campaign Objective: ${objective}.
    Keep it concise, visual, and suitable for a creator video.`;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
    }));
    return response.text || "";
};

export const regenerateFieldCopy = async (
    brief: CampaignBrief,
    prompt: string,
    platform: string,
    field: string,
    existingValues: string[],
    goal?: string
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const instructions = `Regenerate the ${field} for ${platform} for a campaign about ${brief.productName}.
    Context: ${prompt}.
    Goal: ${goal || 'Engagement'}.
    Existing values to avoid repeating exactly: ${JSON.stringify(existingValues)}.
    Return only the new text string (or array of strings if hashtags).`;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: instructions,
    }));
    
    return response.text?.trim() || "";
};

export const generateUGCScriptIdeas = async (input: {
    topic?: string;
    productName: string;
    productDescription: string;
    brandProfile?: BrandProfile | null;
    ugcType?: string;
    sceneDescription?: string;
}): Promise<UGCScriptIdea[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Generate 3 UGC concept ideas.
    Type: ${input.ugcType || 'General'}.
    Topic: ${input.topic || 'Product Review'}.
    Product: ${input.productName} - ${input.productDescription}.
    Scene: ${input.sceneDescription || 'Any'}.
    Brand Voice: ${input.brandProfile?.toneOfVoice?.join(', ') || 'Authentic'}.
    
    For each idea, provide:
    1. Hook (Concept Name)
    2. Key Messaging (Talking points in bullet format, not a full script)
    3. Scene Description (Describe purely the visual location/environment for the Creator, e.g., 'A cozy living room with warm lighting').
    
    Do not include specific avatar actions.
    Return JSON array with hook, keyMessaging, scene.`;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        hook: { type: Type.STRING },
                        keyMessaging: { type: Type.STRING },
                        scene: { type: Type.STRING },
                    },
                    required: ['hook', 'keyMessaging', 'scene'],
                },
            },
        },
    }));

    return JSON.parse(response.text || '[]');
};

export const generateUGCPreviews = async (project: Project): Promise<UploadedFile[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-pro-image-preview';

    const stylePreset = UGC_STYLE_PRESETS[project.ugcType || 'product_showcase'] || UGC_STYLE_PRESETS['talking_head'];
    const productName = project.productName || 'the product';
    
    const prompt = `
    Create a photorealistic, high-quality image that looks like a starting frame for a social media video (Vertical 9:16 aspect ratio).
    
    **Technical Style:** ${stylePreset}
    **Scene:** ${project.ugcSceneDescription || 'A clean, modern setting suitable for a creator video.'}
    **Subject/Avatar:** ${project.ugcAvatarDescription || 'A professional presenter.'}
    **Action/Pose:** ${project.ugcAction || 'Looking directly at the camera with a friendly expression.'}
    **Context:** The subject is presenting ${productName}.
    
    **Important:** The image must look like a real video frame, not a cartoon. High fidelity, 4k resolution.
    `;

    const parts: any[] = [];
    
    if (project.ugcAvatarFile && project.ugcAvatarFile.base64) {
        parts.push({
            inlineData: {
                mimeType: project.ugcAvatarFile.mimeType,
                data: project.ugcAvatarFile.base64
            }
        });
        parts.push({ text: "Use this person as the subject/avatar in the image. Maintain their facial features." });
    }

    if (project.ugcProductFile && project.ugcProductFile.base64) {
        parts.push({
            inlineData: {
                mimeType: project.ugcProductFile.mimeType,
                data: project.ugcProductFile.base64
            }
        });
        parts.push({ text: `Feature this product (${productName}) in the scene. Ensure it looks realistic and integrated.` });
    }

    parts.push({ text: prompt });

    const generatedFiles: UploadedFile[] = [];

    for (let i = 0; i < 4; i++) {
        try {
            const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
                model: model,
                contents: { parts: [ { text: "Use this information to generate one single high quality 4k image." }, ...parts ] },
                config: {
                    responseModalities: [Modality.IMAGE],
                }
            }));

            if (response.candidates?.[0]?.content?.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        const blob = await (await fetch(`data:image/png;base64,${part.inlineData.data}`)).blob();
                        generatedFiles.push({
                            id: `preview_${Date.now()}_${i}`,
                            base64: part.inlineData.data,
                            mimeType: 'image/png',
                            name: `preview_frame_${i}.png`,
                            blob: blob
                        });
                    }
                }
            }
        } catch (e) {
            console.error(`Failed to generate preview frame ${i+1}`, e);
        }
    }

    return generatedFiles;
};

export const generateUGCVideo = async (project: Project): Promise<UploadedFile> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = project.videoModel || 'veo-3.1-fast-generate-preview';
    
    const ugcType = project.ugcType || 'talking_head';
    const stylePreset = UGC_STYLE_PRESETS[ugcType] || UGC_STYLE_PRESETS['talking_head'];
    
    const hasProduct = !!project.ugcProductFile || !!project.productFile;
    const productName = project.productName || 'the product';

    let prompt = '';
    let imagePart = undefined;

    if (project.startFrame && project.startFrame.base64) {
        prompt = `
        ANIMATE THIS IMAGE.
        Format: Vertical 9:16 Social Media Video.
        Action: The subject ${project.ugcAction || 'talks naturally to the camera'}.
        Expression: ${project.ugcEmotion || 'Natural'} and engaging.
        Motion: Subtle head movements, natural blinking, hand gestures if visible.
        Audio: Speaking the following lines: "${project.ugcScript || ''}"
        Technical: Keep the visual style, lighting, and composition exactly consistent with the input frame. High quality motion.
        `.trim();

        imagePart = {
            imageBytes: project.startFrame.base64,
            mimeType: project.startFrame.mimeType,
        };

    } else {
        prompt = `
        FORMAT: Vertical 9:16 Social Media Video (TikTok/Reels style).
        TECHNICAL SPECS: ${stylePreset}
        SCENE DESCRIPTION: ${project.ugcSceneDescription || 'A clean, well-lit environment suitable for social media.'}
        SUBJECT: ${project.ugcAvatarDescription || 'A friendly presenter.'}
        ACTION: ${project.ugcAction || 'Talking directly to the camera.'} ${hasProduct ? `The subject is interacting with ${productName}.` : ''}
        AUDIO: Speaking the following lines with ${project.ugcEmotion || 'natural'} tone: "${project.ugcScript || ''}"
        NEGATIVE PROMPT: morphing, distortion, extra limbs, bad hands, text overlay, watermark, blurry, low resolution, cartoonish.
        `.trim();
        
        if (project.ugcAvatarFile && project.ugcAvatarFile.base64) {
            imagePart = {
                imageBytes: project.ugcAvatarFile.base64,
                mimeType: project.ugcAvatarFile.mimeType,
            };
        } else if (project.ugcProductFile && project.ugcProductFile.base64) {
             imagePart = {
                imageBytes: project.ugcProductFile.base64,
                mimeType: project.ugcProductFile.mimeType,
            };
        }
    }

    let operation = await withRetry<any>(() => ai.models.generateVideos({
        model: model,
        prompt: prompt,
        image: imagePart,
        config: {
            numberOfVideos: 1,
            resolution: project.videoResolution || '720p',
            aspectRatio: project.aspectRatio === '9:16' ? '9:16' : '16:9',
        }
    }));

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await withRetry<any>(() => ai.operations.getVideosOperation({ operation: operation }));
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Video generation failed to return a URI.");

    const videoRes = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
    const videoBlob = await videoRes.blob();

    return {
        id: `video_${Date.now()}`,
        name: 'ugc_video.mp4',
        mimeType: 'video/mp4',
        blob: videoBlob,
    };
};

export const generateAnimateVideo = async (image: UploadedFile, prompt: string, settings: { model: string, resolution: string, aspectRatio: string }): Promise<UploadedFile> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let operation = await withRetry<any>(() => ai.models.generateVideos({
        model: settings.model,
        prompt: prompt,
        image: {
            imageBytes: image.base64!,
            mimeType: image.mimeType,
        },
        config: {
            numberOfVideos: 1,
            resolution: settings.resolution as any,
            aspectRatio: settings.aspectRatio as any,
        }
    }));

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await withRetry<any>(() => ai.operations.getVideosOperation({ operation: operation }));
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Video animation failed.");

    const videoRes = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
    const videoBlob = await videoRes.blob();

    return {
        id: `anim_${Date.now()}`,
        name: 'animated_video.mp4',
        mimeType: 'video/mp4',
        blob: videoBlob,
    };
};

export const extractBrandProfileFromUrl = async (url: string): Promise<BrandProfile> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Analyze the brand at ${url}.
    Extract: businessName, businessOverview, missionStatements (array), brandValues (array), toneOfVoice (array), brandAesthetics (array), logoUrl (if found).
    Return JSON.`;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        }
    }));

    const extractionPrompt = `Extract brand details from the text below into JSON.
    Text: ${response.text}
    Schema: {
        businessName: string,
        businessOverview: string,
        missionStatements: string[],
        brandValues: string[],
        toneOfVoice: string[],
        brandAesthetics: string[],
        logoUrl: string
    }`;

    const jsonResponse = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: extractionPrompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    businessName: { type: Type.STRING },
                    businessOverview: { type: Type.STRING },
                    missionStatements: { type: Type.ARRAY, items: { type: Type.STRING } },
                    brandValues: { type: Type.ARRAY, items: { type: Type.STRING } },
                    toneOfVoice: { type: Type.ARRAY, items: { type: Type.STRING } },
                    brandAesthetics: { type: Type.ARRAY, items: { type: Type.STRING } },
                    logoUrl: { type: Type.STRING },
                },
                required: ['businessName'],
            }
        }
    }));

    const data = JSON.parse(jsonResponse.text || '{}');
    
    return {
        userId: '',
        websiteUrl: url,
        logoFile: null,
        fonts: { header: 'Inter', subHeader: 'Inter', body: 'Inter' },
        colors: [], 
        ...data
    };
};

export const fetchLogo = async (logoUrl: string, baseUrl: string): Promise<UploadedFile | null> => {
    try {
        const fullUrl = new URL(logoUrl, baseUrl).toString();
        const response = await fetchWithProxies(fullUrl);
        const blob = await response.blob();
        return {
            id: `logo_${Date.now()}`,
            name: 'logo',
            mimeType: blob.type,
            blob: blob,
            base64: await (new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                reader.readAsDataURL(blob);
            }))
        };
    } catch (e) {
        console.warn("Failed to fetch logo", e);
        return null;
    }
};

export const fetchScrapedProductImage = async (imageUrl: string, referrer: string, name: string): Promise<UploadedFile | null> => {
    try {
        const fullUrl = new URL(imageUrl, referrer).toString();
        const response = await fetchWithProxies(fullUrl);
        const blob = await response.blob();
        return {
            id: `prod_${Date.now()}`,
            name: name,
            mimeType: blob.type,
            blob: blob,
            base64: await (new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                reader.readAsDataURL(blob);
            }))
        };
    } catch (e) {
        console.warn("Failed to fetch product image", e);
        return null;
    }
};
