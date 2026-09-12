import React, { useState } from "react";
import type { CandidateScoreOutput } from "../types";

interface CandidateCardProps {
  candidate: CandidateScoreOutput;
  onSelect: (candidate: CandidateScoreOutput) => void;
  isSelectedForCompare: boolean;
  onToggleCompare: (candidate: CandidateScoreOutput) => void;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  onSelect,
  isSelectedForCompare,
  onToggleCompare,
}) => {
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(candidate.rank === 1);

  const getTierInfo = (score: number) => {
    if (score >= 80) return { label: "Strong fit", color: "bg-[#ffdad7] text-[#410004] border-[#2d2d2d]/40" };
    if (score >= 65) return { label: "Good potential", color: "bg-[#eae4b1] text-[#1e1c00] border-[#2d2d2d]/30" };
    if (score >= 50) return { label: "Partial match", color: "bg-[#f0eded] text-[#424750] border-[#2d2d2d]/30" };
    return { label: "Limited overlap", color: "bg-[#e4e2e1] text-[#737782] border-[#2d2d2d]/30" };
  };

  const getRankBadge = (rank: number) => {
    if (candidate.parsing_status !== "success") {
      return (
        <div className="w-9 h-9 rounded-full bg-[#ffdad6] border-2 border-[#2d2d2d] text-secondary font-['Epilogue'] font-extrabold flex items-center justify-center shadow-[2px_2px_0px_#2d2d2d] -rotate-3 text-base">
          !
        </div>
      );
    }
    if (rank === 1) {
      return (
        <div className="w-9 h-9 rounded-full bg-secondary border-2 border-[#2d2d2d] text-white font-['Epilogue'] font-extrabold flex items-center justify-center shadow-[2px_2px_0px_#2d2d2d] -rotate-3 text-base">
          #1
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-9 h-9 rounded-full bg-primary border-2 border-[#2d2d2d] text-white font-['Epilogue'] font-extrabold flex items-center justify-center shadow-[2px_2px_0px_#2d2d2d] rotate-2 text-base">
          #2
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-9 h-9 rounded-full bg-primary border-2 border-[#2d2d2d] text-white font-['Epilogue'] font-extrabold flex items-center justify-center shadow-[2px_2px_0px_#2d2d2d] -rotate-2 text-base">
          #3
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-[#f0eded] border-2 border-[#2d2d2d] text-[#1b1c1c] font-['Epilogue'] font-bold flex items-center justify-center shadow-[2px_2px_0px_#2d2d2d] text-sm">
        #{rank}
      </div>
    );
  };

  const tier = getTierInfo(candidate.final_score);
  const scoreInt = Math.round(candidate.final_score);

  return (
    <div
      className={`candidate-row transition-colors border-b-2 border-[#2d2d2d]/20 ${
        candidate.rank === 1 ? "bg-[#fffef5]" : "bg-[#ffffff] hover:bg-[#faf8f5]"
      }`}
    >
      <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Rank & Ribbon */}
        <div className="col-span-1 flex items-center md:justify-center gap-2">
          {getRankBadge(candidate.rank)}
          {candidate.rank === 1 && (
            <span className="md:hidden font-['Kalam'] text-xs font-bold text-secondary uppercase">
              Top Ranked Match
            </span>
          )}
        </div>

        {/* Candidate Info */}
        <div className="col-span-3 flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span
              onClick={() => onSelect(candidate)}
              className="font-['Epilogue'] text-base sm:text-lg text-[#1b1c1c] font-bold truncate cursor-pointer hover:text-primary transition-colors"
            >
              {candidate.candidate_name}
            </span>
            {candidate.rank === 1 && (
              <span className="material-symbols-outlined text-secondary text-base shrink-0" title="Top Pick Star">
                stars
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-['Karla'] font-bold text-[11px] border ${tier.color}`}>
              {tier.label}
            </span>
            <span className="text-[#737782] text-xs font-['Karla'] truncate">
              {candidate.components.education_fit >= 70 ? "Relevant CS / Eng Degree" : "Equivalent Experience"}
            </span>
          </div>
        </div>

        {/* Score Progress */}
        <div className="col-span-2 flex flex-col items-start md:items-center">
          <div className="flex items-baseline gap-1">
            <span className="font-['Epilogue'] text-2xl sm:text-3xl font-extrabold text-primary">
              {scoreInt}
            </span>
            <span className="font-['Kalam'] text-[#424750] font-bold text-xs">
              / 100
            </span>
          </div>
          {/* Sketched Progress Bar */}
          <div className="w-full max-w-[120px] h-3 bg-[#f0eded] border border-[#2d2d2d] rounded-sm p-0.5 mt-1 shadow-[1px_1px_0px_#2d2d2d]">
            <div
              className={`h-full rounded-sm transition-all ${
                candidate.final_score >= 80
                  ? "bg-primary"
                  : candidate.final_score >= 65
                  ? "bg-tertiary"
                  : "bg-[#737782]"
              }`}
              style={{ width: `${Math.min(100, Math.max(5, candidate.final_score))}%` }}
            ></div>
          </div>
        </div>

        {/* Key Matches Chips */}
        <div className="col-span-3 flex flex-wrap gap-1">
          {candidate.matched_requirements.slice(0, 4).map((skill, i) => (
            <span
              key={i}
              className="px-2 py-0.5 bg-[#e5e0d8] border border-[#2d2d2d] rounded text-[#1b1c1c] font-['Karla'] font-bold text-xs shadow-[1px_1px_0px_#2d2d2d]"
            >
              {skill}
            </span>
          ))}
          {candidate.partial_requirements.slice(0, 1).map((skill, i) => (
            <span
              key={i}
              className="px-2 py-0.5 bg-[#eae4b1] border border-[#2d2d2d] rounded text-[#1b1c1c] font-['Karla'] font-bold text-xs shadow-[1px_1px_0px_#2d2d2d]"
              title="Transferable ecosystem match"
            >
              ≈ {skill}
            </span>
          ))}
          {candidate.matched_requirements.length === 0 && candidate.partial_requirements.length === 0 && (
            <span className="text-xs text-[#737782] italic font-['Karla']">
              No direct criteria matched
            </span>
          )}
        </div>

        {/* Missing / Growth Area */}
        <div className="col-span-2">
          {candidate.missing_requirements.length > 0 ? (
            <span className="inline-flex items-center gap-1 text-secondary font-['Karla'] font-bold text-xs bg-[#ffdad6]/50 px-2 py-1 rounded border border-dashed border-secondary/50 truncate max-w-full">
              <span className="material-symbols-outlined text-[14px] shrink-0">
                remove_done
              </span>
              <span className="truncate">{candidate.missing_requirements[0]}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[#1b8a3b] font-['Karla'] font-bold text-xs bg-[#eaf8ee] px-2 py-1 rounded border border-[#1b8a3b]/40">
              <span className="material-symbols-outlined text-[14px]">done_all</span>
              <span>All JD criteria met</span>
            </span>
          )}
        </div>

        {/* Action Button & Compare Checkbox */}
        <div className="col-span-1 flex items-center md:justify-end gap-2">
          <label
            onClick={(e) => e.stopPropagation()}
            className="hidden sm:flex items-center gap-1 text-xs font-['Karla'] font-bold text-[#424750] cursor-pointer"
            title="Select for side-by-side comparison"
          >
            <input
              type="checkbox"
              checked={isSelectedForCompare}
              onChange={() => onToggleCompare(candidate)}
              className="rounded border-2 border-[#2d2d2d] text-primary focus:ring-[#fff9c4] cursor-pointer"
            />
          </label>

          <button
            type="button"
            onClick={() => setIsEvidenceOpen(!isEvidenceOpen)}
            className="paper-btn inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg border-2 border-[#2d2d2d] bg-primary text-white font-['Karla'] font-bold text-xs shadow-[2px_2px_0px_#2d2d2d] hover:bg-primary-container cursor-pointer"
          >
            <span>Proof</span>
            <span
              className={`material-symbols-outlined text-sm transition-transform duration-200 ${
                isEvidenceOpen ? "rotate-180" : ""
              }`}
            >
              expand_more
            </span>
          </button>
        </div>
      </div>

      {/* Expandable Evidence Drawer */}
      {isEvidenceOpen && (
        <div className="bg-[#fdfbf7] border-t-2 border-dashed border-[#2d2d2d] px-4 sm:px-6 py-5">
          <div className="relative max-w-5xl mx-auto bg-white border-2 border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d] p-4 sm:p-5 rounded-lg">
            {/* Sticky note header tape */}
            <div className="absolute -top-3 left-6 sm:left-10 w-36 h-5 bg-[#e5e0d8] border border-[#2d2d2d]/40 -rotate-1 flex items-center justify-center shadow-sm pointer-events-none">
              <span className="font-['Kalam'] text-[10px] text-[#1b1c1c] font-bold uppercase tracking-wider">
                Audit Trail Evidence
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              {/* Section 1: Exact Keyword Proof */}
              <div className="p-3.5 rounded border-2 border-[#2d2d2d] bg-[#fcf9f8] shadow-[2px_2px_0px_#2d2d2d]">
                <div className="flex items-center gap-1.5 text-primary mb-2">
                  <span className="material-symbols-outlined text-[18px]">push_pin</span>
                  <h4 className="font-['Kalam'] font-bold text-sm">
                    Exact Keyword Proof (Tier 3/2)
                  </h4>
                </div>
                <ul className="space-y-2 font-['Karla'] text-xs text-[#1b1c1c]">
                  {candidate.evidence_graph.slice(0, 3).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="font-bold text-primary shrink-0">
                        ✓ {item.requirement}:
                      </span>
                      <span className="truncate-2-lines">
                        {item.extracted_snippet || "Verified in projects section"}
                      </span>
                    </li>
                  ))}
                  {candidate.evidence_graph.length === 0 && (
                    <li className="text-[#737782] italic">No direct keyword quotes indexed</li>
                  )}
                </ul>
              </div>

              {/* Section 2: Semantic Context */}
              <div className="p-3.5 rounded border-2 border-[#2d2d2d] bg-[#fff9c4]/70 shadow-[2px_2px_0px_#2d2d2d] rotate-0.5">
                <div className="flex items-center gap-1.5 text-tertiary mb-2">
                  <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                  <h4 className="font-['Kalam'] font-bold text-sm">Semantic Context</h4>
                </div>
                <p className="font-['Karla'] text-xs text-[#1b1c1c] mb-2 font-medium">
                  {candidate.top_why.strongest_evidence}
                </p>
                {candidate.top_why.differentiator && (
                  <blockquote className="border-l-2 border-[#636037] pl-2 font-['Kalam'] text-xs text-[#424750] italic">
                    "{candidate.top_why.differentiator}"
                  </blockquote>
                )}
              </div>

              {/* Section 3: Missing / Growth Areas */}
              <div className="p-3.5 rounded border-2 border-[#2d2d2d] bg-[#ffdad6]/30 shadow-[2px_2px_0px_#2d2d2d] -rotate-0.5">
                <div className="flex items-center gap-1.5 text-secondary mb-2">
                  <span className="material-symbols-outlined text-[18px]">warning</span>
                  <h4 className="font-['Kalam'] font-bold text-sm">Growth & Gaps</h4>
                </div>
                <p className="font-['Karla'] text-xs text-[#1b1c1c]">
                  {candidate.missing_requirements.length > 0
                    ? `Missing: ${candidate.missing_requirements.join(", ")}.`
                    : "No missing requirements identified from the job description rubric."}
                </p>
                {candidate.partial_requirements.length > 0 && (
                  <div className="mt-2 text-[11px] font-['Karla'] font-bold text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">info</span>
                    <span>
                      Transferable: {candidate.partial_requirements.join(", ")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Recruiter Annotation Line */}
            <div className="mt-4 pt-3 border-t border-dashed border-[#2d2d2d]/30 flex flex-wrap items-center justify-between gap-2 text-xs font-['Karla']">
              <div className="flex items-center gap-2">
                <span className="font-['Kalam'] text-secondary font-bold">
                  Engine Evaluation:
                </span>
                <span className="text-[#424750]">
                  Required Coverage: {candidate.components.required_coverage.toFixed(0)}% • Semantic Match: {candidate.components.semantic.toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onSelect(candidate)}
                  className="paper-btn text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                  Open Full Audit Dossier (Radar & NLP)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
