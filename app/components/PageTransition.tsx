"use client";
import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, []);

  useEffect(() => {
    setIsTransitioning(true);
    const delay = reduceMotion ? 0 : 300;
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsTransitioning(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [pathname, children, reduceMotion]);

  return (
    <div
      className={`
        ${reduceMotion ? '' : 'transition-all duration-300 ease-out'}
        ${isTransitioning 
          ? (reduceMotion ? '' : 'opacity-0 transform translate-y-2') 
          : 'opacity-100 transform translate-y-0'
        }
      `}
    >
      {displayChildren}
    </div>
  );
}
