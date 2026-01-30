import React, { useState, useEffect, useRef } from 'react';
import { SparklesIcon, PlusIcon, XMarkIcon } from './icons';
import { CREDIT_COSTS } from '../constants';
import { ModalWrapper } from './ModalWrapper';
import { GenericSelect } from './GenericSelect';
import { AssetPreview } from './AssetPreview';
import { suggestMotionPrompt } from '../services/geminiService';
import type { UploadedFile } from '../types';
import { useUI } from '../context/UIContext';

interface AnimateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (config: { 
        prompt: string;
        model: string;
        resolution: '720p' | '1080p';
        duration: number;
        aspectRatio: string;
    }) => void;
    defaultPrompt?: string;
    asset: UploadedFile | null;
}

const VIDEO_MODELS = [
    { value: 'veo-3.1-fast-generate-preview', label: 'Veo Fast (Quick Preview)' },
    { value: 'veo-3.1-generate-preview', label: 'Veo Cinematic (Highest Quality)' },
];

const VIDEO_RESOLUTIONS = [
    { value: '720p', label: '720p (Fast)' },
    { value: '1080p', label: '1080p (HD)' },
];

const VIDEO_DURATIONS = [
    { value: 4, label: '4 Seconds' },
    { value: 7, label: '7 Seconds' },
    { value: 10, label: '10 Seconds' },
];

const ASPECT_RATIOS = [
    { value: '9:16', label: '9:16' },
    { value: '16:9', label: '16:9' },
    { value: '1:1', label: '1:1' }
];

