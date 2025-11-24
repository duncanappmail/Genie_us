import React, { useEffect, useRef, useState } from 'react';
import { useGenieChat } from '../context/GenieChatContext';
import { XMarkIcon, SparklesIcon, ArrowLongRightIcon, ArrowPathIcon, PlusIcon } from './icons';
import ReactMarkdown from 'react-markdown';
import type { UploadedFile } from '../types';
import { AssetPreview } from './AssetPreview';

// Helper to process files
const fileToUploadedFile = async (file: File): Promise<UploadedFile> => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            const base64 = (reader.result as string)?.split(',')[1];
            resolve({
                id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                base64,
                mimeType: file.type,
                name: file.name,
                blob: file,
            });
        };
        reader.onerror = reject;
    });
};

// --- Components for Markdown Styling ---

// For Genie (Model): Muted text for readability on light/dark backgrounds
const ModelMarkdownComponents = {
    p: ({ children }: any) => <p className="text-gray-700 dark:text-gray-400 leading-relaxed mb-4 last:mb-0">{children}</p>,
    h1: ({ children }: any) => <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-3 mt-4">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 mt-3">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 mt-3">{children}</h3>,
    strong: ({ children }: any) => <strong className="font-bold text-gray-900 dark:text-white">{children}</strong>,
    ul: ({ children }: any) => <ul className="list-disc pl-5 mb-4 space-y-1 text-gray-700 dark:text-gray-400">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal pl-5 mb-4 space-y-1 text-gray-700 dark:text-gray-400">{children}</ol>,
    li: ({ children }: any) => <li className="pl-1">{children}</li>,
};

// For User: Inherit color (Black) from parent bubble for contrast against Brand Accent
const UserMarkdownComponents = {
    p: ({ children }: any) => <p className="leading-relaxed mb-0">{children}</p>,
    h1: ({ children }: any) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-base font-bold mb-2">{children}</h3>,
    strong: ({ children }: any) => <strong className="font-bold">{children}</strong>,
    ul: ({ children }: any) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
    li: ({ children }: any) => <li className="pl-1">{children}</li>,
};

