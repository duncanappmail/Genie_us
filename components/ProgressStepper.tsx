import React from 'react';
import { CheckIcon } from './icons';

interface ProgressStepperProps {
  steps: string[];
  currentStepIndex: number;
}

export const ProgressStepper: React.FC<ProgressStepperProps> = ({ steps, currentStepIndex }) => {
  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isActive = index === currentStepIndex;

        const dotClasses = `w-3 h-3 rounded-full transition-all duration-300 ${
          isCompleted
            ? 'bg-gray-400 dark:bg-gray-600'
            : isActive
            ? 'bg-brand-accent scale-125'
            : 'border-2 border-gray-300 dark:border-gray-600'
        }`;

        return (
          <div
            key={step}
            className="flex items-center"
            title={step} // Use native title attribute for simple tooltip
          >
            <div className={dotClasses} />
          </div>
        );
      })}
    </div>
  );
};