import { GoogleGenAI, Type, Modality } from "@google/genai";
import type {
    CreativeMode, UploadedFile, CampaignBrief, CampaignInspiration,
    UGCScriptIdea, SocialProofIdea, ScrapedProductDetails, PublishingPackage,
    Project, BrandProfile
} from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- UGC Style Presets ---
// These define the "Physics" of the video generation to ensure consistency.
const UGC_STYLE_PRESETS: Record<string, string> = {
    'talking_head': "Camera: Shot on iPhone 15 Pro, Front-Facing Selfie Camera. Vertical 9:16. Lens: 24mm wide. Movement: Handheld with natural stabilization (slight breathing sway). Lighting: High-key beauty lighting (Ring light reflection in eyes). Evenly lit face.",
    'product_showcase': "Camera: Commercial Product Videography. Sharp focus on the object. Shallow depth of field (f/2.8) to blur background. Movement: Smooth, deliberate movements (simulated gimbal or slider). Focus pulls between face and product. Lighting: Bright, clean studio lighting. Specular highlights on the product.",
    'green_screen': "Composition: Visual Style: 'Green Screen' effect. The subject is superimposed over the background. Lighting: Subject Lighting: Studio bright, distinct from background. Background: Flat, 2D texture (as described in Scene).",
    'podcast': "Camera: Cinema Camera (Sony FX6), 50mm lens. Angle: Slightly off-center (45 degrees), looking at a host off-camera. Props: Large dynamic microphone (Shure SM7B style) on a boom arm in frame. Over-ear headphones. Lighting: Moody, high-contrast 'Dark Mode' studio lighting. Neon accent lights in background.",
    'pov': "Camera: Action Camera / Wide Angle Smartphone Lens. Distorted perspective at edges. Movement: Raw, shaky handheld motion. Walking movement. Lighting: Natural, uncontrolled environment lighting (Sun flares, variable exposure).",
    'unboxing': "Camera: High angle or chest-level POV. Focus is on the hands and the item. Action: Two-handed interaction, tearing packaging, lifting lid.",
    'reaction': "Camera: Split screen composition or Picture-in-Picture style. Front-facing camera. Expression: Highly expressive facial reactions responding to visual content.",
};

// Helper to convert file to base64 (if needed internally, though UploadedFile has base64)
// Most functions receive UploadedFile which already has base64.

export const generatePromptSuggestions = async (mode: CreativeMode, product: { productName: string; productDescription: string }): Promise<{ title: string; prompt: string; }[]> => {
    // High Fidelity Prompting Strategy
    const prompt = `You are a world-class commercial photographer and videographer. Generate 3 creative, high-fidelity prompt suggestions for a ${mode} project featuring ${product.productName} (${product.productDescription}).
    
    The prompts must use technical photography terms. 
    Structure: [Subject] + [Environment] + [Lighting Setup] + [Camera Specs] + [Texture/Details].
    Example terms to use: 'Softbox lighting', 'Rim light', 'f/1.8 aperture', 'Macro lens', '8k resolution', 'Subsurface scattering'.
    
    Return JSON format with an array of objects containing 'title' and 'prompt'.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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
    });

    return JSON.parse(response.text || '[]');
};

export const generateCampaignBrief = async (file: UploadedFile): Promise<CampaignBrief> => {
    if (!file.base64) throw new Error("Image data missing");

    const prompt = `Analyze this product image and generate a campaign brief.
    Return JSON with productName, productDescription, targetAudience, keySellingPoints (array of strings), and brandVibe.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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
    });

    return JSON.parse(response.text || '{}');
};

export const describeImageForPrompt = async (file: UploadedFile): Promise<string> => {
    if (!file.base64) throw new Error("Image data missing");

    const prompt = "Analyze this image as a professional photographer. Reverse engineer the prompt. Identify the likely: 1. Focal length (e.g. 85mm, 24mm), 2. Lighting setup (e.g. Rembrandt, Butterfly, Softbox), 3. Color grading, 4. Film stock or digital aesthetic. Output a concise keyword-rich description suitable for generating a similar image.";

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { mimeType: file.mimeType, data: file.base64 } },
                { text: prompt }
            ]
        },
    });

    return response.text || "";
};

