
import React, { useEffect } from 'react';
import { useUI } from './context/UIContext';
import { useAuth } from './context/AuthContext';
import { useProjects } from './context/ProjectContext';

import { HomeScreen } from './screens/HomeScreen';
import { AuthScreen } from './screens/AuthScreen';
import { PlanSelectScreen } from './screens/PlanSelectScreen';
import { GeneratorScreen } from './screens/GeneratorScreen';
import { UGCGeneratorScreen } from './screens/UGCGeneratorScreen';
import { PreviewScreen } from './screens/PreviewScreen';
import { SubscriptionScreen } from './screens/SubscriptionScreen';
import { BillingHistoryScreen } from './screens/BillingHistoryScreen';
import { PaymentDetailsScreen } from './screens/PaymentDetailsScreen';
import { AllProjectsScreen } from './screens/AllProjectsScreen';
import { ExploreScreen } from './screens/ExploreScreen';
import { AgentScreen } from './screens/AgentScreen';
import { AgentResultScreen } from './screens/AgentResultScreen';
import { BrandingScreen } from './screens/BrandingScreen';

import { Header } from './components/Header';
import { LoadingOverlay } from './components/LoadingOverlay';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { ExtendVideoModal } from './components/ExtendVideoModal';
import { CancelSubscriptionModal } from './components/CancelSubscriptionModal';
import { ProductSelectionModal } from './components/ProductSelectionModal';
import { PlatformSelectorModal } from './components/PlatformSelectorModal';
import { ProductUploadModal } from './components/ProductUploadModal';
import { GenieChat, GenieFab } from './components/GenieChat';

// Define global interface for AIStudio window object
interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
}

// Define AppStep type
export type AppStep = 'AUTH' | 'PLAN_SELECT' | 'HOME' | 'ALL_PROJECTS' | 'GENERATE' | 'UGC_GENERATE' | 'PREVIEW' | 'SUBSCRIPTION' | 'BILLING_HISTORY' | 'PAYMENT_DETAILS' | 'EXPLORE' | 'AGENT' | 'AGENT_RESULT' | 'BRANDING' | 'AGENT_SETUP_PRODUCT';

