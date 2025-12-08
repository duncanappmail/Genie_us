
import React, { useState, useEffect, useCallback } from 'react';
import { generateUGCScriptIdeas } from '../services/geminiService';
import type { Project, BrandProfile, UGCScriptIdea } from '../types';
import { ModalWrapper } from './ModalWrapper';

interface ScriptGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (script: string, scene: string, action: string) => void;
  project: Project;
  brandProfile?: BrandProfile | null;
}

export const ScriptGeneratorModal: React.FC<ScriptGeneratorModalProps> = ({ isOpen, onClose, onSelect, project, brandProfile }) => {
  const [ideas, setIdeas] = useState<UGCScriptIdea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIdeas = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const suggestions = await generateUGCScriptIdeas({
        topic: project.ugcTopic,
        productName: project.productName,
        productDescription: project.productDescription,
        brandProfile: brandProfile,
        ugcType: project.ugcType,
        sceneDescription: project.ugcSceneDescription // Pass existing scene description for context
      });
      setIdeas(suggestions);
    } catch (e) {
      setError('Could not generate concept ideas. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [project.ugcTopic, project.productName, project.productDescription, project.ugcType, project.ugcSceneDescription, brandProfile]);

  useEffect(() => {
    if (isOpen) {
      fetchIdeas();
    }
  }, [isOpen, fetchIdeas]);

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
        <div className="bg-white dark:bg-black rounded-2xl shadow-xl w-full max-w-2xl flex flex-col">
          <div className="p-6 flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Concept Ideas</h3>
              <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                     {project.ugcTopic ? `Ideas based on "${project.ugcTopic}"` : 'Ideas for your video'}
                  </p>
                  <button 
                    onClick={fetchIdeas} 
                    disabled={isLoading} 
                    className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:underline underline-offset-4 disabled:opacity-50 disabled:no-underline transition-colors"
                  >
                    Regenerate
                  </button>
              </div>
          </div>
          
          <div className="px-6 flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div></div>
            ) : error ? (
              <div className="flex items-center justify-center h-64 text-red-500">{error}</div>
            ) : (
              <div className="space-y-4 pb-6">
                  {ideas.map((idea, index) => (
                    <div key={index} className="p-5 border border-gray-200 rounded-xl modal-content-bg dark:border-gray-600 flex flex-col gap-3">
                        <div className="flex justify-between items-start gap-4">
                            <h4 className="font-bold text-lg text-gray-900 dark:text-white leading-tight">
                                {index + 1}. {idea.hook}
                            </h4>
                            <button 
                                onClick={() => { 
                                    onSelect(idea.keyMessaging || idea.script || '', idea.scene, idea.action || ''); 
                                    onClose(); 
                                }} 
                                className="shrink-0 px-5 py-2 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors text-sm"
                            >
                                Use
                            </button>
                        </div>
                        
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Key Messaging</p>
                            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap text-sm leading-relaxed">{idea.keyMessaging || idea.script}</p>
                        </div>
                        
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Scene</p>
                            <p className="text-gray-600 dark:text-gray-400 text-xs line-clamp-3">{idea.scene}</p>
                        </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="p-6 mt-auto flex flex-col sm:flex-row-reverse gap-3 flex-shrink-0">
              <button 
                onClick={onClose} 
                className="w-full sm:w-auto px-6 py-2 bg-transparent border border-[#2B2B2B] text-gray-600 dark:text-gray-400 font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
              >
                Close
              </button>
          </div>
        </div>
    </ModalWrapper>
  );
};
