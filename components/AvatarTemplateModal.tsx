import React, { useState } from 'react';
import { ModalWrapper } from './ModalWrapper';

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
  const [selectedChar, setSelectedChar] = useState<AvatarTemplate | null>(null);

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
        <div className="bg-white dark:bg-black rounded-2xl shadow-xl w-full max-w-2xl p-6 flex flex-col">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Choose a Template Avatar</h3>
          