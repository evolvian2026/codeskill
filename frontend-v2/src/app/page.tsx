"use client";

import { motion } from "framer-motion";
import { fadeUp, staggerContainer, hoverCard } from "@/lib/animations";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, Code2, Zap, Trophy, Target, GitMerge, Terminal, CheckCircle2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { InteractiveCard } from "@/components/ui/interactive-card";
import { TestimonialsSection } from "@/components/TestimonialsSection";

const features = [
  { 
    icon: Code2, 
    title: "Modern Environment", 
    desc: "Code in a world-class editor with syntax highlighting, autocomplete, and a blazing fast runtime.",
    header: (
      <div className="flex flex-1 w-full h-full min-h-[10rem] rounded-xl bg-gradient-to-br from-[#111827] to-[#09090B] border border-white/5 relative overflow-hidden group p-4">
        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        {/* Editor Mockup */}
        <div className="w-full h-full bg-[#0d1117] rounded-lg border border-white/10 p-3 font-mono text-[10px] sm:text-xs leading-loose flex flex-col relative shadow-2xl overflow-hidden group-hover:border-primary/30 transition-colors">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-2 h-2 rounded-full bg-red-500/50" />
            <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
            <div className="w-2 h-2 rounded-full bg-green-500/50" />
          </div>
          <div className="text-white/40 mb-1">// Find two sum</div>
          <div><span className="text-primary">function</span> <span className="text-blue-400">twoSum</span>(nums, target) {'{'}</div>
          <div className="pl-4">
            <span className="text-primary">const</span> map = <span className="text-primary">new</span> <span className="text-yellow-200">Map</span>();<br/>
            <span className="text-primary">for</span> (<span className="text-primary">let</span> i = 0; i &lt; nums.length; i++) {'{'}
          </div>
          <div className="absolute -bottom-2 -right-2 w-24 h-24 bg-primary/20 blur-2xl rounded-full" />
        </div>
      </div>
    )
  },
  { 
    icon: Target, 
    title: "Curated Problems", 
    desc: "Master DSA, System Design, and Frontend with hand-picked challenges from top tech companies.",
    header: (
      <div className="flex flex-1 w-full h-full min-h-[10rem] rounded-xl bg-gradient-to-br from-[#111827] to-[#09090B] border border-white/5 relative overflow-hidden group p-4">
        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        {/* Graph Mockup */}
        <div className="w-full h-full flex items-center justify-center relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
             <div className="w-32 h-32 border-[0.5px] border-white/30 rounded-full" />
             <div className="w-24 h-24 border-[0.5px] border-white/30 rounded-full absolute" />
             <div className="w-16 h-16 border-[0.5px] border-white/30 rounded-full absolute" />
          </div>
          <div className="grid grid-cols-2 gap-2 relative z-10 w-3/4">
             <div className="h-2 w-full bg-white/10 rounded-full group-hover:bg-primary/40 transition-colors" />
             <div className="h-2 w-3/4 bg-white/10 rounded-full group-hover:bg-primary/60 transition-colors delay-75" />
             <div className="h-2 w-5/6 bg-white/10 rounded-full group-hover:bg-primary/50 transition-colors delay-100" />
             <div className="h-2 w-1/2 bg-white/10 rounded-full group-hover:bg-primary/80 transition-colors delay-150" />
          </div>
        </div>
      </div>
    )
  },
  { 
    icon: Trophy, 
    title: "Global Leaderboards", 
    desc: "Compete with developers worldwide and climb the ranks to showcase your problem-solving skills.",
    header: (
      <div className="flex flex-1 w-full h-full min-h-[10rem] rounded-xl bg-gradient-to-br from-[#111827] to-[#09090B] border border-white/5 relative overflow-hidden group p-4 items-end justify-center gap-2">
        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        {/* Podium Mockup */}
        <div className="w-12 h-16 bg-white/5 rounded-t-md relative group-hover:bg-white/10 transition-colors flex items-start justify-center pt-2">
           <span className="text-white/30 text-xs font-bold">2</span>
        </div>
        <div className="w-12 h-24 bg-primary/20 rounded-t-md relative group-hover:bg-primary/30 border-t border-primary/50 transition-colors flex items-start justify-center pt-2">
           <span className="text-primary text-xs font-bold shadow-lg">1</span>
        </div>
        <div className="w-12 h-12 bg-white/5 rounded-t-md relative group-hover:bg-white/10 transition-colors flex items-start justify-center pt-2">
           <span className="text-white/30 text-xs font-bold">3</span>
        </div>
      </div>
    )
  },
  { 
    icon: Zap, 
    title: "Instant Feedback", 
    desc: "Get real-time execution results, performance metrics, and actionable hints to unblock yourself.",
    header: (
      <div className="flex flex-1 w-full h-full min-h-[10rem] rounded-xl bg-gradient-to-br from-[#111827] to-[#09090B] border border-white/5 relative overflow-hidden group p-4">
        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        {/* Terminal Mockup */}
        <div className="w-full h-full bg-black/50 rounded-lg border border-white/10 p-3 font-mono text-[10px] sm:text-xs relative shadow-inner overflow-hidden group-hover:border-success/30 transition-colors flex flex-col gap-2">
          <div className="flex items-center gap-2 text-muted-foreground">
             <Terminal className="w-3 h-3" /> <span>Terminal</span>
          </div>
          <div className="text-white/70">
            $ npm run test<br/>
            &gt; Running test cases...
          </div>
          <div className="text-success flex items-center gap-1 mt-auto">
             <CheckCircle2 className="w-3 h-3" /> All 42 tests passed (45ms)
          </div>
        </div>
      </div>
    )
  },
];

