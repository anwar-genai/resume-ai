"use client";
import { ReactNode, ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  glow?: boolean;
}

export default function Button({ 
  children, 
  variant = "secondary", 
  size = "md", 
  glow = false,
  className = "",
  ...props 
}: ButtonProps) {
  const baseClasses = `
    relative inline-flex items-center justify-center gap-2 rounded-lg font-medium
    transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 
    focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
    border backdrop-blur-md group overflow-hidden cursor-pointer
    hover:shadow-lg active:transform active:scale-[0.98]
  `;
  
  const variants = {
    primary: `
      bg-gradient-to-r from-indigo-600 to-emerald-600 text-white border-transparent
      hover:from-indigo-700 hover:to-emerald-700 hover:shadow-lg hover:-translate-y-0.5
      focus-visible:ring-indigo-500 shadow-lg shadow-indigo-500/25
      active:scale-[0.98] active:shadow-md
    `,
    secondary: `
      bg-white/60 dark:bg-zinc-900/60 border-white/20 dark:border-zinc-700/50
      hover:bg-white/80 dark:hover:bg-zinc-900/80 hover:shadow-md hover:-translate-y-0.5
      focus-visible:ring-indigo-500 text-gray-900 dark:text-gray-100
      active:scale-[0.98]
    `,
    ghost: `
      bg-transparent border-transparent hover:bg-white/20 dark:hover:bg-zinc-800/20
      focus-visible:ring-indigo-500 text-gray-700 dark:text-gray-300
      active:scale-[0.98]
    `,
    danger: `
      bg-gradient-to-r from-red-500 to-pink-500 text-white border-transparent
      hover:from-red-600 hover:to-pink-600 hover:shadow-lg hover:-translate-y-0.5
      focus-visible:ring-red-500 shadow-lg shadow-red-500/25
      active:scale-[0.98] active:shadow-md
    `
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };
  
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {/* Shimmer effect for primary buttons */}
      {variant === "primary" && (
        <div className="absolute inset-0 -z-10 bg-shimmer bg-[size:200%_100%] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}
      
      {/* Glow effect */}
      {glow && (variant === "primary" || variant === "danger") && (
        <div className={`absolute -inset-0.5 rounded-lg blur opacity-30 -z-20 animate-glow bg-gradient-to-r ${
          variant === "primary" ? "from-indigo-600 to-emerald-600" : "from-red-500 to-pink-500"
        }`} />
      )}
      
      {/* Ripple effect container */}
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </button>
  );
}
