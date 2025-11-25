# GenieUs Application Architecture

## 1. Introduction

This document outlines the software architecture and key technical decisions for the GenieUs application. The primary goal of this architecture is to support a modern, fast, and maintainable client-side application that leverages the full power of the Gemini API in the browser.

The architecture prioritizes:
- **Simplicity & Maintainability:** A clean, understandable structure that is easy for developers to work with.
- **User Experience:** A fast, responsive UI with seamless state transitions and offline data access.
- **Security & Privacy:** Keeping user data on the client-side wherever possible.
- **Rapid Development:** Utilizing modern tools and patterns to accelerate feature implementation.

---

## 2. Core Technologies

- **Frontend Framework:** **React 19** with **TypeScript** for building a type-safe, component-based user interface.
- **Styling:** **Tailwind CSS**, a utility-first CSS framework for rapid UI development.
- **AI Integration:** **@google/genai SDK**, the official library for all interactions with the Gemini family of models (Gemini 2.5, Gemini 3 Pro, Veo, Imagen).
- **Build System:** **None (ES Modules + Import Maps)**. The application leverages modern browser capabilities to load modules directly from a CDN.

---

## 3. Frontend Architecture

### Component Model
The application is structured into two primary types of components:
- **Screens (`/screens`):** Top-level components that represent a full page or view (e.g., `HomeScreen`, `GeneratorScreen`, `UGCGeneratorScreen`).
- **Components (`/components`):** Reusable, smaller UI elements (e.g., `Header`, `Uploader`, `GenericSelect`).

### State Management
- **React Context API (`AppContext.tsx`):** Used for global state management. `AppProvider` serves as a single source of truth for the application state.
- **Project Context (`ProjectContext.tsx`):** Manages the lifecycle of creative projects (creation, generation, updates).
- **UI Context (`UIContext.tsx`):** Manages ephemeral UI state like modals, loading overlays, and navigation.
- **Auth Context (`AuthContext.tsx`):** Manages user session and brand profile data.

### Navigation
- **State-based Routing:** The application uses a state variable `appStep` within `UIContext` to handle navigation. This effectively makes it a Single Page Application (SPA) without a URL router library.

---

## 4. Data Persistence & Services

### Client-Side First Strategy
GenieUs is designed as a client-side-first application.
- **IndexedDB (`dbService.ts`):** Used as the primary database for storing structured project data and large binary files (image and video `Blob`s). This allows for persistent storage of large assets without backend costs.
- **LocalStorage:** Used for lightweight user preferences (theme).

### Service Layer Pattern
- **`geminiService.ts`:** Contains all logic for communicating with the `@google/genai` SDK. It handles prompt construction, API calls for image/video generation, and parsing responses. It creates local instances of `GoogleGenAI` to ensure the latest API key is always used.
- **`dbService.ts`:** Provides a clean, promise-based API for interacting with IndexedDB.

---

## 5. Key Architectural Decisions

### 5.1. Mandatory API Key Selection
The application operates in an environment where the user must provide their own Google Cloud API key.
- **Handling:** We use the `window.aistudio` object provided by the environment.
- **Gate:** On application load (`App.tsx`), we check `await window.aistudio.hasSelectedApiKey()`. If false, we render a blocking "Connect API Key" screen.
- **Selection:** We trigger `await window.aistudio.openSelectKey()` to allow the user to securely select a project/key.
- **Usage:** The key is then automatically injected into `process.env.API_KEY`, which we use to initialize the `GoogleGenAI` client.

### 5.2. CORS Proxying for Client-Side Fetching
Since the app runs entirely in the browser, fetching images from external URLs (like product pages or avatar templates) often triggers CORS errors.
- **Solution:** A `fetchWithProxies` utility in `geminiService.ts` attempts to fetch resources directly. If that fails, it routes the request through public CORS proxies (`corsproxy.io`, `allorigins.win`) to retrieve the blob data successfully for processing.

### 5.3. Dynamic, Time-Based Templates
The "Seasonal" and "Holidays & Events" templates are not static lists. They are filtered in real-time based on the user's system date, ensuring the "Use Template" section always feels timely and relevant.
