import React, { useState, useEffect, useCallback } from 'react';
import { generateCampaignInspiration, elaborateArtDirection, generateUGCScripts, generateSocialProofIdeas } from '../services/geminiService';
import type { Project, CampaignInspiration, UGCScriptIdea, SocialProofIdea } from '../types';
import { ModalWrapper } from './ModalWrapper';

type CreativeIdea = CampaignInspiration | UGCScriptIdea | SocialProofIdea;

interface CampaignInspirationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: string, type: 'artDirection' | 'script' | 'review') => void;
  project: Project;
}

export const CampaignInspirationModal: React.FC<CampaignInspirationModalProps> = ({ isOpen, onClose, onSelect, project }) => {
  const [ideas, setIdeas] = useState<CreativeIdea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isElaborating, setIsElaborating] = useState<number | null>(null);
  
  const adStyle = project.adStyle || 'Creative Placement';

  const fetchIdeas = useCallback(async () => {
    if (!project.campaignBrief) {
        setError("Please upload a product image first to generate a campaign brief.");
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      let suggestions: CreativeIdea[];
      if (adStyle === 'UGC') {
        suggestions = await generateUGCScripts(project.campaignBrief);
      } else if (adStyle === 'Social Proof') {
        suggestions = await generateSocialProofIdeas(project.campaignBrief);
      } else {
        suggestions = await generateCampaignInspiration(project.campaignBrief, project.highLevelGoal);
      }
      setIdeas(suggestions);
    } catch (e) {
      setError('Could not fetch campaign ideas. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [project.campaignBrief, project.highLevelGoal, adStyle]);


  useEffect(() => {
    if (isOpen) {
      fetchIdeas();
    }
  }, [isOpen, fetchIdeas]);
  
  const handleUseDirection = async (campaign: CampaignInspiration, index: number) => {
      if (!project.campaignBrief) return;
      setIsElaborating(index);
      try {
          const detailedPrompt = await elaborateArtDirection(campaign.artDirection, project.campaignBrief);
          onSelect(detailedPrompt, 'artDirection');
          onClose();
      } catch (e: any) {
          setError(e.message || "Could not elaborate on the art direction. Please try again.");
      } finally {
          setIsElaborating(null);
      }
  };
  
  const handleSelect = (value: string, type: 'artDirection' | 'script' | 'review') => {
      onSelect(value, type);
      onClose();
  };

  const renderIdeaCard = (idea: CreativeIdea, index: number) => {
    if ('artDirection' in idea) { // CampaignInspiration
      return (
        <div className="p-4 border border-gray-200 rounded-lg modal-content-bg dark:border-gray-600">
          <h4 className="font-bold text-lg text-brand-accent">{idea.hook}</h4>
          <div className="mt-3 space-y-3 text-sm">
            <div><p className="font-semibold text-gray-800 dark:text-gray-200">Strategy:</p><p className="text-gray-600 dark:text-gray-300">{idea.strategy}</p></div>
            <div><p className="font-semibold text-gray-800 dark:text-gray-200">Concept:</p><p className="text-gray-600 dark:text-gray-300">{idea.concept}</p></div>
            <div><p className="font-semibold text-gray-800 dark:text-gray-200">Art Direction:</p><p className="text-gray-600 dark:text-gray-300">{idea.artDirection}</p></div>
          </div>
          <div className="mt-4 text-right">
            <button 
                onClick={() => handleUseDirection(idea, index)} 
                disabled={isElaborating !== null} 
                className="w-full sm:w-auto px-6 py-2.5 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {isElaborating === index ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    <span>Generating...</span>
                  </>
              ) : 'Use this art direction'}
            </button>
          </div>
        </div>
      );
    }
    if ('script' in idea) { // UGCScriptIdea
      return (
        <div className="p-4 border border-gray-200 rounded-lg modal-content-bg dark:border-gray-600">
          <h4 className="font-bold text-lg text-brand-accent">{idea.hook}</h4>
          <div className="mt-3 space-y-3 text-sm"><p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{idea.script}</p></div>
          <div className="mt-4 text-right">
              <button 
                onClick={() => handleSelect(idea.script, 'script')} 
                className="w-full sm:w-auto px-6 py-2.5 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors text-sm"
              >
                  Use this script
              </button>
          </div>
        </div>
      );
    }
    if ('review' in idea) { // SocialProofIdea
      return (
        <div className="p-4 border border-gray-200 rounded-lg modal-content-bg dark:border-gray-600">
          <h4 className="font-bold text-lg text-brand-accent">{idea.hook}</h4>
          <div className="mt-3 space-y-3 text-sm"><p className="text-gray-600 dark:text-gray-300">"{idea.review}"</p></div>
          <div className="mt-4 text-right">
              <button 
                onClick={() => handleSelect(idea.review, 'review')} 
                className="w-full sm:w-auto px-6 py-2.5 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors text-sm"
              >
                  Use this review
              </button>
          </div>
        </div>
      );
    }
    return null;
  };
  
  const getTitle = () => {
      switch(adStyle) {
          case 'UGC': return 'UGC Script Ideas';
          case 'Social Proof': return 'Social Proof Ideas';
          default: return 'Campaign Inspiration';
      }
  }

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
        <div className="bg-white dark:bg-black rounded-2xl shadow-xl w-full max-w-2xl flex flex-col">
          <div className="p-6 flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{getTitle()}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Your Genie has generated some concepts for you.</p>
          </div>
          
          <div className="px-6 flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div></div>
            ) : error ? (
              <div className="flex items-center justify-center h-64 text-red-500">{error}</div>
            ) : (
              <div className="space-y-4">{ideas.map((idea, index) => <div key={index}>{renderIdeaCard(idea, index)}</div>)}</div>
            )}
          </div>

          <div className="p-6 mt-4 flex flex-col sm:flex-row-reverse gap-3 flex-shrink-0">
              <button onClick={onClose} className="w-full sm:flex-1 p-4 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover flex items-center justify-center">Close</button>
              <button onClick={fetchIdeas} disabled={isLoading} className="action-btn w-full sm:flex-1">Refresh</button>
          </div>
        </div>
    </ModalWrapper>
  );
};