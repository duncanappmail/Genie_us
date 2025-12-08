import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import type { BrandProfile, UploadedFile } from '../types';
import { AssetPreview } from '../components/AssetPreview';
import { Uploader } from '../components/Uploader';
import { XMarkIcon, PlusCircleIcon, TrashIcon } from '../components/icons';
import { ModalWrapper } from '../components/ModalWrapper';

const ResetDnaModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (url: string) => void;
    isFetching: boolean;
}> = ({ isOpen, onClose, onConfirm, isFetching }) => {
    const [newUrl, setNewUrl] = useState('');

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (newUrl && !isFetching) {
            onConfirm(newUrl);
        }
    };

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose}>
            <div className="bg-white dark:bg-black rounded-2xl shadow-xl w-full max-w-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Reset Brand DNA</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Enter a new website URL to fetch and replace your current Brand DNA. This action cannot be undone.
                </p>
                <div className="mt-4">
                    <input
                        type="url"
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        placeholder="https://yournewbrand.com"
                        className="w-full p-3 border rounded-lg input-focus-brand"
                        autoFocus
                    />
                </div>
                <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
                    <button
                        onClick={handleConfirm}
                        disabled={!newUrl || isFetching}
                        className="w-full sm:flex-1 px-4 py-2 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover disabled:opacity-50 flex items-center justify-center"
                    >
                        {isFetching ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : 'Reset and Fetch'}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isFetching}
                        className="w-full sm:flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </ModalWrapper>
    );
};


