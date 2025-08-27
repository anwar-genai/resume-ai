"use client";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  animation?: "pulse" | "wave" | "none";
  width?: string | number;
  height?: string | number;
}

export default function Skeleton({
  className = "",
  variant = "rectangular",
  animation = "pulse",
  width,
  height,
}: SkeletonProps) {
  const baseClasses = "bg-gray-200 dark:bg-zinc-800";
  
  const variants = {
    text: "rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };
  
  const animations = {
    pulse: "animate-pulse",
    wave: "bg-shimmer bg-[size:200%_100%] animate-shimmer",
    none: "",
  };
  
  const style: React.CSSProperties = {
    width: width || "100%",
    height: height || (variant === "text" ? "1em" : "100%"),
  };
  
  return (
    <div
      className={`${baseClasses} ${variants[variant]} ${animations[animation]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

interface SkeletonContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function SkeletonContainer({ children, className = "" }: SkeletonContainerProps) {
  return (
    <div className={`animate-fade-in ${className}`}>
      {children}
    </div>
  );
}

// Pre-built skeleton patterns
export function SkeletonCard() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton variant="text" height="24px" width="60%" />
      <div className="space-y-2">
        <Skeleton variant="text" />
        <Skeleton variant="text" />
        <Skeleton variant="text" width="80%" />
      </div>
      <div className="flex gap-3 mt-4">
        <Skeleton variant="rectangular" width="80px" height="32px" />
        <Skeleton variant="rectangular" width="80px" height="32px" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton variant="circular" width="48px" height="48px" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="text" width="60%" />
          </div>
        </div>
      ))}
    </div>
  );
}
