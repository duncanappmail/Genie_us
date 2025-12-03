import type { PlanName } from './types';

export const PLANS: Record<PlanName, any> = {
    'Starter': {
        name: 'Starter',
        price: { monthly: 12, annually: 0 },
        credits: {
            image: { current: 10, total: 10 },
            video: { current: 3, total: 3 },
            strategy: { current: 9999, total: 9999 } // Unlimited
        },
        duration: '3 Days Access',
        features: [
            '3 Videos Per Day',
            '10 Images Per Day',
            'Unlimited AI Strategies Per Day',
            '720p Video Quality',
            'Basic Templates',
            'Limited Video Models'
        ]
    },
    'Creator': {
        name: 'Creator',
        price: { monthly: 49, annually: 0 },
        credits: {
            image: { current: 30, total: 30 },
            video: { current: 10, total: 10 },
            strategy: { current: 9999, total: 9999 } // Unlimited
        },
        duration: '7 Days Access',
        features: [
            '10 Videos Per Day',
            '30 Images Per Day',
            'Unlimited AI Strategies Per Day',
            '1080p Video Quality',
            'Premium Templates',
            'All Video Models'
        ]
    },
    'Business': {
        name: 'Business',
        price: { monthly: 259, annually: 0 },
        credits: {
            image: { current: 100, total: 100 },
            video: { current: 30, total: 30 },
            strategy: { current: 9999, total: 9999 } // Unlimited
        },
        duration: '30 Days Access',
        features: [
            '30 Videos Per Day',
            '100 Images Per Day',
            'Unlimited AI Strategies Per Day',
            '4k Video Quality',
            'Premium Templates',
            'All Video Models',
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