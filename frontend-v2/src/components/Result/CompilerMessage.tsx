"use client";

import React from 'react';
import { Terminal, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface CompilerMessageProps {
  message: string;
}

export default function CompilerMessage({ message }: CompilerMessageProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(message);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }
    } catch (e) {
      // Fallback
    }
    try {
      const textArea = document.createElement("textarea");
      textArea.value = message;
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

  if (!message) return null;

  return (
    <div className="w-full rounded-xl overflow-hidden bg-[#0D0D12] border border-red-500/20">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#27272A] bg-[#18181B]/50">
        <div className="flex items-center gap-2 text-zinc-400">
          <Terminal className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Compiler Message</span>
        </div>
        <button
          onClick={handleCopy}
          className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-[#27272A] rounded-md transition-colors"
          title="Copy output"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm font-mono text-red-400 whitespace-pre-wrap leading-relaxed">
          {message}
        </pre>
      </div>
    </div>
  );
}
