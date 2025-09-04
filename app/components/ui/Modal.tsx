"use client";

import { useEffect, useState, ReactNode } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  showCloseButton?: boolean;
};

export function Modal({ 
  isOpen, 
  onClose, 
  children, 
  title,
  showCloseButton = true 
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  
  // Mount the component client-side only
  useEffect(() => {
    setMounted(true);
    
    // Disable body scroll when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  
  if (!mounted || !isOpen) return null;
  
  const modalContent = (
    <div 
      className="fixed inset-0 z-40 flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 animate-fade-in"
    >
      {title && (
        <div className="absolute top-0 left-0 right-0 p-4 text-center bg-white/80 backdrop-blur-sm border-b border-amber-200">
          <h2 className="text-xl font-bold text-amber-800">{title}</h2>
        </div>
      )}
      
      {/* Close button removed - using tab navigation instead */}
      
      <div className="w-full h-full overflow-y-auto">
        {children}
      </div>
    </div>
  );
  
  return createPortal(modalContent, document.body);
}
