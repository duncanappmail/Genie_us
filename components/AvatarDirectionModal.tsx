
import React, { useState, useRef } from 'react';
import type { UploadedFile, UgcAvatarSource } from '../types';
import { UGCImage, XMarkIcon } from './icons';
import { AssetPreview } from './AssetPreview';
import { ModalWrapper } from './ModalWrapper';
import { Uploader } from './Uploader';

// This function is needed to handle file selection from the hidden input.
const fileToUploadedFile = (file: File): Promise<UploadedFile> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const base64 = (reader.result as string)?.split(',')[1];
        if (base64) {
            resolve({
                id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                base64,
                mimeType: file.type,
                name: file.name,
                blob: file,
            });
        } else {
            reject(new Error("Failed to read file as base64"));
        }
    };
    reader.onerror = error => reject(error);
  });
};


interface AvatarDirectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onOpenTemplateModal: () => void;
  // Controlled component props
  selectedDirection: UgcAvatarSource | undefined;
  avatarFile: UploadedFile | null;
  onDirectionSelect: (direction: UgcAvatarSource) => void;
  onFileUpload: (file: UploadedFile) => Promise<boolean>; // Returns true if valid
  onFileRemove: () => void;
}

export const AvatarDirectionModal: React.FC<AvatarDirectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onOpenTemplateModal,
  selectedDirection,
  avatarFile,
  onDirectionSelect,
  onFileUpload,
  onFileRemove,
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Enforce default selection of 'ai' if undefined
  const activeDirection = selectedDirection || 'ai';

  const handleFileSelect = async (uploadedFile: UploadedFile) => {
    setUploadError(null);
    setIsValidating(true);

    try {
        // Basic client-side validation first
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(uploadedFile.mimeType)) {
            setUploadError("Invalid file type. Please upload a JPG, PNG, or WEBP.");
            setIsValidating(false);
            return;
        }

        const img = new Image();
        const objectURL = URL.createObjectURL(uploadedFile.blob);
        img.src = objectURL;

        img.onload = async () => {
            URL.revokeObjectURL(objectURL);
            if (img.width < 256 || img.height < 256) {
                setUploadError("Image too small. Must be at least 256x256 pixels.");
                setIsValidating(false);
                return;
            }

            // AI Validation via prop function
            const isValid = await onFileUpload(uploadedFile);
            if (!isValid) {
                setUploadError("Invalid image. Please upload a clear, front-facing photo of a person.");
            }
            setIsValidating(false);
        };
        img.onerror = () => {
            URL.revokeObjectURL(objectURL);
            setUploadError("Could not read image file.");
            setIsValidating(false);
        };
    } catch (error) {
        setUploadError("Failed to process file.");
        setIsValidating(false);
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileRemove();
    setUploadError(null);
  };
  
  const DirectionCard: React.FC<{
      direction: UgcAvatarSource;
      title: string;
      description: string;
      onClick?: () => void;
      children?: React.ReactNode;
  }> = ({ direction, title, description, onClick, children }) => {
    const isSelected = activeDirection === direction;
    return (
        <button
            onClick={onClick || (() => onDirectionSelect(direction))}
            className={`cursor-pointer p-6 border-2 rounded-xl transition-all h-full flex flex-col text-left ${isSelected ? 'border-brand-accent bg-brand-accent/5' : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'}`}
        >
            <div className="mb-6">
                <h4 className="font-bold text-brand-accent text-lg">{title}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
            </div>
            {children && <div className="mt-auto w-full flex justify-center">{children}</div>}
        </button>
    );
  }

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
        <div className="bg-white dark:bg-black rounded-2xl shadow-xl w-full max-w-4xl p-8 flex flex-col">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">How Would You Like to Handle Your Avatar?</h3>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow items-stretch">
              <DirectionCard direction="ai" title="Create with AI" description="Your avatar will be crafted based on the script" />
              
              <DirectionCard 
                  direction="upload" 
                  title="Upload Image" 
                  description="Use your own photo." 
                  onClick={() => onDirectionSelect('upload')}
              >
                  <div className="aspect-square w-full">
                    {avatarFile && activeDirection === 'upload' ? (
                        <div className="relative w-full h-full rounded-lg group">
                            <div className="relative w-full h-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 p-8 bg-gray-50 dark:bg-gray-900/50">
                                <AssetPreview asset={avatarFile} objectFit="contain" />
                            </div>
                            <button 
                                onClick={handleRemoveFile} 
                                className="absolute -top-2 -right-2 z-10 flex items-center justify-center w-6 h-6 bg-black text-white rounded-full shadow-md hover:bg-gray-800 transition-colors"
                            >
                                <XMarkIcon className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ) : (
                        <div className="w-full h-full">
                            {isValidating ? (
                                <div className="w-full h-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center text-center p-4">
                                    <div className="w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
                                    <p className="font-semibold mt-2 text-sm text-gray-600 dark:text-gray-400">Validating...</p>
                                </div>
                            ) : (
                                <Uploader onUpload={handleFileSelect} title="Click to upload image" subtitle="or drag & drop" fill={true} />
                            )}
                        </div>
                    )}
                  </div>
                  {uploadError && <p className="text-xs text-red-500 mt-2 text-center">{uploadError}</p>}
              </DirectionCard>

              <DirectionCard 
                  direction="template" 
                  title="Choose Template" 
                  description="Select a pre-made avatar." 
                  onClick={onOpenTemplateModal}
              >
                  <div className="aspect-square w-full">
                    {avatarFile && activeDirection === 'template' ? (
                        <div className="relative w-full h-full rounded-lg group">
                            <div className="relative w-full h-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 p-8 bg-gray-50 dark:bg-gray-900/50">
                                <AssetPreview asset={avatarFile} objectFit="contain" />
                            </div>
                            <button 
                                onClick={handleRemoveFile} 
                                className="absolute -top-2 -right-2 z-10 flex items-center justify-center w-6 h-6 bg-black text-white rounded-full shadow-md hover:bg-gray-800 transition-colors"
                            >
                                <XMarkIcon className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ) : (
                        <div className="w-full h-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center text-center p-4">
                            <UGCImage className="w-10 h-10 text-gray-400" />
                            <p className="font-semibold mt-4 text-sm text-gray-600 dark:text-gray-400">Choose from Templates</p>
                        </div>
                    )}
                  </div>
              </DirectionCard>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row-reverse gap-3">
              <button onClick={onConfirm} className="w-full sm:w-auto px-12 py-3 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-all shadow-md active:scale-95">
                  Continue
              </button>
              <button onClick={onClose} className="action-btn dark:border-gray-700 !w-full sm:!w-auto sm:!px-8">
                  Cancel
              </button>
          </div>
        </div>
    </ModalWrapper>
  );
};
