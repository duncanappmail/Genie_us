
import React, { useState } from 'react';
import { ModalWrapper } from './ModalWrapper';
import { AspectRatioTallIcon, AspectRatioSquareIcon, AspectRatioWideIcon } from './icons';
import type { Project } from '../types';

interface PlatformSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (aspectRatio: Project['aspectRatio']) => void;
}

type PlatformId = 'instagram' | 'tiktok' | 'youtube' | 'x' | 'linkedin';

interface PlatformOption {
    id: PlatformId;
    name: string;
    ratios: {
        value: Project['aspectRatio'];
        label: string;
        icon: React.FC<any>;
    }[];
}

const PLATFORMS: PlatformOption[] = [
    {
        id: 'instagram',
        name: 'Instagram',
        ratios: [
            { value: '9:16', label: 'Reel / Story', icon: AspectRatioTallIcon },
            { value: '1:1', label: 'Post', icon: AspectRatioSquareIcon },
        ]
    },
    {
        id: 'tiktok',
        name: 'TikTok',
        ratios: [
            { value: '9:16', label: 'TikTok', icon: AspectRatioTallIcon },
        ]
    },
    {
        id: 'youtube',
        name: 'YouTube',
        ratios: [
            { value: '9:16', label: 'Shorts', icon: AspectRatioTallIcon },
            { value: '16:9', label: 'Video', icon: AspectRatioWideIcon },
        ]
    },
    {
        id: 'x',
        name: 'X',
        ratios: [
            { value: '1:1', label: 'Post', icon: AspectRatioSquareIcon },
            { value: '16:9', label: 'Video', icon: AspectRatioWideIcon },
        ]
    },
    {
        id: 'linkedin',
        name: 'LinkedIn',
        ratios: [
            { value: '1:1', label: 'Post', icon: AspectRatioSquareIcon },
            { value: '16:9', label: 'Video', icon: AspectRatioWideIcon },
        ]
    }
];

export const PlatformSelectorModal: React.FC<PlatformSelectorModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [selectedPlatform, setSelectedPlatform] = useState<PlatformId>('instagram');
    const [selectedRatio, setSelectedRatio] = useState<Project['aspectRatio'] | null>(null);

    const currentPlatform = PLATFORMS.find(p => p.id === selectedPlatform);

    const handleConfirm = () => {
        if (selectedRatio) {
            onConfirm(selectedRatio);
        }
    };

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose}>
            <div className="bg-white dark:bg-black rounded-2xl shadow-xl w-full max-w-2xl p-0 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 pb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center">Where will you post this?</h3>
                </div>

                {/* Tabs */}
                <div className="flex justify-center overflow-x-auto hide-scrollbar px-2 border-b border-gray-200 dark:border-gray-700">
                    {PLATFORMS.map(platform => {
                        const isActive = selectedPlatform === platform.id;
                        return (
                            <button
                                key={platform.id}
                                onClick={() => {
                                    setSelectedPlatform(platform.id);
                                    setSelectedRatio(null);
                                }}
                                className={`whitespace-nowrap px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                                    isActive 
                                    ? 'border-brand-accent text-gray-900 dark:text-white' 
                                    : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400'
                                }`}
                            >
                                {platform.name}
                            </button>
                        );
                    })}
                </div>

                {/* Instruction Text */}
                <div className="text-center mt-6 px-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Please select the aspect ratio</p>
                </div>

                {/* Content */}
                <div className="p-8 pt-4">
                    <div className="grid grid-cols-4 gap-4">
                        {currentPlatform?.ratios.map(ratio => {
                            const RatioIcon = ratio.icon;
                            const isSelected = selectedRatio === ratio.value;
                            return (
                                <button
                                    key={ratio.value}
                                    onClick={() => setSelectedRatio(ratio.value)}
                                    className={`group relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 bg-transparent ${
                                        isSelected 
                                        ? 'border-brand-accent' 
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-white'
                                    }`}
                                >
                                    <div className={`mb-3 transition-colors ${
                                        isSelected 
                                        ? 'text-brand-accent' 
                                        : 'text-gray-400 dark:text-gray-600 dark:group-hover:text-white'
                                    }`}>
                                        <RatioIcon className="w-10 h-10" />
                                    </div>
                                    <span className={`text-base font-bold transition-colors ${
                                        isSelected 
                                        ? 'text-gray-900 dark:text-white' 
                                        : 'text-gray-500 dark:text-gray-400 dark:group-hover:text-white'
                                    }`}>
                                        {ratio.value}
                                    </span>
                                    
                                    {isSelected && (
                                        <div className="absolute inset-0 rounded-xl ring-2 ring-brand-accent pointer-events-none" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 pt-0 flex flex-col sm:flex-row-reverse gap-3">
                    <button 
                        onClick={handleConfirm} 
                        disabled={!selectedRatio}
                        className="w-full sm:flex-1 px-8 py-3 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Continue
                    </button>
                    <button onClick={onClose} className="action-btn w-full sm:flex-1 px-8 dark:border-gray-700">
                        Cancel
                    </button>
                </div>
            </div>
        </ModalWrapper>
    );
};
