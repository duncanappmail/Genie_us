
import React, { useState, useEffect } from 'react';
import type { Project, PublishingPackageWithVariations, PlatformPublishingContentWithVariations } from '../types';
import { regenerateFieldCopy } from '../services/geminiService';
import {
    SparklesIcon, LeftArrowIcon, RightArrowIcon
} from './icons';
import { useUI } from '../context/UIContext';

type SocialPlatform = 'instagram' | 'tiktok' | 'youtube' | 'x';

interface SocialCopyEditorProps {
    project: Project;
}

export const SocialCopyEditor: React.FC<SocialCopyEditorProps> = ({ project }) => {
    const { theme } = useUI();
    const [activeTab, setActiveTab] = useState<SocialPlatform>('instagram');
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [editablePackage, setEditablePackage] = useState<PublishingPackageWithVariations | null>(null);
    const [copyIndexes, setCopyIndexes] = useState({
        instagram: { caption: 0, hashtags: 0, title: 0, audioSuggestion: 0 },
        tiktok: { caption: 0, hashtags: 0, title: 0, audioSuggestion: 0 },
        youtube: { caption: 0, hashtags: 0, title: 0, audioSuggestion: 0 },
        x: { caption: 0, hashtags: 0, title: 0, audioSuggestion: 0 },
    });
    const [regeneratingField, setRegeneratingField] = useState<string | null>(null);

    useEffect(() => {
        if (project.publishingPackage) {
            const { publishingPackage } = project;
            const variationalPackage: PublishingPackageWithVariations = {
                instagram: publishingPackage.instagram ? {
                    caption: [publishingPackage.instagram.caption || ''],
                    hashtags: [publishingPackage.instagram.hashtags || []],
                } : { caption: [''], hashtags: [[]] },
                tiktok: publishingPackage.tiktok ? {
                    caption: [publishingPackage.tiktok.caption || ''],
                    hashtags: [publishingPackage.tiktok.hashtags || []],
                    audioSuggestion: [publishingPackage.tiktok.audioSuggestion || ''],
                } : { caption: [''], hashtags: [[]], audioSuggestion: [''] },
                youtube: publishingPackage.youtube ? {
                    title: [publishingPackage.youtube.title || ''],
                    caption: [publishingPackage.youtube.caption || ''],
                    hashtags: [publishingPackage.youtube.hashtags || []],
                } : { title: [''], caption: [''], hashtags: [[]] },
                x: publishingPackage.x ? {
                    caption: [publishingPackage.x.caption || ''],
                    hashtags: [publishingPackage.x.hashtags || []],
                } : { caption: [''], hashtags: [[]] },
            };
            setEditablePackage(variationalPackage);
        }
    }, [project.publishingPackage]);


    const handleCopy = (text: string, fieldName: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleRegenerateCopy = async (
        platform: SocialPlatform,
        field: keyof PlatformPublishingContentWithVariations
    ) => {
        if (!project.campaignBrief || !editablePackage) return;
        const fieldKey = `${platform}-${field}`;
        setRegeneratingField(fieldKey);

        try {
            const currentValuesRaw = (editablePackage[platform] as any)?.[field] || [];
            const currentValues: string[] = field === 'hashtags'
                ? (currentValuesRaw as string[][]).map(h => h.join(' '))
                : currentValuesRaw as string[];

            const newValue = await regenerateFieldCopy(
                project.campaignBrief,
                project.prompt,
                platform,
                field as any,
                currentValues,
                project.highLevelGoal
            );

            setEditablePackage(prev => {
                if (!prev) return null;
                const newPackage = JSON.parse(JSON.stringify(prev));
                if (!newPackage[platform]) {
                    newPackage[platform] = {};
                }
                if (!newPackage[platform][field]) {
                    newPackage[platform][field] = [];
                }
                newPackage[platform][field].push(newValue);
                return newPackage;
            });

            setCopyIndexes(prev => {
                const totalCount = (editablePackage[platform]?.[field] || []).length;
                return {
                    ...prev,
                    [platform]: { ...prev[platform], [field]: totalCount }
                };
            });

        } catch (e) {
            console.error("Regeneration failed", e);
        } finally {
            setRegeneratingField(null);
        }
    };

    const handleNavigateCopy = (
        platform: SocialPlatform,
        field: keyof PlatformPublishingContentWithVariations,
        direction: 'next' | 'prev'
    ) => {
        const total = (editablePackage?.[platform]?.[field] || []).length;
        if (total <= 1) return;

        setCopyIndexes(prev => {
            const currentIndex = (prev[platform] as any)[field] || 0;
            let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
            if (newIndex >= total) newIndex = 0;
            if (newIndex < 0) newIndex = total - 1;

            return { ...prev, [platform]: { ...prev[platform], [field]: newIndex } };
        });
    };

    const renderEditableField = (
        platform: SocialPlatform,
        field: keyof PlatformPublishingContentWithVariations,
        label: string
    ) => {
        if (!editablePackage || !editablePackage[platform] || (editablePackage[platform] as any)[field] === undefined) return null;

        const variations = (editablePackage[platform] as any)[field] || [];
        const currentIndex = (copyIndexes[platform] as any)[field] || 0;
        const currentValue = variations[currentIndex];
        const fieldKey = `${platform}-${field}`;
        const isRegenerating = regeneratingField === fieldKey;
        const isHashtags = field === 'hashtags';

        const textToCopy = (Array.isArray(currentValue) ? currentValue.join(' ') : currentValue) || '';

        const displayValue = (
            isHashtags && Array.isArray(currentValue) && currentValue.length > 0 ?
                currentValue.map(h => `#${h.replace(/#/g, '')}`).join(' ') :
                Array.isArray(currentValue) ? '' : currentValue
        ) || '';

        return (
            <div key={fieldKey}>
                <div className="flex justify-between items-center mb-3">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => handleRegenerateCopy(platform, field)}
                            disabled={isRegenerating}
                            className="text-sm font-regular text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-50 transition-colors"
                        >
                            {isRegenerating ? '...' : 'Regenerate copy'}
                        </button>
                        <button
                            onClick={() => handleCopy(textToCopy, fieldKey)}
                            className="text-sm font-regular text-brand-accent hover:text-brand-accent-hover-subtle transition-colors"
                        >
                            {copiedField === fieldKey ? 'Copied!' : 'Copy text'}
                        </button>
                    </div>
                </div>
                <div 
                    className="w-full p-4 rounded-md text-sm whitespace-pre-wrap border border-transparent dark:border-gray-800"
                    style={{
                        backgroundColor: theme === 'dark' ? '#000000' : '#F3F4F6' 
                    }}
                >
                    {displayValue}
                </div>
                {variations.length > 1 && (
                    <div className="flex items-center justify-end gap-2 mt-1">
                        <button onClick={() => handleNavigateCopy(platform, field, 'prev')} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><LeftArrowIcon className="w-4 h-4" /></button>
                        <span className="text-xs font-mono">{currentIndex + 1} / {variations.length}</span>
                        <button onClick={() => handleNavigateCopy(platform, field, 'next')} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><RightArrowIcon className="w-4 h-4" /></button>
                    </div>
                )}
            </div>
        );
    };

    const tabs: { id: SocialPlatform, name: string }[] = [
        { id: 'instagram', name: 'Instagram' },
        { id: 'tiktok', name: 'TikTok' },
        { id: 'x', name: 'X' },
        { id: 'youtube', name: 'YouTube Shorts' },
    ];

    if (!editablePackage) {
        return <div className="text-center p-8 text-sm text-gray-500">No social media copy available for this project.</div>;
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg h-full">
            <h3 className="text-lg font-bold">Social Media Copy</h3>
            <nav className="flex overflow-x-auto hide-scrollbar border-b border-gray-200 dark:border-gray-700 mt-4">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-shrink-0 flex justify-center items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                            activeTab === tab.id
                                ? 'border-brand-accent text-gray-900 dark:text-white'
                                : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400'
                        }`}
                    >
                        {tab.name}
                    </button>
                ))}
            </nav>
            <div className="mt-6 space-y-6 pr-2">
                {renderEditableField(activeTab, 'title', 'Title')}
                {renderEditableField(activeTab, 'caption', 'Caption')}
                {renderEditableField(activeTab, 'hashtags', 'Hashtags')}
                {renderEditableField(activeTab, 'audioSuggestion', 'Audio Suggestion')}
            </div>
        </div>
    );
};
