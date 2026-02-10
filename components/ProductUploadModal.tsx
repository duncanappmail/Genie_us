
import React, { useState, useEffect, useMemo } from 'react';
import { ModalWrapper } from './ModalWrapper';
import { Uploader } from './Uploader';
import { ProductScraper } from './ProductScraper';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import type { UploadedFile, SavedProduct } from '../types';
import { validateProductImage, validateAvatarImage, generateCampaignBrief } from '../services/geminiService';
import { AssetPreview } from './AssetPreview';
import { XMarkIcon, SparklesIcon, MagnifyingGlassIcon, CheckIcon } from './icons';

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
    const { setIsLoading, setGenerationStatusMessages, setError, productUploadModalContext } = useUI();
    const { savedProducts, saveProduct } = useAuth();
    
    // UI State
    const [activeTab, setActiveTab] = useState<'upload' | 'library'>('upload');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLibraryProductId, setSelectedLibraryProductId] = useState<string | null>(null);

    // Form State
    const [file, setFile] = useState<UploadedFile | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisMessage, setAnalysisMessage] = useState(ANALYSIS_MESSAGES[0]);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [validationWarning, setValidationWarning] = useState<string | null>(null);
    const [productName, setProductName] = useState('');
    const [productDescription, setProductDescription] = useState('');
    const [scrapedUrl, setScrapedUrl] = useState('');

    const isPersonContext = productUploadModalContext === 'person';

    // Reset or populate state on open
    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && initialData) {
                setFile(initialData.file);
                setProductName(initialData.name || '');
                setProductDescription(initialData.description || '');
                setScrapedUrl(initialData.url || '');
                setValidationError(null);
                setValidationWarning(null);
                setActiveTab('upload');
            } else {
                setFile(null);
                setProductName('');
                setProductDescription('');
                setScrapedUrl('');
                setValidationError(null);
                setValidationWarning(null);
                setSelectedLibraryProductId(null);
                setActiveTab('upload');
            }
        }
    }, [isOpen, mode, initialData]);

    // Filter library products based on search
    const filteredLibrary = useMemo(() => {
        return savedProducts.filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [savedProducts, searchQuery]);

    // Analysis message cycle
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
        setValidationWarning(null);
        setIsValidating(true);
        setError(null);
        
        if (mode === 'create') {
            setProductName('');
            setProductDescription('');
            setScrapedUrl('');
        }

        try {
            let isValid = false;
            if (isPersonContext) {
                isValid = await validateAvatarImage(uploadedFile);
                if (!isValid) {
                    setValidationError("Please upload a clear photo of a person.");
                    setIsValidating(false);
                    return;
                }
            } else {
                isValid = await validateProductImage(uploadedFile);
                if (!isValid) {
                    setValidationError("Please upload a clear product image where the item is the hero.");
                    setIsValidating(false);
                    return;
                }
            }
            setIsValidating(false);

            if (!isPersonContext && (!productName || !productDescription)) {
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
            } else if (isPersonContext && !productName) {
                setProductName("Subject");
            }
        } catch (e: any) {
            console.error("Validation error", e);
            setIsValidating(false);
            
            // If it's a technical error (quota/busy), show a non-blocking warning
            if (e.isQuotaError || (e.status >= 500)) {
                setValidationWarning("Validation system is currently busy. You can still continue, but please ensure your image is high-quality.");
            } else {
                setValidationError("Could not validate image. Please try another or try again later.");
            }
        }
    };

    const handleScraped = (data: { name: string; description: string; file: UploadedFile | null; url: string }) => {
        setProductName(data.name);
        setProductDescription(data.description);
        setScrapedUrl(data.url);
        if (data.file) {
            setFile(data.file);
            setValidationError(null); 
            setValidationWarning(null);
        }
    };

    const handleLibrarySelect = (prod: SavedProduct) => {
        setSelectedLibraryProductId(prod.id);
        setFile(prod.file);
        setProductName(prod.name);
        setProductDescription(prod.description);
    };

    const handleContinue = async () => {
        // If it's a new upload and we have valid data, save to library for future use
        if (activeTab === 'upload' && file && !isPersonContext && mode === 'create') {
            try {
                await saveProduct({
                    id: `prod_${Date.now()}`,
                    name: productName,
                    description: productDescription,
                    file: file
                });
            } catch (e) {
                console.warn("Failed to auto-save to library", e);
            }
        }

        onConfirm({
            file,
            url: scrapedUrl,
            name: productName || (isPersonContext ? "Subject" : ""),
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
        setValidationWarning(null);
    };

    const isContinueDisabled = !file || isValidating || isAnalyzing || !!validationError || (activeTab === 'upload' && !productName && !isPersonContext);

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose}>
            <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl flex flex-col transition-all duration-300 overflow-hidden`}>
                
                {/* Tabs Header */}
                <div className="flex border-b border-gray-100 dark:border-gray-700">
                    <button 
                        onClick={() => setActiveTab('upload')}
                        className={`flex-1 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'upload' ? 'border-brand-accent text-gray-900 dark:text-white' : 'border-transparent text-gray-400 dark:text-gray-600 hover:text-gray-500'}`}
                    >
                        {isPersonContext ? "Upload Character Reference" : "Upload Product"}
                    </button>
                    <button 
                        onClick={() => setActiveTab('library')}
                        className={`flex-1 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'library' ? 'border-brand-accent text-gray-900 dark:text-white' : 'border-transparent text-gray-400 dark:text-gray-600 hover:text-gray-500'}`}
                    >
                        {isPersonContext ? "Character Library" : "My Products"}
                    </button>
                </div>

                {/* Content Area */}
                <div className="p-6 min-h-[400px] overflow-y-auto custom-scrollbar flex flex-col">
                    {activeTab === 'upload' ? (
                        <div className="flex-1 flex flex-col space-y-6 animate-in fade-in duration-300">
                             {!isPersonContext && (
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
                                            <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-[10px]">OR</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {file ? (
                                <div className={`flex flex-col flex-1 ${!isPersonContext ? 'md:grid md:grid-cols-3 md:gap-8 items-start' : ''}`}>
                                    <div className="w-full flex flex-col items-center md:items-start">
                                        {!isPersonContext && <label className="block mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide w-full">Preview</label>}
                                        <div className={`relative w-full aspect-square group rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50`}>
                                            <div className="absolute inset-0 p-8 flex items-center justify-center">
                                                <div className="relative w-full h-full">
                                                    <div className="w-full h-full rounded-md overflow-hidden">
                                                        <AssetPreview asset={file} objectFit="contain" />
                                                    </div>
                                                    {!isValidating && !isAnalyzing && (
                                                        <button onClick={handleRemoveFile} className="absolute -top-3 -right-3 z-10 flex items-center justify-center w-6 h-6 bg-black text-white rounded-full shadow-lg hover:bg-gray-800 transition-transform active:scale-90"><XMarkIcon className="w-3.5 h-3.5" /></button>
                                                    )}
                                                </div>
                                            </div>
                                            {isValidating && <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20 rounded-lg"><div className="text-white font-semibold flex items-center gap-2 text-xs"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Verifying...</div></div>}
                                        </div>
                                        {validationError && (
                                            <div className="w-full p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-2 mt-4 animate-in fade-in slide-in-from-top-1">
                                                <XMarkIcon className="w-4 h-4 shrink-0" />
                                                <span>{validationError}</span>
                                            </div>
                                        )}
                                        {validationWarning && (
                                            <div className="w-full p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-sm rounded-lg border border-yellow-200 dark:border-yellow-800 flex items-center gap-2 mt-4 animate-in fade-in slide-in-from-top-1">
                                                <SparklesIcon className="w-4 h-4 shrink-0" />
                                                <span>{validationWarning}</span>
                                            </div>
                                        )}
                                    </div>

                                    {!isPersonContext && (
                                        <div className="w-full md:col-span-2 mt-6 md:mt-0 flex flex-col">
                                            {isAnalyzing ? (
                                                <div className="flex flex-col items-center justify-center space-y-4 p-8 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700 flex-1 min-h-[220px]">
                                                    <div className="relative">
                                                        <div className="w-12 h-12 border-4 border-brand-accent/30 rounded-full"></div>
                                                        <div className="absolute top-0 left-0 w-12 h-12 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
                                                        <div className="absolute inset-0 flex items-center justify-center"><SparklesIcon className="w-5 h-5 text-brand-accent animate-pulse" /></div>
                                                    </div>
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white animate-pulse">{analysisMessage}</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</label>
                                                        <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} className="w-full p-3 border rounded-lg bg-white dark:bg-[#1C1E20] dark:border-gray-600 dark:text-gray-300" placeholder="e.g., The Cozy Slipper"/>
                                                    </div>
                                                    <div>
                                                        <label className="block mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</label>
                                                        <textarea value={productDescription} onChange={(e) => setProductDescription(e.target.value)} className="w-full p-3 border rounded-lg resize-none bg-white dark:bg-[#1C1E20] dark:border-gray-600 dark:text-gray-300" placeholder="A brief summary..." rows={5}/>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className={`w-full flex justify-center items-center py-4`}>
                                    <div className="w-full aspect-[1.6/1]">
                                        <Uploader onUpload={handleFileUpload} title={isPersonContext ? "Upload Subject Photo" : "Upload Product Image"} subtitle="" fill={true} />
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* My Products Tab Content */
                        <div className="space-y-6 animate-in fade-in duration-300 h-full flex flex-col">
                            {/* Library Search */}
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder={isPersonContext ? "Search your characters..." : "Search your library..."} 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-[#1C1E20] input-focus-brand"
                                />
                            </div>

                            {savedProducts.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                                    <SparklesIcon className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                                    <h4 className="font-bold text-gray-600 dark:text-gray-400">Your library is empty</h4>
                                    <p className="text-sm text-gray-400 mt-1">{isPersonContext ? "Upload a character reference to save it here." : "Upload a product to save it here for future magic."}</p>
                                </div>
                            ) : filteredLibrary.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center text-center py-12">
                                    <p className="text-gray-500">No results match your search.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-4">
                                    {filteredLibrary.map((p) => {
                                        const isSelected = selectedLibraryProductId === p.id;
                                        return (
                                            <button 
                                                key={p.id}
                                                onClick={() => handleLibrarySelect(p)}
                                                className={`group flex flex-col items-start text-left rounded-xl overflow-hidden border transition-all ${
                                                    isSelected 
                                                    ? 'border-brand-accent bg-white dark:bg-[#1C1E20]' 
                                                    : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-[#131517]'
                                                }`}
                                            >
                                                <div className="relative aspect-square w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                                                    <AssetPreview asset={p.file} objectFit="cover" hoverEffect={true} />
                                                    {isSelected && (
                                                        <div className="absolute top-2 right-2 bg-brand-accent text-[#050C26] rounded-full p-0.5 shadow-md border border-white/20 z-10">
                                                            <CheckIcon className="w-4 h-4 stroke-[3]" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-3 w-full">
                                                    <p className={`font-bold text-sm truncate ${isSelected ? 'text-brand-accent' : 'text-gray-900 dark:text-white'}`}>{p.name}</p>
                                                    <p className="text-[10px] text-gray-400 mt-0.5">{new Date(p.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 flex flex-col sm:flex-row-reverse gap-3 border-t border-gray-100 dark:border-gray-700">
                    <button 
                        onClick={handleContinue} 
                        disabled={isContinueDisabled}
                        className="w-full sm:flex-1 px-8 py-3 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                    >
                        Continue
                    </button>
                    <button 
                        onClick={onClose} 
                        className="w-full sm:flex-1 px-8 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </ModalWrapper>
    );
};
