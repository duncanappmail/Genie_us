import React from 'react';
import type { CreativeMode, User } from '../types';
import type { AppStep } from '../App';
import { CameraIcon, FilmIcon, SparklesIcon } from '../components/icons';

interface ModeSelectScreenProps {
    onSelectMode: (mode: CreativeMode) => void;
    user: User | null;
    setAppStep: (step: AppStep) => void;
}

export const ModeSelectScreen: React.FC<ModeSelectScreenProps> = ({ onSelectMode, user, setAppStep }) => {
    const plan = user?.subscription?.plan || 'Starter';
    const modes = [
        { name: 'Product Ad', description: 'Drop your product into any scene — instantly ad-ready.', icon: <SparklesIcon className="w-8 h-8"/>, enabled: true },
        { name: 'Art Maker', description: 'Turn ideas into beautiful visuals', icon: <CameraIcon className="w-8 h-8"/>, enabled: true },
        { name: 'Video Maker', description: 'Make your next viral video — or animate your image in seconds', icon: <FilmIcon className="w-8 h-8"/>, enabled: plan === 'Business' },
    ];
    return (
        <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold">What would you like to create today?</h2>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                {modes.map(mode => (
                    <button 
                        key={mode.name}
                        onClick={() => mode.enabled ? onSelectMode(mode.name as CreativeMode) : setAppStep('PLAN_SELECT')}
                        className="p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all border border-gray-200 dark:border-gray-700 text-left relative"
                    >
                        <div className={`${mode.enabled ? 'text-blue-500' : 'text-gray-400'}`}>{mode.icon}</div>
                        <h3 className="mt-4 text-xl font-bold">{mode.name}</h3>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">{mode.description}</p>
                        {!mode.enabled && (
                            <div className="mt-4">
                                <span className="text-xs font-semibold bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full dark:bg-yellow-900 dark:text-yellow-300">
                                    Upgrade to unlock
                                </span>
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};