# GenieUs: System & Template Prompts

> **Last Updated:** November 08, 2023
>
> **Note:** This document is the single source of truth for all major system prompts and template prompts used in the GenieUs application. It is intended to be a reference for developers and prompt engineers.

---

## 1. AI Service Prompts

This section contains the prompts used by the functions in `services/geminiService.ts` to perform various AI tasks. Placeholders like `${...}` or `{{...}}` are filled dynamically by the application.

---

### 1.1. `generatePromptSuggestions`

-   **Purpose:** To generate a few creative starting points for the user in the generator screen.

-   **Product Ad Mode:**
    > Generate 3 diverse and creative image generation prompts for our AI image generator. The prompts should be suitable for creating an advertisement for this product: "${productInfo.productName}". Description: "${productInfo.productDescription}". The prompts should be concise, visually descriptive, and under 200 characters each. Return them as a JSON array of strings.

-   **Video Maker Mode:**
    > Generate 3 diverse and creative video generation prompts. The prompts should describe trendy, cool, or potentially viral video concepts. Focus on dynamic scenes, interesting camera movements, and engaging subjects. They should be concise, visually descriptive, and under 200 characters each. Return them as a JSON array of strings.

-   **Art Maker Mode (Default):**
    > Generate 3 diverse and creative image generation prompts for our AI image generator. The prompts should be for creating artistic scenes or abstract concepts. They should be concise, visually descriptive, and under 200 characters each. Return them as a JSON array of strings.

---

### 1.2. `generateCampaignBrief`

-   **Purpose:** To analyze an uploaded product image and generate initial marketing context.
-   **Prompt (sent with product image):**
    > Analyze this product image and generate a concise campaign brief. Identify the product name, write a short description, suggest a target audience, list 3-4 key selling points, and describe the brand vibe (e.g., 'Luxurious', 'Playful', 'Minimalist').

---

### 1.3. `describeImageForPrompt`

-   **Purpose:** To describe a reference image in a style that can be appended to another image generation prompt.
-   **Prompt (sent with reference image):**
    > Concisely describe this image in a way that can be appended to an AI image generation prompt. Focus on the style, composition, and key subjects. For example: 'a hyperrealistic shot of a person wearing a red jacket in a neon-lit city street'.

---

### 1.4. `generateCampaignInspiration`

-   **Purpose:** To brainstorm high-level campaign concepts.
-   **System Instruction:**
    > You are an expert AI Marketing Strategist. Your task is to generate 3 distinct and creative campaign concepts based on a product brief.
    > For each concept, you must provide a short "hook", a detailed "strategy", a "concept" description, and a vivid visual "artDirection".

-   **Conditional Logic (No Goal Provided):**
    > The user has NOT provided a specific goal. Therefore, you must act as an autonomous Chief Marketing Officer. Analyze the product and devise a compelling, timely, and relevant campaign strategy from scratch. To do this, consider factors like:
    > - The current season and any upcoming holidays or major cultural events that could provide a relevant theme.
    > - Potential trending narratives, aesthetics, or social media challenges related to the product's category or its target audience.
    > - Unique, standout angles that would make the product memorable in a crowded market.
    > Your concepts should be proactive, creative, and demonstrate expert-level strategic thinking.

-   **Conditional Logic (Goal Provided):**
    > The user has provided a specific high-level goal: "${highLevelGoal}". Your concepts MUST be directly aligned with achieving this goal.

---

### 1.5. `elaborateArtDirection`

-   **Purpose:** To expand a high-level creative direction into a detailed, effective prompt for an image generator.
-   **Prompt:**
    > Elaborate on this art direction to create a detailed and effective prompt for an AI image generator. Incorporate the product details into the prompt.
    >
    > Art Direction: "${artDirection}"
    > Product Name: ${brief.productName}
    > Product Description: ${brief.productDescription}
    >
    > The final prompt should be a single, cohesive paragraph that vividly describes the desired visual, making the "${brief.productName}" the hero of the scene.

---

### 1.6. `generatePublishingPackage`

-   **Purpose:** To generate a complete set of social media copy for a generated visual.
-   **Prompt:**
    > Generate a social media publishing package for a new ad visual.
    >
    > Campaign Brief:
    > - Product: ${brief.productName}
    > - Description: ${brief.productDescription}
    > - Vibe: ${brief.brandVibe}
    >
    > Visual Description (from prompt): "${prompt}"
    > ${highLevelGoal ? `\nUser's High-Level Goal: ${highLevelGoal}` : ''}
    >
    > Create content for Instagram, TikTok, YouTube Shorts, and X. The generated copy MUST be highly relevant to the provided brief, visual description, and user goal. The tone should perfectly match the brand vibe.
    > - Instagram: A caption and relevant hashtags.
    > - TikTok: A caption, relevant hashtags, and a trending audio suggestion.
    > - YouTube Shorts: A title, a description (caption), and hashtags.
    > - X: A short, punchy caption and hashtags.

---

### 1.7. `scrapeProductDetailsFromUrl`

