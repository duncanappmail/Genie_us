# GenieUs: Comprehensive Feature Documentation

> **Last Updated:** November 08, 2023

> **Note for Future Updates:** This document is the single source of truth for all implemented features in the GenieUs application. It is intended for Product Managers and Developers to track and understand the current state of the platform's capabilities.
>
> When adding a new feature or modifying an existing one, please adhere to the established structure for each feature section and **always update the 'Last Updated' date at the top of this document.**
>
> -   **[Feature Name]:** The main heading for the feature.
> -   **User Value:** Explain *why* this feature exists from the user's perspective. What problem does it solve?
> -   **User Flow & Functionality:** Describe *how* a user interacts with the feature, step-by-step.
> -   **Technical Implementation:** Provide a high-level technical breakdown for developers.
>     -   **Primary Screens/Components:** List the main UI files involved.
>     -   **Core Logic:** Point to the key logic files (contexts, services) and specific functions.
>     -   **Data Models:** Reference the relevant interfaces from `types.ts`.
>     -   **Notes:** Add any other important technical details, such as the specific AI model used or any unique constraints.

---

## 1. Introduction

This document provides a comprehensive overview of the features and functionalities implemented in the GenieUs application. It is structured to give a clear understanding of the platform's capabilities, from core content creation modes to advanced AI-powered automation and user management.

---

## 2. Core Creative Modes

These are the primary entry points for users to begin the creation process, accessible from the `HomeScreen`.

### 2.1. Product Ad

-   **User Value:** Enables e-commerce sellers to create professional, ad-ready visuals of their products in any imagined scene without needing physical photoshoots, saving time and money.
-   **User Flow & Functionality:**
    1.  The user starts a "Product Ad" project from the `HomeScreen`.
    2.  On the `GeneratorScreen` ("Add Your Product" step), they can either import from a URL (top) or upload a product image (bottom).
    3.  Upon upload/import, the AI analyzes the product (generating a `CampaignBrief`).
    4.  **Creative Direction:** The user enters a prompt in a "Command Center" style input. This input area includes tools to upload reference images and buttons for "Campaign Inspiration" and "Visual Inspiration".
    5.  **Settings:** The user selects an AI Model (`gemini-3-pro-image-preview` for high fidelity), aspect ratio, image quality, and batch size.
    6.  The AI generates a new visual that composites the user's product into the described scene.
-   **Technical Implementation:**
    -   **Primary Screens/Components:** `HomeScreen`, `GeneratorScreen`, `ProductScraper`, `Uploader`
    -   **Core Logic:** `ProjectContext.tsx` (state), `geminiService.ts#generateContent` (using `gemini-3-pro-image-preview` or `gemini-2.5-flash-image`).
    -   **Data Models:** `Project`, `UploadedFile`, `CampaignBrief`
    -   **Notes:** Leverages `gemini-3-pro-image-preview` for high-quality image composition and editing capabilities (generateContent).

### 2.2. Art Maker

-   **User Value:** Provides a flexible canvas for users to transform any text idea into a unique piece of visual art, enabling creative expression and content creation for blogs, social media, or personal projects.
-   **User Flow & Functionality:**
    1.  The user starts an "Art Maker" project from the `HomeScreen`.
    2.  On the `GeneratorScreen`, they describe their vision in the prompt input.
    3.  Optionally, they can upload up to four reference images.
    4.  Settings layout matches Product Ad (Model on top row, other settings below).
    5.  The AI generates a new image based on the text prompt.
-   **Technical Implementation:**
    -   **Primary Screens/Components:** `HomeScreen`, `GeneratorScreen`
    -   **Core Logic:** `ProjectContext.tsx` (state), `geminiService.ts` (logic routes to `generateImages` for Imagen models or `generateContent` for Gemini models).
    -   **Data Models:** `Project`, `UploadedFile`

### 2.3. Video Maker

-   **User Value:** Empowers users to create short-form video content from simple text prompts or static images, lowering the barrier to video production for social media and marketing.
-   **User Flow & Functionality:**
    1.  The user starts a "Video Maker" project (Pro Plan required).
    2.  On the `GeneratorScreen`, they describe a scene or action.
    3.  **Settings:** They select Resolution (720p/1080p), Duration (4s/7s/10s), Aspect Ratio, and AI Model.
    4.  (Advanced) They can set a start/end frame or add camera controls.
    5.  The AI generates a short video clip.
-   **Technical Implementation:**
    -   **Primary Screens/Components:** `HomeScreen`, `GeneratorScreen`, `AdvancedVideoSettings`
    -   **Core Logic:** `ProjectContext.tsx`, `geminiService.ts#generateVideos` (using `veo` models).
    -   **Data Models:** `Project`, `UploadedFile`
    -   **Notes:** Requires `window.aistudio.hasSelectedApiKey()` check.

