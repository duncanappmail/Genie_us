
import React from 'react';
import { ModalWrapper } from './ModalWrapper';
import { XMarkIcon } from './icons';

const TEMPLATE_CHARACTERS = [
    { name: 'Chloe', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400' },
    { name: 'Marcus', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400' },
    { name: 'Isabella', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=400' },
    { name: 'Liam', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&h=400' },
];

interface AvatarTemplate {
    name: string;
    url: string;
}

interface AvatarTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (character: AvatarTemplate) => void;
}

export const AvatarTemplateModal: React.FC<AvatarTemplateModalProps> = ({ isOpen, onClose, onSelect }) => {
  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
        <div className="bg-white dark:bg-black rounded-2xl shadow-xl w-full max-w-2xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Choose a Template Avatar</h3>
              <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                  <XMarkIcon className="w-6 h-6 text-gray-500" />
              </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-1">
              {TEMPLATE_CHARACTERS.map((char) => (
                  <button 
                    key={char.name} 
                    onClick={() => onSelect(char)}
                    className="group relative rounded-xl overflow-hidden aspect-square border-2 border-transparent hover:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  >
                      <img src={char.url} alt={char.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 text-white text-sm font-semibold text-center opacity-0 group-hover:opacity-100 transition-opacity">
                          {char.name}
                      </div>
                  </button>
              ))}
          </div>
          
          <div className="mt-6 flex justify-end">
              <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
                  Cancel
              </button>
          </div>
        </div>
    </ModalWrapper>
  );
};
