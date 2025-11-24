import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalWrapperProps {
    isOpen: boolean;
    onClose?: () => void;
    children: React.ReactNode;
    zIndex?: number;
}

export const ModalWrapper: React.FC<ModalWrapperProps> = ({ isOpen, onClose, children, zIndex = 1000 }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 bg-black/90 backdrop-blur-sm overflow-y-auto transition-opacity duration-300"
            style={{ zIndex }}
            onClick={onClose}
        >
            <div className="flex min-h-full items-start justify-center p-4 py-10">
                {/* Inner container to stop propagation and center width */}
                <div 
                    onClick={(e) => e.stopPropagation()} 
                    className="w-full flex justify-center pointer-events-none"
                >
                    {/* Pointer events auto re-enabled on children */}
                    <div className="pointer-events-auto w-full max-w-fit">
                        {children}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};