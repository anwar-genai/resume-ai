"use client";
import { ReactNode, useState, useRef, useEffect } from "react";

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}

export default function Dropdown({
  trigger,
  children,
  align = "left",
  className = "",
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const alignmentClasses = {
    left: "left-0",
    right: "right-0",
    center: "left-1/2 -translate-x-1/2",
  };

  return (
    <div ref={dropdownRef} className="relative">
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">{trigger}</div>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className={`
              absolute top-full mt-2 z-50
              min-w-[200px] py-2 rounded-xl
              bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl
              border border-white/20 dark:border-zinc-700/50
              shadow-xl shadow-black/10 dark:shadow-black/30
              animate-scale-in origin-top
              ${alignmentClasses[align]}
              ${className}
            `}
          >
            {children}
          </div>
        </>
      )}
    </div>
  );
}

interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  variant?: "default" | "danger";
  className?: string;
}

export function DropdownItem({
  children,
  onClick,
  icon,
  variant = "default",
  className = "",
}: DropdownItemProps) {
  const variants = {
    default: "hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-900 dark:text-gray-100",
    danger: "hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400",
  };

  return (
    <button
      onClick={onClick}
      className={`
        w-full px-4 py-2.5 text-sm text-left
        flex items-center gap-3 transition-colors
        ${variants[variant]}
        ${className}
      `}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </button>
  );
}

export function DropdownDivider() {
  return <div className="my-2 border-t border-gray-200 dark:border-zinc-700" />;
}