export const fetchWithProxies = async (url: string): Promise<Response> => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch ${url}`);
        return response;
    } catch (error) {
        console.error("Fetch failed", error);
        throw error;
    }
};

export const validateAvatarImage = async (file: UploadedFile): Promise<boolean> => {
    if (!file.base64) return false;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: file.mimeType, data: file.base64 } },
                    { text: "Does this image contain a clear, single human face suitable for avatar animation? Answer with JSON: { \"isValid\": boolean }." }
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
        });
        const result = JSON.parse(response.text || '{}');
        return result.isValid === true;
    } catch (e) {
        console.error("Avatar validation failed", e);
        return false;
    }
};

export const generateCampaignInspiration = async (brief: CampaignBrief, goal?: string): Promise<CampaignInspiration[]> => {
    const prompt = `Generate 3 creative campaign inspirations for ${brief.productName}.
    Context/Goal: ${goal || 'General awareness'}.
    Target Audience: ${brief.targetAudience}.
    Vibe: ${brief.brandVibe}.
    Return JSON array.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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
    });

    return JSON.parse(response.text || '[]');
};

export const elaborateArtDirection = async (direction: string, brief: CampaignBrief): Promise<string> => {
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

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text || direction;
};

export const generateUGCScripts = async (brief: CampaignBrief): Promise<UGCScriptIdea[]> => {
    const prompt = `Generate 3 UGC video script ideas for ${brief.productName}.
    Audience: ${brief.targetAudience}.
    Return JSON array with hook, script, scene, and action.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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
    });

    return JSON.parse(response.text || '[]');
};

export const generateSocialProofIdeas = async (brief: CampaignBrief): Promise<SocialProofIdea[]> => {
    const prompt = `Generate 3 social proof/review ideas for ${brief.productName}.
    Return JSON array with hook and review text.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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
    });

    return JSON.parse(response.text || '[]');
};

export const scrapeProductDetailsFromUrl = async (url: string): Promise<ScrapedProductDetails[]> => {
    const prompt = `Find product details for the product at this URL: ${url}.
    Extract product name, description, and if possible a main image URL.
    Return JSON array of found products (usually 1).`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    const extractionPrompt = `Extract product details from the following text into a JSON array.
    Text: ${response.text}
    JSON Schema: Array of objects with productName, productDescription, imageUrl (optional).`;
    
    const jsonResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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
    });

    return JSON.parse(jsonResponse.text || '[]');
};

export const generatePublishingPackage = async (brief: CampaignBrief, prompt: string, goal?: string): Promise<PublishingPackage> => {
    const userGoal = goal ? `Campaign Goal: ${goal}` : '';
    const instructions = `Generate a social media publishing package for ${brief.productName}.
    Context: ${prompt}.
    ${userGoal}
    Platforms: Instagram, TikTok, YouTube Shorts, X (Twitter).
    For each platform, provide: caption, hashtags (array), and for TikTok/YouTube also include title and audioSuggestion.
    Return JSON.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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
    });

    return JSON.parse(response.text || '{}');
};

export const suggestAvatarFromContext = async (scene: string, productInfo?: { productName: string; productDescription: string }): Promise<string> => {
    let prompt = `Suggest a visual description for a UGC avatar (person) suitable for this scene: "${scene}".`;
    if (productInfo) {
        prompt += ` Product: ${productInfo.productName} - ${productInfo.productDescription}.`;
    }
    prompt += ` Keep it brief (e.g., "A young man in athletic wear").`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text || "A friendly presenter.";
};

export const regenerateFieldCopy = async (
    brief: CampaignBrief,
    prompt: string,
    platform: string,
    field: string,
    existingValues: string[],
    goal?: string
): Promise<string> => {
    const instructions = `Regenerate the ${field} for ${platform} for a campaign about ${brief.productName}.
    Context: ${prompt}.
    Goal: ${goal || 'Engagement'}.
    Existing values to avoid repeating exactly: ${JSON.stringify(existingValues)}.
    Return only the new text string (or array of strings if hashtags).`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: instructions,
    });
    
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
    const prompt = `Generate 3 UGC script ideas.
    Type: ${input.ugcType || 'General'}.
    Topic: ${input.topic || 'Product Review'}.
    Product: ${input.productName} - ${input.productDescription}.
    Scene: ${input.sceneDescription || 'Any'}.
    Brand Voice: ${input.brandProfile?.toneOfVoice?.join(', ') || 'Authentic'}.
    
    For each idea, provide:
    1. Hook (Title)
    2. Script (Spoken text)
    3. Scene Description (Visual details)
    4. Action (What the avatar does)
    
    Return JSON array with hook, script, scene, action.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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
    });

    return JSON.parse(response.text || '[]');
};

