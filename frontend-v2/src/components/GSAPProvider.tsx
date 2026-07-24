"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

// Register GSAP React plugin safely on client
if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

interface GSAPContextType {
  isReducedMotion: boolean;
}

const GSAPContext = createContext<GSAPContextType>({
  isReducedMotion: false,
});

export const useGSAPContext = () => useContext(GSAPContext);

export function GSAPProvider({ children }: { children: React.ReactNode }) {
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return (
    <GSAPContext.Provider value={{ isReducedMotion }}>
      {children}
    </GSAPContext.Provider>
  );
}

export default GSAPProvider;