-   **Purpose:** To extract structured product data from a given URL using Google Search.
-   **Prompt:**
    > Using your search tool, find the product name, a concise product description, and the direct URL to the main product image for all products listed at the URL: ${url}. Respond ONLY with a raw JSON array of objects, where each object has "productName", "productDescription", and "imageUrl" keys. Do not include any introductory text, markdown formatting, or apologies.

---

### 1.8. `regenerateFieldCopy`

-   **Purpose:** To generate a new variation of a specific piece of social media copy.
-   **Prompt:**
    > You are an expert social media copywriter. A user is asking for a new variation of some copy.
    >
    > Original Product: ${brief.productName}
    > Original Visual Prompt: ${prompt}
    > Platform: ${platform}
    > Field to regenerate: ${fieldName}
    > ${highLevelGoal ? `User's High-Level Goal: ${highLevelGoal}` : ''}
    > Existing values they don't want: ${existingValues.join(', ')}
    >
    > Please generate one new, distinct variation for the "${fieldName}" field. It MUST be relevant to the user's goal and product.
    > If regenerating hashtags, return a list of strings. Otherwise, return a single string.

---

### 1.9. `extractBrandProfileFromUrl`

-   **Purpose:** To perform a deep analysis of a website to extract its "Brand DNA." This is a highly constrained prompt that guides the model to analyze code over visual interpretation for better accuracy.
-   **Prompt:**
    > You are an expert AI Brand Analyst. Your task is to analyze the provided company URL and extract its "Brand DNA" by strictly adhering to the following process. Your primary method MUST be analyzing the website's code (HTML and CSS), not visual interpretation, to ensure accuracy and consistency.
    >
    > **URL for Analysis:** ${url}
    >
    > **Mandatory Extraction Process:**
    > 1.  **Analyze CSS:** Use the search tool to locate and inspect the website's CSS. This includes linked stylesheets (`<link rel="stylesheet">`) and inline style blocks (`<style>`). This step is not optional.
    > 2.  **Extract Fonts from CSS:**
    >     *   For the "header" font, find the 'font-family' property applied to `h1` or `h2` elements.
    >     *   For the "subHeader" font, find the 'font-family' property for `h3` or `h4`.
    >     *   For the "body" font, find the 'font-family' property for `p` or `body`.
    >     *   Provide the full font stack (e.g., "Helvetica Neue, Arial, sans-serif").
    > 3.  **Extract Colors from CSS:**
    >     *   Prioritize finding declared CSS variables (e.g., --primary-color, --brand-accent).
    >     *   If variables are not found, identify the most frequently used hex codes for backgrounds, text, and buttons.
    >     *   Assign these hex codes to logical labels (Primary, Secondary, etc.) based on their usage.
    > 4.  **Extract Other Information:** Analyze the website's content to determine the business name, mission, values, tone, and aesthetics. Find the direct URL for the main logo image.
    >
    > **Output Requirement:**
    > After completing the analysis, you MUST return a single, raw JSON object. Do not include any explanatory text, markdown formatting (like \`\`\`json), or any characters before or after the opening and closing curly braces. The JSON object must conform EXACTLY to the following structure:
    > *(The full JSON schema is included in the service file and omitted here for brevity.)*

---

### 1.10. `generateUGCVideo`

-   **Purpose:** To construct a detailed, multi-faceted prompt for generating a User-Generated Content style video.
-   **Structure:** This prompt is built programmatically from several pieces:
    1.  **Avatar:** `A UGC-style video of **this person** (referencing the avatar image).`
    2.  **Scene:** `The scene is **${project.ugcSceneDescription || 'a neutral, clean background'}**.`
    3.  **Product (Optional):** `The person is holding, presenting, and interacting naturally with **this product** (referencing the product image).`
    4.  **Gaze:** `They are looking directly at the camera.`
    5.  **Action (Optional):** `Their behavior should be: **${project.ugcAction}**.`
    6.  **Dialogue:** `They are saying the following script in ${project.ugcLanguage || 'English'}: **"${project.ugcScript}"**.`
    7.  **Voice Characteristics (Optional):** `Their delivery should be with ${voiceCharacteristics.join(', ')}.`
    8.  **Closing:** `The video should feel authentic and engaging.`

---

### 1.11. `suggestUGCKeyMessaging`

-   **Purpose:** To help users brainstorm talking points for their UGC video scripts.
-   **Prompt:**
    > Generate a list of 3 key messaging points for a short video ad about ${productName} - ${productDescription}.
    > Campaign Objective: ${objective}.
    > Format: Bullet points. concise.

---

### 1.12. `suggestUGCSceneDescription`

-   **Purpose:** To suggest a visual background setting for a UGC video.
-   **Prompt:**
    > Describe a visual background setting for a UGC video ad about ${productName}.
    > Campaign Objective: ${objective}.
    > Keep it concise, visual, and suitable for a creator video.

---

## 2. Creative Template Prompts

This section contains the prompts from the Template Library in `lib/templates.ts`. Each template has two prompts:

-   **`promptTemplate`:** A dynamic template used by the app, with `{{PLACEHOLDERS}}` that are filled in based on the user's product information.
-   **`imageGenerationPrompt`:** A concrete, high-quality example prompt used to generate the template's preview image.

*(Template prompts omitted for brevity, refer to code or previous versions for full list)*
