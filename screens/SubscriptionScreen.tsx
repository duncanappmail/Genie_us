
import React from 'react';
import { LeftArrowIcon, ImageIcon, VideoIcon, SparklesIcon } from '../components/icons';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';

export const SubscriptionScreen: React.FC = () => {
    const { 
        user
    } = useAuth();
    const { 
        goBack, 
        navigateTo,
        theme
    } = useUI();

    if (!user) return null;

    const credits = user.credits;

    // Calculate expiration date (7 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    const dateString = expiryDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

    const CreditCard = ({ title, icon, current = 0, total = 0, isUnlimited = false }: { title: string, icon: React.ReactNode, current?: number, total?: number, isUnlimited?: boolean }) => {
        // Calculate Used instead of Remaining
        const used = total - current;
        // Ensure we don't divide by zero
        const percentage = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;

        return (
            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col h-full shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="text-brand-accent">
                        {icon}
                    </div>
                    <h4 className="font-semibold text-brand-accent">{title}</h4>
                </div>
                <div>
                    {isUnlimited ? (
                        <p className="text-base font-bold text-gray-900 dark:text-white mb-2 mt-3 text-white">
                            Unlimited
                        </p>
                    ) : (
                        <>
                            <p className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                                {used} <span className="text-base text-gray-400 font-normal">/ {total}</span>
                            </p>
                            {/* Progress Bar Track: Using inline styles to bypass global CSS overrides */}
                            <div 
                                className="w-full rounded-full h-2 overflow-hidden"
                                style={{
                                    backgroundColor: theme === 'dark' ? '#9CA3AF' : '#E5E7EB'
                                }}
                            >
                                <div 
                                    className="bg-[#91EB23] h-2 rounded-full transition-all duration-500" 
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-right">
                                {percentage}% used
                            </p>
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-5xl mx-auto">
            <button onClick={goBack} className="flex items-center gap-2 text-sm font-semibold mb-6 text-brand-accent hover:text-brand-accent-hover-subtle"><LeftArrowIcon className="w-4 h-4"/> Back</button>
            <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">My Plan</h2>

            <div className="flex flex-col gap-8">
                
                {/* Section 1: Today's Credit Balance (Moved to Top) */}
                <div>
                    <div className="flex justify-between items-end mb-4">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Today's Credit Balance</h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            Resets Every 24hrs <span className="mx-1">|</span> <span className="font-bold text-gray-900 dark:text-white">Expires in 7 Days</span>
                        </span>
                    </div>
                    {credits ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <CreditCard 
                                title="Image" 
                                icon={<ImageIcon className="w-5 h-5"/>} 
                                current={credits.image.current} 
                                total={credits.image.total} 
                            />
                            <CreditCard 
                                title="Video" 
                                icon={<VideoIcon className="w-5 h-5"/>} 
                                current={credits.video.current} 
                                total={credits.video.total} 
                            />
                            <CreditCard 
                                title="AI Strategies" 
                                icon={<SparklesIcon className="w-5 h-5"/>} 
                                isUnlimited={true}
                            />
                        </div>
                    ) : (
                        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center text-gray-500">
                            No credit information available.
                        </div>
                    )}
                </div>

                {/* Section 2: Pay As You Go Plan (Renamed from My Plan) */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Pay As You Go Plan</h3>
                        <button 
                            onClick={() => navigateTo('PLAN_SELECT')} 
                            className="px-4 py-2 bg-[#91EB23] text-[#050C26] font-bold rounded-lg hover:bg-[#75CB0C] text-sm transition-colors"
                        >
                            Purchase Plan
                        </button>
                    </div>
                    
                    {/* Inner Container: Using inline styles to control dark mode colors precisely */}
                    <div 
                        className="p-6 rounded-lg border"
                        style={{
                            backgroundColor: theme === 'dark' ? '#171717' : '#F9FAFB',
                            borderColor: theme === 'dark' ? '#2B2B2B' : '#E5E7EB'
                        }}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-2xl font-bold block text-gray-900 dark:text-white mb-1">
                                    {user.subscription?.plan || 'Free'}
                                </span>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Expires in 7 Days <span className="mx-1">|</span> {dateString}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
