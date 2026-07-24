"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Code2, Sparkles, Terminal, CheckCircle2, Trophy, Cpu, Users } from "lucide-react";
import AnimatedBackground from "./AnimatedBackground";

export default function MorphHero() {
  const heroRef = useRef<HTMLDivElement>(null);

  const STATS = [
    { label: "Problems Solved", value: "2.4M+", icon: CheckCircle2 },
    { label: "Active Developers", value: "150K+", icon: Users },
    { label: "Execution Speed", value: "< 45ms", icon: Cpu },
    { label: "Top Tech Partners", value: "500+", icon: Trophy },
  ];

  return (
    <section ref={heroRef} className="relative w-full min-h-[92vh] flex flex-col justify-center items-center overflow-hidden pt-28 pb-20">
      {/* Premium GSAP Morphing Background Canvas */}
      <AnimatedBackground className="absolute inset-0 z-0" intensity="high" showGrid={true} interactive={true} />

      {/* Main Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col items-center text-center">
        
        {/* Release Pill Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 backdrop-blur-md hover:border-indigo-500/40 transition-all cursor-pointer shadow-lg shadow-indigo-500/5"
        >
          <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 tracking-wide uppercase">
            CodeSkill 2.0 Engine Live
          </span>
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-5xl mx-auto leading-[1.08] text-foreground mb-8"
        >
          Become the Developer{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-gradient">
            Companies Want to Hire.
          </span>
        </motion.h1>

        {/* Subhead */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Master algorithms, solve real-world coding problems, and ace technical interviews with our high-speed execution judge and interactive learning environment.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto justify-center mb-16"
        >
          <Link
            href="/problems"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Start Coding Now
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-foreground bg-white/80 dark:bg-slate-900/80 border border-gray-200 dark:border-slate-800 backdrop-blur-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-all shadow-sm"
          >
            Explore Dashboard
          </Link>
        </motion.div>

        {/* Interactive Editor Card Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="w-full max-w-4xl rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden"
        >
          {/* Top Window Bar */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono text-muted-foreground ml-2">solution.ts</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <Terminal className="w-3 h-3" /> Runtime: 38ms
            </div>
          </div>

          {/* Code Window */}
          <div className="font-mono text-left text-xs sm:text-sm leading-relaxed text-gray-800 dark:text-slate-200 space-y-1 overflow-x-auto p-2">
            <div><span className="text-purple-600 dark:text-purple-400 font-semibold">function</span> <span className="text-blue-600 dark:text-blue-400 font-semibold">twoSum</span>(nums: <span className="text-amber-600 dark:text-amber-300">number[]</span>, target: <span className="text-amber-600 dark:text-amber-300">number</span>) {'{'}</div>
            <div className="pl-6"><span className="text-purple-600 dark:text-purple-400">const</span> map = <span className="text-purple-600 dark:text-purple-400">new</span> <span className="text-emerald-600 dark:text-emerald-400">Map</span>&lt;<span className="text-amber-600 dark:text-amber-300">number</span>, <span className="text-amber-600 dark:text-amber-300">number</span>&gt;();</div>
            <div className="pl-6"><span className="text-purple-600 dark:text-purple-400">for</span> (<span className="text-purple-600 dark:text-purple-400">let</span> i = 0; i &lt; nums.length; i++) {'{'}</div>
            <div className="pl-12"><span className="text-purple-600 dark:text-purple-400">const</span> diff = target - nums[i];</div>
            <div className="pl-12"><span className="text-purple-600 dark:text-purple-400">if</span> (map.has(diff)) <span className="text-purple-600 dark:text-purple-400">return</span> [map.get(diff)!, i];</div>
            <div className="pl-12">map.set(nums[i], i);</div>
            <div className="pl-6">{'}'}</div>
            <div>{'}'}</div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-5xl mt-16 pt-8 border-t border-gray-200/60 dark:border-white/[0.06]"
        >
          {STATS.map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className="w-4 h-4 text-indigo-500" />
                <span className="text-2xl sm:text-3xl font-extrabold text-foreground">{stat.value}</span>
              </div>
              <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