export const AnimateModal: React.FC<AnimateModalProps> = ({ isOpen, onClose, onConfirm, defaultPrompt, asset }) => {
    const { setIsLoading, setLoadingTitle, setAgentStatusMessages } = useUI();
    const [prompt, setPrompt] = useState(defaultPrompt || '');
    const [model, setModel] = useState(VIDEO_MODELS[0].value);
    const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
    const [duration, setDuration] = useState(4);
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [insight, setInsight] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen) {
            setPrompt(defaultPrompt || ""); 
            setInsight(null);
            setAspectRatio('1:1'); 
        }
    }, [isOpen, defaultPrompt]);

    const handleSuggest = async () => {
        if (!asset) return;
        setIsSuggesting(true);
        setIsLoading(true);
        setLoadingTitle("Genie is brainstorming motion...");
        setAgentStatusMessages([]);

        const addAgent = (role: string, content: string, status: 'active' | 'done') => {
            setAgentStatusMessages(prev => {
                const updatedPrev = prev.map(m => m.status === 'active' ? { ...m, status: 'done' as const } : m);
                return [...updatedPrev, { role, content, status }];
            });
        };

        try {
            addAgent('Supervisor Agent', 'Orchestrating the creative workflow', 'active');
            await new Promise(r => setTimeout(r, 1000));
            
            addAgent('Director Agent', 'Analyzing visual composition and depth cues...', 'active');
            const result = await suggestMotionPrompt(asset);
            
            addAgent('Director Agent', 'Optimizing camera path for cinematic impact', 'done');
            
            setPrompt(result.motion_prompt);
            setInsight(result.cinematographer_insight);
        } catch (e) {
            console.error("Suggestion failed", e);
        } finally {
            setIsSuggesting(false);
            setIsLoading(false);
            setAgentStatusMessages([]);
        }
    };

    const handleSubmit = () => {
        if(prompt) {
            onConfirm({
                prompt,
                model,
                resolution,
                duration,
                aspectRatio
            });
        }
    }

    const cost = model === 'veo-3.1-generate-preview' ? CREDIT_COSTS.base.videoCinematic : CREDIT_COSTS.base.videoFast;

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose}>
            <div className="bg-white dark:bg-black rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">
                {/* Header Section */}
                <div className="p-6 pb-2">
                    <div className="flex justify-between items-start">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Animate Image</h3>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
                        Transform your image into an engaging video
                    </p>
                </div>

                <div className="p-6 pt-4 space-y-6">
                    {/* Prompt Section - Perfect Parity with main GeneratorScreen */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label htmlFor="prompt-animate" className="text-xl font-bold text-gray-900 dark:text-white">
                                Describe your vision
                            </label>
                        </div>
                        <div className="relative border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:!bg-[#131517] transition-all group focus-within:ring-1 focus-within:ring-white focus-within:border-white">
                            
                            {/* Insight Box */}
                            {insight && (
                                <div className="mb-4 p-3 rounded-lg bg-brand-accent/5 border border-brand-accent/10 relative animate-in fade-in slide-in-from-top-1 duration-500">
                                    <button 
                                        onClick={() => setInsight(null)}
                                        className="absolute top-2 right-2 text-gray-500 hover:text-gray-300 transition-colors"
                                    >
                                        <XMarkIcon className="w-4 h-4" />
                                    </button>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold uppercase tracking-wide text-brand-accent">Director's Insight</span>
                                    </div>
                                    <p className="text-xs text-gray-400 italic leading-relaxed pr-6">
                                        "{insight}"
                                    </p>
                                </div>
                            )}

                            <textarea
                                id="prompt-animate"
                                ref={textareaRef}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe how you'd like to transform your static image into a video."
                                className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-sm min-h-[8rem] pb-10 resize-none p-0 text-gray-900 dark:text-white placeholder-gray-500"
                            />
                            
                            {/* Reference Preview row inside prompt box */}
                            {asset && (
                                <div className="flex flex-wrap gap-2 mb-4 mt-2">
                                    <div className="relative group/thumb w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 shadow-sm">
                                        <AssetPreview asset={asset} objectFit="cover" />
                                    </div>
                                </div>
                            )}

                            {/* Action Bar inside prompt box */}
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-700/50">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 transition-colors opacity-30 cursor-not-allowed">
                                        <PlusIcon className="w-5 h-5" />
                                    </div>
                                </div>
                                <button 
                                    onClick={handleSuggest} 
                                    disabled={isSuggesting || !asset}
                                    className="text-sm font-bold text-brand-accent hover:underline flex items-center gap-1.5 disabled:opacity-50 transition-all"
                                >
                                    {isSuggesting ? (
                                        <><div className="w-3 h-3 border-2 border-brand-accent border-t-transparent rounded-full animate-spin"></div> Thinking...</>
                                    ) : (
                                        <><SparklesIcon className="w-4 h-4"/> Suggest</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Settings Section */}
                    <div className="space-y-4">
                        <div className="w-full">
                            <GenericSelect 
                                label="AI Model" 
                                options={VIDEO_MODELS} 
                                selectedValue={model} 
                                onSelect={(v) => setModel(v as string)} 
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <GenericSelect 
                                label="Resolution" 
                                options={VIDEO_RESOLUTIONS} 
                                selectedValue={resolution} 
                                onSelect={(v) => setResolution(v as any)} 
                            />
                            <GenericSelect 
                                label="Duration" 
                                options={VIDEO_DURATIONS} 
                                selectedValue={duration} 
                                onSelect={(v) => setDuration(v as any)} 
                            />
                            <GenericSelect 
                                label="Aspect Ratio" 
                                options={ASPECT_RATIOS} 
                                selectedValue={aspectRatio} 
                                onSelect={(v) => setAspectRatio(v as any)} 
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row-reverse gap-3">
                    <button 
                        onClick={handleSubmit} 
                        disabled={!prompt || isSuggesting} 
                        className="w-full sm:flex-1 py-4 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-accent/10"
                    >
                        <span>Generate</span>
                        <SparklesIcon className="w-5 h-5" />
                        <span className="opacity-70">({cost})</span>
                    </button>
                    <button 
                        onClick={onClose} 
                        className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </ModalWrapper>
    );
};