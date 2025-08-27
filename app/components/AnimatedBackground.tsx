"use client";
import { useEffect, useRef } from "react";

export default function AnimatedBackground() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    
    // Create floating orbs with more sophisticated movement
    const orbs = Array.from({ length: 8 }, (_, i) => {
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
      orb.style.width = `${Math.random() * 400 + 200}px`;
      orb.style.height = orb.style.width;
      orb.style.left = `${Math.random() * 100}%`;
      orb.style.top = `${Math.random() * 100}%`;
      orb.style.filter = "blur(40px)";
      orb.style.opacity = "0";
      orb.style.animation = `fadeIn 2s ease-out ${i * 0.2}s forwards`;
      ref.current?.appendChild(orb);
      
      // Animate position with smooth, organic movement
      let time = Math.random() * Math.PI * 2;
      const speed = 0.0001 + Math.random() * 0.0002;
      const radiusX = 50 + Math.random() * 100;
      const radiusY = 50 + Math.random() * 100;
      
      const animate = () => {
        time += speed;
        const x = Math.sin(time) * radiusX;
        const y = Math.cos(time * 0.7) * radiusY;
        orb.style.transform = `translate(${x}px, ${y}px) scale(${1 + Math.sin(time * 0.5) * 0.1})`;
        requestAnimationFrame(animate);
      };
      animate();
      
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

    return () => {
      orbs.forEach(orb => orb.remove());
      style.remove();
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
