
import React from 'react';
import { ModalWrapper } from './ModalWrapper';

export const PRESET_SCENES = [
    { name: 'Bedroom', url: 'https://placehold.co/600x400/FFC0CB/050C26?text=Bedroom' },
    { name: 'Living Room', url: 'https://placehold.co/600x400/E2E8F0/050C26?text=Living+Room' },
    { name: 'Urban Street', url: 'https://placehold.co/600x400/3B82F6/FFFFFF?text=Urban+Street' },
    { name: 'Studio', url: 'https://placehold.co/600x400/F59E0B/FFFFFF?text=Studio' },
    { name: 'Beach', url: 'https://placehold.co/600x400/10B981/FFFFFF?text=Beach' },
    { name: 'Park', url: 'https://placehold.co/600x400/8B5CF6/FFFFFF?text=Park' },
    { name: 'Office', url: 'https://placehold.co/600x400/6B7280/FFFFFF?text=Office' },
    { name: 'Cafe', url: 'https://placehold.co/600x400/EC4899/FFFFFF?text=Cafe' },
];

interface SceneSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (sceneName: string) => void;
}

export const SceneSelectionModal: React.FC<SceneSelectionModalProps> = ({ isOpen, onClose, onSelect }) => {
    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose}>
            <div className="bg-white dark:bg-black rounded-2xl shadow-xl w-full max-w-3xl p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Choose a Scene</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">
                    {PRESET_SCENES.map((scene) => (
                        <button 
                            key={scene.name}
                            onClick={() => { onSelect(scene.name); onClose(); }}
                            className="group text-left"
                        >
                            <div className="relative overflow-hidden rounded-xl aspect-square border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                                <img 
                                    src={scene.url} 
                                    alt={scene.name} 
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                                />
                            </div>
                            <div className="mt-2 px-1">
                                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 transition-colors group-hover:text-brand-accent truncate">
                                    {scene.name}
                                </h4>
                            </div>
                        </button>
                    ))}
                </div>
                <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-800 text-right">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </ModalWrapper>
    );
};
