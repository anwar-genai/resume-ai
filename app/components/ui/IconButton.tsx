"use client";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "ghost" | "solid" | "outline";
  size?: "sm" | "md" | "lg";
  isActive?: boolean;
}

export default function IconButton({
  children,
  variant = "ghost",
  size = "md",
  isActive = false,
  className = "",
  ...props
}: IconButtonProps) {
  const baseClasses = `
    relative inline-flex items-center justify-center rounded-lg
    transition-all duration-200 ease-out focus-visible:outline-none
    focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variants = {
    ghost: `
      hover:bg-white/20 dark:hover:bg-zinc-800/50
      ${isActive ? "bg-white/20 dark:bg-zinc-800/50" : ""}
    `,
    solid: `
      bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md
      hover:bg-white/80 dark:hover:bg-zinc-900/80
      border border-white/20 dark:border-zinc-700/50
    `,
    outline: `
      border border-white/20 dark:border-zinc-700/50
      hover:bg-white/10 dark:hover:bg-zinc-800/30
    `,
  };

  const sizes = {
    sm: "p-1.5",
    md: "p-2",
    lg: "p-3",
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
