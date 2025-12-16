
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppStep } from '../App';
import type { ScrapedProductDetails } from '../types';

export type AgentStatusMessage = {
    type: 'thought' | 'action' | 'result' | 'done';
    content: string;
};

type ProductSelectionModalState = {
    isOpen: boolean;
    products: ScrapedProductDetails[];
    resolve: ((value: ScrapedProductDetails | null) => void) | null;
};

type UIContextType = {
    appStep: AppStep;
    navigateTo: (step: AppStep) => void;
    goBack: () => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    error: string | null;
    setError: (error: string | null) => void;
    isExtendModalOpen: boolean;
    setIsExtendModalOpen: (isOpen: boolean) => void;
    isCancelModalOpen: boolean;
    setIsCancelModalOpen: (isOpen: boolean) => void;
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    agentStatusMessages: AgentStatusMessage[];
    setAgentStatusMessages: React.Dispatch<React.SetStateAction<AgentStatusMessage[]>>;
    generationStatusMessages: string[];
    setGenerationStatusMessages: React.Dispatch<React.SetStateAction<string[]>>;
    openProductSelectionModal: (products: ScrapedProductDetails[]) => Promise<ScrapedProductDetails | null>;
    productSelectionModalState: {
        isOpen: boolean;
        products: ScrapedProductDetails[];
    };
    handleProductSelection: (product: ScrapedProductDetails | null) => void;
    productAdStep: number;
    setProductAdStep: React.Dispatch<React.SetStateAction<number>>;
    isPlatformSelectorOpen: boolean;
    setIsPlatformSelectorOpen: (isOpen: boolean) => void;
    isProductUploadModalOpen: boolean;
    setIsProductUploadModalOpen: (isOpen: boolean) => void;
    productUploadModalContext: 'product' | 'person';
    setProductUploadModalContext: React.Dispatch<React.SetStateAction<'product' | 'person'>>;
};

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [appStep, setAppStep] = useState<AppStep>('AUTH');
    const [history, setHistory] = useState<AppStep[]>(['AUTH']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [theme, rawSetTheme] = useState<'light' | 'dark'>('dark');
    const [agentStatusMessages, setAgentStatusMessages] = useState<AgentStatusMessage[]>([]);
    const [generationStatusMessages, setGenerationStatusMessages] = useState<string[]>([]);
    const [productSelectionModalState, setProductSelectionModalState] = useState<ProductSelectionModalState>({
        isOpen: false,
        products: [],
        resolve: null,
    });
    const [productAdStep, setProductAdStep] = useState(1);
    const [isPlatformSelectorOpen, setIsPlatformSelectorOpen] = useState(false);
    const [isProductUploadModalOpen, setIsProductUploadModalOpen] = useState(false);
    const [productUploadModalContext, setProductUploadModalContext] = useState<'product' | 'person'>('product');

    const setTheme = useCallback((newTheme: 'light' | 'dark') => {
        rawSetTheme(newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', newTheme);
    }, []);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        // Default to dark unless 'light' is explicitly saved
        if (savedTheme === 'light') {
            setTheme('light');
        } else {
            setTheme('dark');
        }
    }, [setTheme]);

    const navigateTo = useCallback((step: AppStep) => {
        setHistory(prev => [...prev, step]);
        setAppStep(step);
    }, []);

    const goBack = useCallback(() => {
        setHistory(prev => {
            if (prev.length <= 1) return prev;
            const newHistory = [...prev];
            newHistory.pop();
            const prevStep = newHistory[newHistory.length - 1] || 'HOME';
            setAppStep(prevStep);
            return newHistory;
        });
    }, []);

    const openProductSelectionModal = useCallback((products: ScrapedProductDetails[]) => {
        return new Promise<ScrapedProductDetails | null>((resolve) => {
            setProductSelectionModalState({ isOpen: true, products, resolve });
        });
    }, []);

    const handleProductSelection = useCallback((product: ScrapedProductDetails | null) => {
        if (productSelectionModalState.resolve) {
            productSelectionModalState.resolve(product);
        }
        setProductSelectionModalState({ isOpen: false, products: [], resolve: null });
    }, [productSelectionModalState.resolve]);


    const value: UIContextType = {
        appStep, navigateTo, goBack,
        isLoading, setIsLoading,
        error, setError,
        isExtendModalOpen, setIsExtendModalOpen,
        isCancelModalOpen, setIsCancelModalOpen,
        theme, setTheme,
        agentStatusMessages, setAgentStatusMessages,
        generationStatusMessages, setGenerationStatusMessages,
        openProductSelectionModal,
        productSelectionModalState: {
            isOpen: productSelectionModalState.isOpen,
            products: productSelectionModalState.products,
        },
        handleProductSelection,
        productAdStep, setProductAdStep,
        isPlatformSelectorOpen, setIsPlatformSelectorOpen,
        isProductUploadModalOpen, setIsProductUploadModalOpen,
        productUploadModalContext, setProductUploadModalContext
    };

    return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};
