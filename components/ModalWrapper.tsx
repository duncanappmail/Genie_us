
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
                {/* 
                    This inner container stops propagation on itself so clicking the modal content doesn't close it.
                    However, we rely on the flex container (parent) to handle centering and sizing.
                    If we make this container `relative pointer-events-auto`, it will wrap the content tightly (if inline-block behavior)
                    or expand to fill width. Since most children have w-full max-w-something, this works.
                */}
                <div 
                    onClick={(e) => e.stopPropagation()} 
                    className="relative pointer-events-auto w-full flex justify-center"
                >
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};
