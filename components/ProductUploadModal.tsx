import React, { useState, useEffect } from 'react';
import { ModalWrapper } from './ModalWrapper';
import { Uploader } from './Uploader';
import { ProductScraper } from './ProductScraper';
import { useUI } from '../context/UIContext';
import type { UploadedFile } from '../types';
import { validateProductImage, generateCampaignBrief } from '../services/geminiService';
import { AssetPreview } from './AssetPreview';
import { XMarkIcon } from './icons';

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

// Internal Skeleton Component for consistent loading state
const SkeletonField = ({ className }: { className?: string }) => (
    <div className={`rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 relative overflow-hidden ${className}`}>
        <div className="absolute inset-0 bg-gray-200/50 dark:bg-gray-600/30 animate-pulse"></div>
    </div>
);

export const ProductUploadModal: React.FC<ProductUploadModalProps> = ({ isOpen, onClose, onConfirm, mode = 'create', initialData }) => {
    const { setIsLoading, setGenerationStatusMessages, setError } = useUI();
    const [file, setFile] = useState<UploadedFile | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
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

    const handleFileUpload = async (uploadedFile: UploadedFile) => {
        setFile(uploadedFile);
        setValidationError(null);
        setIsValidating(true);
        setError(null);
        
        // Only reset text fields if in create mode or if the user is uploading a new file to replace existing
        // Actually, usually when uploading a new image, we want to re-analyze or clear old analysis.
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

    // Show details if:
    // 1. Analyzing (pulsating state)
    // 2. We have a file AND validation is done (manual entry fallback)
    // 3. We have scraped/entered data
    const shouldShowDetails = isAnalyzing || (file && !isValidating) || productName || productDescription;

    const isEditMode = mode === 'edit';

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl p-6 flex flex-col">
                <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {isEditMode ? 'Edit Product Details' : 'Upload Your Product'}
                    </h3>
                </div>

                <div className="space-y-6">
                    {/* URL Scraper - Only show in CREATE mode */}
                    {!isEditMode && (
                        <>
                            <ProductScraper 
                                onProductScraped={handleScraped}
                                setIsLoading={setIsLoading}
                                setStatusMessages={setGenerationStatusMessages}
                                setError={setError}
                            />

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">OR</span>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Main Uploader */}
                    <div className="flex flex-col items-center">
                        <label className="block mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide self-start w-full">
                            {isEditMode ? 'Product Image' : 'Upload Product Image'}
                        </label>
                        {file ? (
                            <div className="flex flex-col items-center gap-2">
                                <div className="relative w-40 h-40 group">
                                    {/* Preview container matching new style: aspect square, centered, cover */}
                                    <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                                        <AssetPreview asset={file} objectFit="cover" />
                                    </div>
                                    
                                    {!isValidating && !isAnalyzing && (
                                        <button 
                                            onClick={handleRemoveFile}
                                            className="absolute -top-2 -right-2 z-10 flex items-center justify-center w-6 h-6 bg-black text-white dark:bg-white dark:text-black rounded-full shadow-md hover:bg-gray-800 transition-colors"
                                        >
                                            <XMarkIcon className="w-3 h-3" />
                                        </button>
                                    )}
                                    
                                    {/* Combined Overlay for Validation and Analysis */}
                                    {(isValidating || isAnalyzing) && (
                                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-lg z-20">
                                            <div className="text-white font-semibold flex items-center gap-2 text-xs">
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                {isValidating ? "Verifying..." : "Analyzing..."}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {validationError && (
                                    <div className="w-full max-w-xs p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-2">
                                        <XMarkIcon className="w-4 h-4" />
                                        {validationError}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="w-full">
                                <Uploader onUpload={handleFileUpload} />
                            </div>
                        )}
                    </div>

                    {/* Product Details Inputs */}
                    {shouldShowDetails && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div>
                                <label htmlFor="modalProductName" className="block mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product Name</label>
                                {isAnalyzing ? (
                                    <SkeletonField className="h-[50px]" />
                                ) : (
                                    <input 
                                        id="modalProductName"
                                        type="text" 
                                        value={productName} 
                                        onChange={(e) => setProductName(e.target.value)} 
                                        className="w-full p-3 border rounded-lg input-focus-brand bg-white dark:bg-[#1C1E20] dark:border-gray-600 dark:text-gray-300"
                                        placeholder="e.g., The Cozy Slipper"
                                    />
                                )}
                            </div>
                            <div>
                                <label htmlFor="modalProductDesc" className="block mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product Description</label>
                                {isAnalyzing ? (
                                    <SkeletonField className="h-24" />
                                ) : (
                                    <textarea 
                                        id="modalProductDesc"
                                        value={productDescription} 
                                        onChange={(e) => setProductDescription(e.target.value)} 
                                        className="w-full p-3 border rounded-lg input-focus-brand min-h-[6rem] resize-none bg-white dark:bg-[#1C1E20] dark:border-gray-600 dark:text-gray-300"
                                        placeholder="e.g., A warm and comfortable slipper..."
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-8 flex flex-col sm:flex-row-reverse gap-3">
                    <button 
                        onClick={handleContinue} 
                        disabled={!file || isValidating || isAnalyzing || !!validationError}
                        className="w-full sm:flex-1 px-4 py-3 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isAnalyzing ? "Analyzing..." : isEditMode ? "Save Changes" : "Continue"}
                    </button>
                    <button 
                        onClick={onClose} 
                        className="w-full sm:flex-1 px-4 py-3 bg-transparent border border-[#2B2B2B] text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </ModalWrapper>
    );
};