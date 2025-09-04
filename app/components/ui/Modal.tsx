"use client";

import { useEffect, useState, ReactNode } from "react";
import { Button } from "./Button";
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
      
      {showCloseButton && (
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-amber-800 hover:text-amber-900"
        >
          <span className="sr-only">Close</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      
      <div className="w-full h-full p-4 pt-16 pb-24 overflow-y-auto">
        {children}
      </div>
    </div>
  );
  
  return createPortal(modalContent, document.body);
}
