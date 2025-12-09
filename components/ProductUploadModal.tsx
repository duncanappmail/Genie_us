import React, { useState, useEffect } from 'react';
import { ModalWrapper } from './ModalWrapper';
import { Uploader } from './Uploader';
import { ProductScraper } from './ProductScraper';
import { useUI } from '../context/UIContext';
import type { UploadedFile } from '../types';
import { validateProductImage, generateCampaignBrief } from '../services/geminiService';
import { AssetPreview } from './AssetPreview';
import { XMarkIcon, SparklesIcon } from './icons';

interface ProductUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { file: UploadedFile | null; url?: string; name?: string; description?: string }) => void;
    mode?: 'create' | 'edit';
    initialData?: {
        file: UploadedFile | null;
        url?: string;
        name?: string;
        description?: string;
    };
}

const ANALYSIS_MESSAGES = [
    "Analyzing image details...",
    "Identifying key features...",
    "Crafting product description...",
    "Finalizing details..."
];

export const ProductUploadModal: React.FC<ProductUploadModalProps> = ({ isOpen, onClose, onConfirm, mode = 'create', initialData }) => {
    const { setIsLoading, setGenerationStatusMessages, setError } = useUI();
    const [file, setFile] = useState<UploadedFile | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisMessage, setAnalysisMessage] = useState(ANALYSIS_MESSAGES[0]);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [productName, setProductName] = useState('');
    const [productDescription, setProductDescription] = useState('');
    const [scrapedUrl, setScrapedUrl] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && initialData) {
                setFile(initialData.file);
                setProductName(initialData.name || '');
                setProductDescription(initialData.description || '');
                setScrapedUrl(initialData.url || '');
                setValidationError(null);
            } else if (mode === 'create') {
                // Reset for fresh upload
                setFile(null);
                setProductName('');
                setProductDescription('');
                setScrapedUrl('');
                setValidationError(null);
            }
        }
    }, [isOpen, mode, initialData]);

    // Message cycling effect
    useEffect(() => {
        let interval: number;
        if (isAnalyzing) {
            let index = 0;
            setAnalysisMessage(ANALYSIS_MESSAGES[0]);
            interval = window.setInterval(() => {
                index = (index + 1) % ANALYSIS_MESSAGES.length;
                setAnalysisMessage(ANALYSIS_MESSAGES[index]);
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [isAnalyzing]);

    const handleFileUpload = async (uploadedFile: UploadedFile) => {
        setFile(uploadedFile);
        setValidationError(null);
        setIsValidating(true);
        setError(null);
        
        if (mode === 'create') {
            setProductName('');
            setProductDescription('');
            setScrapedUrl('');
        }

        try {
            const isValid = await validateProductImage(uploadedFile);
            if (!isValid) {
                setValidationError("Please upload a clear product image on a plain background.");
                setIsValidating(false);
                return;
            }
            setIsValidating(false);

            // Auto-analyze product details if fields are empty
            if (!productName || !productDescription) {
                setIsAnalyzing(true);
                try {
                    const brief = await generateCampaignBrief(uploadedFile);
                    setProductName(brief.productName);
                    setProductDescription(brief.productDescription);
                } catch (analyzeErr) {
                    console.warn("Analysis failed", analyzeErr);
                } finally {
                    setIsAnalyzing(false);
                }
            }

        } catch (e: any) {
            console.error("Failed to validate product image", e);
            setValidationError("Could not validate image. Please try again.");
            setIsValidating(false);
        }
    };

    const handleScraped = (data: { name: string; description: string; file: UploadedFile | null; url: string }) => {
        setProductName(data.name);
        setProductDescription(data.description);
        setScrapedUrl(data.url);
        if (data.file) {
            setFile(data.file);
            setValidationError(null); 
        }
    };

    const handleContinue = () => {
        onConfirm({
            file,
            url: scrapedUrl,
            name: productName,
            description: productDescription
        });
    };

    const handleRemoveFile = () => {
        setFile(null);
        if (mode === 'create') {
            setProductName('');
            setProductDescription('');
            setScrapedUrl('');
        }
        setValidationError(null);
    };

    const isEditMode = mode === 'edit';
    
    // Determine if we should show the bottom section (Analysis or Form)
    // We show it if we are analyzing OR if we have data to show
    const showBottomSection = isAnalyzing || ((file && !isValidating) || productName || productDescription);

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose}>
            <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl p-6 flex flex-col transition-all duration-300`}>
                <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {isEditMode ? 'Edit Product Details' : 'Upload Your Product'}
                    </h3>
                </div>

                <div className="space-y-6">
                    {/* URL Scraper - Show in CREATE mode */}
                    {!isEditMode && (
                        <div className={isAnalyzing ? "opacity-50 pointer-events-none" : ""}>
                            <ProductScraper 
                                onProductScraped={handleScraped}
                                setIsLoading={setIsLoading}
                                setStatusMessages={setGenerationStatusMessages}
                                setError={setError}
                            />

                            <div className="relative mt-6">
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">OR</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {file ? (
                        // ----------------------------------------------------------------------
                        // UPLOADED STATE: Grid Layout for Desktop (1/3 Image, 2/3 Form)
                        // ----------------------------------------------------------------------
                        <div className="flex flex-col md:grid md:grid-cols-3 md:gap-8">
                            {/* Left Column: Label + Image */}
                            <div className="w-full flex flex-col items-start md:col-span-1 h-full">
                                <label className="block mb-2 md:mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide self-start w-full">
                                    {isEditMode ? 'Product Image' : 'Product Image'}
                                </label>
                                <div className="flex flex-col items-start gap-2 w-full">
                                    {/* 
                                        Square Container: 
                                        - 'relative w-full aspect-square': Enforces 1:1 ratio.
                                        - Content is absolutely positioned to ensure it fits perfectly without distorting container.
                                        - Removed overflow-hidden from outer container to prevent clipping of the remove button.
                                    */}
                                    <div className="relative w-full aspect-square group rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                        {/* Inner content wrapper with padding */}
                                        <div className="absolute inset-0 p-4 flex items-center justify-center">
                                            {/* Container needs relative to position the button absolutely against it */}
                                            <div className="relative w-full h-full shadow-sm">
                                                {/* Image wrapper - clips image corners */}
                                                <div className="w-full h-full rounded-md overflow-hidden">
                                                    <AssetPreview asset={file} objectFit="cover" />
                                                </div>
                                                
                                                {!isValidating && !isAnalyzing && (
                                                    <button 
                                                        onClick={handleRemoveFile}
                                                        className="absolute -top-3 -right-3 z-10 flex items-center justify-center w-6 h-6 bg-black text-white rounded-full shadow-lg hover:bg-gray-800 transition-colors"
                                                        title="Remove Image"
                                                    >
                                                        <XMarkIcon className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Validation Overlay */}
                                        {isValidating && (
                                            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20 rounded-lg">
                                                <div className="text-white font-semibold flex items-center gap-2 text-xs">
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    Verifying...
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {validationError && (
                                        <div className="w-full p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-2 mt-2">
                                            <XMarkIcon className="w-4 h-4 shrink-0" />
                                            <span>{validationError}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column: Analysis or Form */}
                            <div className="w-full md:col-span-2 mt-6 md:mt-0 flex flex-col h-full">
                                {showBottomSection && (
                                    <div className="w-full animate-in fade-in slide-in-from-top-2 duration-300 h-full flex flex-col">
                                        {isAnalyzing ? (
                                            <>
                                                <label className="block mb-2 md:mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                    Status
                                                </label>
                                                <div className="flex flex-col items-center justify-center space-y-4 p-8 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700 flex-1 min-h-[160px]">
                                                    <div className="relative">
                                                        <div className="w-12 h-12 border-4 border-brand-accent/30 rounded-full"></div>
                                                        <div className="absolute top-0 left-0 w-12 h-12 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <SparklesIcon className="w-5 h-5 text-brand-accent animate-pulse" />
                                                        </div>
                                                    </div>
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white animate-pulse">
                                                        {analysisMessage}
                                                    </p>
                                                </div>
                                            </>
                                        ) : (
                                            /* Form Fields State */
                                            <div className="space-y-4">
                                                <div>
                                                    <label htmlFor="modalProductName" className="block mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product Name</label>
                                                    <input 
                                                        id="modalProductName"
                                                        type="text" 
                                                        value={productName} 
                                                        onChange={(e) => setProductName(e.target.value)} 
                                                        className="w-full p-3 border rounded-lg input-focus-brand bg-white dark:bg-[#1C1E20] dark:border-gray-600 dark:text-gray-300"
                                                        placeholder="e.g., The Cozy Slipper"
                                                    />
                                                </div>
                                                <div>
                                                    <label htmlFor="modalProductDesc" className="block mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product Description</label>
                                                    <textarea 
                                                        id="modalProductDesc"
                                                        value={productDescription} 
                                                        onChange={(e) => setProductDescription(e.target.value)} 
                                                        className="w-full p-3 border rounded-lg input-focus-brand resize-none bg-white dark:bg-[#1C1E20] dark:border-gray-600 dark:text-gray-300"
                                                        placeholder="e.g., A warm and comfortable slipper..."
                                                        rows={6}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        // ----------------------------------------------------------------------
                        // INITIAL STATE: Standard Centered Stack (No File)
                        // ----------------------------------------------------------------------
                        <>
                            <div className="flex flex-col items-center">
                                <label className="block mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide self-start w-full">
                                    {isEditMode ? 'Product Image' : 'Upload Product Image'}
                                </label>
                                <div className={`w-full ${isAnalyzing ? "opacity-50 pointer-events-none" : ""}`}>
                                    <Uploader onUpload={handleFileUpload} />
                                </div>
                            </div>

                            {/* Bottom Section for Initial State (Only if text exists without file, e.g. scrape error fallback) */}
                            {showBottomSection && (
                                <div className="min-h-[200px] flex flex-col justify-center animate-in fade-in slide-in-from-top-2 duration-300">
                                    {/* Form Fields State (Analysis shouldn't trigger here without file usually) */}
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="modalProductName" className="block mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product Name</label>
                                            <input 
                                                id="modalProductName"
                                                type="text" 
                                                value={productName} 
                                                onChange={(e) => setProductName(e.target.value)} 
                                                className="w-full p-3 border rounded-lg input-focus-brand bg-white dark:bg-[#1C1E20] dark:border-gray-600 dark:text-gray-300"
                                                placeholder="e.g., The Cozy Slipper"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="modalProductDesc" className="block mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product Description</label>
                                            <textarea 
                                                id="modalProductDesc"
                                                value={productDescription} 
                                                onChange={(e) => setProductDescription(e.target.value)} 
                                                className="w-full p-3 border rounded-lg input-focus-brand resize-none bg-white dark:bg-[#1C1E20] dark:border-gray-600 dark:text-gray-300"
                                                placeholder="e.g., A warm and comfortable slipper..."
                                                rows={6}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="mt-8 flex flex-col sm:flex-row-reverse gap-3">
                    <button 
                        onClick={handleContinue} 
                        disabled={!file || isValidating || isAnalyzing || !!validationError}
                        className="w-full sm:flex-1 px-4 py-3 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isEditMode ? "Save Changes" : "Continue"}
                    </button>
                    {!isAnalyzing && (
                        <button 
                            onClick={onClose} 
                            className="w-full sm:flex-1 px-4 py-3 bg-transparent border border-[#2B2B2B] text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>
        </ModalWrapper>
    );
};
