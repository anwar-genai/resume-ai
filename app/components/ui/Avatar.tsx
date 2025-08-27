"use client";
import { useState } from "react";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Avatar({
  src,
  alt = "Avatar",
  fallback = "?",
  size = "md",
  className = "",
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };

  const showFallback = !src || imageError;

  return (
    <div
      className={`
        relative inline-flex items-center justify-center rounded-full
        bg-gradient-to-br from-indigo-500 to-emerald-500
        ${sizes[size]} ${className}
      `}
    >
      {!showFallback ? (
        <img
          src={src}
          alt={alt}
          onError={() => setImageError(true)}
          className="w-full h-full rounded-full object-cover border-2 border-white/20"
        />
      ) : (
        <span className="font-semibold text-white uppercase">
          {fallback.slice(0, 2)}
        </span>
      )}
      <div className="absolute inset-0 rounded-full ring-1 ring-white/20 dark:ring-zinc-700/50" />
    </div>
  );
}
