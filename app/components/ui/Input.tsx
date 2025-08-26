"use client";
import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const baseClasses = `
  w-full px-4 py-3 rounded-lg border border-white/20 dark:border-zinc-700/50
  bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md
  placeholder:text-gray-500 dark:placeholder:text-gray-400
  focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
  transition-all duration-200
`;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
      <input
        ref={ref}
        className={`${baseClasses} ${error ? "border-red-500/50 ring-red-500/20" : ""} ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", ...props }, ref) => (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
      <textarea
        ref={ref}
        className={`${baseClasses} resize-none ${error ? "border-red-500/50 ring-red-500/20" : ""} ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
);

Input.displayName = "Input";
Textarea.displayName = "Textarea";
