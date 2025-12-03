import React from 'react';
import { LeftArrowIcon } from '../components/icons';
import { PLANS } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';

export const BillingHistoryScreen: React.FC = () => {
    const { user } = useAuth();
    const { goBack } = useUI();

    if (!user) return null;

    // Generate mock billing history
    const history = [];
    const plan = PLANS[user.subscription?.plan || 'Starter'];
    const price = user.subscription?.billingCycle === 'annually' ? plan.price.annually : plan.price.monthly;
    
    if (user.subscription && user.subscription.plan !== 'Starter') {
        for (let i = 0; i < 3; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            history.push({
                id: `inv-00${123 - i}`,
                date: date.toLocaleDateString(),
                description: `${user.subscription.plan} Plan (${user.subscription.billingCycle})`,
                amount: `$${price.toFixed(2)}`,
                status: 'Paid',
            });
        }
    } else {
         history.push({
            id: 'N/A',
            date: new Date().toLocaleDateString(),
            description: `Starter Plan`,
            amount: `$0.00`,
            status: 'Active',
        });
    }


    return (
        <div className="max-w-4xl mx-auto">
            <button onClick={goBack} className="flex items-center gap-2 text-sm font-semibold mb-6 text-brand-accent hover:text-brand-accent-hover-subtle">
                <LeftArrowIcon className="w-4 h-4"/> Back to Subscription
            </button>
            <h2 className="text-3xl font-bold">Billing History</h2>
            <div className="mt-8 bg-white dark:bg-gray-800 p-2 sm:p-4 rounded-xl shadow-sm border">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">Date</th>
                                <th scope="col" className="px-6 py-3">Description</th>
                                <th scope="col" className="px-6 py-3">Amount</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3"><span className="sr-only">Invoice</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map(item => (
                                <tr key={item.id} className="border-b dark:border-gray-700">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{item.date}</td>
                                    <td className="px-6 py-4">{item.description}</td>
                                    <td className="px-6 py-4">{item.amount}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${item.status === 'Paid' || item.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800'}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {item.id !== 'N/A' && <a href="#" className="font-medium text-brand-accent hover:underline">Invoice</a>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};