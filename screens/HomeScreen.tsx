
import React, { useState, useEffect } from 'react';
import type { CreativeMode, Project, Template, UploadedFile } from '../types';
import { AssetPreview } from '../components/AssetPreview';
import { SparklesIcon, TrashIcon, DocumentTextIcon, UserCircleIcon, TshirtIcon, ImageIcon, VideoIcon, MagnifyingGlassIcon } from '../components/icons';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useProjects } from '../context/ProjectContext';
import { TEMPLATE_LIBRARY } from '../lib/templates';
import { VideoLightbox } from '../components/VideoLightbox';

const GREETINGS = [
    'Ready to make some magic?',
    'What do you wish to create today?',
    'Your next creation is just a wish away.',
    'What would you like to create today?',
];

type TemplatePillCategory = 'Product Placement' | 'UGC' | 'Visual Effects';

const AIAgentHomeModule: React.FC = () => {
    const { user } = useAuth();
    const { theme, navigateTo } = useUI();
    const { handleAgentUrlRetrieval } = useProjects();
    const [url, setUrl] = useState('');
    const [urlError, setUrlError] = useState(false);

    const plan = user?.subscription?.plan || 'Starter';
    const isBusiness = plan === 'Business';

    const handleRetrieve = async () => {
        setUrlError(false);
        
        let fullUrl = url.trim();
        if (!fullUrl) {
            setUrlError(true);
            alert("Please enter a URL.");
            return;
        }

        if (!/^(https?:\/\/)/i.test(fullUrl)) {
            fullUrl = `https://${fullUrl}`;
        }

        try {
            // This is a simple client-side check for a valid URL structure.
            new URL(fullUrl);
        } catch (_) {
            setUrlError(true);
            alert("Please enter a valid URL format (e.g., yourbrand.com).");
            return;
        }

        try {
            // This function will throw an error on failure, which we'll catch.
            await handleAgentUrlRetrieval(fullUrl);
        } catch (e) {
            // The context shows the alert; we just need to update the UI state.
            setUrlError(true);
        }
    };
    
    return (
        <div className="w-full p-6 text-left rounded-xl transition-all bg-black border border-gray-200 dark:border-gray-800 shadow-sm relative flex flex-col md:flex-row md:items-center justify-between">
            <div className="mb-4 md:mb-0">
                <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-bold text-white">From Product URL to an Ad</h3>
                    {!isBusiness && (
                        <span className="px-2 py-0.5 rounded-full bg-brand-accent text-[#050C26] text-xs font-bold uppercase tracking-wider">
                            Business
                        </span>
                    )}
                </div>
                <p className="mt-2 text-gray-400">Your Marketing Genie will strategize and generate a full campaign</p>
            </div>
            <div className="flex gap-3 w-full md:w-auto md:min-w-[450px]">
                <input
                    type="url"
                    value={url}
                    onChange={(e) => {
                        setUrl(e.target.value);
                        if (urlError) setUrlError(false); // Clear error on new input
                    }}
                    placeholder={!isBusiness ? "Upgrade to Business to use URL scraping..." : "Enter product page URL..."}
                    disabled={!isBusiness}
                    className={`flex-grow w-full p-3 border rounded-lg bg-[#1C1E20] input-focus-brand ${urlError ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} ${!isBusiness ? 'opacity-60 cursor-not-allowed text-gray-500' : 'text-white'}`}
                />
                {isBusiness ? (
                    <button
                        onClick={handleRetrieve}
                        disabled={!url}
                        className="px-4 py-2 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <MagnifyingGlassIcon className="w-5 h-5" />
                        Retrieve
                    </button>
                ) : (
                    <button
                        onClick={() => navigateTo('PLAN_SELECT')}
                        className="px-4 py-2 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center justify-center gap-2 shrink-0 whitespace-nowrap"
                    >
                        <SparklesIcon className="w-5 h-5" />
                        Upgrade to Unlock
                    </button>
                )}
            </div>
        </div>
    );
};

