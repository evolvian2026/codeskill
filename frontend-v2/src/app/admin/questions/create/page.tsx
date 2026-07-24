"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { adminProblemsAPI } from "@/config/api";
import { useQuestionStore } from "./_store/useQuestionStore";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Settings, FileText, Code2, Database, BarChart3, Rocket, LayoutTemplate, Shield, Moon, Sun, Search, Cpu, AlertTriangle, ArrowRightLeft, Lightbulb, BookOpen, Sparkles, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { ToastProvider, useToast } from "./_components/Toast";
import ProgressBar from "./_components/ProgressBar";

import BasicInfo from "./_components/BasicInfo";
import ProgrammingLanguages from "./_components/ProgrammingLanguages";
import ExecutionSettings from "./_components/ExecutionSettings";
import ProblemStatement from "./_components/ProblemStatement";
import Constraints from "./_components/Constraints";
import InputOutputFormat from "./_components/InputOutputFormat";
import SampleTestCases from "./_components/SampleTestCases";
import StarterCode from "./_components/StarterCode";
import ReferenceSolution from "./_components/ReferenceSolution";
import TestCases from "./_components/TestCases";
import CustomChecker from "./_components/CustomChecker";
import SolutionExplanation from "./_components/SolutionExplanation";
import AIAssistance from "./_components/AIAssistance";
import SEOSection from "./_components/SEOSection";
import AnalyticsSection from "./_components/AnalyticsSection";
import PublishingSection from "./_components/PublishingSection";

const NAV_ITEMS = [
  { id: "basic-info", label: "Basic Info", icon: Settings },
  { id: "languages", label: "Languages", icon: Code2 },
  { id: "execution-settings", label: "Execution", icon: Cpu },
  { id: "statement", label: "Statement", icon: FileText },
  { id: "constraints", label: "Constraints", icon: AlertTriangle },
  { id: "io-format", label: "I/O Format", icon: ArrowRightLeft },
  { id: "sample-test-cases", label: "Sample Cases", icon: Lightbulb },
  { id: "starter-code", label: "Starter Code", icon: LayoutTemplate },
  { id: "reference-solution", label: "Reference", icon: Shield },
  { id: "test-cases", label: "Test Cases", icon: Database },
  { id: "custom-checker", label: "Checker", icon: Shield },
  { id: "solution-explanation", label: "Editorial", icon: BookOpen },
  { id: "ai-assistance", label: "AI Tools", icon: Sparkles },
  { id: "seo", label: "SEO", icon: Search },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "publishing", label: "Publishing", icon: Rocket },
];

function CreateQuestionContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  
  const store = useQuestionStore();
  const { isDarkMode, setDarkMode, lastSaved, markSaved, getProgress, activeSection, setActiveSection, resetStore } = store;

  // Auto-save logic
  useEffect(() => {
    const interval = setInterval(() => {
      markSaved();
    }, 60000);
    return () => clearInterval(interval);
  }, [markSaved]);

  // Dark mode class toggle
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Scrollspy logic
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -80% 0px" }
    );

    NAV_ITEMS.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [setActiveSection]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  const handleValidate = () => {
    if (!store.metadata.title.trim() || !store.metadata.slug.trim()) {
      addToast("error", "Validation Failed", "Question Title and URL Slug are required.");
      scrollToSection("basic-info");
      return false;
    }
    if (store.languages.supported.length === 0) {
      addToast("error", "Validation Failed", "Please select at least one programming language.");
      scrollToSection("languages");
      return false;
    }
    addToast("success", "Validation Passed", "All required fields look good.");
    return true;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!handleValidate()) return;

    setLoading(true);
    try {
      const visibility = (store.metadata.visibility === "Published" || store.publishing.publishImmediately)
        ? "Published"
        : (store.metadata.visibility === "Draft" || store.publishing.saveAsDraft)
        ? "Draft"
        : store.metadata.visibility || "Draft";

      const payload = {
        metadata: {
          ...store.metadata,
          visibility,
        },
        languages: store.languages.supported || store.languages,
        execution: store.execution,
        statement: store.statement,
        sampleExamples: store.sampleExamples,
        starterCode: store.starterCode,
        referenceSolution: store.referenceSolution,
        testCases: { cases: store.testCases },
        customChecker: store.customChecker,
        solutionExplanation: store.solutionExplanation,
        seo: store.seo,
        analytics: store.analytics,
        publishing: {
          ...store.publishing,
          visibility,
        },
      };

      await adminProblemsAPI.create(payload);
      addToast("success", "Question Created", "Successfully created question.");
      setTimeout(() => {
        router.push("/admin/questions");
      }, 1000);
    } catch (err: any) {
      addToast("error", "Failed to create question", err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = () => {
    markSaved();
    addToast("info", "Draft Saved", "Your progress has been saved locally.");
  };

  const progress = getProgress();

  return (
    <div className={`min-h-screen pb-32 transition-colors duration-300 ${isDarkMode ? 'bg-[#0B0F1A]' : 'bg-[#F8FAFC]'}`}>
      {/* Top Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/[0.04] sticky top-0 z-40 shadow-sm transition-colors duration-300">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 mb-1">
                <Link href="/admin/questions" className="hover:text-gray-900 dark:hover:text-white flex items-center gap-1 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Question Bank
                </Link>
                <span>/</span>
                <span className="text-gray-900 dark:text-white font-medium">Create Question</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Create New Question</h1>
            </div>
            
            <div className="hidden lg:block h-10 w-px bg-gray-200 dark:bg-slate-700" />
            
            <div className="hidden lg:block w-48">
              <ProgressBar value={progress} />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
               {lastSaved ? (
                 <>
                   <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                   Saved {new Date(lastSaved).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                 </>
               ) : (
                 <>
                   <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Auto-saving enabled
                 </>
               )}
             </div>

             <button
               onClick={() => setDarkMode(!isDarkMode)}
               className="p-2.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
             >
               {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
             </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Scrollspy Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0 sticky top-32">
            <nav className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4 px-3">Navigation</p>
              {NAV_ITEMS.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-all text-left ${
                    activeSection === item.id
                      ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 shadow-sm"
                      : "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${activeSection === item.id ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-slate-500"}`} />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Form Content */}
          <div className="flex-1 w-full min-w-0">
            <form id="question-form" onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
              <BasicInfo />
              <ProgrammingLanguages />
              <ExecutionSettings />
              <ProblemStatement />
              <Constraints />
              <InputOutputFormat />
              <SampleTestCases />
              <StarterCode />
              <ReferenceSolution />
              <TestCases />
              <CustomChecker />
              <SolutionExplanation />
              <AIAssistance />
              <SEOSection />
              <AnalyticsSection />
              <PublishingSection />
            </form>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.5 }}
        className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-gray-200 dark:border-white/[0.04] p-4 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.2)] z-50"
      >
        <div className="max-w-[1600px] mx-auto flex items-center justify-between px-2">
          <button 
            type="button" 
            onClick={() => router.push("/admin/questions")}
            className="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white font-medium text-sm transition-colors"
          >
            Cancel
          </button>
          
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
            <button 
              type="button" 
              onClick={handleSaveDraft}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm whitespace-nowrap"
            >
              Save Draft
            </button>
            <button 
              type="button" 
              onClick={handleValidate}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm whitespace-nowrap"
            >
              Validate
            </button>
            <button 
              type="button" 
              className="px-5 py-2.5 text-sm font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors shadow-sm whitespace-nowrap"
            >
              Preview
            </button>
            <button 
              type="button" 
              onClick={() => { handleSubmit(); resetStore(); }}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap hidden sm:block"
            >
              Save & Add Another
            </button>
            <button 
              type="submit" 
              form="question-form"
              disabled={loading}
              className="flex items-center justify-center gap-2 px-8 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Publish Question
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function CreateAdvancedQuestionPage() {
  return (
    <ToastProvider>
      <CreateQuestionContent />
    </ToastProvider>
  );
}
