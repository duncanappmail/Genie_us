
import React from 'react';
import { useUI } from '../context/UIContext';
import { LeftArrowIcon, ChatBubbleLeftIcon } from '../components/icons';

export const ContactSupportScreen: React.FC = () => {
    const { goBack } = useUI();

    const openLink = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <div className="mb-8">
                <button 
                    onClick={goBack} 
                    className="flex items-center gap-2 text-sm font-semibold mb-6 text-brand-accent hover:text-brand-accent-hover-subtle transition-colors"
                >
                    <LeftArrowIcon className="w-4 h-4"/> Back
                </button>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Contact Support</h2>
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                    Choose a channel below to get in touch with our team.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {/* WhatsApp Section */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col items-center text-center shadow-sm">
                    <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">WhatsApp</h3>
                    <div className="w-48 h-48 bg-gray-100 dark:bg-gray-900 rounded-xl flex items-center justify-center mb-8 border-2 border-dashed border-gray-300 dark:border-gray-600 relative group">
                        {/* Placeholder QR Code Image */}
                        <div className="text-gray-400 dark:text-gray-600 flex flex-col items-center gap-2">
                            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 15h6v6H3v-6zm2 2v2h2v-2H5zm10 0h2v2h-2v-2zm2-2h2v2h-2v-2zm-2-2h2v2h-2v-2zm0-2h2v2h-2v-2zm2 2h2v2h-2v-2zM11 11h2v2h-2v-2zm2-2h2v2h-2v-2zm-2 2v2h-2v-2h2zm2 2v2h-2v-2h2z" />
                            </svg>
                            <span className="text-[10px] uppercase font-bold tracking-widest">QR Code Placeholder</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => openLink('https://wa.me/yournumber')}
                        className="w-full py-3 bg-[#25D366] text-white font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20"
                    >
                        <span>Chat on WhatsApp</span>
                    </button>
                </div>

                {/* Zalo Section */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col items-center text-center shadow-sm">
                    <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Zalo</h3>
                    <div className="w-48 h-48 bg-gray-100 dark:bg-gray-900 rounded-xl flex items-center justify-center mb-8 border-2 border-dashed border-gray-300 dark:border-gray-600 relative group">
                        {/* Placeholder QR Code Image */}
                        <div className="text-gray-400 dark:text-gray-600 flex flex-col items-center gap-2">
                            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 15h6v6H3v-6zm2 2v2h2v-2H5zm10 0h2v2h-2v-2zm2-2h2v2h-2v-2zm-2-2h2v2h-2v-2zm0-2h2v2h-2v-2zm2 2h2v2h-2v-2zM11 11h2v2h-2v-2zm2-2h2v2h-2v-2zm-2 2v2h-2v-2h2zm2 2v2h-2v-2h2z" />
                            </svg>
                            <span className="text-[10px] uppercase font-bold tracking-widest">QR Code Placeholder</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => openLink('https://zalo.me/yourlink')}
                        className="w-full py-3 bg-[#0068FF] text-white font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#0068FF]/20"
                    >
                        <span>Chat on Zalo</span>
                    </button>
                </div>
            </div>

            {/* Typeform Feedback Buttons */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white text-center">Feedback & Issues</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                        onClick={() => openLink('https://typeform.com/your-support-form')}
                        className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-brand-accent hover:bg-brand-accent/5 transition-all text-left group"
                    >
                        <h4 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-brand-accent">General Support</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Technical issues, billing questions, or account help.</p>
                    </button>
                    <button 
                        onClick={() => openLink('https://typeform.com/your-feedback-form')}
                        className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-brand-accent hover:bg-brand-accent/5 transition-all text-left group"
                    >
                        <h4 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-brand-accent">Provide Product Feedback</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Feature requests, suggestions, or general praise.</p>
                    </button>
                </div>
            </div>
        </div>
    );
};