const FeaturedTemplateSection: React.FC<{ title: string; isEcommerce?: boolean }> = ({ title, isEcommerce = false }) => {
    const { navigateTo } = useUI();
    const { selectTemplate } = useProjects();
    
    // Reordered tabs: UGC first
    const pillCategories: TemplatePillCategory[] = ['UGC', 'Product Placement', 'Visual Effects'];
    const [activePill, setActivePill] = useState<TemplatePillCategory>('UGC');

    // UGC Sub-tabs configuration
    const ugcSubCategories = [
        'Beauty',
        'Electronics & Gadgets',
        'Fashion & Apparel',
        'Food & Beverage',
        'Health & Wellness',
        'Bags & Accessories'
    ];
    const [activeUgcSubCategory, setActiveUgcSubCategory] = useState<string>('Beauty');

    // --- Dynamic Template Logic ---
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth(); // 0-11
    const nextMonth = (currentMonth + 1) % 12;
    const isSecondHalfOfMonth = currentDate.getDate() > 15;

    // Filter by type first
    const baseTemplates = TEMPLATE_LIBRARY.filter(t => {
        if (activePill === 'Product Placement') return t.type === 'image' && t.category !== 'UGC' && t.category !== 'Visual Effects';
        if (activePill === 'UGC') return t.category === 'UGC';
        if (activePill === 'Visual Effects') return t.category === 'Visual Effects';
        return false;
    });

    const isHolidayOrEventActive = (template: Template): boolean => {
        if (!template.activeMonths) return false;
        return template.activeMonths.some(m => {
            if (m === currentMonth) return true;
            if (m === nextMonth && isSecondHalfOfMonth) return true;
            return false;
        });
    };

    const getSortValue = (month: number, currentMonth: number) => (month - currentMonth + 12) % 12;
    
    const activeHolidayTemplates = baseTemplates.filter(t =>
        t.category === 'Holidays & Events' && isHolidayOrEventActive(t)
    ).sort((a, b) => {
        const firstMonthA = a.activeMonths![0];
        const firstMonthB = b.activeMonths![0];
        return getSortValue(firstMonthA, currentMonth) - getSortValue(firstMonthB, currentMonth);
    });

    const activeSeasonalTemplates = baseTemplates.filter(t => t.category === 'Seasonal' && t.activeMonths?.includes(currentMonth));
    const studioTemplates = baseTemplates.filter(t => t.category === 'Studio');
    const lifestyleTemplates = baseTemplates.filter(t => t.category === 'Lifestyle');
    const surrealTemplates = baseTemplates.filter(t => t.category === 'Surreal');
    const visualEffectsTemplates = baseTemplates.filter(t => t.category === 'Visual Effects');
    const ugcTemplates = baseTemplates.filter(t => t.category === 'UGC');

    const prioritizedTemplates = [
        ...visualEffectsTemplates,
        ...activeHolidayTemplates,
        ...activeSeasonalTemplates,
        ...ugcTemplates,
        ...studioTemplates,
        ...lifestyleTemplates,
        ...surrealTemplates
    ];

    const featuredTemplates = prioritizedTemplates
      .filter((template, index, self) => self.findIndex(t => t.id === template.id) === index)
      .slice(0, 4);
    // --- End Dynamic Template Logic ---

    return (
        <div className="mb-16">
            <div className="flex flex-col mb-8 gap-6">
                <div className="flex justify-between items-center">
                        <h2 className="text-3xl font-bold text-left shrink-0">{title}</h2>
                        {/* Mobile only Explore button to keep existing flow */}
                    <button 
                        onClick={() => navigateTo('EXPLORE')}
                        className="md:hidden px-4 py-2 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors text-sm shrink-0"
                    >
                        Explore all
                    </button>
                </div>
                {/* Align Tabs to Left, Explore Button to right on Desktop */}
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div className="flex justify-start overflow-x-auto hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                        <div className="flex items-center gap-2">
                            {pillCategories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setActivePill(category)}
                                    className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors whitespace-nowrap ${
                                        activePill === category
                                            ? 'bg-brand-accent text-on-accent'
                                            : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Desktop only Explore button */}
                    <button 
                        onClick={() => navigateTo('EXPLORE')}
                        className="hidden md:block px-4 py-2 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors text-sm shrink-0"
                    >
                        Explore all
                    </button>
                </div>

                {/* UGC Sub-tabs */}
                {activePill === 'UGC' && (
                    <div className="flex justify-start overflow-x-auto hide-scrollbar border-b border-gray-200 dark:border-gray-700 -mx-4 px-4 md:mx-0 md:px-0">
                        {ugcSubCategories.map((subCategory) => (
                            <button
                                key={subCategory}
                                onClick={() => setActiveUgcSubCategory(subCategory)}
                                className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors hover:border-brand-accent hover:text-gray-900 dark:hover:text-white ${
                                    activeUgcSubCategory === subCategory
                                        ? 'border-brand-accent text-gray-900 dark:text-white'
                                        : 'border-transparent text-gray-500 dark:text-gray-400'
                                }`}
                            >
                                {subCategory}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {featuredTemplates.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {featuredTemplates.map((template: Template) => (
                        <a 
                            key={template.id} 
                            onClick={() => selectTemplate(template, isEcommerce)}
                            className="group text-left relative"
                        >
                            <div
                                className={`relative overflow-hidden rounded-xl cursor-pointer ${activePill === 'UGC' ? 'aspect-[9/16]' : 'aspect-square'}`}
                                onMouseEnter={(e) => e.currentTarget.parentElement?.setAttribute('data-hovering', 'true')}
                                onMouseLeave={(e) => e.currentTarget.parentElement?.removeAttribute('data-hovering')}
                            >
                                <div className="absolute top-3 left-3 z-10 bg-black/50 text-white text-xs font-semibold px-2 py-1 rounded-full backdrop-blur-sm">
                                    {template.category}
                                </div>
                                <img src={template.previewImageUrl} alt={template.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                            </div>
                                <div className="mt-3 cursor-default">
                                <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 transition-colors card-title">{template.title}</h3>
                            </div>
                        </a>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 px-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl col-span-full">
                    <SparklesIcon className="w-12 h-12 mx-auto text-gray-400" />
                    <h3 className="mt-4 text-xl font-semibold text-gray-500 dark:text-gray-400">
                        {activePill} Templates Coming Soon!
                    </h3>
                    <p className="mt-2 text-gray-500">
                        Our genies are hard at work crafting magical {activePill.toLowerCase()} templates. Check back soon!
                    </p>
                </div>
            )}
        </div>
    );
};


export const HomeScreen: React.FC = () => {
    const { user } = useAuth();
    const { navigateTo } = useUI();
    const { 
        projects, 
        startNewProject, 
        setCurrentProject, 
        setProjectToDelete, 
    } = useProjects();
    
    const [greeting, setGreeting] = useState(GREETINGS[0]);
    const [lightboxAsset, setLightboxAsset] = useState<UploadedFile | null>(null);
    const recentProjects = projects.slice(0, 5);

    useEffect(() => {
        // Select a random greeting when the component mounts
        const randomIndex = Math.floor(Math.random() * GREETINGS.length);
        setGreeting(GREETINGS[randomIndex]);
    }, []);

    const plan = user?.subscription?.plan || 'Starter';
    const modes = [
        { name: 'Product Ad', title: 'Launch Product Ad Campaign', description: 'Place your product into any scene', enabled: true, imageUrl: 'https://storage.googleapis.com/genius-images-ny/images/548af5e5-dcaa-430e-977c-2f877121679b.png' },
        { name: 'Art Maker', title: 'Turn Ideas to Visuals', description: 'Create a scene, a moment, a piece of art', enabled: true, imageUrl: 'https://storage.googleapis.com/genius-images-ny/images/611e5a83-77f0-44b3-971f-6c0e0b174582.png' },
        { name: 'Create a UGC Video', title: 'Create UGC Video', description: 'A presenter delivering your message', enabled: plan === 'Business', imageUrl: 'https://storage.googleapis.com/genius-images-ny/images/Screenshot%202025-11-08%20at%2010.34.57%E2%80%AFAM.png' },
        { name: 'Video Maker', title: 'Make a Video', description: 'Animate an image or create from an idea', enabled: plan === 'Business', imageUrl: 'https://storage.googleapis.com/genius-images-ny/images/Screenshot%202025-11-08%20at%2010.19.03%E2%80%AFAM.png' },
    ];
    
    const onViewProject = (project: Project) => {
        setCurrentProject(project);
        if (project.mode === 'AI Agent') {
            navigateTo('AGENT_RESULT');
        } else {
            navigateTo('PREVIEW');
        }
    };
    
    const handlePreviewClick = (asset: UploadedFile) => {
        if (asset.mimeType.startsWith('video/')) {
            setLightboxAsset(asset);
        }
    };
    
    return (
        <div className="max-w-7xl mx-auto">
            {/* Mode Selection */}
            <div className="text-center mb-16">
                <h2 className="text-4xl font-bold">{greeting}</h2>
                <div className="mt-8 space-y-4">
                    <AIAgentHomeModule />
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {modes.map(mode => (
                             <a
                                key={mode.name}
                                onClick={() => mode.enabled ? startNewProject(mode.name as CreativeMode) : navigateTo('PLAN_SELECT')}
                                className="group text-left"
                            >
                                <div
                                    className="relative overflow-hidden rounded-xl aspect-square cursor-pointer"
                                    onMouseEnter={(e) => e.currentTarget.parentElement?.setAttribute('data-hovering', 'true')}
                                    onMouseLeave={(e) => e.currentTarget.parentElement?.removeAttribute('data-hovering')}
                                >
                                    <img src={mode.imageUrl} alt={mode.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                     {!mode.enabled && (
                                        <>
                                            <div className="absolute inset-0 bg-black/40" />
                                            <div className="absolute top-3 right-3">
                                                <span className="text-xs font-semibold bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full dark:bg-yellow-900 dark:text-yellow-300">
                                                    Upgrade
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="mt-3 cursor-default">
                                    <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 transition-colors card-title">{mode.title}</h3>
                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 transition-colors group-hover:text-brand-accent">{mode.description}</p>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            {/* Templates Section */}
            <FeaturedTemplateSection title="Use Template" isEcommerce={true} />

            {/* Projects */}
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-center sm:text-left">Your Recent Projects</h2>
                {projects.length > 5 && (
                    <button 
                        onClick={() => navigateTo('ALL_PROJECTS')}
                        className="px-4 py-2 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors text-sm shrink-0"
                    >
                        See all
                    </button>
                )}
            </div>
            {projects.length === 0 ? (
                 <div className="text-center py-16 px-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                    <h3 className="text-base font-normal text-gray-500 dark:text-gray-400">No projects have been created yet</h3>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {recentProjects.map(p => {
                        const previewAsset = p.generatedVideos[0] || p.generatedImages[0] || p.productFile;
                        return (
                            <div key={p.id} onClick={() => onViewProject(p)} className="cursor-pointer group bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
                                <div className="w-full h-40 bg-gray-200 dark:bg-gray-700 flex items-center justify-center relative overflow-hidden">
                                    {previewAsset ? <AssetPreview asset={previewAsset} objectFit="cover" hoverEffect={true} onClick={handlePreviewClick} /> : <SparklesIcon className="w-12 h-12 text-gray-400" />}
                                    <div className="absolute bottom-2 right-2 flex items-center gap-2">
                                        {p.generatedImages.length > 0 && <div className="flex items-center gap-1.5 text-sm text-white bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm"><ImageIcon className="w-4 h-4"/>{p.generatedImages.length}</div>}
                                        {p.generatedVideos.length > 0 && <div className="flex items-center gap-1.5 text-sm text-white bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm"><VideoIcon className="w-5 h-5"/>{p.generatedVideos.length}</div>}
                                    </div>
                                </div>
                                <div className="p-3 flex flex-col flex-grow">
                                    <h3 className="font-bold truncate text-sm mb-1 flex-grow">{p.prompt || p.productName || p.mode}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{p.mode}</p>
                                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                        <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setProjectToDelete(p);
                                            }}
                                            className="z-10 p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                                            aria-label="Delete project"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            <VideoLightbox
                isOpen={!!lightboxAsset}
                onClose={() => setLightboxAsset(null)}
                asset={lightboxAsset}
            />
        </div>
    );
};
