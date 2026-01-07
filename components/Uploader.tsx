
import React, { useCallback, useRef, useState } from 'react';
import type { UploadedFile } from '../types';
import { PhotoIcon, VideoCameraIcon } from './icons';

interface UploaderProps {
  onUpload: (file: UploadedFile) => void;
  compact?: boolean;
  fill?: boolean;
  title?: React.ReactNode;
  subtitle?: string;
  accept?: 'image/*' | 'video/*' | 'image/*,video/*';
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
};

export const Uploader: React.FC<UploaderProps> = ({ onUpload, compact = false, fill = false, title, subtitle, accept = 'image/*' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isVideoMode = accept.includes('video');

  const handleFile = useCallback(async (file: File) => {
    if (file) {
      const base64 = await fileToBase64(file);
      onUpload({
        id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        base64,
        mimeType: file.type,
        name: file.name,
        blob: file,
      });
    }
  }, [onUpload]);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const uploaderClasses = `
    w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center
    cursor-pointer transition-all duration-300
    ${fill ? 'h-full' : compact ? 'h-32' : 'h-48'}
    ${isDragging 
      ? 'border-[#91EB23] bg-[#91EB23]/10' 
      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-[#1C1E20]'}
  `;

  return (
    <div
      className={uploaderClasses}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept={accept}
      />
      {isVideoMode ? (
          <VideoCameraIcon className={`transition-transform duration-300 ${compact ? 'w-6 h-6' : 'w-7 h-7'} ${isDragging ? 'scale-110' : ''} text-gray-400 dark:text-gray-500`} />
      ) : (
          <PhotoIcon className={`transition-transform duration-300 ${compact ? 'w-6 h-6' : 'w-7 h-7'} ${isDragging ? 'scale-110' : ''} text-gray-400 dark:text-gray-500`} />
      )}
      <div className={`font-semibold mt-3 ${compact ? 'text-sm' : 'text-base'} text-gray-600 dark:text-[#525252]`}>
        {isDragging ? "Drop your file here" : title || `Click to upload ${isVideoMode ? 'video' : 'image'}`}
      </div>
      <p className={`text-xs text-gray-500 dark:text-[#525252] ${compact ? 'mt-1' : 'mt-2'} hidden sm:block`}>
        {isDragging ? "" : (subtitle !== undefined ? subtitle : `or drag & drop a ${isVideoMode ? 'video' : 'image'}`)}
      </p>
    </div>
  );
};

export default Uploader;