export const BrandingScreen: React.FC = () => {
    const { user, handleFetchBrandProfile, handleUpdateBrandProfile, handleClearBrandProfile } = useAuth();
    const { isLoading, error, navigateTo } = useUI();
    const [url, setUrl] = useState(user?.brandProfile?.websiteUrl || '');
    const [localProfile, setLocalProfile] = useState<BrandProfile | null>(user?.brandProfile || null);
    const [isDirty, setIsDirty] = useState(false);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);

    useEffect(() => {
        setLocalProfile(user?.brandProfile || null);
        if (user?.brandProfile?.websiteUrl) {
            setUrl(user.brandProfile.websiteUrl);
        }
        setIsDirty(false); // Reset dirty state when user profile changes
    }, [user?.brandProfile]);
    
    const handleResetAndFetch = async (newUrl: string) => {
        await handleClearBrandProfile();
        setUrl(newUrl);
        await handleFetchBrandProfile(newUrl);
        setIsResetModalOpen(false);
    };

    const handleSave = async () => {
        if (localProfile && isDirty) {
            await handleUpdateBrandProfile(localProfile);
            navigateTo('HOME');
        }
    };
    
    // --- Dynamic Field Handlers ---
    const handleFieldChange = (field: keyof Omit<BrandProfile, 'logoFile' | 'colors' | 'fonts' | 'brandValues' | 'missionStatements' | 'userId' | 'toneOfVoice' | 'brandAesthetics'>, value: string) => {
        setIsDirty(true);
        setLocalProfile(prev => prev ? { ...prev, [field]: value } : null);
    };
    
    const handleFontChange = (field: 'header' | 'subHeader' | 'body', value: string) => {
        setIsDirty(true);
        setLocalProfile(prev => prev ? { ...prev, fonts: { ...prev.fonts, [field]: value } } : null);
    };
    
    const handleColorChange = (index: number, field: 'label' | 'hex', value: string) => {
        setIsDirty(true);
        setLocalProfile(prev => {
            if (!prev) return null;
            const newColors = [...prev.colors];
            newColors[index] = { ...newColors[index], [field]: value };
            return { ...prev, colors: newColors };
        });
    };

    const handleArrayChange = (field: 'missionStatements' | 'brandValues' | 'toneOfVoice' | 'brandAesthetics', index: number, value: string) => {
        setIsDirty(true);
        setLocalProfile(prev => {
            if (!prev) return null;
            const newArray = [...prev[field]];
            newArray[index] = value;
            return { ...prev, [field]: newArray };
        });
    };
    
    const addToArray = (field: 'colors' | 'brandValues' | 'missionStatements' | 'toneOfVoice' | 'brandAesthetics') => {
        setIsDirty(true);
        setLocalProfile(prev => {
            if (!prev) return null;
            let newItem;
            if (field === 'colors') newItem = { label: '', hex: '#000000' };
            else newItem = '';
            
            return { ...prev, [field]: [...prev[field], newItem as any] };
        });
    };
    
    const removeFromArray = (field: 'colors' | 'brandValues' | 'missionStatements' | 'toneOfVoice' | 'brandAesthetics', index: number) => {
        setIsDirty(true);
        setLocalProfile(prev => {
            if (!prev) return null;
            const newArray = prev[field].filter((_, i) => i !== index);
            return { ...prev, [field]: newArray as any };
        });
    };

    const handleLogoUpload = (file: UploadedFile) => {
        setIsDirty(true);
        if (localProfile) {
            setLocalProfile({ ...localProfile, logoFile: file });
        }
    };
    
    const handleLogoRemove = () => {
        setIsDirty(true);
        if (localProfile) {
            setLocalProfile({ ...localProfile, logoFile: null });
        }
    };

    if (!user) return null;

    if (!localProfile && !isLoading) {
        return (
            <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Define Your Brand DNA</h2>
                <p className="mt-2 text-gray-500 dark:text-gray-300">Enter your website URL, and our AI will analyze it to automatically create your brand profile.</p>
                <div className="mt-8 flex gap-2">
                     <input
                        id="brandUrl"
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://yourbrand.com"
                        className="w-full p-3 border rounded-lg input-focus-brand"
                    />
                    <button
                        onClick={() => handleFetchBrandProfile(url)}
                        disabled={isLoading || !url}
                        className="px-6 py-3 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors disabled:bg-gray-400"
                    >
                        Fetch
                    </button>
                </div>
                {error && <p className="mt-4 text-red-500">{error}</p>}
            </div>
        );
    }
    
    if (!localProfile && isLoading) {
        // This handles the initial loading state when fetching for the first time
        return null; // The global loading overlay will be shown
    }
    
    if (!localProfile) {
        // This case should ideally not be hit if logic is correct, but it's a safe fallback.
        return <div className="text-center p-8">Loading brand profile...</div>;
    }
    
    return (
        <div className="max-w-4xl mx-auto">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Your Brand DNA</h2>
                <button
                    onClick={() => setIsResetModalOpen(true)}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-red-600"
                >
                    Reset & Fetch New URL
                </button>
             </div>
             <div className="space-y-8">
                {/* Business Information Card */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-[#2B2B2B]">
                    <h3 className="text-xl font-bold mb-4">Business</h3>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="businessName" className="block mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</label>
                            <input type="text" id="businessName" value={localProfile.businessName} onChange={e => handleFieldChange('businessName', e.target.value)} className="w-full p-4 border rounded-lg input-focus-brand bg-white dark:bg-[#1C1E20] dark:border-gray-600" placeholder="Your Business Name"/>
                        </div>
                         <div>
                            <label htmlFor="businessOverview" className="block mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Overview</label>
                            <textarea id="businessOverview" value={localProfile.businessOverview} onChange={e => handleFieldChange('businessOverview', e.target.value)} className="w-full p-4 border rounded-lg h-32 input-focus-brand bg-white dark:bg-[#1C1E20] dark:border-gray-600 resize-none" placeholder="What your business does, sells, its industry, values, and mission."/>
                        </div>
                    </div>
                </div>

                {/* Visual Identity Card */}
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-[#2B2B2B]">
                    <h3 className="text-xl font-bold mb-4">Visual Identity</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Logo</h4>
                             {localProfile.logoFile ? (
                                <div className="relative w-48 h-48 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                                    <AssetPreview asset={localProfile.logoFile} objectFit="contain" />
                                    <button onClick={handleLogoRemove} className="absolute -top-2 -right-2 z-10 bg-black text-white dark:bg-white dark:text-black rounded-full p-1 shadow-md">
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <Uploader onUpload={handleLogoUpload} compact/>
                            )}
                        </div>
                         <div>
                            <h4 className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Color Palette</h4>
                            <div className="space-y-2">
                                {localProfile.colors.map((color, index) => (
                                    <div key={index} className="flex items-center gap-4">
                                        <div className="relative w-8 h-8 shrink-0">
                                            <div 
                                                className="w-full h-full rounded-full border border-gray-200 dark:border-gray-600"
                                                style={{ backgroundColor: color.hex }}
                                                aria-hidden="true"
                                            />
                                            <input 
                                                type="color" 
                                                value={color.hex} 
                                                onChange={e => handleColorChange(index, 'hex', e.target.value)} 
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                title={`Change ${color.label} color`}
                                            />
                                        </div>
                                        <input type="text" value={color.label} onChange={e => handleColorChange(index, 'label', e.target.value)} className="w-full p-3 border rounded-lg text-sm input-focus-brand bg-white dark:bg-[#1C1E20] dark:border-gray-600" placeholder="Color Label"/>
                                        <input type="text" value={color.hex} onChange={e => handleColorChange(index, 'hex', e.target.value)} className="w-24 p-3 border rounded-lg text-sm input-focus-brand bg-white dark:bg-[#1C1E20] dark:border-gray-600"/>
                                         <button onClick={() => removeFromArray('colors', index)} className="p-1 text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>
                                    </div>
                                ))}
                                <button onClick={() => addToArray('colors')} className="ml-12 text-sm font-semibold text-brand-accent flex items-center gap-1 hover:underline"><PlusCircleIcon className="w-5 h-5"/> Add Color</button>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6">
                        <h4 className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fonts</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div>
                                <label className="block mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Header</label>
                                <input type="text" value={localProfile.fonts.header} onChange={e => handleFontChange('header', e.target.value)} className="w-full p-3 border rounded-lg input-focus-brand bg-white dark:bg-[#1C1E20] dark:border-gray-600" placeholder="Header Font"/>
                            </div>
                             <div>
                                <label className="block mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sub-Header</label>
                                <input type="text" value={localProfile.fonts.subHeader} onChange={e => handleFontChange('subHeader', e.target.value)} className="w-full p-3 border rounded-lg input-focus-brand bg-white dark:bg-[#1C1E20] dark:border-gray-600" placeholder="Sub-Header Font"/>
                            </div>
                             <div>
                                <label className="block mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Body</label>
                                <input type="text" value={localProfile.fonts.body} onChange={e => handleFontChange('body', e.target.value)} className="w-full p-3 border rounded-lg input-focus-brand bg-white dark:bg-[#1C1E20] dark:border-gray-600" placeholder="Body Font"/>
                            </div>
                        </div>
                    </div>
                 </div>
                 
                {/* Mission Card */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-[#2B2B2B]">
                    <h3 className="text-xl font-bold mb-4">Mission</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Mission Statements</h4>
                            <div className="space-y-2">
                                {localProfile.missionStatements.map((statement, index) => (
                                    <div key={index} className="flex items-start gap-2">
                                        <textarea 
                                            value={statement} 
                                            onChange={e => handleArrayChange('missionStatements', index, e.target.value)} 
                                            className="w-full p-3 border rounded-lg input-focus-brand resize-none bg-white dark:bg-[#1C1E20] dark:border-gray-600" 
                                            placeholder="Inspiring mission statement..."
                                            rows={2}
                                        />
                                        <button onClick={() => removeFromArray('missionStatements', index)} className="p-1 text-gray-400 hover:text-red-500 mt-2"><TrashIcon className="w-4 h-4"/></button>
                                    </div>
                                ))}
                                <button onClick={() => addToArray('missionStatements')} className="text-sm font-semibold text-brand-accent flex items-center gap-1 hover:underline"><PlusCircleIcon className="w-5 h-5"/> Add</button>
                            </div>
                        </div>
                        <div>
                            <h4 className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Brand Values</h4>
                            <div className="space-y-2">
                                {localProfile.brandValues.map((val, index) => (
                                <div key={index} className="flex items-start gap-2">
                                    <textarea 
                                        value={val} 
                                        onChange={e => handleArrayChange('brandValues', index, e.target.value)} 
                                        className="w-full p-3 border rounded-lg input-focus-brand resize-none bg-white dark:bg-[#1C1E20] dark:border-gray-600" 
                                        placeholder="A core brand value..."
                                        rows={2}
                                    />
                                    <button onClick={() => removeFromArray('brandValues', index)} className="p-1 text-gray-400 hover:text-red-500 mt-2"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                                ))}
                                <button onClick={() => addToArray('brandValues')} className="text-sm font-semibold text-brand-accent flex items-center gap-1 hover:underline"><PlusCircleIcon className="w-5 h-5"/> Add</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Brand Personality Card */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-[#2B2B2B]">
                     <h3 className="text-xl font-bold mb-4">Brand Personality</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Brand Tone of Voice</h4>
                            <div className="space-y-2">
                                {localProfile.toneOfVoice.map((tone, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <input type="text" value={tone} onChange={e => handleArrayChange('toneOfVoice', index, e.target.value)} className="w-full p-4 border rounded-lg input-focus-brand bg-white dark:bg-[#1C1E20] dark:border-gray-600" placeholder="e.g., Playful and Witty"/>
                                    <button onClick={() => removeFromArray('toneOfVoice', index)} className="p-1 text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                                ))}
                                <button onClick={() => addToArray('toneOfVoice')} className="text-sm font-semibold text-brand-accent flex items-center gap-1 hover:underline"><PlusCircleIcon className="w-5 h-5"/> Add</button>
                            </div>
                        </div>
                         <div>
                            <h4 className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Brand Aesthetics</h4>
                            <div className="space-y-2">
                                {localProfile.brandAesthetics.map((aesthetic, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <input type="text" value={aesthetic} onChange={e => handleArrayChange('brandAesthetics', index, e.target.value)} className="w-full p-4 border rounded-lg input-focus-brand bg-white dark:bg-[#1C1E20] dark:border-gray-600" placeholder="e.g., Minimal and Clean"/>
                                    <button onClick={() => removeFromArray('brandAesthetics', index)} className="p-1 text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                                ))}
                                <button onClick={() => addToArray('brandAesthetics')} className="text-sm font-semibold text-brand-accent flex items-center gap-1 hover:underline"><PlusCircleIcon className="w-5 h-5"/> Add</button>
                            </div>
                        </div>
                     </div>
                </div>
                
                <div className="flex justify-end pt-4">
                    <button onClick={handleSave} disabled={!isDirty} className="px-8 py-3 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        Save Changes
                    </button>
                </div>
             </div>
             <ResetDnaModal
                isOpen={isResetModalOpen}
                onClose={() => setIsResetModalOpen(false)}
                onConfirm={handleResetAndFetch}
                isFetching={isLoading}
             />
        </div>
    )
};