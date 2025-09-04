"use client";

import { ReactNode } from "react";

export interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: "default" | "team";
}

export function Card({
  title,
  children,
  className = "",
  onClick,
  variant = "default",
}: CardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  };

  // Base styles for all cards
  const baseClasses = "overflow-hidden transition-all shadow-lg rounded-xl";
  
  // Variant-specific styles
  const variantClasses = {
    default: "bg-white bg-opacity-90 backdrop-blur-md border border-gray-200",
    team: "hover:shadow-xl transform hover:scale-105 cursor-pointer",
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className} ${
        onClick ? "cursor-pointer" : ""
      }`}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? "button" : undefined}
    >
      {title && (
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">{title}</h3>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