export const generateUGCConcept = async (input: {
    productName?: string;
    productDescription?: string;
    goal?: string;
    topic?: string;
}): Promise<{ talkingPoints: string; sceneDescription: string }> => {
    let prompt = `You are an expert UGC Marketing Strategist. Create a video concept for a user-generated content video.\n`;
    
    if (input.topic) {
        prompt += `Topic: ${input.topic}\n`;
    } else {
        prompt += `Product: ${input.productName} - ${input.productDescription}\n`;
        prompt += `Campaign Goal: ${input.goal}\n`;
    }

    prompt += `
    Generate:
    1. Key Talking Points: A bulleted list of 2-3 short, punchy persuasive points the creator should cover. Do NOT write a script. Write guidelines. Keep it concise for a 12s video.
    2. Scene Description: A visual description of the best setting for this video (e.g. aesthetic, lighting, background).

    Return JSON.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    talkingPoints: { type: Type.STRING },
                    sceneDescription: { type: Type.STRING },
                },
                required: ['talkingPoints', 'sceneDescription'],
            }
        }
    });

    return JSON.parse(response.text || '{}');
};

export const generateUGCTalkingPoints = async (input: {
    productName?: string;
    productDescription?: string;
    goal?: string;
    topic?: string;
}): Promise<string> => {
    let prompt = `Generate a new set of Key Talking Points for a UGC video.\n`;
    
    if (input.topic) {
        prompt += `Topic: ${input.topic}\n`;
    } else {
        prompt += `Product: ${input.productName} - ${input.productDescription}\n`;
        prompt += `Campaign Goal: ${input.goal}\n`;
    }
    
    prompt += `Format: A concise bulleted list of 2-3 punchy points suitable for a 12-second video.
    Return only the text string.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text || '';
};

export const generateUGCScene = async (input: {
    productName?: string;
    productDescription?: string;
    goal?: string;
    topic?: string;
}): Promise<string> => {
    let prompt = `Generate a new Scene Description for a UGC video.\n`;
    
    if (input.topic) {
        prompt += `Topic: ${input.topic}\n`;
    } else {
        prompt += `Product: ${input.productName} - ${input.productDescription}\n`;
        prompt += `Campaign Goal: ${input.goal}\n`;
    }

    prompt += `Format: A concise visual description of the setting, lighting, and vibe.
    Return only the text string.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text || '';
};

export const generateUGCVideo = async (project: Project): Promise<UploadedFile> => {
    const model = project.videoModel || 'veo-3.1-fast-generate-preview';
    
    // Select the Style Preset based on the user's choice
    const ugcType = project.ugcType || 'talking_head';
    const stylePreset = UGC_STYLE_PRESETS[ugcType] || UGC_STYLE_PRESETS['talking_head'];
    
    const hasProduct = !!project.ugcProductFile || !!project.productFile;
    const productName = project.productName || 'the product';

    // Construct High-Fidelity Prompt using "Director's Note" structure
    // Note: We use ugcScript as "Talking Points" if provided, guiding the model to be natural.
    const prompt = `
FORMAT: Vertical 9:16 Social Media Video (TikTok/Reels style).
TECHNICAL SPECS: ${stylePreset}
SCENE DESCRIPTION: ${project.ugcSceneDescription || 'A clean, well-lit environment suitable for social media.'}
SUBJECT: ${project.ugcAvatarDescription || 'A friendly presenter.'}
ACTION: ${project.ugcAction || `The subject is looking at the camera, speaking naturally and enthusiastically. ${hasProduct ? `They are holding and showing ${productName} clearly.` : ''}`}
AUDIO: The avatar should cover the following key talking points naturally and authentically: "${project.ugcScript || ''}". Do not read verbatim, make it conversational. Tone: ${project.ugcEmotion || 'natural'}.
NEGATIVE PROMPT: morphing, distortion, extra limbs, bad hands, text overlay, watermark, blurry, low resolution, cartoonish.
    `.trim();
    
    let imagePart = undefined;
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

    let operation = await ai.models.generateVideos({
        model: model,
        prompt: prompt,
        image: imagePart,
        config: {
            numberOfVideos: 1,
            resolution: project.videoResolution || '720p',
            aspectRatio: project.aspectRatio === '9:16' ? '9:16' : '16:9',
        }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
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

export const extractBrandProfileFromUrl = async (url: string): Promise<BrandProfile> => {
    const prompt = `Analyze the brand at ${url}.
    Extract: businessName, businessOverview, missionStatements (array), brandValues (array), toneOfVoice (array), brandAesthetics (array), logoUrl (if found).
    Return JSON.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        }
    });

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

    const jsonResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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
    });

    const data = JSON.parse(jsonResponse.text || '{}');
    
    return {
        userId: '', // Set by caller
        websiteUrl: url,
        logoFile: null, // Fetched separately
        fonts: { header: 'Inter', subHeader: 'Inter', body: 'Inter' },
        colors: [], 
        ...data
    };
};

export const fetchLogo = async (logoUrl: string, baseUrl: string): Promise<UploadedFile | null> => {
    try {
        const fullUrl = new URL(logoUrl, baseUrl).toString();
        const response = await fetch(fullUrl);
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
        const response = await fetch(fullUrl);
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