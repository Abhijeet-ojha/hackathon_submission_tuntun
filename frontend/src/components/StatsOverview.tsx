import React from "react";
import type { CandidateScoreOutput } from "../types";

interface StatsOverviewProps {
  candidates: CandidateScoreOutput[];
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  candidates,
  selectedFilter,
  onSelectFilter,
  searchQuery = "",
  onSearchChange = () => {},
}) => {
  const total = candidates.length;
  const topCandidate = candidates[0];
  
  const strongFits = candidates.filter((c) => c.final_score >= 80).length;
  const goodPotentials = candidates.filter(
    (c) => c.final_score >= 65 && c.final_score < 80
  ).length;
  const partialMatches = candidates.filter(
    (c) => c.final_score >= 50 && c.final_score < 65
  ).length;
  const limitedOverlaps = candidates.filter((c) => c.final_score < 50).length;

  const filters = [
    { id: "all", label: `All (${total})` },
    { id: "strong", label: `Strong fit (${strongFits})` },
    { id: "good", label: `Good potential (${goodPotentials})` },
    { id: "partial", label: `Partial match (${partialMatches})` },
    { id: "limited", label: `Limited overlap (${limitedOverlaps})` },
  ];

  return (
    <div className="w-full flex flex-col gap-6 mb-8">
      {/* Top Metric Cut-Out Cards Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Volume Filter (Taped top) */}
        <div className="relative bg-[#ffffff] border-2 border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d] p-4 rounded-lg -rotate-1 hover:rotate-0 transition-transform">
          {/* Washi tape top */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-5 bg-[#e5e0d8]/90 border border-[#2d2d2d]/30 rotate-1 shadow-sm flex items-center justify-center pointer-events-none">
            <span className="w-full border-t border-dashed border-[#2d2d2d]/30"></span>
          </div>
          <div className="flex items-start justify-between mt-1">
            <div>
              <span className="font-['Kalam'] text-xs uppercase tracking-widest text-[#737782] font-bold">
                Volume Filter
              </span>
              <div className="font-['Epilogue'] text-4xl font-extrabold text-[#1b1c1c] mt-1">
                {total}
              </div>
              <p className="font-['Karla'] text-sm text-[#424750] mt-0.5 font-medium">
                Resumes reviewed
              </p>
            </div>
            <div className="w-11 h-11 rounded-lg bg-[#f0eded] border-2 border-[#2d2d2d] flex items-center justify-center rotate-3 shadow-[2px_2px_0px_#2d2d2d]">
              <span className="material-symbols-outlined text-primary text-2xl">
                description
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t-2 border-dashed border-[#2d2d2d]/20 flex items-center gap-1.5 text-secondary font-['Karla'] font-bold text-xs">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span>100% parsed & verified across rubric</span>
          </div>
        </div>

        {/* Card 2: Top Score (Pinned with red thumbtack) */}
        <div className="relative bg-[#fff9c4] border-2 border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d] p-4 rounded-lg rotate-1 hover:rotate-0 transition-transform">
          {/* Red Thumbtack Marker */}
          <div className="absolute -top-3.5 right-6 w-6 h-6 flex items-center justify-center z-10 pointer-events-none">
            <div className="w-4 h-4 rounded-full bg-secondary border-2 border-[#2d2d2d] shadow-[1px_1px_0px_#2d2d2d]"></div>
            <div className="absolute -bottom-1 w-0.5 h-2 bg-[#2d2d2d]"></div>
          </div>
          <div className="flex items-start justify-between mt-1">
            <div className="min-w-0 pr-2">
              <span className="font-['Kalam'] text-xs uppercase tracking-widest text-[#424750] font-bold">
                Benchmark Peak
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-['Epilogue'] text-4xl font-extrabold text-[#1b1c1c]">
                  {topCandidate ? Math.round(topCandidate.final_score) : 0}
                </span>
                <span className="font-['Kalam'] text-secondary font-bold text-lg">
                  / 100
                </span>
              </div>
              <p className="font-['Karla'] text-sm text-[#1b1c1c] font-bold truncate">
                {topCandidate ? topCandidate.candidate_name : "No candidates"} • Top Fit
              </p>
            </div>
            <div className="w-11 h-11 rounded-lg bg-white border-2 border-[#2d2d2d] flex items-center justify-center -rotate-3 shadow-[2px_2px_0px_#2d2d2d] shrink-0">
              <span className="material-symbols-outlined text-secondary text-2xl">
                military_tech
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t-2 border-dashed border-[#2d2d2d]/30 flex items-center gap-1.5 text-[#424750] font-['Karla'] font-bold text-xs truncate">
            <span className="material-symbols-outlined text-[15px] text-primary shrink-0">
              verified
            </span>
            <span className="truncate">Full-stack React + Node proof present</span>
          </div>
        </div>

        {/* Card 3: Explainability Engine */}
        <div className="relative bg-[#ffffff] border-2 border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d] p-4 rounded-lg -rotate-[0.5deg] hover:rotate-0 transition-transform">
          {/* Tape corner */}
          <div className="absolute -top-2.5 -left-3 w-12 h-4 bg-[#e5e0d8] border border-[#2d2d2d]/30 -rotate-45 shadow-sm pointer-events-none"></div>
          <div className="flex items-start justify-between mt-1">
            <div>
              <span className="font-['Kalam'] text-xs uppercase tracking-widest text-[#737782] font-bold">
                Scoring Model
              </span>
              <div className="font-['Epilogue'] text-2xl font-bold text-[#1b1c1c] mt-1">
                Semantic + Rubric
              </div>
              <p className="font-['Karla'] text-sm text-[#424750] mt-0.5">
                Zero black-box AI — full proof cited
              </p>
            </div>
            <div className="w-11 h-11 rounded-lg bg-[#eae4b1] border-2 border-[#2d2d2d] flex items-center justify-center rotate-2 shadow-[2px_2px_0px_#2d2d2d] shrink-0">
              <span className="material-symbols-outlined text-[#43411b] text-2xl">
                fact_check
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t-2 border-dashed border-[#2d2d2d]/20 flex items-center gap-1.5 text-primary font-['Karla'] font-bold text-xs">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <span>Explainability active on all {total} files</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Palette */}
      <div className="bg-[#ffffff] border-2 border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d] p-4 rounded-lg flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Wobbly Search Input */}
        <div className="relative flex-1 max-w-xl">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#737782] text-xl pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search candidate name, project, or skill (e.g. React, MongoDB)..."
            className="w-full pl-10 pr-4 py-2 bg-[#fcf9f8] rounded-lg border-2 border-[#2d2d2d] text-[#1b1c1c] font-['Karla'] text-sm placeholder:text-[#737782] focus:outline-none focus:ring-2 focus:ring-[#fff9c4] focus:border-primary shadow-[2px_2px_0px_#2d2d2d] transition-all"
          />
        </div>

        {/* Filter Chips Group */}
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          {filters.map((f, idx) => {
            const isActive = selectedFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => onSelectFilter(f.id)}
                className={`paper-btn px-3 py-1 rounded-full border-2 border-[#2d2d2d] font-['Karla'] font-bold text-xs transition-all cursor-pointer ${
                  isActive
                    ? "bg-primary text-white shadow-[2px_2px_0px_#2d2d2d] -rotate-1"
                    : "bg-[#f6f3f2] text-[#1b1c1c] hover:bg-[#eae7e7] shadow-[2px_2px_0px_#2d2d2d]"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Sort Indicator */}
        <div className="flex items-center justify-between sm:justify-end gap-2 border-t lg:border-t-0 pt-2 lg:pt-0 border-dashed border-[#2d2d2d]/30">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-[#2d2d2d] bg-[#f6f3f2] shadow-[2px_2px_0px_#2d2d2d] font-['Karla'] font-bold text-xs text-[#1b1c1c] select-none">
            <span className="font-['Kalam'] text-secondary font-bold">Sort:</span>
            <span>Score (High → Low)</span>
            <span className="material-symbols-outlined text-[16px] text-primary">
              arrow_downward
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
