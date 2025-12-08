import React, { useState } from 'react';
import type { Project, UploadedFile } from '../types';
import { Uploader } from './Uploader';
import { AssetPreview } from './AssetPreview';
import { CameraIcon, ChevronDownIcon, ArrowLongDownIcon, ArrowLongLeftIcon, ArrowLongRightIcon, ArrowLongUpIcon, PlusIcon, XMarkIcon } from './icons';

interface AdvancedVideoSettingsProps {
    project: Project;
    updateProject: (updates: Partial<Project>) => void;
}

export const AdvancedVideoSettings: React.FC<AdvancedVideoSettingsProps> = ({ project, updateProject }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleFrameUpload = (uploadedFile: UploadedFile, type: 'start' | 'end') => {
        if (type === 'start') updateProject({ startFrame: uploadedFile });
        else updateProject({ endFrame: uploadedFile });
    };

    return (
        <div className="mt-8 border-t pt-8">
            <button onClick={() => setIsOpen(!isOpen)} className="flex justify-between items-center w-full text-left">
                <h3 className="text-xl font-bold">Advanced Settings</h3>
                <ChevronDownIcon className={`w-6 h-6 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Camera Controls */}
                    <div>
                         <label className="block mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Camera Controls</label>
                         <div className="flex flex-wrap gap-2">
                            {[
                                { name: 'Pan Left', icon: <ArrowLongLeftIcon className="w-4 h-4" /> },
                                { name: 'Pan Right', icon: <ArrowLongRightIcon className="w-4 h-4" /> },
                                { name: 'Tilt Up', icon: <ArrowLongUpIcon className="w-4 h-4" /> },
                                { name: 'Tilt Down', icon: <ArrowLongDownIcon className="w-4 h-4" /> },
                                { name: 'Zoom In', icon: <PlusIcon className="w-4 h-4" /> },
                                { name: 'Dolly Zoom', icon: <CameraIcon className="w-4 h-4"/> }
                            ].map(control => (
                                <button key={control.name} onClick={() => updateProject({ prompt: `${project.prompt} ${control.name}`.trim() })} className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-2">
                                    {control.icon} {control.name}
                                </button>
                            ))}
                         </div>
                    </div>
                    {/* Storyboarding */}
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Starting Image</label>
                            {project.startFrame ? (
                                <div className="relative w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                    <AssetPreview asset={project.startFrame} />
                                    <button onClick={() => updateProject({ startFrame: undefined })} className="absolute -top-2 -right-2 z-10 bg-black text-white dark:bg-white dark:text-black rounded-full p-1 shadow-md">
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : <Uploader onUpload={(file) => handleFrameUpload(file, 'start')} compact />}
                        </div>
                         <div>
                            <label className="block mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ending Image</label>
                             {project.endFrame ? (
                                <div className="relative w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                    <AssetPreview asset={project.endFrame} />
                                    <button onClick={() => updateProject({ endFrame: undefined })} className="absolute -top-2 -right-2 z-10 bg-black text-white dark:bg-white dark:text-black rounded-full p-1 shadow-md">
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : <Uploader onUpload={(file) => handleFrameUpload(file, 'end')} compact />}
                        </div>
                    </div>
                    {/* Negative Prompt */}
                    <div className="md:col-span-2">
                        <label htmlFor="negativePrompt" className="block mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Negative Prompt</label>
                        <input type="text" id="negativePrompt" value={project.negativePrompt} onChange={e => updateProject({ negativePrompt: e.target.value })} placeholder="e.g., text, watermark, blurry" 
                            className="w-full p-4 border rounded-lg" />
                    </div>
                </div>
            )}
        </div>
    )
};