"use client";

import { type ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "play";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  icon?: ReactNode;
  uppercase?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  disabled = false,
  type = "button",
  icon,
  uppercase = false,
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center font-bold transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none";

  const variantClasses = {
    primary:
      "bg-yellow-400 hover:bg-yellow-500 text-black shadow-md border-2 border-black",
    secondary:
      "bg-green-400 hover:bg-green-500 text-black shadow-md border-2 border-black",
    outline:
      "bg-cream-100 border-2 border-black hover:bg-cream-200 text-black shadow-md",
    ghost:
      "hover:bg-cream-100 text-black",
    play:
      "bg-yellow-400 hover:bg-yellow-500 text-black text-xl font-extrabold shadow-md uppercase tracking-wider border-2 border-black",
  };

  const sizeClasses = {
    sm: "text-xs px-2.5 py-1.5 rounded-full",
    md: "text-sm px-5 py-2 rounded-full",
    lg: "text-base px-8 py-3 rounded-full",
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${uppercase ? 'uppercase' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="flex items-center mr-2">{icon}</span>}
      {children}
    </button>
  );
}
