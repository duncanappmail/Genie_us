import React, { useState } from 'react';
import { LeftArrowIcon } from '../components/icons';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';

export const PaymentDetailsScreen: React.FC = () => {
    const { user, handleUpdatePaymentDetails } = useAuth();
    const { goBack } = useUI();
    const [card, setCard] = useState({ number: '', name: '', expiry: '', cvc: '' });
    const [cardBrand, setCardBrand] = useState(user?.paymentMethod?.brand || 'unknown');

    if (!user) return null;

    const getCardBrand = (num: string): string => {
        if (num.startsWith('4')) return 'Visa';
        if (/^5[1-5]/.test(num)) return 'Mastercard';
        if (/^3[47]/.test(num)) return 'American Express';
        if (/^6/.test(num)) return 'Discover';
        return 'unknown';
    };

    const formatCardNumber = (value: string) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = (matches && matches[0]) || '';
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        if (parts.length) return parts.join(' ');
        return value;
    };
    
    const formatExpiry = (value: string) => {
        return value.replace(/[^0-9]/g, '').replace(/^(.{2})/, '$1 / ').slice(0, 7);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let { name, value } = e.target;
        if (name === 'number') {
            value = formatCardNumber(value);
            setCardBrand(getCardBrand(value.replace(/\s/g, '')));
        }
        if (name === 'expiry') {
            value = formatExpiry(value);
        }
        setCard({ ...card, [name]: value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const last4 = card.number.slice(-4);
        handleUpdatePaymentDetails({ brand: cardBrand, last4, expiry: card.expiry.replace(' / ', '/') });
    };
    
    return (
        <div className="max-w-xl mx-auto">
            <button onClick={goBack} className="flex items-center gap-2 text-sm font-semibold mb-6 text-brand-accent hover:text-brand-accent-hover-subtle"><LeftArrowIcon className="w-4 h-4"/> Back</button>
            <h2 className="text-3xl font-bold">Payment Details</h2>

            <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border">
                <h3 className="text-xl font-bold mb-4">Update Payment Method</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="card-name" className="block mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name on Card</label>
                        <input type="text" id="card-name" name="name" value={card.name} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-transparent dark:border-gray-600 input-focus-brand p-4"/>
                    </div>
                     <div>
                        <label htmlFor="card-number" className="block mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Card Number</label>
                        <div className="relative">
                            <input type="text" id="card-number" name="number" value={card.number} onChange={handleInputChange} maxLength={19} placeholder="0000 0000 0000 0000" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-transparent dark:border-gray-600 input-focus-brand p-4"/>
                             <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500">{cardBrand !== 'unknown' && cardBrand}</span>
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="card-expiry" className="block mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Expiry Date</label>
                            <input type="text" id="card-expiry" name="expiry" value={card.expiry} onChange={handleInputChange} maxLength={7} placeholder="MM / YY" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-transparent dark:border-gray-600 input-focus-brand p-4"/>
                        </div>
                         <div>
                            <label htmlFor="card-cvc" className="block mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">CVC</label>
                            <input type="text" id="card-cvc" name="cvc" value={card.cvc} onChange={handleInputChange} maxLength={4} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-transparent dark:border-gray-600 input-focus-brand p-4"/>
                        </div>
                    </div>
                    <button type="submit" className="w-full mt-4 py-2.5 px-4 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors">Save Card</button>
                </form>
            </div>
        </div>
    );
};