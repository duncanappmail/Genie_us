import React from 'react';
import { XMarkIcon, RocketLaunchIcon } from './icons';
import type { GenerationError } from '../types';

interface ErrorResolutionViewProps {
    error: GenerationError;
    onClear: () => void;
    onNavigateToPlans?: () => void;
}

export const ErrorResolutionView: React.FC<ErrorResolutionViewProps> = ({ 
    error, onClear, onNavigateToPlans 
}) => {
    const isQuota = error.type === 'quota';

    // "Worked well" red palette used for stroke/fill:
    // Fill: #450a0a, Stroke: #7f1d1d
    const containerClasses = isQuota 
        ? "bg-white dark:bg-black border-brand-accent shadow-xl"
        : "bg-[#450a0a] border-[#7f1d1d] shadow-lg";

    const headerClasses = isQuota
        ? "text-gray-900 dark:text-white"
        : "text-white"; // White title as requested

    const bodyClasses = isQuota
        ? "text-gray-600 dark:text-gray-400"
        : "text-[#fca5a5]"; // Light red to match the X icon

    const xIconClasses = isQuota
        ? "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        : "text-[#fca5a5] hover:text-white";

    return (
        <div className={`w-full rounded-2xl border p-6 flex flex-col relative animate-in fade-in slide-in-from-bottom-2 duration-300 ${containerClasses}`}>
            
            {/* Top Right Close Button */}
            <button 
                onClick={onClear}
                className={`absolute top-4 right-4 p-1 transition-colors ${xIconClasses}`}
                aria-label="Close"
            >
                <XMarkIcon className="w-6 h-6" />
            </button>

            <div className="flex flex-col text-left">
                {/* Header */}
                <h3 className={`text-xl font-bold mb-2 ${headerClasses}`}>
                    {isQuota ? "Wish Reserves Empty" : "Generation Failed, No credits were used"}
                </h3>
                
                {/* Body Text: Fills width with right padding for visual balance against the "Got it" button */}
                <p className={`text-sm leading-relaxed pr-10 ${bodyClasses}`}>
                    {error.message}
                </p>
            </div>

            {/* Bottom Right Actions */}
            <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
                {isQuota ? (
                    <>
                        <button 
                            onClick={onNavigateToPlans}
                            className="px-6 py-2.5 bg-brand-accent text-on-accent text-sm font-bold rounded-lg hover:bg-brand-accent-hover transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                            <RocketLaunchIcon className="w-4 h-4" />
                            Upgrade Plan
                        </button>
                        <button 
                            onClick={onClear}
                            className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            Later
                        </button>
                    </>
                ) : (
                    <button 
                        onClick={onClear}
                        className="px-8 py-2.5 bg-brand-accent text-on-accent text-sm font-bold rounded-lg hover:bg-brand-accent-hover transition-all flex items-center justify-center shadow-sm"
                    >
                        Got it
                    </button>
                )}
            </div>
        </div>
    );
};