
import React, { useState, useEffect } from 'react';
import { VideoIcon, SparklesIcon } from './icons';
import { CREDIT_COSTS } from '../constants';
import { ModalWrapper } from './ModalWrapper';
import { GenericSelect } from './GenericSelect';

interface AnimationSettings {
    model: string;
    resolution: '720p' | '1080p';
    duration: number;
    aspectRatio: string;
}

interface AnimateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (prompt: string, settings: AnimationSettings) => void;
    defaultPrompt?: string;
    initialAspectRatio?: string;
}

const VIDEO_MODELS = [
    { value: 'veo-3.1-fast-generate-preview', label: 'Veo Fast' },
    { value: 'veo-3.1-generate-preview', label: 'Veo Cinematic' },
];

const VIDEO_RESOLUTIONS = [
    { value: '720p', label: '720p' },
    { value: '1080p', label: '1080p' },
];

const VIDEO_DURATIONS = [
    { value: 4, label: '4s' },
    { value: 7, label: '7s' },
    { value: 10, label: '10s' },
];

const ASPECT_RATIOS = [
    { value: '9:16', label: '9:16' },
    { value: '16:9', label: '16:9' },
    { value: '1:1', label: '1:1' },
];

export const AnimateModal: React.FC<AnimateModalProps> = ({ isOpen, onClose, onConfirm, defaultPrompt, initialAspectRatio }) => {
    const [prompt, setPrompt] = useState(defaultPrompt || '');
    const [model, setModel] = useState(VIDEO_MODELS[0].value);
    const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
    const [duration, setDuration] = useState(4);
    const [aspectRatio, setAspectRatio] = useState(initialAspectRatio || '16:9');

    useEffect(() => {
        if (isOpen) {
            setPrompt(defaultPrompt || "Slow cinematic pan, bringing the scene to life.");
            if (initialAspectRatio) {
                const validRatios = ASPECT_RATIOS.map(r => r.value);
                setAspectRatio(validRatios.includes(initialAspectRatio) ? initialAspectRatio : '1:1');
            }
        }
    }, [isOpen, defaultPrompt, initialAspectRatio]);

    const calculateCost = () => {
        const base = model === 'veo-3.1-generate-preview' ? CREDIT_COSTS.base.videoCinematic : CREDIT_COSTS.base.videoFast;
        const resMod = CREDIT_COSTS.modifiers.videoResolution[resolution as '720p' | '1080p'] || 0;
        const durMod = CREDIT_COSTS.modifiers.videoDuration[duration as 4 | 7 | 10] || 0;
        return base + resMod + durMod;
    };

    const handleSubmit = () => {
        if (prompt) {
            onConfirm(prompt, { model, resolution, duration, aspectRatio });
        }
    };

    const cost = calculateCost();

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose}>
            <div className="bg-white dark:bg-black rounded-2xl shadow-xl w-full max-w-2xl p-8 flex flex-col gap-6 border border-gray-200 dark:border-gray-800 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="text-left">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Animate Image</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Transform your image into an engaging video</p>
                </div>

                {/* Production Grid: 2x2 */}
                <div className="grid grid-cols-2 gap-6">
                    <GenericSelect 
                        label="AI Model" 
                        options={VIDEO_MODELS} 
                        selectedValue={model} 
                        onSelect={(v) => setModel(v as string)} 
                    />
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
                        onSelect={(v) => setDuration(v as number)} 
                    />
                    <GenericSelect 
                        label="Aspect Ratio" 
                        options={ASPECT_RATIOS} 
                        selectedValue={aspectRatio} 
                        onSelect={(v) => setAspectRatio(v as string)} 
                    />
                </div>

                <div>
                    <label className="block mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Creative Direction</label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe the motion (e.g., cinematic pan, subtle zoom)..."
                        className="w-full p-4 border border-gray-300 dark:border-gray-700 rounded-xl min-h-[120px] bg-gray-50 dark:bg-[#131517] input-focus-brand resize-none placeholder-gray-500 text-gray-900 dark:text-white"
                        autoFocus
                    />
                </div>

                <div className="mt-2 flex flex-col sm:flex-row-reverse gap-3">
                    <button 
                        onClick={handleSubmit} 
                        disabled={!prompt} 
                        className="w-full sm:flex-1 p-4 bg-brand-accent text-on-accent font-bold rounded-xl hover:bg-brand-accent-hover transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-accent/20 active:scale-95 disabled:opacity-50"
                    >
                        <span>Animate Now</span>
                        <SparklesIcon className="w-5 h-5" />
                        <span className="bg-black/10 px-2 py-0.5 rounded-full text-xs font-mono">{cost} Credits</span>
                    </button>
                    <button 
                        onClick={onClose} 
                        className="w-full sm:w-auto px-8 p-4 bg-transparent border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </ModalWrapper>
    );
};
