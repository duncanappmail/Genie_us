
import React from 'react';
import type { Project } from '../types';
import { ModalWrapper } from './ModalWrapper';
import { ArrowPathIcon } from './icons';

interface PromptExamplesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (prompt: string) => void;
  onRegenerate: () => void;
  examples: { title: string; prompt: string; }[];
  project: Project;
}

export const PromptExamplesModal: React.FC<PromptExamplesModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  onRegenerate,
  examples,
  project 
}) => {
  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
        <div className="bg-white dark:bg-black rounded-2xl shadow-xl w-full max-w-lg p-6 flex flex-col">
          <div className="flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Visual Ideas</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Your AI Team has generated some ideas for you</p>
          </div>
          
          <div className="mt-4 flex-1 modal-content-bg rounded-lg overflow-y-auto max-h-[60vh] custom-scrollbar">
            {examples.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-500 italic">
                No ideas generated yet.
              </div>
            ) : (
              <ul className="space-y-3 p-2">
                {examples.map((example, index) => (
                  <li key={index}>
                    <button
                      onClick={() => { onSelect(example.prompt); onClose(); }}
                      className="w-full text-left p-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-[#131517]"
                    >
                      <h4 className="font-bold text-brand-accent mb-1 text-sm uppercase tracking-wide">{example.title}</h4>
                      <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">{example.prompt}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3 flex-shrink-0">
              <button
                  onClick={onClose}
                  className="w-full sm:flex-1 p-4 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover flex items-center justify-center transition-colors"
              >
                  Close
              </button>
              <button
                  onClick={onRegenerate}
                  className="action-btn w-full sm:flex-1 dark:border-gray-600 flex items-center justify-center gap-2"
              >
                  <ArrowPathIcon className="w-4 h-4" />
                  Regenerate
              </button>
          </div>
        </div>
    </ModalWrapper>
  );
};
