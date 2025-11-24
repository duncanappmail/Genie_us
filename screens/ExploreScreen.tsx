
import React, { useState } from 'react';
import { useProjects } from '../context/ProjectContext';
import { useUI } from '../context/UIContext';
import { TEMPLATE_LIBRARY } from '../lib/templates';
import type { Template, TemplateCategory } from '../types';
import { DocumentTextIcon, VideoIcon, ImageIcon, SparklesIcon } from '../components/icons';

type TemplatePillCategory = 'Product Placement' | 'UGC' | 'Visual Effects';

export const ExploreScreen: React.FC = () => {
    const { selectTemplate } = useProjects();
    const { setError } = useUI();
    const [activePill, setActivePill] = useState<TemplatePillCategory>('Product Placement');
    const [activeCategory, setActiveCategory] = useState<TemplateCategory>('All');

    const categories: TemplateCategory[] = ['All', 'Holidays & Events', 'Seasonal', 'Studio', 'Lifestyle', 'Surreal'];
    const pillCategories: TemplatePillCategory[] = ['Product Placement', 'UGC', 'Visual Effects'];

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth(); // 0-11
    const nextMonth = (currentMonth + 1) % 12;
    const isSecondHalfOfMonth = currentDate.getDate() > 15;

    const isHolidayOrEventActive = (template: Template): boolean => {
        if (!template.activeMonths) return false;
        // An event is considered "active" if it's in the current month,
        // or if it's in the next month AND we are in the second half of the current month.
        return template.activeMonths.some(m => {
            if (m === currentMonth) return true;
            if (m === nextMonth && isSecondHalfOfMonth) return true;
            return false;
        });
    };

    const getSortValue = (month: number, currentMonth: number) => (month - currentMonth + 12) % 12;

    const filteredTemplates = (() => {
        const baseTemplates = TEMPLATE_LIBRARY.filter(t => {
            if (activePill === 'Product Placement') return t.type === 'image' && t.category !== 'UGC';
            if (activePill === 'UGC') return t.category === 'UGC';
            return false;
        });

        if (activeCategory === 'All') {
            // If showing UGC, just show all of them without extra filtering for now
            if (activePill === 'UGC') return baseTemplates;

            // Filter out any holiday/event or seasonal templates that are not currently relevant.
            const relevantTemplates = baseTemplates.filter(t => {
                if (t.category === 'Holidays & Events') {
                    return isHolidayOrEventActive(t);
                }
                if (t.category === 'Seasonal') {
                    return t.activeMonths?.includes(currentMonth) ?? false;
                }
                return true; // Keep all templates from other categories.
            });

            // Now, sort the relevant templates.
            const categoryOrder: TemplateCategory[] = ['Holidays & Events', 'Seasonal', 'Studio', 'Lifestyle', 'Surreal'];
            const getTemplatePriority = (template: Template): number => {
                // Highest priority for active holidays/events (already filtered)
                if (template.category === 'Holidays & Events') {
                    return 0;
                }
                // Next priority for active seasonal templates
                if (template.category === 'Seasonal' && template.activeMonths?.includes(currentMonth)) {
                    return 1;
                }
                // Then, prioritize by the defined category order
                const categoryIndex = categoryOrder.indexOf(template.category);
                return categoryIndex !== -1 ? categoryIndex + 2 : 99;
            };

            return relevantTemplates.sort((a, b) => {
                const priorityA = getTemplatePriority(a);
                const priorityB = getTemplatePriority(b);

                if (priorityA !== priorityB) {
                    return priorityA - priorityB;
                }

                // If priority is the same (i.e., both are upcoming holidays), sort by date proximity
                if (priorityA === 0 && a.activeMonths && b.activeMonths) {
                    const firstMonthA = a.activeMonths[0];
                    const firstMonthB = b.activeMonths[0];
                    return getSortValue(firstMonthA, currentMonth) - getSortValue(firstMonthB, currentMonth);
                }

                return 0; // Maintain original relative order for other categories
            });
        }

        if (activeCategory === 'Seasonal') {
            return baseTemplates.filter(t => t.category === 'Seasonal' && t.activeMonths?.includes(currentMonth));
        }

        if (activeCategory === 'Holidays & Events') {
             return baseTemplates
             .filter(t => t.category === 'Holidays & Events' && isHolidayOrEventActive(t))
             .sort((a, b) => {
                // Ensure activeMonths exists before accessing it
                if (a.activeMonths && b.activeMonths) {
                    const firstMonthA = a.activeMonths[0];
                    const firstMonthB = b.activeMonths[0];
                    return getSortValue(firstMonthA, currentMonth) - getSortValue(firstMonthB, currentMonth);
                }
                return 0;
            });
        }

        return baseTemplates.filter(t => t.category === activeCategory);
    })();
    
    const handleSelectTemplate = (template: Template) => {
        setError(null); // Clear any previous errors
        selectTemplate(template);
    };
    
    const isComingSoon = activePill === 'Visual Effects' || (activePill === 'UGC' && filteredTemplates.length === 0);

    return (
        <div className="max-w-7xl mx-auto">
            <div className="text-left mb-8">
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white">Explore Templates</h2>
            </div>

            <div className="mb-8 space-y-6">
                <div className="flex justify-start">
                    <div className="flex items-center gap-2">
                        {pillCategories.map((category) => (
                            <button
                                key={category}
                                onClick={() => {
                                    setActivePill(category);
                                    setActiveCategory('All');
                                }}
                                className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
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
                
                {activePill === 'Product Placement' && (
                    <div className="flex justify-start overflow-x-auto hide-scrollbar border-b border-gray-200 dark:border-gray-700">
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors hover:border-brand-accent hover:text-gray-900 dark:hover:text-white ${
                                    activeCategory === category
                                        ? 'border-brand-accent text-gray-900 dark:text-white'
                                        : 'border-transparent text-gray-500 dark:text-gray-400'
                                }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {filteredTemplates.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {filteredTemplates.map(template => (
                        <a
                            key={template.id}
                            onClick={() => handleSelectTemplate(template)}
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
                                <img 
                                    src={template.previewImageUrl} 
                                    alt={template.title}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
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
                        {isComingSoon ? `${activePill} Templates Coming Soon!` : 'No templates found'}
                    </h3>
                    <p className="mt-2 text-gray-500">
                         {isComingSoon ? `Our genies are hard at work crafting magical ${activePill.toLowerCase()} templates. Check back soon!` : 'Check back soon or explore other categories!'}
                    </p>
                </div>
            )}
        </div>
    );
};
