"use client";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export default function GlassCard({ children, className = "", hover = true, glow = false }: GlassCardProps) {
  return (
    <div
      className={`
        relative rounded-xl border border-white/20 dark:border-zinc-700/50
        bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md backdrop-saturate-150
        shadow-lg shadow-black/5 dark:shadow-black/20
        ${hover ? "hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30 hover:-translate-y-1 hover:border-white/30 dark:hover:border-zinc-600/50 hover:bg-white/70 dark:hover:bg-zinc-900/70" : ""}
        ${glow ? "ring-1 ring-indigo-500/20 shadow-indigo-500/10" : ""}
        transition-all duration-300 ease-out group
        ${className}
      `}
    >
      {/* Gradient overlay on hover */}
      {hover && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      )}
      
      {/* Glow effect */}
      {glow && (
        <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 blur opacity-30 -z-10 animate-pulse-slow" />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
