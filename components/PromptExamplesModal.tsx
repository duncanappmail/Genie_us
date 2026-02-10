import React, { useState, useEffect, useCallback } from 'react';
import { generatePromptSuggestions } from '../services/geminiService';
import type { Project } from '../types';
import { ModalWrapper } from './ModalWrapper';

interface PromptExamplesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (prompt: string) => void;
  project: Project;
}

export const PromptExamplesModal: React.FC<PromptExamplesModalProps> = ({ isOpen, onClose, onSelect, project }) => {
  const [examples, setExamples] = useState<{ title: string; prompt: string; }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExamples = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const suggestions = await generatePromptSuggestions(project.mode, { productName: project.productName, productDescription: project.productDescription });
      setExamples(suggestions);
    } catch (e) {
      setError('Could not fetch suggestions. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [project.mode, project.productName, project.productDescription]);


  useEffect(() => {
    if (isOpen) {
      fetchExamples();
    }
  }, [isOpen, fetchExamples]);

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
        <div className="bg-white dark:bg-black rounded-2xl shadow-xl w-full max-w-lg p-6 flex flex-col">
          <div className="flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Visual Ideas</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Your Genie has generated some visual ideas for you</p>
          </div>
          
          <div className="mt-4 flex-1 modal-content-bg rounded-lg">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-32 text-red-500">
                {error}
              </div>
            ) : (
              <ul className="space-y-3 p-2">
                {examples.map((example, index) => (
                  <li key={index}>
                    <button
                      onClick={() => { onSelect(example.prompt); onClose(); }}
                      className="w-full text-left p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                    >
                      <h4 className="font-bold text-brand-accent mb-1">{example.title}</h4>
                      <p className="text-gray-800 dark:text-gray-200">{example.prompt}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3 flex-shrink-0">
              <button
                  onClick={onClose}
                  className="w-full sm:flex-1 p-4 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover flex items-center justify-center"
              >
                  Close
              </button>
              <button
                  onClick={fetchExamples}
                  disabled={isLoading}
                  className="action-btn w-full sm:flex-1 dark:border-gray-600"
              >
                  Refresh
              </button>
          </div>
        </div>
    </ModalWrapper>
  );
};