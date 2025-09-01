"use client";
import { useEffect, useRef } from "react";

export default function AnimatedBackground() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const reduceMotion = mediaQuery.matches;
    
    // Create floating orbs with reduced count on low-power devices
    const orbCount = reduceMotion ? 0 : Math.max(4, Math.min(6, Math.floor((window.innerWidth * window.devicePixelRatio) / 800)));
    const orbs = Array.from({ length: orbCount }, (_, i) => {
      const orb = document.createElement("div");
      orb.className = `absolute rounded-full blur-xl`;
      
      const colors = [
        "rgba(99,102,241,0.15)", // Indigo
        "rgba(16,185,129,0.15)", // Emerald
        "rgba(168,85,247,0.15)", // Purple
        "rgba(59,130,246,0.15)", // Blue
        "rgba(236,72,153,0.15)", // Pink
        "rgba(251,146,60,0.15)", // Orange
      ];
      
      orb.style.background = `radial-gradient(circle, ${colors[i % colors.length]} 0%, transparent 70%)`;
      orb.style.width = `${Math.random() * 280 + 160}px`;
      orb.style.height = orb.style.width;
      orb.style.left = `${Math.random() * 100}%`;
      orb.style.top = `${Math.random() * 100}%`;
      orb.style.filter = "blur(40px)";
      orb.style.opacity = "0";
      orb.style.animation = `fadeIn 1.2s ease-out ${i * 0.15}s forwards`;
      ref.current?.appendChild(orb);
      
      if (!reduceMotion) {
        // Animate position with a single shared RAF
        (orb as any).__state = {
          time: Math.random() * Math.PI * 2,
          speed: 0.00008 + Math.random() * 0.00015,
          radiusX: 40 + Math.random() * 80,
          radiusY: 40 + Math.random() * 80,
        };
      }
      
      return orb;
    });

    // Add CSS for fade-in animation
    const style = document.createElement("style");
    style.textContent = `
      @keyframes fadeIn {
        to { opacity: 0.6; }
      }
    `;
    document.head.appendChild(style);

    // Single RAF loop to update all orbs
    let raf = 0;
    const tick = () => {
      for (const orb of orbs) {
        const state = (orb as any).__state;
        if (!state) continue;
        state.time += state.speed;
        const x = Math.sin(state.time) * state.radiusX;
        const y = Math.cos(state.time * 0.7) * state.radiusY;
        orb.style.transform = `translate(${x}px, ${y}px) scale(${1 + Math.sin(state.time * 0.5) * 0.1})`;
      }
      raf = requestAnimationFrame(tick);
    };
    if (!reduceMotion && orbs.length) raf = requestAnimationFrame(tick);

    return () => {
      orbs.forEach(orb => orb.remove());
      style.remove();
      if (raf) cancelAnimationFrame(raf);
    };
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
