import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { User, PlanName, BrandProfile, Credits } from '../types';
import * as dbService from '../services/dbService';
import * as geminiService from '../services/geminiService';
import { useUI } from './UIContext';
import { PLANS } from '../constants';

type AuthContextType = {
    user: User | null;
    setUser: (user: User | null) => void;
    handleLogin: (email: string) => void;
    handleLogout: () => void;
    handleSelectPlan: (plan: PlanName, billingCycle: 'monthly' | 'annually') => void;
    handleCancelSubscription: () => void;
    handleReactivateSubscription: () => void;
    handleUpdatePaymentDetails: (details: { brand: string, last4: string, expiry: string }) => void;
    handleFetchBrandProfile: (url: string) => Promise<void>;
    handleUpdateBrandProfile: (profile: BrandProfile) => Promise<void>;
    handleClearBrandProfile: () => Promise<void>;
    deductCredits: (amount: number, category: keyof Credits) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const { navigateTo, goBack, setIsLoading, setAgentStatusMessages, setError } = useUI();

    const handleLogin = useCallback(async (email: string) => {
        const brandProfile = await dbService.getBrandProfile(email);
        const mockUser: User = { email, subscription: null, credits: null, paymentMethod: null, brandProfile };
        setUser(mockUser);
        navigateTo('PLAN_SELECT');
    }, [navigateTo]);

    const handleLogout = useCallback(() => {
        setUser(null);
        navigateTo('AUTH');
    }, [navigateTo]);

    const handleSelectPlan = useCallback((plan: PlanName, billingCycle: 'monthly' | 'annually') => {
        if (!user) return;
        const isUpdate = !!user.subscription;
        const planData = PLANS[plan];
        const credits = planData.credits;
        
        const renewsOn = new Date();
        if (billingCycle === 'annually') renewsOn.setFullYear(renewsOn.getFullYear() + 1);
        else renewsOn.setMonth(renewsOn.getMonth() + 1);

        setUser({
            ...user,
            subscription: { plan, billingCycle, renewsOn: renewsOn.getTime() },
            credits,
            paymentMethod: plan !== 'Starter' ? { brand: 'Visa', last4: '4242', expiry: '12/26' } : null,
        });
        
        if (isUpdate) {
            navigateTo('SUBSCRIPTION');
        } else {
            navigateTo('HOME');
        }
    }, [user, navigateTo]);

    const handleCancelSubscription = useCallback(() => {
        if (!user?.subscription) return;
        setUser({ ...user, subscription: { ...user.subscription, cancelAtPeriodEnd: true } });
    }, [user]);

    const handleReactivateSubscription = useCallback(() => {
        if (!user?.subscription) return;
        setUser({ ...user, subscription: { ...user.subscription, cancelAtPeriodEnd: false } });
    }, [user]);

    const handleUpdatePaymentDetails = useCallback((details: { brand: string, last4: string, expiry: string }) => {
        if (!user) return;
        setUser({ ...user, paymentMethod: details });
        goBack();
    }, [user, goBack]);
    
    const handleUpdateBrandProfile = useCallback(async (profile: BrandProfile) => {
        if (!user) return;
        setUser({ ...user, brandProfile: profile });
        await dbService.saveBrandProfile(profile);
    }, [user]);

    const handleClearBrandProfile = useCallback(async () => {
        if (!user) return;
        setUser({ ...user, brandProfile: null });
        await dbService.deleteBrandProfile(user.email);
    }, [user]);
    
    const handleFetchBrandProfile = useCallback(async (url: string) => {
        if (!user) return;
        
        setIsLoading(true);
        setError(null);
        setAgentStatusMessages([]);

        try {
            setAgentStatusMessages([{ type: 'action', content: 'Analyzing website structure...' }]);
            const profileData = await geminiService.extractBrandProfileFromUrl(url);
            
            setAgentStatusMessages(prev => [
                { ...prev[0], type: 'done' },
                { type: 'action', content: 'Extracting visual identity...' }
            ]);

            let logoFile = null;
            if (profileData.logoUrl) {
                logoFile = await geminiService.fetchLogo(profileData.logoUrl, url);
            }
             
            setAgentStatusMessages(prev => [
                ...prev.slice(0, -1),
                { ...prev[prev.length - 1], type: 'done' },
                { type: 'action', content: 'Finalizing brand profile...' }
            ]);
            
            const fullProfile: BrandProfile = {
                ...profileData,
                logoFile,
                websiteUrl: url,
                userId: user.email,
            };
            
            await handleUpdateBrandProfile(fullProfile);
             setAgentStatusMessages(prev => [
                ...prev.slice(0, -1),
                { ...prev[prev.length - 1], type: 'done' }
            ]);

        } catch (e: any) {
            console.error("Failed to fetch brand profile", e);
            setError(e.message || "Could not retrieve brand information from the provided URL.");
        } finally {
            setIsLoading(false);
            setAgentStatusMessages([]);
        }

    }, [user, setIsLoading, setError, setAgentStatusMessages, handleUpdateBrandProfile]);


    const deductCredits = useCallback((amount: number, category: keyof Credits) => {
        setUser(prevUser => {
            if (!prevUser || !prevUser.credits) return prevUser;
            return {
                ...prevUser,
                credits: {
                    ...prevUser.credits,
                    [category]: {
                        ...prevUser.credits[category],
                        current: Math.max(0, prevUser.credits[category].current - amount),
                    }
                }
            };
        });
    }, []);

    const value: AuthContextType = {
        user, setUser, handleLogin, handleLogout, handleSelectPlan,
        handleCancelSubscription, handleReactivateSubscription, handleUpdatePaymentDetails,
        handleFetchBrandProfile, handleUpdateBrandProfile, handleClearBrandProfile,
        deductCredits
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};