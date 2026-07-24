"use client";

import React, { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useGSAPContext } from "./GSAPProvider";

interface AnimatedBackgroundProps {
  className?: string;
  intensity?: "low" | "medium" | "high";
  showGrid?: boolean;
  interactive?: boolean;
}

// Morph SVG path keyframe sequence
const SVG_PATHS = [
  "M 100,200 Q 350,50 700,200 T 1300,200 Q 1400,500 1100,750 T 400,700 Q 50,500 100,200 Z",
  "M 150,150 Q 500,100 850,250 T 1350,300 Q 1250,650 900,800 T 250,650 Q 100,400 150,150 Z",
  "M 200,250 Q 400,200 800,150 T 1250,200 Q 1350,600 1000,700 T 350,750 Q 150,600 200,250 Z",
  "M 120,180 Q 450,120 750,220 T 1320,180 Q 1380,550 1050,720 T 320,720 Q 80,480 120,180 Z"
];

export default function AnimatedBackground({
  className = "",
  intensity = "medium",
  showGrid = true,
  interactive = true,
}: AnimatedBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef1 = useRef<SVGPathElement>(null);
  const pathRef2 = useRef<SVGPathElement>(null);
  const glowBlob1 = useRef<HTMLDivElement>(null);
  const glowBlob2 = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  const { isReducedMotion } = useGSAPContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // GSAP Morphing Animation
  useGSAP(
    () => {
      if (isReducedMotion || !pathRef1.current || !pathRef2.current) return;

      const tl1 = gsap.timeline({ repeat: -1, yoyo: true });
      const tl2 = gsap.timeline({ repeat: -1, yoyo: true });

      // Morph path 1 across SVG_PATHS
      tl1.to(pathRef1.current, {
        duration: 12,
        attr: { d: SVG_PATHS[1] },
        ease: "sine.inOut",
      })
      .to(pathRef1.current, {
        duration: 14,
        attr: { d: SVG_PATHS[2] },
        ease: "power1.inOut",
      })
      .to(pathRef1.current, {
        duration: 12,
        attr: { d: SVG_PATHS[3] },
        ease: "sine.inOut",
      })
      .to(pathRef1.current, {
        duration: 10,
        attr: { d: SVG_PATHS[0] },
        ease: "power2.inOut",
      });

      // Morph path 2 with offset rhythm
      tl2.to(pathRef2.current, {
        duration: 15,
        attr: { d: SVG_PATHS[2] },
        ease: "power2.inOut",
      })
      .to(pathRef2.current, {
        duration: 13,
        attr: { d: SVG_PATHS[0] },
        ease: "sine.inOut",
      })
      .to(pathRef2.current, {
        duration: 16,
        attr: { d: SVG_PATHS[1] },
        ease: "sine.inOut",
      });

      // Ambient glowing light floating animation
      if (glowBlob1.current && glowBlob2.current) {
        gsap.to(glowBlob1.current, {
          x: "random(-80, 80)",
          y: "random(-60, 60)",
          duration: 8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });

        gsap.to(glowBlob2.current, {
          x: "random(-100, 100)",
          y: "random(-80, 80)",
          duration: 10,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
    },
    { scope: containerRef, dependencies: [isReducedMotion] }
  );

  // Smooth mouse parallax loop (60 FPS lerp)
  useEffect(() => {
    if (!interactive || isReducedMotion || typeof window === "undefined") return;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      mousePos.current.targetX = (e.clientX / innerWidth - 0.5) * 40;
      mousePos.current.targetY = (e.clientY / innerHeight - 0.5) * 40;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    let animationFrameId: number;
    const updateParallax = () => {
      mousePos.current.x += (mousePos.current.targetX - mousePos.current.x) * 0.05;
      mousePos.current.y += (mousePos.current.targetY - mousePos.current.y) * 0.05;

      if (containerRef.current) {
        gsap.set(containerRef.current.querySelectorAll(".parallax-layer"), {
          x: mousePos.current.x,
          y: mousePos.current.y,
        });
      }

      animationFrameId = requestAnimationFrame(updateParallax);
    };

    updateParallax();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [interactive, isReducedMotion]);

  const opacityMap = {
    low: "opacity-30",
    medium: "opacity-60",
    high: "opacity-90",
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-background transition-colors duration-500 pointer-events-none ${className}`}
    >
      {/* 1. Ambient Gradient Orbs */}
      <div className={`absolute inset-0 z-0 ${opacityMap[intensity]}`}>
        <div
          ref={glowBlob1}
          className="parallax-layer absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-indigo-600/30 via-purple-600/20 to-pink-500/10 blur-[120px]"
        />
        <div
          ref={glowBlob2}
          className="parallax-layer absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-600/20 via-cyan-500/20 to-emerald-500/10 blur-[140px]"
        />
      </div>

      {/* 2. Grid Pattern Overlay */}
      {showGrid && (
        <div className="absolute inset-0 z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      )}

      {/* 3. Morphing SVG Layer */}
      {mounted && (
        <svg
          className="parallax-layer absolute inset-0 w-full h-full z-20 transition-opacity duration-1000"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="morphGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#a855f7" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="morphGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
            </linearGradient>
            <filter id="svgGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="30" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Morphing Blob 1 */}
          <path
            ref={pathRef1}
            d={SVG_PATHS[0]}
            fill="url(#morphGrad1)"
            stroke="rgba(99, 102, 241, 0.3)"
            strokeWidth="1.5"
            filter="url(#svgGlow)"
          />

          {/* Morphing Blob 2 */}
          <path
            ref={pathRef2}
            d={SVG_PATHS[2]}
            fill="url(#morphGrad2)"
            stroke="rgba(59, 130, 246, 0.25)"
            strokeWidth="1"
            filter="url(#svgGlow)"
          />
        </svg>
      )}

      {/* 4. Radial Vignette Shading */}
      <div className="absolute inset-0 z-30 bg-radial from-transparent via-background/40 to-background pointer-events-none" />
    </div>
  );
}
