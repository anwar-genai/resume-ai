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
        bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md
        shadow-lg shadow-black/5 dark:shadow-black/20
        ${hover ? "hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30 hover:-translate-y-0.5" : ""}
        ${glow ? "ring-1 ring-indigo-500/20 shadow-indigo-500/10" : ""}
        transition-all duration-300 ease-out
        ${className}
      `}
    >
      {glow && (
        <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 blur opacity-30 -z-10" />
      )}
      {children}
    </div>
  );
}
