
import React from 'react';
import { ModalWrapper } from './ModalWrapper';

export const PRESET_REGIONS = [
    { name: 'Bedroom', url: 'https://placehold.co/600x400/3B82F6/FFFFFF?text=Bedroom' },
    { name: 'Loft', url: 'https://placehold.co/600x400/EF4444/FFFFFF?text=Loft' },
];

export const PRESET_CITIES = [
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
    maxWidthClass?: string;
}

export const RegionSelectionModal: React.FC<RegionSelectionModalProps> = ({ 
    isOpen, 
    onClose, 
    onSelect, 
    title = "Choose Scene",
    items = PRESET_REGIONS,
    maxWidthClass = "max-w-3xl"
}) => {
    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose}>
            <div className={`bg-white dark:bg-black rounded-2xl shadow-xl w-full ${maxWidthClass} p-6`}>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{title}</h3>
                <div className={`grid grid-cols-2 ${items.length > 2 ? 'md:grid-cols-3' : ''} gap-x-4 gap-y-6`}>
                    {items.map((item) => (
                        <button 
                            key={item.name}
                            onClick={() => { onSelect(item.name); onClose(); }}
                            className="group text-left"
                        >
                            <div className="relative overflow-hidden rounded-xl aspect-square border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                                <img 
                                    src={item.url} 
                                    alt={item.name} 
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                                />
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/30">
                                        Select
                                    </span>
                                </div>
                            </div>
                            <div className="mt-2 px-1">
                                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 transition-colors group-hover:text-brand-accent truncate">
                                    {item.name}
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
