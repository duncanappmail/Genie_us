import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useProjects } from '../context/ProjectContext';
import { Uploader } from '../components/Uploader';
import { AssetPreview } from '../components/AssetPreview';
import { XMarkIcon, SparklesIcon, LeftArrowIcon } from '../components/icons';
import type { UploadedFile, Project } from '../types';
import { CREDIT_COSTS } from '../constants';

export const AgentScreen: React.FC = () => {
    const { user } = useAuth();
    const { isLoading, error, goBack } = useUI();
    const { 
        currentProject: project, 
        setCurrentProject: setProject,
        runAgent,
    } = useProjects();
    
    if (!project || !user) {
        return <div className="text-center p-8">Error: No active project or user.</div>;
    }
    
    const updateProject = (updates: Partial<Project>) => {
        setProject({ ...project, ...updates });
    };

    const cost = CREDIT_COSTS.base.agent;
    const hasEnoughCredits = (user.credits?.strategy?.current ?? 0) >= cost;
    const isLaunchDisabled = isLoading || !project.productFile || !hasEnoughCredits;

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                 <button onClick={goBack} className="flex items-center gap-2 text-sm font-semibold mb-6 hover:text-[#3f6212] dark:hover:text-[#91EB23]">
                    <LeftArrowIcon className="w-4 h-4"/> Back
                </button>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Provide Your Campaign Briefing</h2>
            </div>


            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border">
                 <div>
                    <label htmlFor="highLevelGoal" className="block mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Campaign Goal & Context (Optional)</label>
                    <textarea
                        id="highLevelGoal"
                        value={project.highLevelGoal || ''}
                        onChange={(e) => updateProject({ highLevelGoal: e.target.value })}
                        placeholder="Provide any details to guide your Genie. Examples: a discount you're running, a holiday theme (e.g., 'Holiday Cheer'), a target audience (e.g., 'Gen Z shoppers'), or just leave it blank and let your Genie decide the best strategy."
                        className="w-full p-4 border rounded-lg h-36 input-focus-brand"
                    />
                </div>

                {error && <div className="mt-6 p-4 bg-red-50 text-red-800 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-300 dark:border-red-500/30">{error}</div>}
                
                {!hasEnoughCredits && !isLoading && (
                    <div className="mt-6 p-4 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-500/30 text-center">
                        Not enough credits. The AI Agent costs {cost} Strategy credits to run.
                    </div>
                )}
                
                <div className="mt-8 text-center">
                    <button onClick={runAgent} disabled={isLaunchDisabled} className="w-full sm:w-auto px-12 py-4 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center justify-center gap-2 sm:mx-auto">
                        <span>Generate Campaign</span>
                        <SparklesIcon className="w-5 h-5" />
                        <span>{cost}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};