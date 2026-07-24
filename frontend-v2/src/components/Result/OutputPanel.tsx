"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Terminal, Code2 } from 'lucide-react';
import CompilerMessage from './CompilerMessage';

interface OutputSectionProps {
  title: string;
  content: string;
  icon?: React.ElementType;
}

function OutputSection({ title, content, icon: Icon = Terminal }: OutputSectionProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      if (typeof document !== "undefined" && document.hasFocus() && navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }
    } catch (e) {
      // Fallback
    }
    try {
      const textArea = document.createElement("textarea");
      textArea.value = content;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      textArea.remove();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Copy failed", err);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5" />
          {title}
        </h4>
        <button
          onClick={handleCopy}
          className="p-1 text-zinc-500 hover:text-zinc-200 transition-colors"
          title="Copy"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <div className="w-full rounded-xl bg-[#0D0D12] border border-[#27272A] p-4">
        <pre className="font-mono text-sm text-zinc-300 whitespace-pre-wrap break-words">
          {content || <span className="text-zinc-600 italic">No output</span>}
        </pre>
      </div>
    </div>
  );
}

interface OutputPanelProps {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  compilerMessage?: string;
  executionTime?: number; // in seconds
  memory?: number; // in MB
}

export default function OutputPanel({
  input,
  expectedOutput,
  actualOutput,
  compilerMessage,
  executionTime,
  memory
}: OutputPanelProps) {
  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 gap-6 overflow-y-auto">
      
      {compilerMessage && (
        <CompilerMessage message={compilerMessage} />
      )}

      {!compilerMessage && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-6"
        >
          <OutputSection title="Input (stdin)" content={input} icon={Code2} />
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <OutputSection title="Your Output" content={actualOutput} />
            <OutputSection title="Expected Output" content={expectedOutput} />
          </div>
          
          {(executionTime !== undefined || memory !== undefined) && (
            <div className="flex flex-wrap items-center gap-4 mt-2">
              {executionTime !== undefined && (
                <div className="flex items-center gap-2 bg-[#18181B] border border-[#27272A] rounded-lg px-4 py-2">
                  <span className="text-xs font-medium text-zinc-400">Execution Time</span>
                  <span className="text-sm font-semibold text-zinc-200">{executionTime} sec</span>
                </div>
              )}
              
              {memory !== undefined && (
                <div className="flex items-center gap-2 bg-[#18181B] border border-[#27272A] rounded-lg px-4 py-2">
                  <span className="text-xs font-medium text-zinc-400">Memory</span>
                  <span className="text-sm font-semibold text-zinc-200">{memory} MB</span>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
