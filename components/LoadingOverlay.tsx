import React, { useState, useEffect } from 'react';
import { useUI } from '../context/UIContext';
import { CheckIcon } from './icons';
import { ModalWrapper } from './ModalWrapper';

interface LoadingOverlayProps {}

const LOADING_MESSAGES = [
    "Working my magic...",
    "Your wish is taking shape!",
    "Mixing stardust and pixels...",
    "Polishing the lamp...",
];

export const LoadingOverlay: React.FC<LoadingOverlayProps> = () => {
    const { agentStatusMessages, generationStatusMessages } = useUI();
    const [currentMessage, setCurrentMessage] = useState(LOADING_MESSAGES[0]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentMessage(prevMessage => {
                const currentIndex = LOADING_MESSAGES.indexOf(prevMessage);
                const nextIndex = (currentIndex + 1) % LOADING_MESSAGES.length;
                return LOADING_MESSAGES[nextIndex];
            });
        }, 2500);

        return () => clearInterval(intervalId);
    }, []);
    
    const isAgent = agentStatusMessages.length > 0;
    const isGeneration = generationStatusMessages.length > 0;
    const showChecklist = isAgent || isGeneration;
    const isOpen = true; // Always open if rendered, parent controls rendering
    
    const title = isAgent ? "Your Team of AI Agents are working..." : "Generating Your Creation...";

    const getIconForStep = (isCompleted: boolean) => {
        if (isCompleted) {
            return <CheckIcon className="w-5 h-5 text-green-500 shrink-0" />;
        }
        return (
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <div className="w-3.5 h-3.5 border-2 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    };

    return (
        <ModalWrapper isOpen={isOpen} zIndex={2000}>
            {showChecklist ? (
                <div className="w-full max-w-md">
                     <h3 className="text-2xl font-bold text-center mb-4 text-white">{title}</h3>
                    <div className="bg-white dark:bg-black p-6 rounded-xl shadow-2xl space-y-3">
                        {isAgent ? (
                             agentStatusMessages.map((msg, index) => {
                                const isLast = index === agentStatusMessages.length - 1;
                                const isCompleted = msg.type === 'done' || !isLast;
                                return (
                                    <div key={index} className={`flex items-start gap-3 animate-fade-in ${isCompleted ? 'text-gray-400 dark:text-gray-500' : ''}`} style={{ animationDelay: `${index * 150}ms` }}>
                                        {getIconForStep(isCompleted)}
                                        <p className={`text-sm ${!isCompleted ? 'font-semibold text-gray-800 dark:text-gray-200' : ''}`}>{msg.content}</p>
                                    </div>
                                );
                            })
                        ) : (
                            generationStatusMessages.map((msg, index) => {
                                const isCompleted = index < generationStatusMessages.length - 1;
                                return (
                                    <div key={index} className={`flex items-center gap-3 animate-fade-in ${isCompleted ? 'text-gray-400 dark:text-gray-500' : ''}`} style={{ animationDelay: `${index * 150}ms` }}>
                                        {getIconForStep(isCompleted)}
                                        <p className={`text-sm ${!isCompleted ? 'font-semibold text-gray-800 dark:text-gray-200' : ''}`}>{msg}</p>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 text-[#91EB23]">
                        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                                    <stop stopColor="#91EB23" offset="0%"/>
                                    <stop stopColor="#86DB1E" offset="100%"/>
                                </linearGradient>
                            </defs>
                            <path d="M 50,50 m 0,-48 a 48,48 0 1 1 0,96 a 48,48 0 1 1 0,-96" fill="none" stroke="url(#g)" strokeWidth="4">
                                <animateTransform 
                                    attributeName="transform"
                                    type="rotate"
                                    from="0 50 50"
                                    to="360 50 50"
                                    dur="1.5s"
                                    repeatCount="indefinite"
                                />
                                <animate 
                                    attributeName="stroke-dasharray" 
                                    values="150.8, 150.8; 1, 300; 150.8, 150.8" 
                                    dur="1.5s" 
                                    repeatCount="indefinite" 
                                />
                            </path>
                        </svg>
                    </div>
                    <p className="mt-4 text-lg font-semibold text-gray-800 dark:text-gray-200 text-center px-4">{currentMessage}</p>
                </div>
            )}
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out forwards;
                }
            `}</style>
        </ModalWrapper>
    );
};