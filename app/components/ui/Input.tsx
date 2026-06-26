"use client";
import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

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
  bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md backdrop-saturate-150
  placeholder:text-gray-500 dark:placeholder:text-gray-400
  focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
  transition-all duration-200 text-gray-900 dark:text-white
  hover:bg-white/80 dark:hover:bg-zinc-900/80 hover:border-white/30 dark:hover:border-zinc-600/50
`;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", type, ...props }, ref) => {
    const [reveal, setReveal] = useState(false);
    const isPassword = type === "password";
    const effectiveType = isPassword && reveal ? "text" : type;

    return (
      <div className="space-y-1">
        {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">{label}</label>}
        <div className="relative">
          <input
            ref={ref}
            type={effectiveType}
            className={`${baseClasses} ${isPassword ? "pr-12" : ""} ${error ? "border-red-500/50 ring-red-500/20" : ""} ${className}`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setReveal((v) => !v)}
              aria-label={reveal ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none"
            >
              {reveal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", ...props }, ref) => (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">{label}</label>}
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
