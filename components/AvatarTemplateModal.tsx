
import React, { useState } from 'react';
import { ModalWrapper } from './ModalWrapper';
import { CheckIcon } from './icons';

const TEMPLATE_CHARACTERS = [
    { name: 'Chloe', url: 'https://placehold.co/400x400/91EB23/050C26?text=Chloe', description: 'Friendly & approachable' },
    { name: 'Marcus', url: 'https://placehold.co/400x400/3B82F6/FFFFFF?text=Marcus', description: 'Professional & confident' },
    { name: 'Isabella', url: 'https://placehold.co/400x400/EC4899/FFFFFF?text=Isabella', description: 'Energetic & fun' },
    { name: 'Liam', url: 'https://placehold.co/400x400/F59E0B/FFFFFF?text=Liam', description: 'Casual & relatable' },
];

interface AvatarTemplate {
    name: string;
    url: string;
    description?: string;
}

interface AvatarTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (character: AvatarTemplate) => void;
}

export const AvatarTemplateModal: React.FC<AvatarTemplateModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [selectedChar, setSelectedChar] = useState<AvatarTemplate | null>(null);

  const handleConfirm = () => {
      if (selectedChar) {
          onSelect(selectedChar);
      }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
        <div className="bg-white dark:bg-black rounded-2xl shadow-xl w-full max-w-3xl p-6 flex flex-col">
          <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Choose an Avatar</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Select a professional presenter for your video.</p>
          </div>

          <div className="flex-1 p-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {TEMPLATE_CHARACTERS.map((char) => (
                      <button
                          key={char.name}
                          onClick={() => setSelectedChar(char)}
                          className={`group relative rounded-xl overflow-hidden border-2 transition-all text-left ${
                              selectedChar?.name === char.name 
                              ? 'border-brand-accent ring-1 ring-brand-accent' 
                              : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                      >
                          <div className="aspect-square w-full relative">
                              <img 
                                  src={char.url} 
                                  alt={char.name} 
                                  className="w-full h-full object-cover"
                                  // Fallback if image fails
                                  onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/2B2B2B/FFF?text=Avatar';
                                  }}
                              />
                              {selectedChar?.name === char.name && (
                                  <div className="absolute inset-0 bg-brand-accent/20 flex items-center justify-center">
                                      <div className="bg-brand-accent text-[#050C26] rounded-full p-1">
                                          <CheckIcon className="w-6 h-6" />
                                      </div>
                                  </div>
                              )}
                          </div>
                          <div className="p-3 bg-gray-50 dark:bg-[#1C1E20]">
                              <h4 className="font-bold text-gray-900 dark:text-white">{char.name}</h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{char.description}</p>
                          </div>
                      </button>
                  ))}
              </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row-reverse gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button 
                  onClick={handleConfirm} 
                  disabled={!selectedChar}
                  className="w-full sm:w-auto px-8 py-3 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                  Select Avatar
              </button>
              <button 
                  onClick={onClose} 
                  className="w-full sm:w-auto px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                  Cancel
              </button>
          </div>
        </div>
    </ModalWrapper>
  );
};
