import React, { useState, useEffect } from "react";
import {
  GitCompare,
  Sparkles,
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import type { CandidateScoreOutput, ComparisonDelta, JDIntelligence } from "../types";
import { compareCandidates } from "../services/api";

interface CandidateComparisonViewProps {
  candidates: CandidateScoreOutput[];
  initialCandA?: CandidateScoreOutput | null;
  initialCandB?: CandidateScoreOutput | null;
  jd: JDIntelligence | null;
}

export const CandidateComparisonView: React.FC<CandidateComparisonViewProps> = ({
  candidates,
  initialCandA,
  initialCandB,
  jd,
}) => {
  const [candAId, setCandAId] = useState<string>(
    initialCandA?.candidate_id || candidates[0]?.candidate_id || ""
  );
  const [candBId, setCandBId] = useState<string>(
    initialCandB?.candidate_id || candidates[1]?.candidate_id || ""
  );
  const [delta, setDelta] = useState<ComparisonDelta | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const candA = candidates.find((c) => c.candidate_id === candAId) || candidates[0];
  const candB = candidates.find((c) => c.candidate_id === candBId) || candidates[1];

  useEffect(() => {
    if (candA && candB) {
      setIsLoading(true);
      compareCandidates(candA, candB)
        .then((res) => {
          setDelta(res);
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    }
  }, [candAId, candBId, candidates]);

  if (candidates.length < 2) {
    return (
      <div className="bg-white border-2 border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d] p-8 rounded-xl text-center space-y-3">
        <GitCompare className="w-8 h-8 text-primary mx-auto" />
        <h3 className="font-['Kalam'] font-bold text-lg text-[#1b1c1c]">
          Need at least 2 Candidates
        </h3>
        <p className="text-xs text-[#737782] font-['Karla']">
          Upload resumes or load the demo batch to compare candidates side-by-side.
        </p>
      </div>
    );
  }

  const radarData = [
    {
      subject: "Semantic",
      [candA?.candidate_name || "A"]: candA?.components.semantic || 0,
      [candB?.candidate_name || "B"]: candB?.components.semantic || 0,
    },
    {
      subject: "Keyword",
      [candA?.candidate_name || "A"]: candA?.components.keyword || 0,
      [candB?.candidate_name || "B"]: candB?.components.keyword || 0,
    },
    {
      subject: "Must-Have",
      [candA?.candidate_name || "A"]: candA?.components.required_coverage || 0,
      [candB?.candidate_name || "B"]: candB?.components.required_coverage || 0,
    },
    {
      subject: "Pref Cov",
      [candA?.candidate_name || "A"]: candA?.components.preferred_coverage || 0,
      [candB?.candidate_name || "B"]: candB?.components.preferred_coverage || 0,
    },
    {
      subject: "Evidence",
      [candA?.candidate_name || "A"]: candA?.components.evidence_strength || 0,
      [candB?.candidate_name || "B"]: candB?.components.evidence_strength || 0,
    },
    {
      subject: "Project Fit",
      [candA?.candidate_name || "A"]: candA?.components.experience_relevance || 0,
      [candB?.candidate_name || "B"]: candB?.components.experience_relevance || 0,
    },
    {
      subject: "Education",
      [candA?.candidate_name || "A"]: candA?.components.education_fit || 0,
      [candB?.candidate_name || "B"]: candB?.components.education_fit || 0,
    },
  ];

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header Selector Row */}
      <div className="bg-white border-2 border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d] p-5 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Cand A Select */}
        <div className="flex-1 w-full">
          <label className="font-['Kalam'] text-xs font-bold text-primary block mb-1">
            Candidate A (Ballpoint Blue)
          </label>
          <select
            value={candAId}
            onChange={(e) => setCandAId(e.target.value)}
            className="w-full px-3 py-2 text-xs font-['Karla'] font-bold rounded-lg bg-[#fcf9f8] border-2 border-[#2d2d2d] text-[#1b1c1c] shadow-[2px_2px_0px_#2d2d2d] focus:outline-none focus:ring-2 focus:ring-[#fff9c4]"
          >
            {candidates.map((c) => (
              <option key={c.candidate_id} value={c.candidate_id}>
                #{c.rank} - {c.candidate_name} ({c.final_score.toFixed(1)} pts)
              </option>
            ))}
          </select>
        </div>

        <div className="w-10 h-10 rounded-full bg-[#f0eded] border-2 border-[#2d2d2d] flex items-center justify-center shadow-[2px_2px_0px_#2d2d2d] rotate-2">
          <GitCompare className="w-5 h-5 text-secondary" />
        </div>

        {/* Cand B Select */}
        <div className="flex-1 w-full">
          <label className="font-['Kalam'] text-xs font-bold text-secondary block mb-1">
            Candidate B (Marker Red)
          </label>
          <select
            value={candBId}
            onChange={(e) => setCandBId(e.target.value)}
            className="w-full px-3 py-2 text-xs font-['Karla'] font-bold rounded-lg bg-[#fcf9f8] border-2 border-[#2d2d2d] text-[#1b1c1c] shadow-[2px_2px_0px_#2d2d2d] focus:outline-none focus:ring-2 focus:ring-[#fff9c4]"
          >
            {candidates.map((c) => (
              <option key={c.candidate_id} value={c.candidate_id}>
                #{c.rank} - {c.candidate_name} ({c.final_score.toFixed(1)} pts)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Delta Summary */}
      {delta && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Dual Radar Chart */}
          <div className="lg:col-span-5 bg-white border-2 border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d] p-5 rounded-xl flex flex-col items-center">
            <span className="font-['Kalam'] text-xs font-bold uppercase tracking-wider text-[#1b1c1c] mb-2">
              Overlaid Competency Radar
            </span>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#737782" strokeDasharray="3 3" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: "#1b1c1c", fontSize: 10, fontWeight: "bold" }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fill: "#737782", fontSize: 9 }}
                  />
                  <Radar
                    name={candA?.candidate_name}
                    dataKey={candA?.candidate_name}
                    stroke="#074588"
                    strokeWidth={2}
                    fill="#2d5da1"
                    fillOpacity={0.3}
                  />
                  <Radar
                    name={candB?.candidate_name}
                    dataKey={candB?.candidate_name}
                    stroke="#b71422"
                    strokeWidth={2}
                    fill="#ff4d4d"
                    fillOpacity={0.3}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px", fontWeight: "bold" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderColor: "#2d2d2d",
                      borderWidth: "2px",
                      boxShadow: "2px 2px 0px #2d2d2d",
                      fontSize: "11px",
                      borderRadius: "6px",
                      color: "#1b1c1c",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right: Why A over B Structured Bullets */}
          <div className="lg:col-span-7 bg-white border-2 border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d] p-5 rounded-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-[#2d2d2d]/30">
              <h3 className="font-['Kalam'] text-lg font-bold text-[#1b1c1c] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-secondary" />
                "Why A Over B" Pairwise Explainability
              </h3>
              <span
                className={`font-['Kalam'] font-bold text-xs px-2.5 py-1 rounded-lg border-2 border-[#2d2d2d] shadow-[1px_1px_0px_#2d2d2d] ${
                  delta.score_delta >= 0
                    ? "bg-[#d6e3ff] text-primary"
                    : "bg-[#ffdad7] text-secondary"
                }`}
              >
                Δ {Math.abs(delta.score_delta).toFixed(1)} pts
              </span>
            </div>

            {/* Bullet reasons */}
            <div className="space-y-2">
              {delta.summary_bullets.map((b, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-[#fdfbf7] border-2 border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] text-xs font-['Karla'] text-[#1b1c1c] flex items-start gap-2.5"
                >
                  <span className="text-secondary font-bold font-['Kalam'] text-sm">
                    #{i + 1}
                  </span>
                  <span className="leading-relaxed font-medium">{b}</span>
                </div>
              ))}
            </div>

            {/* Exclusive Skills Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-[#d6e3ff]/30 border-2 border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] space-y-1.5">
                <span className="font-['Kalam'] text-xs font-bold text-primary block">
                  Uniquely in {candA.candidate_name}:
                </span>
                {delta.exclusive_to_a.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {delta.exclusive_to_a.map((s, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-[10px] font-['Karla'] font-bold bg-white border border-[#2d2d2d] text-primary rounded shadow-[1px_1px_0px_#2d2d2d]"
                      >
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-[#737782] italic font-['Karla']">
                    No unique requirements
                  </span>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-[#ffdad7]/30 border-2 border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] space-y-1.5">
                <span className="font-['Kalam'] text-xs font-bold text-secondary block">
                  Uniquely in {candB.candidate_name}:
                </span>
                {delta.exclusive_to_b.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {delta.exclusive_to_b.map((s, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-[10px] font-['Karla'] font-bold bg-white border border-[#2d2d2d] text-secondary rounded shadow-[1px_1px_0px_#2d2d2d]"
                      >
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-[#737782] italic font-['Karla']">
                    No unique requirements
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
