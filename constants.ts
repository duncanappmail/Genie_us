import type { PlanName } from './types';

export const PLANS: Record<PlanName, any> = {
    'Free': {
        name: 'Free',
        price: { monthly: 0, annually: 0 },
        credits: 20,
        features: ['Product Ad', 'Art Maker', 'Style Presets', 'Community Support']
    },
    'Basic': {
        name: 'Basic',
        price: { monthly: 20, annually: 168 },
        credits: 150,
        features: ['Product Ad', 'Art Maker', 'Style Presets', 'Buy Extra Credits', 'Email Support']
    },
    'Pro': {
        name: 'Pro',
        price: { monthly: 35, annually: 294 },
        credits: 450,
        features: [
            'Everything in Basic', 
            'Have Your Very Own AI Agent That Works Autonomously',
            'Create UGC Videos',
            'Make Social Videos', 
            'Animate & Extend Videos', 
            'All Advanced Video Settings', 
            'Priority Support'
        ]
    }
};

export const CREDIT_COSTS = {
    base: {
        artMaker: 1,
        productAd: 2,
        refine: 1,
        animate: 5,
        videoFast: 10,
        videoCinematic: 20,
        videoExtend: 15,
        agent: 25,
        ugcVideoFast: 30,
        ugcVideoCinematic: 45,
    },
    modifiers: {
        imageQuality: {
            low: 0,
            medium: 1,
            high: 2,
        },
        videoResolution: {
            '720p': 0,
            '1080p': 10,
        },
        videoDuration: {
            4: 0,
            7: 5,
            10: 10,
        }
    }
};