"use client";
import { useEffect, useRef } from "react";

export default function AnimatedBackground() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    
    // Create floating orbs
    const orbs = Array.from({ length: 6 }, (_, i) => {
      const orb = document.createElement("div");
      orb.className = `absolute rounded-full opacity-20 animate-pulse`;
      orb.style.background = `radial-gradient(circle, ${
        i % 2 === 0 ? "rgba(99,102,241,0.3)" : "rgba(16,185,129,0.3)"
      } 0%, transparent 70%)`;
      orb.style.width = `${Math.random() * 300 + 100}px`;
      orb.style.height = orb.style.width;
      orb.style.left = `${Math.random() * 100}%`;
      orb.style.top = `${Math.random() * 100}%`;
      orb.style.animationDelay = `${Math.random() * 3}s`;
      orb.style.animationDuration = `${Math.random() * 4 + 6}s`;
      ref.current?.appendChild(orb);
      
      // Animate position
      const animate = () => {
        orb.style.transform = `translate(${Math.sin(Date.now() * 0.001 + i) * 30}px, ${Math.cos(Date.now() * 0.0008 + i) * 40}px)`;
        requestAnimationFrame(animate);
      };
      animate();
      
      return orb;
    });

    return () => orbs.forEach(orb => orb.remove());
  }, []);

  return (
    <div
      ref={ref}
      className="fixed inset-0 -z-10 overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse 80% 50% at 20% 40%, rgba(99,102,241,0.1) 0%, transparent 50%),
          radial-gradient(ellipse 60% 50% at 80% 60%, rgba(16,185,129,0.1) 0%, transparent 50%),
          linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.05) 100%)
        `
      }}
      aria-hidden
    />
  );
}
