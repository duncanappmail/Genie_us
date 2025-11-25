# GenieUs: New Feature Log

> **Last Updated:** November 08, 2023

**Audience:** This document is intended for Product Managers and Developers to stay up-to-date on the latest features and functionalities implemented in the application.

> **Note for Future Updates:** When adding a new feature, prepend a new entry at the top of the log, following the exact format below. New entries should always include the current date and a detailed breakdown under the specified headings. **Always update the 'Last Updated' date at the top of this document.**

---

## November 08, 2023

### ✨ UI/UX Restoration & Technical Stabilization

**Summary:**
A comprehensive update focused on restoring beloved UI patterns from previous versions ("Command Center" inputs, "Dashboard Card" selection) while stabilizing the technical foundation with robust API key handling and model updates.

**Key Functionalities:**
*   **"Command Center" Input Style:** Restored the clean, contained text input design for "Scene & Story" and "Creative Direction" pages. Inspiration buttons are now integrated directly into the input area.
*   **Dashboard Card Layout:** Restored the 3-card layout for the "Customize Avatar" page. "Use My Avatar" and "Select Avatar" cards now feature internal 1:1 preview zones for a more intuitive experience.
*   **Refined Generator Layout:** The "Turn ideas to visuals" and "Make a Video" settings have been restructured. The AI Model selector now sits on its own row, with other settings (Resolution, Duration, Aspect Ratio) arranged in a clean grid below.
*   **UGC "Just Talking" Specifics:** The "Scene & Story" page now intelligently adapts for non-product video types, asking for a "Topic" instead of a "Campaign Objective" and providing relevant placeholder examples.
*   **Template Flow Streamlining:** Users selecting a template now skip the redundant "Review" step and can generate immediately after adding their product.
*   **Agentic AI Flow Restoration:** Fixed the navigation flow for the AI Agent to ensure users land on the dedicated Agent Command Center rather than the generic generator.

**Technical Impact:**
*   **API Key Gating:** Implemented a mandatory check for `window.aistudio.hasSelectedApiKey()` in `App.tsx` to prevent 403 errors and ensure proper billing/quota usage.
*   **Model Updates:** Switched high-quality image generation to `gemini-3-pro-image-preview` to support `generateContent` editing capabilities that `imagen` lacks.
*   **CORS Fallback:** Implemented `fetchWithProxies` in `geminiService.ts` to reliably load external images (avatars, scraped products) without backend middleware.
*   **File Updates:** Significant refactoring in `screens/GeneratorScreen.tsx`, `screens/UGCGeneratorScreen.tsx`, and `services/geminiService.ts`.

**Purpose & Value:**
These updates bridge the gap between the advanced new functionality (UGC, Agents) and the highly polished user experience of previous versions. The technical fixes ensure reliability in the client-side environment, allowing for smooth demos and usage without CORS or Auth blockers.

---

## October 27, 2023

### ✨ New Feature: Template Organization: Image vs. Video

**Summary:**
The template discovery experience has been redesigned to clearly differentiate between "Image" and "Video" templates. This structural change improves user navigation and prepares the application for the future launch of a video template library.

**Key Functionalities:**
*   **Image/Video Toggles:** A new, prominent toggle UI has been added to the "Use Template" section on the `HomeScreen` and at the top of the `ExploreScreen`, allowing users to switch between viewing image and video templates.
*   **Improved UI Hierarchy:** On the `ExploreScreen`, the secondary category filters (e.g., All, Seasonal, Studio) have been restyled as simple text buttons, creating a clear visual distinction from the primary Image/Video tabs.
*   **"Coming Soon" State:** The "Video" tab currently displays a user-friendly "Coming Soon!" message, as no video templates have been added yet.
*   **Responsive Layout:** The "Use Template" section on the `HomeScreen` has been updated to be fully responsive, repositioning the toggle and "Explore all" button on mobile devices for a better user experience.

**Technical Impact:**
*   **Data Model Update:** The `Template` interface in `types.ts` now includes a mandatory `type` property ('image' or 'video').
*   **Library Update:** All existing templates in `lib/templates.ts` have been updated with `type: 'image'`.
*   **Screen Refactoring:**
    *   `screens/HomeScreen.tsx`: Reworked the "Use Template" section to include the new toggle, state management for the active template type, and responsive flexbox layouts.
    *   `screens/ExploreScreen.tsx`: Added top-level state for `activeTemplateType`, implemented the new toggle UI, and restyled the sub-category filter buttons.
*   **Context Update:** `context/ProjectContext.tsx`: The `selectTemplate` function was updated to inspect the template's `type` and initiate the correct creative mode (`Product Ad` for images, `Video Maker` for videos).

**Purpose & Value:**
This feature provides a scalable and intuitive foundation for expanding our content offerings. By separating templates by type, we prevent user confusion and create a clean browsing experience. It establishes the necessary data structures and UI patterns to seamlessly integrate video templates in the future.

---

## October 26, 2023

### ✨ New Feature: Brand DNA

**Summary:**
A new "Brand DNA" page has been introduced, allowing users to establish a persistent brand profile. This profile can be automatically generated by an AI agent that analyzes a user's website URL and can also be fully edited manually. The purpose of this feature is to ensure all future AI-generated content remains consistent and on-brand.

**Key Functionalities:**

1.  **Automated Brand Profile Extraction:**
    *   Users can input their website URL on the new "Brand DNA" page (`/screens/BrandingScreen.tsx`).
    *   An AI agent (`geminiService.ts#extractBrandProfileFromUrl`) is triggered to perform a deep analysis of the website's content and styling.
    *   The agent extracts the business name, logo, color palette, fonts (header, sub-header, body), mission statements, brand values, tone of voice, and brand aesthetics.

2.  **Persistent Storage:**
    *   The user's `BrandProfile` is saved locally to their browser's IndexedDB (`dbService.ts`), linked to their user ID.
    *   The profile is automatically loaded on subsequent sessions, making it readily available for future features that will leverage this data.

3.  **Full Editability & Manual Creation:**
    *   The "Brand DNA" screen provides a comprehensive interface for users to review and manually edit every field extracted by the AI. This includes adding/removing colors, changing font families, and refining mission statements. A user can also build their profile from scratch without providing a URL.

**Technical Impact:**

*   **New Type:** Introduced the `BrandProfile` interface in `types.ts`.
*   **New Screen:** Created `screens/BrandingScreen.tsx` to house the UI for fetching and editing the brand profile.
*   **New Service Logic:**
    *   `geminiService.ts` now includes `extractBrandProfileFromUrl` and `fetchLogo` functions to handle the AI analysis and asset retrieval.
    *   `dbService.ts` has been updated with `saveBrandProfile`, `getBrandProfile`, and `deleteBrandProfile` to manage persistence.
*   **Context Updates:** `AuthContext.tsx` now manages the state for the user's `brandProfile` and orchestrates the fetching and saving operations.
*   **UI Integration:** A "Brand DNA" link has been added to the main `Header.tsx` component for easy access.

**Purpose & Value:**
This feature is a foundational step towards hyper-personalized content generation. By establishing a clear brand identity, we can ensure that all future AI outputs (images, videos, and copy) are not just creative, but also perfectly aligned with the user's specific brand, significantly increasing the value and utility of the platform.
