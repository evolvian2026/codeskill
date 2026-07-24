"use client";

import { useState } from "react";
import { useQuestionStore } from "../_store/useQuestionStore";
import SectionCard from "./SectionCard";
import { FileText, X, Plus } from "lucide-react";

const CATEGORY_OPTIONS = [
  "Arrays", "Strings", "Graph", "Dynamic Programming", "Trees",
  "Math", "Greedy", "Binary Search", "SQL", "Hash Table",
  "Stack", "Queue", "Linked List", "Sorting", "Recursion",
  "Backtracking", "Bit Manipulation", "Two Pointers", "Sliding Window",
];

const inputClass =
  "w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:ring-indigo-400/20 dark:focus:border-indigo-400 transition-all";

const labelClass = "text-[13px] font-medium text-gray-700 dark:text-slate-300";

export default function BasicInfo() {
  const { metadata, updateMetadata } = useQuestionStore();
  const [tagInput, setTagInput] = useState("");
  const [showCategories, setShowCategories] = useState(false);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    updateMetadata({ title, slug });
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().replace(/,$/, "");
      if (!metadata.tags.includes(tag)) {
        updateMetadata({ tags: [...metadata.tags, tag] });
      }
      setTagInput("");
    }
    if (e.key === "Backspace" && !tagInput && metadata.tags.length > 0) {
      updateMetadata({ tags: metadata.tags.slice(0, -1) });
    }
  };

  const removeTag = (tag: string) => {
    updateMetadata({ tags: metadata.tags.filter((t) => t !== tag) });
  };

  const toggleCategory = (cat: string) => {
    const cats = metadata.categories.includes(cat)
      ? metadata.categories.filter((c) => c !== cat)
      : [...metadata.categories, cat];
    updateMetadata({ categories: cats });
  };

  return (
    <SectionCard
      id="basic-info"
      title="Basic Information"
      subtitle="Define the core properties of your coding problem."
      icon={FileText}
      delay={0}
    >
      <div className="space-y-5">
        {/* Row 1: Title + Slug */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className={labelClass}>
              Question Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={metadata.title}
              onChange={handleTitleChange}
              placeholder="e.g. Two Sum"
              className={inputClass}
            />
            {!metadata.title.trim() && (
              <p className="text-[11px] text-red-500 mt-1">Title is required</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>
              URL Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={metadata.slug}
              onChange={(e) => updateMetadata({ slug: e.target.value })}
              placeholder="e.g. two-sum"
              className={`${inputClass} font-mono text-xs`}
            />
            {metadata.slug && (
              <p className="text-[11px] text-gray-400 dark:text-slate-500">
                codeskill.com/problems/<span className="text-indigo-500 font-medium">{metadata.slug}</span>
              </p>
            )}
          </div>
        </div>

        {/* Row 2: Difficulty + Visibility */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className={labelClass}>
              Difficulty <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {(["Easy", "Medium", "Hard"] as const).map((diff) => {
                const isActive = metadata.difficulty === diff;
                const colors = {
                  Easy: isActive
                    ? "bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-400"
                    : "bg-gray-50 border-gray-200 text-gray-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400",
                  Medium: isActive
                    ? "bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-500/20 dark:border-amber-500/30 dark:text-amber-400"
                    : "bg-gray-50 border-gray-200 text-gray-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400",
                  Hard: isActive
                    ? "bg-red-100 border-red-300 text-red-700 dark:bg-red-500/20 dark:border-red-500/30 dark:text-red-400"
                    : "bg-gray-50 border-gray-200 text-gray-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400",
                };
                return (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => updateMetadata({ difficulty: diff })}
                    className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${colors[diff]}`}
                  >
                    {diff}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Visibility</label>
            <select
              value={metadata.visibility}
              onChange={(e) => {
                const vis = e.target.value as "Draft" | "Published" | "Private";
                updateMetadata({ visibility: vis });
                const { updatePublishing } = useQuestionStore.getState();
                if (vis === "Published") {
                  updatePublishing({ publishImmediately: true, saveAsDraft: false });
                } else if (vis === "Draft") {
                  updatePublishing({ publishImmediately: false, saveAsDraft: true });
                }
              }}
              className={inputClass}
            >
              <option value="Draft">🔒 Draft (Hidden)</option>
              <option value="Published">🌐 Published (Public)</option>
              <option value="Private">🔗 Private (Link Only)</option>
            </select>
          </div>
        </div>

        {/* Row 3: Categories multi-select */}
        <div className="space-y-1.5">
          <label className={labelClass}>
            Categories <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCategories(!showCategories)}
              className={`${inputClass} text-left flex items-center justify-between cursor-pointer`}
            >
              <span className={metadata.categories.length === 0 ? "text-gray-400 dark:text-slate-500" : ""}>
                {metadata.categories.length === 0
                  ? "Select categories..."
                  : `${metadata.categories.length} selected`}
              </span>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${showCategories ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>

            {showCategories && (
              <div className="absolute z-30 top-full mt-1 left-0 right-0 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl p-3 max-h-60 overflow-y-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {CATEGORY_OPTIONS.map((cat) => (
                    <label
                      key={cat}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
                        metadata.categories.includes(cat)
                          ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                          : "hover:bg-gray-50 text-gray-600 dark:hover:bg-slate-700 dark:text-slate-400"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={metadata.categories.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      {cat}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Selected chips */}
          {metadata.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {metadata.categories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-lg"
                >
                  {cat}
                  <button type="button" onClick={() => toggleCategory(cat)} className="hover:text-indigo-900 dark:hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Row 4: Tags */}
        <div className="space-y-1.5">
          <label className={labelClass}>Tags</label>
          <div className={`${inputClass} flex flex-wrap items-center gap-1.5 min-h-[42px] !p-2`}>
            {metadata.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs font-medium rounded-lg"
              >
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder={metadata.tags.length === 0 ? "Type and press Enter to add tags..." : ""}
              className="flex-1 min-w-[120px] bg-transparent text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none"
            />
          </div>
        </div>

        {/* Row 5: Author + Question ID + Solve Time + Points */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div className="space-y-1.5">
            <label className={labelClass}>Author</label>
            <input
              type="text"
              value={metadata.author}
              onChange={(e) => updateMetadata({ author: e.target.value })}
              placeholder="Author name"
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Question ID</label>
            <input
              type="text"
              value={metadata.questionId}
              readOnly
              className={`${inputClass} bg-gray-100 dark:bg-slate-700/50 cursor-not-allowed font-mono text-xs`}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Est. Solve Time</label>
            <div className="relative">
              <input
                type="number"
                value={metadata.estimatedSolveTime}
                onChange={(e) => updateMetadata({ estimatedSolveTime: Number(e.target.value) })}
                min={1}
                className={inputClass}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-slate-500">min</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Points</label>
            <input
              type="number"
              value={metadata.points}
              onChange={(e) => updateMetadata({ points: Number(e.target.value) })}
              min={0}
              className={inputClass}
            />
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