import GSAPProvider from "@/components/GSAPProvider";
import AnimatedBackground from "@/components/AnimatedBackground";

export default function Home() {
  return (
    <GSAPProvider>
      <div className="flex-1 flex flex-col w-full">
        {/* 1. Hero Section with GSAP Morphing Canvas */}
        <section className="relative w-full min-h-screen flex flex-col items-center justify-center bg-background text-foreground overflow-hidden pt-32 pb-32">
          <AnimatedBackground className="absolute inset-0 z-0" intensity="high" showGrid={true} interactive={true} />

          {/* Floating Code Snippet 1 */}
          <motion.div 
            animate={{ y: [0, -20, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[20%] left-[10%] hidden lg:block z-10"
          >
            <div className="bg-[#111827] text-white p-4 rounded-xl shadow-2xl text-xs font-mono w-48 border border-[#09090B]/10">
              <span className="text-primary">function</span> <span className="text-blue-400">solve</span>() {'{\n'}
              {'  '}return <span className="text-success font-semibold">true</span>;{'\n'}
              {'}'}
            </div>
          </motion.div>
          
          {/* Floating Code Snippet 2 */}
          <motion.div 
            animate={{ y: [0, 20, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-[30%] right-[10%] hidden lg:block z-10"
          >
            <div className="bg-card border border-border text-card-foreground p-4 rounded-xl shadow-2xl text-xs font-mono w-56">
              <span className="text-primary">const</span> result = <span className="text-blue-500 font-semibold">optimize</span>();
            </div>
          </motion.div>

          <div className="relative z-10 px-6 max-w-5xl mx-auto text-center flex flex-col items-center justify-center flex-1">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="flex flex-col items-center w-full"
            >
              <motion.div variants={fadeUp} className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-muted/80 backdrop-blur-md hover:bg-muted transition-colors cursor-pointer shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-medium text-muted-foreground">CodeSkill 2.0 is now live</span>
              </motion.div>

              <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl lg:text-[5.5rem] font-bold font-heading text-foreground tracking-tight mb-8 leading-[1.05] max-w-4xl mx-auto">
                Become the Developer <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-primary animate-gradient bg-300%">Companies Want to Hire.</span>
              </motion.h1>

              <motion.p variants={fadeUp} className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl leading-relaxed">
                Practice coding, master algorithms, and ace technical interviews with real-world challenges.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
                <Link href="/problems" className={cn(buttonVariants({ size: "lg" }), "rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-xl shadow-black/20 dark:shadow-white/20 px-8 h-14 text-base font-medium group overflow-hidden relative w-full sm:w-auto transition-all")}>
                  Start Coding
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/dashboard" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "rounded-full border-border bg-card text-card-foreground hover:bg-muted h-14 px-8 text-base font-medium overflow-hidden relative w-full sm:w-auto shadow-sm")}>
                  Explore Problems
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

      {/* 2. Black Features Section */}
      <section className="w-full bg-[#09090B] text-white py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="flex flex-col items-center mb-20 text-center"
          >
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold mb-6">Everything you need to succeed</motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-2xl">A professional environment built for focused execution and continuous improvement.</motion.p>
          </motion.div>

          <BentoGrid className="max-w-6xl mx-auto md:auto-rows-[24rem]">
            {features.map((feature, i) => (
              <BentoGridItem
                key={i}
                title={feature.title}
                description={feature.desc}
                icon={<feature.icon className="w-5 h-5 text-primary" />}
                className={i === 0 || i === 3 ? "md:col-span-2" : ""}
                header={feature.header}
              />
            ))}
          </BentoGrid>
        </div>
      </section>

      {/* 3. White Companies Section */}
      <section className="w-full bg-white text-black py-24 px-6 border-y border-black/5">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-10">Trusted by developers at top companies</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Logos represented by stylized text for demo */}
            <span className="text-2xl font-bold font-heading">Google</span>
            <span className="text-2xl font-bold font-heading">Meta</span>
            <span className="text-2xl font-bold font-heading">Amazon</span>
            <span className="text-2xl font-bold font-heading">Netflix</span>
            <span className="text-2xl font-bold font-heading">Apple</span>
          </div>
        </div>
      </section>

      {/* 4. White Premium Testimonials Section */}
      <TestimonialsSection />





      </div>
    </GSAPProvider>
  );
}
