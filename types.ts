
import type { Modality } from "@google/genai";

export interface UploadedFile {
    id: string;
    base64?: string;
    mimeType: string;
    name: string;
    blob: Blob;
}

export type CreativeMode = 'Product Ad' | 'Art Maker' | 'Video Maker' | 'Create a UGC Video' | 'AI Agent' | 'Character Swap';
export type PlanName = 'Starter' | 'Creator' | 'Business';
export type AdStyle = 'Creative Placement' | 'UGC' | 'Social Proof';
export type UgcAvatarSource = 'ai' | 'upload' | 'template';

export type GenerationErrorType = 'safety' | 'downtime' | 'quota' | 'unknown';
export interface GenerationError {
    type: GenerationErrorType;
    message: string;
}

export interface TransitionStep {
    id: string;
    look: string;
    action?: string; // Action to transition TO the next look. Last step has undefined action.
    referenceFile?: UploadedFile | null; // Visual reference for this specific look
}

export interface SavedProduct {
    id: string;
    userId: string;
    name: string;
    description: string;
    file: UploadedFile;
    createdAt: number;
}

export interface Project {
    id: string;
    userId: string;
    createdAt: number;
    mode: CreativeMode;
    prompt: string;
    productFile: UploadedFile | null;
    productName: string;
    productDescription: string;
    websiteUrl?: string;
    campaignBrief: CampaignBrief | null;
    generatedImages: UploadedFile[];
    generatedVideos: UploadedFile[];
    aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
    batchSize: number;
    useCinematicQuality: boolean;
    startFrame?: UploadedFile | null;
    endFrame?: UploadedFile | null;
    sourceVideo?: UploadedFile | null;
    negativePrompt: string;
    referenceFiles: UploadedFile[];
    videoToExtend?: UploadedFile;
    highLevelGoal?: string;
    publishingPackage?: PublishingPackage | null;
    campaignInspiration?: CampaignInspiration | null;
    campaignStrategy?: string | null;
    imageModel?: string;
    videoModel?: string;
    videoDuration?: number;
    videoModelToUse?: string; // For temporarily overriding model on retry
    videoResolution?: '720p' | '1080p';
    imageQuality?: 'low' | 'medium' | 'high';
    templateId?: string;
    adStyle?: AdStyle;
    // For UGC Factory
    ugcType?: 'talking_head' | 'product_showcase' | 'green_screen' | 'podcast' | 'reaction' | 'pov' | 'unboxing';
    ugcTopic?: string;
    ugcScript?: string;
    ugcAvatarFile?: UploadedFile | null;
    ugcProductFile?: UploadedFile | null;
    ugcAction?: string;
    ugcVoice?: string;
    ugcEmotion?: string;
    ugcLanguage?: string;
    ugcAccent?: string;
    ugcAccentPath?: string;
    ugcSceneDescription?: string;
    ugcAvatarDescription?: string;
    ugcAvatarSource?: UgcAvatarSource;
    isEcommerce?: boolean;
    // For Visual Effects
    transitionSettings?: TransitionStep[];
    transitionPreviews?: UploadedFile[];
    outfitReferenceFile?: UploadedFile | null;
}

export interface User {
    email: string;
    subscription: Subscription | null;
    credits: Credits | null;
    paymentMethod: PaymentMethod | null;
    brandProfile: BrandProfile | null;
}

export interface BrandProfile {
    userId: string;
    websiteUrl: string;
    businessName: string;
    logoFile: UploadedFile | null;
    logoUrl?: string;
    fonts: {
        header: string;
        subHeader: string;
        body: string;
    };
    colors: { label: string; hex: string }[];
    missionStatements: string[];
    brandValues: string[];
    toneOfVoice: string[];
    businessOverview: string;
    brandAesthetics: string[];
}


export interface Subscription {
    plan: PlanName;
    billingCycle: 'monthly' | 'annually';
    renewsOn: number;
    cancelAtPeriodEnd?: boolean;
}

export interface CreditCategory {
    current: number;
    total: number;
}

export interface Credits {
    image: CreditCategory;
    video: CreditCategory;
    strategy: CreditCategory;
}

export interface PaymentMethod {
    brand: string;
    last4: string;
    expiry: string;
}

export type TemplateCategory = 'All' | 'Holidays & Events' | 'Seasonal' | 'Studio' | 'Lifestyle' | 'Surreal' | 'UGC' | 'Visual Effects';

export interface Template {
    id: string;
    title: string;
    description: string;
    category: TemplateCategory;
    previewImageUrl: string;
    promptTemplate: string;
    imageGenerationPrompt: string;
    activeMonths?: number[];
    type: 'image' | 'video';
    animationPrompt?: string;
    sceneDescription?: string;
    ugcAction?: string;
    defaultAvatarDescription?: string;
    recommendedModel?: string;
    customUI?: 'transition-builder' | 'bullet-time';
}

export interface CampaignBrief {
    productName: string;
    productDescription: string;
    targetAudience: string;
    keySellingPoints: string[];
    brandVibe: string;
}

export interface AdCopy {
    headline: string;
    body: string;
    cta: string;
}

export interface CampaignInspiration {
    hook: string;
    strategy: string;
    concept: string;
    artDirection: string;
}

export interface UGCScriptIdea {
    hook: string;
    script?: string;
    keyMessaging?: string;
    scene: string;
    action?: string;
}

export interface SocialProofIdea {
    hook: string;
    review: string;
}

export interface ScrapedProductDetails {
    productName: string;
    productDescription: string;
    imageUrl?: string;
}

export interface CampaignPackage {
    brief: CampaignBrief;
    inspiration: CampaignInspiration;
    finalImage: UploadedFile;
    publishingPackage: PublishingPackage;
    strategy: string;
}

export interface PlatformPublishingContent {
    caption: string;
    hashtags?: string[];
    title?: string;
    audioSuggestion?: string;
}

export interface PublishingPackage {
    instagram: PlatformPublishingContent;
    tiktok: PlatformPublishingContent;
    youtube: PlatformPublishingContent;
    x?: PlatformPublishingContent;
}

export interface PlatformPublishingContentWithVariations {
    caption: string[];
    hashtags?: string[][];
    title?: string[];
    audioSuggestion?: string[];
}

export interface PublishingPackageWithVariations {
    instagram: PlatformPublishingContentWithVariations;
    tiktok: PlatformPublishingContentWithVariations;
    youtube: PlatformPublishingContentWithVariations;
    x?: PlatformPublishingContentWithVariations;
}

// --- Chat & Agent Types ---
export type ChatRole = 'user' | 'model' | 'system';

export interface ChatMessage {
    id: string;
    role: ChatRole;
    text: string;
    timestamp: number;
    // For Rich UI rendering in the chat
    attachments?: UploadedFile[]; 
    uiType?: 'text' | 'idea-cards' | 'project-preview';
    uiData?: any; // Flexible payload for component rendering
}
export interface CalendarEvent {
    id: string;
    userId: string;
    date: number; // Timestamp
    title: string;
    description?: string;
    status: 'draft' | 'generated' | 'scheduled' | 'posted';
    projectId?: string; // Linked project if generated
    // Blueprint for generation
    concept?: {
        mode: CreativeMode;
        prompt: string;
        templateId?: string;
        adStyle?: AdStyle;
    };
}
