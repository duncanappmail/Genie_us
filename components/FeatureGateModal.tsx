import React from 'react';
import { ModalWrapper } from './ModalWrapper';
import { LockClosedIcon } from './icons';

interface FeatureGateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpgrade: () => void;
    featureName: string;
}

export const FeatureGateModal: React.FC<FeatureGateModalProps> = ({ isOpen, onClose, onUpgrade, featureName }) => {
    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose}>
            <div className="bg-white dark:bg-black rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col items-center text-center">
                <div className="mb-4 p-3 bg-brand-accent/10 rounded-full">
                    <LockClosedIcon className="w-8 h-8 text-brand-accent" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Want access to this feature?
                </h3>
                
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Upgrade your plan to unlock this feature and a wider set of tools to help you get more done, faster.
                </p>

                <div className="mt-8 flex flex-col w-full gap-3">
                    <button
                        onClick={() => {
                            onUpgrade();
                            onClose();
                        }}
                        className="w-full py-3 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-all shadow-md active:scale-95"
                    >
                        View Plans & Upgrade
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        Maybe later
                    </button>
                </div>
            </div>
        </ModalWrapper>
    );
};
