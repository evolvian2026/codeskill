"use client";

import { useQuestionStore } from "../_store/useQuestionStore";
import SectionCard from "./SectionCard";
import { Rocket, Calendar, Star, Trophy, Dumbbell, Archive } from "lucide-react";

export default function PublishingSection() {
  const { publishing, updatePublishing } = useQuestionStore();

  return (
    <SectionCard
      id="publishing"
      title="Publishing"
      subtitle="Configure when and how this question is published."
      icon={Rocket}
      delay={0.75}
    >
      <div className="space-y-5">
        {/* Publish mode radio group */}
        <div className="space-y-3">
          <label className="text-[13px] font-medium text-gray-700 dark:text-slate-300">Publish Mode</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                key: "publishImmediately",
                label: "Publish Immediately",
                desc: "Go live right now",
                icon: Rocket,
              },
              {
                key: "saveAsDraft",
                label: "Save as Draft",
                desc: "Save for later review",
                icon: Archive,
              },
              {
                key: "schedule",
                label: "Schedule Publish",
                desc: "Set a future date",
                icon: Calendar,
              },
            ].map((option) => {
              const isActive =
                option.key === "publishImmediately"
                  ? publishing.publishImmediately
                  : option.key === "saveAsDraft"
                  ? publishing.saveAsDraft && !publishing.publishImmediately
                  : !publishing.publishImmediately && !publishing.saveAsDraft;

              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => {
                    const { updateMetadata } = useQuestionStore.getState();
                    if (option.key === "publishImmediately") {
                      updatePublishing({ publishImmediately: true, saveAsDraft: false });
                      updateMetadata({ visibility: "Published" });
                    } else if (option.key === "saveAsDraft") {
                      updatePublishing({ publishImmediately: false, saveAsDraft: true });
                      updateMetadata({ visibility: "Draft" });
                    } else {
                      updatePublishing({ publishImmediately: false, saveAsDraft: false });
                    }
                  }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all ${
                    isActive
                      ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/20"
                      : "bg-gray-50 border-gray-200 dark:bg-slate-800 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600"
                  }`}
                >
                  <option.icon
                    className={`w-5 h-5 ${
                      isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-slate-500"
                    }`}
                  />
                  <div>
                    <p className={`text-sm font-medium ${isActive ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-slate-400"}`}>
                      {option.label}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">{option.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Schedule date */}
        {!publishing.publishImmediately && !publishing.saveAsDraft && (
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-gray-700 dark:text-slate-300">Scheduled Date & Time</label>
            <input
              type="datetime-local"
              value={publishing.scheduledDate}
              onChange={(e) => updatePublishing({ scheduledDate: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        )}

        {/* Toggle options */}
        <div className="pt-4 border-t border-gray-100 dark:border-white/[0.04]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: "isArchived" as const, label: "Archive", icon: Archive, desc: "Archive this question" },
              { key: "isFeatured" as const, label: "Featured", icon: Star, desc: "Mark as featured" },
              { key: "contestOnly" as const, label: "Contest Only", icon: Trophy, desc: "Only in contests" },
              { key: "practiceOnly" as const, label: "Practice Only", icon: Dumbbell, desc: "Only in practice" },
            ].map((toggle) => (
              <label
                key={toggle.key}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border cursor-pointer text-center transition-all ${
                  publishing[toggle.key]
                    ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/20"
                    : "bg-gray-50 border-gray-200 dark:bg-slate-800 dark:border-slate-700"
                }`}
              >
                <input
                  type="checkbox"
                  checked={publishing[toggle.key]}
                  onChange={() => updatePublishing({ [toggle.key]: !publishing[toggle.key] })}
                  className="sr-only"
                />
                <toggle.icon
                  className={`w-5 h-5 ${
                    publishing[toggle.key] ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-slate-500"
                  }`}
                />
                <div>
                  <p className={`text-xs font-medium ${publishing[toggle.key] ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-slate-400"}`}>
                    {toggle.label}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