### 2.4. Create a UGC Video

-   **User Value:** Allows brands to generate authentic-looking User-Generated Content (UGC) style videos with an AI avatar, providing a scalable way to create testimonials, explainers, or social media content without hiring actors.
-   **User Flow & Functionality:**
    1.  The user starts a "Create a UGC Video" project (Pro Plan required).
    2.  **Setup:** Choose a style (e.g., Just Talking, Product Showcase). For Product Showcase, upload a product image.
    3.  **Scene & Story:**
        -   **Topic/Objective:** Enter a topic (Just Talking) or select a Campaign Objective (Product Showcase).
        -   **Script & Scene:** Enter the script and scene description. AI "Suggest" buttons are available for assistance.
        -   **Settings:** Select Language, Accent, and Emotion.
    4.  **Customize Avatar:** A 3-card dashboard allows selection between "AI Generated", "Use My Avatar" (Upload with preview), or "Select Avatar" (Template with preview).
    5.  **Production:** Configure Resolution, Duration, Aspect Ratio, and AI Model.
    6.  The AI generates a video of the avatar performing the action and speaking the dialogue.
-   **Technical Implementation:**
    -   **Primary Screens/Components:** `HomeScreen`, `UGCGeneratorScreen`
    -   **Core Logic:** `ProjectContext.tsx` (state), `geminiService.ts#generateUGCVideo` (using `veo` models), `geminiService.ts#suggestUGCKeyMessaging`.
    -   **Data Models:** `Project`, `UploadedFile`
    -   **Notes:** Combines multimodal prompting to guide the video generation (Avatar Image + Product Image + Text Prompt).

---

## 3. AI-Powered Automation & Strategy

These features leverage AI to perform strategic tasks, accelerating the marketing workflow.

### 3.1. AI Agent: The Autonomous Marketing Genie

-   **User Value:** Acts as an "CMO-in-a-box" by autonomously generating a complete, ready-to-launch marketing campaign from a single product image, saving users immense time in strategy, copywriting, and creative direction.
-   **User Flow & Functionality:**
    1.  The user starts the "AI Agent" ("From Product URL to an Ad") module on the `HomeScreen`.
    2.  They enter a URL or upload a product image.
    3.  **Agent Screen:** The user sees a "Product Preview Card" confirming the scraped/uploaded details and can add a high-level goal.
    4.  Upon launch, a loading screen shows the agent's real-time thought process.
    5.  The user is taken to the `AgentResultScreen`, presenting the final visual, strategy summary, and social media copy.
-   **Technical Implementation:**
    -   **Primary Screens/Components:** `HomeScreen`, `AgentScreen`, `AgentResultScreen`, `LoadingOverlay`
    -   **Core Logic:** `ProjectContext.tsx#runAgent`, `geminiService.ts` chain.
    -   **Data Models:** `Project`, `CampaignPackage`

### 3.2. Brand DNA

-   **User Value:** Ensures all AI-generated content is consistent and on-brand by creating a persistent, editable brand profile that can be used to guide future generations.
-   **User Flow & Functionality:**
    1.  The user navigates to "Brand DNA".
    2.  They input a website URL.
    3.  The AI analyzes the site (using Google Search grounding) and populates the profile (Logo, Colors, Fonts, Mission, etc.).
    4.  The user can manually edit any field.
    5.  The profile is stored locally via IndexedDB.
-   **Technical Implementation:**
    -   **Primary Screens/Components:** `BrandingScreen.tsx`
    -   **Core Logic:** `AuthContext.tsx`, `geminiService.ts#extractBrandProfileFromUrl`.
    -   **Data Models:** `BrandProfile`

---

## 4. Technical Foundation

### 4.1. API Key Management
-   **Mechanism:** The application requires users to select their own Google Cloud API key via a secure environment method.
-   **Implementation:** `App.tsx` checks `window.aistudio.hasSelectedApiKey()` on load. If false, it renders a "Connect API Key" landing page that triggers `window.aistudio.openSelectKey()`. This ensures 403 errors are minimized and users are properly authenticated for paid models like Veo.

### 4.2. CORS Proxying
-   **Mechanism:** To handle image fetching from external URLs (product scraping, avatar templates) within a client-side environment, a robust CORS proxy fallback strategy is implemented.
-   **Implementation:** `geminiService.ts#fetchWithProxies` attempts direct fetch, then falls back to `corsproxy.io` and `allorigins.win`.

### 4.3. Client-Side Persistence
-   **Mechanism:** All project data and large assets (images/videos) are stored locally in the browser using IndexedDB.
-   **Implementation:** `dbService.ts` manages the `GenieUsDB` with `projects` and `files` stores.
