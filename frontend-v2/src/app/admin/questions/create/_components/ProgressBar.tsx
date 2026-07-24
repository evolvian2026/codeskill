"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  value: number; // 0-100
}

export default function ProgressBar({ value }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const circumference = 2 * Math.PI * 18; // radius = 18
  const dashOffset = circumference - (clampedValue / 100) * circumference;

  const getColor = () => {
    if (clampedValue < 30) return { stroke: "#ef4444", text: "text-red-500", bg: "bg-red-500" };
    if (clampedValue < 60) return { stroke: "#f59e0b", text: "text-amber-500", bg: "bg-amber-500" };
    if (clampedValue < 90) return { stroke: "#3b82f6", text: "text-blue-500", bg: "bg-blue-500" };
    return { stroke: "#10b981", text: "text-emerald-500", bg: "bg-emerald-500" };
  };

  const color = getColor();

  return (
    <div className="flex items-center gap-3">
      {/* Circular progress */}
      <div className="relative w-11 h-11 flex-shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-gray-200 dark:text-slate-700"
          />
          <motion.circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke={color.stroke}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-[10px] font-bold ${color.text}`}>{clampedValue}%</span>
        </div>
      </div>

      {/* Label + linear bar */}
      <div className="flex-1 min-w-0 hidden sm:block">
        <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1">Form Completion</p>
        <div className="h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${color.bg}`}
            animate={{ width: `${clampedValue}%` }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
          />
        </div>
      </div>
    </div>
  );
}
