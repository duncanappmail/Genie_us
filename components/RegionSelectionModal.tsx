
import React from 'react';
import { ModalWrapper } from './ModalWrapper';

export const PRESET_REGIONS = [
    { name: 'New York', url: 'https://placehold.co/600x400/3B82F6/FFFFFF?text=New+York' },
    { name: 'London', url: 'https://placehold.co/600x400/EF4444/FFFFFF?text=London' },
    { name: 'Tokyo', url: 'https://placehold.co/600x400/10B981/FFFFFF?text=Tokyo' },
    { name: 'Hanoi', url: 'https://placehold.co/600x400/F59E0B/FFFFFF?text=Hanoi' },
    { name: 'Bangkok', url: 'https://placehold.co/600x400/8B5CF6/FFFFFF?text=Bangkok' },
    { name: 'Shanghai', url: 'https://placehold.co/600x400/EC4899/FFFFFF?text=Shanghai' },
];

export const WHIMSICAL_SCENES = [
    { name: 'Whimsical Urban Rooftop', url: 'https://placehold.co/600x400/3B82F6/FFFFFF?text=Whimsical+Urban+Rooftop' },
    { name: 'Inflated Dream Space', url: 'https://placehold.co/600x400/FFC0CB/050C26?text=Inflated+Dream+Space' },
    { name: 'Interior Playground', url: 'https://placehold.co/600x400/8B5CF6/FFFFFF?text=Interior+Playground' },
    { name: 'Surreal Outdoor Courtyard', url: 'https://placehold.co/600x400/10B981/FFFFFF?text=Surreal+Outdoor+Courtyard' },
    { name: 'Floating Architectural Garden', url: 'https://placehold.co/600x400/F59E0B/FFFFFF?text=Floating+Architectural+Garden' },
    { name: 'Endless Staircase', url: 'https://placehold.co/600x400/6B7280/FFFFFF?text=Endless+Staircase' },
    { name: 'BTS Studio', url: 'https://placehold.co/600x400/000000/FFFFFF?text=BTS+Studio' },
];

interface RegionSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (regionName: string) => void;
    title?: string;
    items?: { name: string; url: string }[];
}

export const RegionSelectionModal: React.FC<RegionSelectionModalProps> = ({ 
    isOpen, 
    onClose, 
    onSelect, 
    title = "Choose a Region",
    items = PRESET_REGIONS 
}) => {
    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose}>
            <div className="bg-white dark:bg-black rounded-2xl shadow-xl w-full max-w-3xl p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {items.map((item) => (
                        <button 
                            key={item.name}
                            onClick={() => { onSelect(item.name); onClose(); }}
                            className="group relative rounded-lg overflow-hidden border-2 border-transparent hover:border-brand-accent transition-all aspect-video"
                        >
                            <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white font-bold">Select</span>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] font-bold p-2 text-center truncate">
                                {item.name}
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