// Main App Component
const App: React.FC = () => {
    const { 
        appStep, isLoading, isExtendModalOpen, isCancelModalOpen,
        setIsExtendModalOpen, setIsCancelModalOpen,
        productSelectionModalState, handleProductSelection,
        isPlatformSelectorOpen, setIsPlatformSelectorOpen,
        isProductUploadModalOpen, setIsProductUploadModalOpen
    } = useUI();
    const { user, handleCancelSubscription } = useAuth();
    const { 
        projectToDelete, setProjectToDelete, handleConfirmDelete, handleConfirmExtend, 
        loadProjects, setProjects, setCurrentProject, confirmTemplateSelection,
        handleEcommerceProductConfirm
    } = useProjects();

    // Check for API Key selection on mount (Production Environment Specific)
    useEffect(() => {
        const checkApiKey = async () => {
            const aistudio = (window as any).aistudio as AIStudio | undefined;
            if (aistudio && aistudio.hasSelectedApiKey) {
                const hasKey = await aistudio.hasSelectedApiKey();
                if (!hasKey) {
                    // Block app and show key selection UI if needed, 
                    // or rely on the environment's overlay if it handles it.
                    // For now, we'll assume the environment handles the initial gate, 
                    // but we can provide a fallback button here if user bypasses it.
                }
            }
        };
        checkApiKey();
    }, []);

    // This effect coordinates between Auth and Project contexts
    useEffect(() => {
        if (user) {
            loadProjects(user.email);
        } else {
            // On logout, clear project data
            setProjects([]);
            setCurrentProject(null);
        }
    }, [user, loadProjects, setProjects, setCurrentProject]);

    // This effect ensures the page scrolls to the top on every navigation change.
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [appStep]);

    // Render logic for API Key Gate
    const [hasApiKey, setHasApiKey] = React.useState(true); // Default true to avoid flicker in dev
    useEffect(() => {
        const verifyKey = async () => {
             const aistudio = (window as any).aistudio as AIStudio | undefined;
             if (aistudio) {
                 const selected = await aistudio.hasSelectedApiKey();
                 setHasApiKey(selected);
             }
        }
        verifyKey();
    }, []);

    if (!hasApiKey) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6 text-center">
                <h1 className="text-3xl font-bold mb-4">Connect Google Cloud</h1>
                <p className="mb-8 text-gray-400 max-w-md">
                    To use GenieUs, you must select a Google Cloud project with billing enabled. This ensures you have access to the generative models.
                </p>
                <button 
                    onClick={async () => {
                        const aistudio = (window as any).aistudio as AIStudio | undefined;
                        if (aistudio) {
                            await aistudio.openSelectKey();
                            // Optimistically assume success to unblock UI
                            setHasApiKey(true); 
                        }
                    }}
                    className="px-6 py-3 bg-[#91EB23] text-black font-bold rounded-lg hover:bg-[#75CB0C] transition-colors"
                >
                    Select Google Cloud API Key
                </button>
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="mt-6 text-sm text-gray-500 hover:text-white underline">
                    Learn more about billing
                </a>
            </div>
        );
    }

    const renderScreen = () => {
        if (!user && appStep !== 'AUTH') {
            return <AuthScreen />;
        }
        
        switch (appStep) {
            case 'AUTH':
                return <AuthScreen />;
            case 'PLAN_SELECT':
                return <PlanSelectScreen />;
            case 'HOME':
                return <HomeScreen />;
            case 'ALL_PROJECTS':
                 return <AllProjectsScreen />;
            case 'SUBSCRIPTION':
                 return <SubscriptionScreen />;
            case 'BILLING_HISTORY':
                return <BillingHistoryScreen />;
            case 'PAYMENT_DETAILS':
                return <PaymentDetailsScreen />;
            case 'GENERATE':
                return <GeneratorScreen />;
            case 'AGENT_SETUP_PRODUCT':
                return <GeneratorScreen />;
            case 'UGC_GENERATE':
                return <UGCGeneratorScreen />;
            case 'PREVIEW':
                return <PreviewScreen />;
            case 'EXPLORE':
                return <ExploreScreen />;
            case 'AGENT':
                return <AgentScreen />;
            case 'AGENT_RESULT':
                return <AgentResultScreen />;
            case 'BRANDING':
                return <BrandingScreen />;
            default:
                return <HomeScreen />;
        }
    };
    
    const isInitialPlanSelection = user && !user.subscription;

    return (
        <div className="min-h-screen font-sans text-gray-800 dark:text-white relative">
            {isLoading && <LoadingOverlay />}
            {user && appStep !== 'AUTH' && <Header isInitialPlanSelection={isInitialPlanSelection} />}
            <main key={appStep} className="p-4 sm:p-6 md:p-8 page-enter">
                {renderScreen()}
            </main>
            
            {/* Global Modals */}
            <DeleteConfirmationModal 
                isOpen={!!projectToDelete}
                onClose={() => setProjectToDelete(null)}
                onConfirm={handleConfirmDelete}
            />
            <ExtendVideoModal
                isOpen={isExtendModalOpen}
                onClose={() => setIsExtendModalOpen(false)}
                onConfirm={handleConfirmExtend}
            />
            <CancelSubscriptionModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                onConfirm={() => {
                    handleCancelSubscription();
                    setIsCancelModalOpen(false);
                }}
                planName={user?.subscription?.plan || ''}
                renewsOn={user?.subscription?.renewsOn || 0}
            />
            <ProductSelectionModal
                isOpen={productSelectionModalState.isOpen}
                products={productSelectionModalState.products}
                onClose={() => handleProductSelection(null)}
                onSelect={handleProductSelection}
            />
            <PlatformSelectorModal
                isOpen={isPlatformSelectorOpen}
                onClose={() => setIsPlatformSelectorOpen(false)}
                onConfirm={confirmTemplateSelection}
            />
            <ProductUploadModal
                isOpen={isProductUploadModalOpen}
                onClose={() => setIsProductUploadModalOpen(false)}
                onConfirm={handleEcommerceProductConfirm}
            />
            
            {/* Genie Co-pilot */}
            {user && appStep !== 'AUTH' && (
                <>
                    <GenieFab />
                    <GenieChat />
                </>
            )}
        </div>
    );
};

export default App;