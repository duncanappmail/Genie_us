import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { CheckIcon, ChevronDownIcon } from './icons';

interface SelectOption {
    value: string | number;
    label: string;
    icon?: React.ReactNode;
    description?: string;
}

interface GenericSelectProps {
    label: string;
    options: SelectOption[];
    selectedValue: string | number;
    onSelect: (value: string | number) => void;
    disabled?: boolean;
}

export const GenericSelect: React.FC<GenericSelectProps> = ({ label, options, selectedValue, onSelect, disabled = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [direction, setDirection] = useState<'down' | 'up'>('down');
    const selectRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (isOpen) {
            const selectRect = selectRef.current?.getBoundingClientRect();
            const panelHeight = panelRef.current?.offsetHeight || 200; // Estimate height
            if (selectRect) {
                const spaceBelow = window.innerHeight - selectRect.bottom;
                if (spaceBelow < panelHeight && selectRect.top > panelHeight) {
                    setDirection('up');
                } else {
                    setDirection('down');
                }
            }
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(o => o.value === selectedValue);

    return (
        <div className="relative" ref={selectRef}>
            <label className={`block mb-2 text-xs font-semibold uppercase tracking-wide ${disabled ? 'text-gray-400 dark:text-gray-600' : 'text-gray-500'}`}>{label}</label>
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                disabled={disabled} 
                className="generic-select-button w-full h-12 px-4 border border-gray-300 dark:border-gray-600 rounded-lg flex justify-between items-center text-left bg-white dark:bg-[#171717] input-focus-brand"
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    {selectedOption?.icon}
                    <span className={`truncate ${disabled ? 'text-gray-400 dark:text-[#6D717F]' : 'dark:text-gray-300'}`}>{selectedOption?.label}</span>
                </div>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''} ${disabled ? 'text-gray-400 dark:text-[#6D717F]' : 'text-gray-400'}`} />
            </button>
            {isOpen && (
                <div ref={panelRef} className={`absolute left-0 right-0 w-full mt-2 dropdown-panel border rounded-lg shadow-lg z-20 p-2 ${direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
                    {options.map(option => (
                        <button key={option.value} onClick={() => { onSelect(option.value); setIsOpen(false); }} className="w-full text-left p-2.5 flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                            <div className="flex items-center gap-2">
                                {option.icon}
                                <div>
                                    <span className="font-normal block">{option.label}</span>
                                    {option.description && <span className="text-xs text-gray-500 dark:text-gray-400">{option.description}</span>}
                                </div>
                            </div>
                            {selectedValue === option.value && <CheckIcon className="w-5 h-5 text-brand-accent" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};