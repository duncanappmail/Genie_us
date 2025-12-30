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
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Choose a Scene</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {PRESET_SCENES.map((scene) => (
                        <button 
                            key={scene.name}
                            onClick={() => { onSelect(scene.name); onClose(); }}
                            className="group relative rounded-lg overflow-hidden border-2 border-transparent hover:border-brand-accent transition-all aspect-square"
                        >
                            <img src={scene.url} alt={scene.name} className="w-full h-full object-cover" />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs font-bold p-2 text-center">
                                {scene.name}
                            </div>
                        </button>
                    ))}
                </div>
                <div className="mt-6 text-right">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm font-semibold text-gray-800 dark:text-gray-200"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </ModalWrapper>
    );
};