export const GenieChat: React.FC = () => {
    const { isOpen, toggleChat, messages, sendMessage, isTyping, clearHistory } = useGenieChat();
    const [input, setInput] = useState('');
    const [attachments, setAttachments] = useState<UploadedFile[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, isOpen]);

    // Auto-focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSend = () => {
        if (input.trim() || attachments.length > 0) {
            sendMessage(input, attachments);
            setInput('');
            setAttachments([]);
        }
    };

    const handleCardClick = (value: string) => {
        sendMessage(value);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = await Promise.all(
                Array.from(e.target.files).map((file) => fileToUploadedFile(file as File))
            );
            setAttachments(prev => [...prev, ...newFiles]);
        }
        // Reset input so same file can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeAttachment = (id: string) => {
        setAttachments(prev => prev.filter(f => f.id !== id));
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop for mobile */}
            <div 
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
                onClick={toggleChat}
            />

            {/* Drawer */}
            <div className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-white dark:bg-[#131517] shadow-2xl z-50 border-l border-gray-200 dark:border-gray-800 flex flex-col animate-slide-in-right font-sans">
                
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-[#1C1E20]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-accent/10 rounded-full">
                            <SparklesIcon className="w-5 h-5 text-brand-accent" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white leading-tight">Genie Co-pilot</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Always here to help</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={clearHistory}
                            className="p-2 text-gray-400 hover:text-brand-accent hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors group"
                            title="Reset Conversation"
                        >
                            <ArrowPathIcon className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
                        </button>
                        <button 
                            onClick={toggleChat}
                            className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white dark:bg-[#131517]">
                    {messages.map((msg) => (
                        <div 
                            key={msg.id} 
                            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                        >
                            {/* Render Attachments for User Messages */}
                            {msg.role === 'user' && msg.attachments && msg.attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-2 justify-end">
                                    {msg.attachments.map((att) => (
                                        <div key={att.id} className="w-24 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                            <AssetPreview asset={att} objectFit="cover" />
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            <div className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div 
                                    className={`max-w-[90%] rounded-2xl p-4 shadow-sm ${
                                        msg.role === 'user' 
                                            ? 'bg-brand-accent text-[#050C26] rounded-br-none' 
                                            : 'bg-gray-50 dark:bg-[#1C1E20] border border-gray-100 dark:border-gray-800 rounded-bl-none'
                                    }`}
                                >
                                    <div className="text-sm">
                                        <ReactMarkdown components={(msg.role === 'user' ? UserMarkdownComponents : ModelMarkdownComponents) as any}>
                                            {msg.text}
                                        </ReactMarkdown>
                                    </div>
                                    
                                    {/* Render Interactive UI Elements */}
                                    {msg.uiType === 'idea-cards' && msg.uiData && (
                                        <div className="mt-4 grid grid-cols-1 gap-2">
                                            {msg.uiData.map((card: any, idx: number) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleCardClick(card.value || card.title)}
                                                    className="text-left p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-accent dark:hover:border-brand-accent bg-white dark:bg-[#2B2B2B] hover:bg-brand-accent/5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                                                >
                                                    <div className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-brand-accent">{card.title}</div>
                                                    {card.description && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{card.description}</div>}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {isTyping && (
                        <div className="flex justify-start w-full">
                            <div className="bg-gray-50 dark:bg-[#1C1E20] border border-gray-100 dark:border-gray-800 rounded-2xl rounded-bl-none p-4 flex items-center gap-3 shadow-sm">
                                <div className="relative w-4 h-4">
                                    <div className="absolute inset-0 bg-brand-accent rounded-full opacity-75 animate-ping"></div>
                                    <div className="relative w-4 h-4 bg-brand-accent rounded-full"></div>
                                </div>
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 animate-pulse">Genie is thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1C1E20]">
                    {/* Attachment Previews */}
                    {attachments.length > 0 && (
                        <div className="flex gap-3 mb-3 overflow-x-auto py-2">
                            {attachments.map((file) => (
                                <div key={file.id} className="relative w-16 h-16 flex-shrink-0 group">
                                    <div className="w-full h-full rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                                        <AssetPreview asset={file} objectFit="cover" />
                                    </div>
                                    <button 
                                        onClick={() => removeAttachment(file.id)}
                                        className="absolute -top-1 -right-1 bg-black text-white rounded-full p-0.5 shadow-md hover:bg-gray-800"
                                    >
                                        <XMarkIcon className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="relative flex items-end gap-2">
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileSelect} 
                            className="hidden" 
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="p-3 mb-[2px] bg-white dark:bg-[#2B2B2B] border border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm"
                            title="Attach Image"
                        >
                            <PlusIcon className="w-5 h-5" />
                        </button>

                        <div className="relative flex-grow">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask Genie..."
                                rows={1}
                                className="w-full pl-4 pr-12 py-3 bg-white dark:bg-[#2B2B2B] border border-gray-300 dark:border-gray-600 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all max-h-32 shadow-sm text-sm dark:text-white placeholder-gray-400"
                                style={{ minHeight: '48px' }}
                            />
                            <button 
                                onClick={handleSend}
                                disabled={(!input.trim() && attachments.length === 0) || isTyping}
                                className="absolute right-2 bottom-2 p-2 bg-brand-accent text-[#050C26] rounded-lg hover:bg-brand-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                <ArrowLongRightIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes slide-in-right {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in-right {
                    animation: slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(156, 163, 175, 0.5);
                    border-radius: 20px;
                }
            `}</style>
        </>
    );
};

export const GenieFab: React.FC = () => {
    const { toggleChat, isOpen } = useGenieChat();

    if (isOpen) return null;

    return (
        <button
            onClick={toggleChat}
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-brand-accent text-[#050C26] shadow-lg flex items-center justify-center hover:scale-105 transition-transform z-30"
            title="Ask Genie"
        >
            <SparklesIcon className="w-7 h-7" />
        </button>
    );
};