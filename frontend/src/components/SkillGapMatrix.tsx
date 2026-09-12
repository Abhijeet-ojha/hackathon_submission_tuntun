import React from "react";
import type { CandidateScoreOutput, JDIntelligence } from "../types";

interface SkillGapMatrixProps {
  candidates: CandidateScoreOutput[];
  jd: JDIntelligence | null;
  onSelectCandidate: (candidate: CandidateScoreOutput) => void;
}

export const SkillGapMatrix: React.FC<SkillGapMatrixProps> = ({
  candidates,
  jd,
  onSelectCandidate,
}) => {
  if (!jd || candidates.length === 0) {
    return (
      <div className="bg-white border-2 border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d] p-8 rounded-xl text-center text-[#737782] text-xs font-['Karla']">
        No candidate data available to render the Skill Gap Matrix.
      </div>
    );
  }

  const allReqs = Array.from(
    new Set([...jd.must_have_skills, ...jd.should_have_skills, ...jd.nice_to_have_skills])
  );

  return (
    <div className="bg-white border-2 border-[#2d2d2d] shadow-[6px_6px_0px_#2d2d2d] p-6 rounded-xl space-y-4 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b-2 border-dashed border-[#2d2d2d]/30">
        <div>
          <h3 className="font-['Kalam'] text-xl font-bold text-[#1b1c1c]">
            Batch Skill Gap & Evidence Heatmap
          </h3>
          <p className="text-xs text-[#737782] font-['Karla']">
            Holistic view of all {candidates.length} candidates across {allReqs.length} JD requirements.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-['Karla'] font-bold">
          <span className="flex items-center gap-1 text-[#1b8a3b]">
            <span className="w-3 h-3 rounded bg-[#eaf8ee] border border-[#2d2d2d] text-center leading-none text-[10px]">
              ★
            </span>{" "}
            Direct (Tier 3/2)
          </span>
          <span className="flex items-center gap-1 text-primary">
            <span className="w-3 h-3 rounded bg-[#d6e3ff] border border-[#2d2d2d] text-center leading-none text-[10px]">
              ≈
            </span>{" "}
            Transferable
          </span>
          <span className="flex items-center gap-1 text-[#737782]">
            <span className="w-3 h-3 rounded bg-[#f0eded] border border-[#2d2d2d] text-center leading-none text-[10px]">
              —
            </span>{" "}
            Missing
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b-2 border-[#2d2d2d] bg-[#f0eded] text-[#1b1c1c] font-['Kalam'] font-bold">
              <th className="p-3 sticky left-0 bg-[#f0eded] z-10 min-w-[150px]">
                CANDIDATE
              </th>
              <th className="p-3 text-center">SCORE</th>
              {allReqs.map((req, i) => {
                const isMust = jd.must_have_skills.includes(req);
                return (
                  <th
                    key={i}
                    className="p-3 text-center min-w-[100px] max-w-[140px] truncate"
                    title={req}
                  >
                    <span className="block truncate">{req}</span>
                    {isMust && (
                      <span className="text-[9px] text-secondary font-bold uppercase block">
                        Must-Have
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-[#2d2d2d]/20">
            {candidates.map((cand) => {
              return (
                <tr
                  key={cand.candidate_id}
                  onClick={() => onSelectCandidate(cand)}
                  className="hover:bg-[#fdfbf7] cursor-pointer transition-colors"
                >
                  <td className="p-3 font-bold text-[#1b1c1c] sticky left-0 bg-white z-10 truncate max-w-[170px] border-r border-[#2d2d2d]/20">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#737782] text-[11px] font-mono">
                        #{cand.rank}
                      </span>
                      <span className="truncate hover:text-primary transition-colors">
                        {cand.candidate_name}
                      </span>
                    </div>
                  </td>

                  <td className="p-3 text-center font-mono font-extrabold text-primary text-sm">
                    {cand.final_score.toFixed(0)}
                  </td>

                  {allReqs.map((req, i) => {
                    const isDirect = cand.matched_requirements.includes(req);
                    const isPartial = cand.partial_requirements.includes(req);
                    const node = cand.evidence_graph.find((n) => n.requirement === req);
                    const tier = node?.evidence_strength || 0;

                    return (
                      <td key={i} className="p-2 text-center">
                        {isDirect ? (
                          <div
                            className={`inline-flex items-center justify-center w-7 h-7 rounded border border-[#2d2d2d] text-xs font-bold shadow-[1px_1px_0px_#2d2d2d] ${
                              tier === 3
                                ? "bg-[#eaf8ee] text-[#1b8a3b]"
                                : "bg-[#eaf8ee] text-[#1b8a3b]"
                            }`}
                            title={`Matched (Tier ${tier})`}
                          >
                            {tier === 3 ? "★" : "✓"}
                          </div>
                        ) : isPartial ? (
                          <div
                            className="inline-flex items-center justify-center w-7 h-7 rounded bg-[#d6e3ff] border border-[#2d2d2d] text-primary text-xs font-bold shadow-[1px_1px_0px_#2d2d2d]"
                            title="Transferable Support"
                          >
                            ≈
                          </div>
                        ) : (
                          <div
                            className="inline-flex items-center justify-center w-7 h-7 rounded bg-[#f0eded] border border-[#2d2d2d]/30 text-[#737782] text-xs"
                            title="Missing"
                          >
                            —
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
