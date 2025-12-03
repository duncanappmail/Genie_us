
import React, { useState } from 'react';
import type { PlanName } from '../types';
import { PLANS } from '../constants';
import { CheckIcon, LeftArrowIcon } from '../components/icons';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';

export const PlanSelectScreen: React.FC = () => {
    const { user, handleSelectPlan } = useAuth();
    const { goBack } = useUI();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('annually');
    const cameFromSubscriptionPage = !!user?.subscription;

    const PlanCard: React.FC<{ planName: PlanName }> = ({ planName }) => {
        const plan = PLANS[planName];
        // Updated Recommendation Logic: Creator Plan is now recommended
        const isRecommended = planName === 'Creator';
        const price = plan.price.monthly; // Always use monthly price for one-time charge logic
        const isCurrentPlan = user?.subscription?.plan === planName;

        const displayPrice = (price: number) => {
            const fixed = price.toFixed(2);
            return fixed.endsWith('.00') ? price.toFixed(0) : fixed;
        };

        return (
            <div className={`p-6 border rounded-xl flex flex-col bg-white shadow-sm relative ${isCurrentPlan ? 'border-brand-accent dark:border-brand-accent' : 'border-gray-200 dark:border-gray-700'}`}>
                {isRecommended && <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-brand-accent text-on-accent text-xs font-bold px-3 py-1 rounded-full">Recommended</div>}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-2">{plan.name}</h3>
                <div className="my-4">
                    <span className="text-4xl font-extrabold text-gray-900 dark:text-white">${displayPrice(price)}</span>
                    <span className="text-sm text-gray-500 dark:text-white ml-2">One-time Charge</span>
                </div>
                <div className="min-h-[3.5rem]">
                    <p className="text-sm font-semibold text-brand-accent dark:text-brand-accent">
                        {plan.duration}
                    </p>
                </div>
                <button
                    onClick={() => handleSelectPlan(planName, billingCycle)}
                    disabled={isCurrentPlan}
                    className="w-full py-2.5 mt-6 font-semibold rounded-lg transition-colors bg-brand-accent text-on-accent hover:bg-brand-accent-hover disabled:cursor-not-allowed"
                >
                    {isCurrentPlan ? 'Current Plan' : 'Choose Plan'}
                </button>
                <ul className="mt-6 space-y-3 text-sm flex-grow">
                    {plan.features.map((feat: string) => (
                        <li key={feat} className="flex items-start gap-3">
                            <CheckIcon className="w-5 h-5 mt-0.5 shrink-0 text-brand-accent" />
                            <span className="text-gray-600 dark:text-gray-400">{feat}</span>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    return (
        <div className="max-w-5xl mx-auto">
             {cameFromSubscriptionPage && (
                <button onClick={goBack} className="flex items-center gap-2 text-sm font-semibold mb-6 hover:text-[#3f6212] dark:hover:text-[#91EB23]">
                    <LeftArrowIcon className="w-4 h-4"/> Back
                </button>
            )}
            <div className="text-center">
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white">Pay As You Go Plans</h2>
                <p className="mt-2 text-gray-500 dark:text-gray-300">Start creating with the plan that suits you best.</p>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <PlanCard planName="Starter" />
                <PlanCard planName="Creator" />
                <PlanCard planName="Business" />
            </div>
        </div>
    );
};
