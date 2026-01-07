import React from 'react';
import { ModalWrapper } from './ModalWrapper';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onConfirm }) => {
  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
        <div className="bg-white dark:bg-black rounded-2xl shadow-xl w-full max-w-md p-6">
          <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Delete Project</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Are you sure you want to delete this project? This action cannot be undone.</p>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
            <button
              onClick={onConfirm}
              className="w-full sm:flex-1 px-8 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all flex items-center justify-center shadow-md active:scale-95"
            >
              Delete
            </button>
            <button
              onClick={onClose}
              className="w-full sm:flex-1 px-8 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
    </ModalWrapper>
  );
};