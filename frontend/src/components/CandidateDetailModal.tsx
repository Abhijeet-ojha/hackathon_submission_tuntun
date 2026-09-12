import React, { useState } from "react";
import {
  X,
  Award,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Layers,
  Terminal,
  Network,
  GitCompare,
  Calculator,
  ShieldCheck
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { CandidateScoreOutput, JDIntelligence, ScoringWeights } from "../types";
import { DecisionAudit } from "./DecisionAudit";

interface CandidateDetailModalProps {
  candidate: CandidateScoreOutput | null;
  jd: JDIntelligence | null;
  weights?: ScoringWeights;
  onClose: () => void;
  onCompareWithAnother?: (candidate: CandidateScoreOutput) => void;
}

export const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({
  candidate,
  jd,
  weights,
  onClose,
  onCompareWithAnother,
}) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "audit" | "graph" | "skills" | "underthehood"
  >("audit");

  if (!candidate) return null;

  const defaultWeights: ScoringWeights = weights || {
    semantic: 0.25,
    keyword: 0.25,
    required_coverage: 0.20,
    preferred_coverage: 0.10,
    evidence_strength: 0.10,
    experience_relevance: 0.05,
    education_fit: 0.05,
  };

  const radarData = [
    { subject: "Semantic NLP", score: candidate.components.semantic, fullMark: 100 },
    { subject: "Keyword", score: candidate.components.keyword, fullMark: 100 },
    { subject: "Must-Have", score: candidate.components.required_coverage, fullMark: 100 },
    { subject: "Pref Cov", score: candidate.components.preferred_coverage, fullMark: 100 },
    { subject: "Evidence Tier", score: candidate.components.evidence_strength, fullMark: 100 },
    { subject: "Project Fit", score: candidate.components.experience_relevance, fullMark: 100 },
    { subject: "Education", score: candidate.components.education_fit, fullMark: 100 },
  ];

  const getTierBadge = (tier: number) => {
    switch (tier) {
      case 3:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#fff9c4] text-[#856404] border border-[#2d2d2d] shadow-[1px_1px_0px_#2d2d2d] inline-flex items-center gap-1">
            ★ Tier 3 (Metrics & Proof)
          </span>
        );
      case 2:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#d6e3ff] text-primary border border-[#2d2d2d] shadow-[1px_1px_0px_#2d2d2d] inline-flex items-center gap-1">
            ● Tier 2 (Action Verbs)
          </span>
        );
      case 1:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#f0eded] text-[#424750] border border-[#2d2d2d] shadow-[1px_1px_0px_#2d2d2d] inline-flex items-center gap-1">
            ○ Tier 1 (Keyword Mention)
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-700 border border-[#2d2d2d] inline-flex items-center gap-1">
            ✕ Tier 0 (Absent)
          </span>
        );
    }
  };

  const confidence =
    candidate.components.evidence_strength >= 70
      ? { label: "HIGH CONFIDENCE", color: "bg-green-100 text-green-800 border-green-700" }
      : candidate.components.evidence_strength >= 40
      ? { label: "MEDIUM CONFIDENCE", color: "bg-yellow-100 text-yellow-800 border-yellow-700" }
      : { label: "LOW CONFIDENCE", color: "bg-red-100 text-red-800 border-red-700" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs">
      <div className="bg-[#fcf9f8] border-2 border-[#2d2d2d] shadow-[8px_8px_0px_#2d2d2d] rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 border-b-2 border-[#2d2d2d] flex items-center justify-between bg-[#fdfbf7]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-primary text-white border-2 border-[#2d2d2d] flex items-center justify-center font-['Epilogue'] font-extrabold text-base shadow-[2px_2px_0px_#2d2d2d] -rotate-2">
              #{candidate.rank}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-['Epilogue'] font-bold text-[#1b1c1c]">
                  {candidate.candidate_name}
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 bg-[#f0eded] text-[#424750] rounded border border-[#2d2d2d]">
                  {candidate.candidate_id}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${confidence.color}`}>
                  {confidence.label}
                </span>
              </div>
              <p className="text-xs text-[#737782] font-['Karla'] mt-0.5">
                Target Role:{" "}
                <strong className="text-primary font-bold">
                  {jd?.role_title || "Junior Full Stack Developer Intern"}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-3xl font-extrabold font-['Epilogue'] text-primary">
                {candidate.final_score.toFixed(1)}
                <span className="text-xs font-['Kalam'] font-bold text-[#424750]">
                  /100
                </span>
              </div>
            </div>
            {onCompareWithAnother && (
              <button
                type="button"
                onClick={() => onCompareWithAnother(candidate)}
                className="paper-btn hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f6f3f2] hover:bg-[#eae7e7] text-[#2d2d2d] font-['Karla'] font-bold text-xs border-2 border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] rounded cursor-pointer"
                title="Select for comparison"
              >
                <GitCompare className="w-3.5 h-3.5 text-primary" />
                <span>Compare</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="paper-btn p-1.5 rounded-lg border-2 border-[#2d2d2d] bg-white text-[#2d2d2d] hover:bg-secondary hover:text-white shadow-[2px_2px_0px_#2d2d2d] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Tabs Bar */}
        <div className="px-6 border-b-2 border-[#2d2d2d] bg-[#f0eded] flex gap-2 pt-2 overflow-x-auto">
          {[
            { id: "audit", label: "Decision Audit (Math)", icon: Calculator },
            { id: "overview", label: "Audit Dossier", icon: Award },
            { id: "graph", label: "Evidence Graph", icon: Network },
            { id: "skills", label: "Skill Gap Map", icon: Layers },
            { id: "underthehood", label: "Under The Hood (NLP)", icon: Terminal },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-2 border-[#2d2d2d] transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#fcf9f8] text-primary shadow-[2px_2px_0px_#2d2d2d] rounded-t-lg -mb-[2px] border-b-[#fcf9f8]"
                    : "bg-white text-[#424750] hover:text-[#1b1c1c] rounded-t-md opacity-80 hover:opacity-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-[#fcf9f8]">
          {/* TAB 0: DECISION AUDIT */}
          {activeTab === "audit" && (
            <DecisionAudit
              candidate={candidate}
              weights={defaultWeights}
              jd={jd}
            />
          )}

          {/* TAB 1: OVERVIEW & WHY THIS CANDIDATE */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Radar Chart in Paper Aesthetic */}
                <div className="md:col-span-5 bg-white border-2 border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d] p-4 rounded-xl flex flex-col items-center">
                  <span className="font-['Kalam'] text-xs font-bold uppercase tracking-wider text-primary mb-1">
                    Multi-Factor Evaluation Radar
                  </span>
                  <div className="w-full h-52">
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
                          name={candidate.candidate_name}
                          dataKey="score"
                          stroke="#074588"
                          strokeWidth={2}
                          fill="#2d5da1"
                          fillOpacity={0.35}
                        />
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

                {/* Score Components breakdown list */}
                <div className="md:col-span-7 space-y-2">
                  <h4 className="font-['Kalam'] text-sm font-bold text-[#1b1c1c] uppercase tracking-wider">
                    Score Components Breakdown
                  </h4>
                  <div className="space-y-2 bg-white border-2 border-[#2d2d2d] shadow-[3px_3px_0px_#2d2d2d] p-3.5 rounded-lg">
                    {[
                      { label: "Semantic Relevance (MiniLM)", val: candidate.components.semantic, weight: "25%" },
                      { label: "Explicit Keyword Match", val: candidate.components.keyword, weight: "25%" },
                      { label: "Must-Have Skill Coverage", val: candidate.components.required_coverage, weight: "20%" },
                      { label: "Preferred Skill Coverage", val: candidate.components.preferred_coverage, weight: "10%" },
                      { label: "Evidence Tier Strength", val: candidate.components.evidence_strength, weight: "10%" },
                      { label: "Project & Domain Fit", val: candidate.components.experience_relevance, weight: "5%" },
                      { label: "Education / Degree Fit", val: candidate.components.education_fit, weight: "5%" },
                    ].map((comp, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs font-['Karla']">
                        <span className="text-[#424750] truncate max-w-[200px]">
                          {comp.label}{" "}
                          <span className="text-[#737782] font-semibold">
                            ({comp.weight})
                          </span>
                        </span>
                        <div className="flex items-center gap-2 flex-1 max-w-[160px] ml-4">
                          <div className="flex-1 bg-[#f0eded] border border-[#2d2d2d] rounded-sm h-2 overflow-hidden">
                            <div
                              className="bg-primary h-full"
                              style={{ width: `${comp.val}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-[#1b1c1c] w-9 text-right">
                            {comp.val.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Highlights & Gaps Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Highlights */}
                <div className="bg-[#fdfbf7] border-2 border-[#2d2d2d] shadow-[3px_3px_0px_#2d2d2d] p-4 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <h4 className="font-['Kalam'] text-sm font-bold uppercase tracking-wider text-[#1b1c1c]">
                      Core Strengths & Highlights
                    </h4>
                  </div>
                  <ul className="space-y-1.5">
                    {candidate.top_why.matched_highlights.map((h, i) => (
                      <li key={i} className="text-xs text-[#1b1c1c] flex items-start gap-2 font-['Karla']">
                        <span className="text-primary font-bold">•</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Gaps / Risks */}
                <div className="bg-[#ffdad6]/20 border-2 border-[#2d2d2d] shadow-[3px_3px_0px_#2d2d2d] p-4 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-secondary">
                    <AlertTriangle className="w-4 h-4 text-secondary" />
                    <h4 className="font-['Kalam'] text-sm font-bold uppercase tracking-wider text-secondary">
                      Gaps & Growth Areas
                    </h4>
                  </div>
                  <ul className="space-y-1.5">
                    {candidate.top_why.missing_gaps.map((g, i) => (
                      <li key={i} className="text-xs text-[#1b1c1c] flex items-start gap-2 font-['Karla']">
                        <span className="text-secondary font-bold">•</span>
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-2 border-t border-dashed border-[#2d2d2d]/30">
                    <span className="text-[11px] text-[#737782] block font-bold font-['Kalam']">
                      Risk Assessment:
                    </span>
                    <span className="text-xs text-[#1b1c1c] font-['Karla']">
                      {candidate.top_why.potential_risk}
                    </span>
                  </div>
                </div>
              </div>

              {/* Strongest Verified Evidence Quote Card */}
              <div className="p-4 rounded-xl bg-[#fff9c4] border-2 border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d] space-y-2 relative">
                <div className="flex items-center justify-between">
                  <span className="font-['Kalam'] text-sm font-bold text-[#1b1c1c] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-secondary" />
                    Strongest Verified Evidence Quote
                  </span>
                  <span className="text-[10px] font-['Karla'] font-bold text-primary bg-white px-2 py-0.5 rounded border border-[#2d2d2d]">
                    Indexed Source
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#1b1c1c] italic font-['Kalam'] bg-white p-3 rounded-lg border-2 border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d]">
                  "{candidate.top_why.strongest_evidence}"
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: EVIDENCE GRAPH */}
          {activeTab === "graph" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#424750] font-['Karla']">
                <p>
                  Every score is traceable to an inspectable evidence node (JD Requirement → Matched Source → ML Classified Tier).
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-['Kalam'] font-bold text-primary text-sm">
                    {candidate.evidence_graph.length} Evidence Nodes
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30">
                    Model: evidence-v1 (Offline)
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {candidate.evidence_graph.map((node, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-white border-2 border-[#2d2d2d] shadow-[3px_3px_0px_#2d2d2d] space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-xs text-[#1b1c1c] font-['Epilogue']">
                          {node.requirement}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded border-2 border-[#2d2d2d] font-['Karla'] font-bold shadow-[1px_1px_0px_#2d2d2d] ${
                            node.match_type === "direct"
                              ? "bg-[#eaf8ee] text-[#1b8a3b]"
                              : node.match_type === "transferable"
                              ? "bg-[#d6e3ff] text-primary"
                              : "bg-[#f0eded] text-[#737782]"
                          }`}
                        >
                          {node.match_type.toUpperCase()}
                        </span>
                        {node.ml_confidence !== undefined && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#fff3cd] text-[#856404] border border-[#856404]/40 font-mono">
                            {Math.round(node.ml_confidence * 100)}% ML Conf
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getTierBadge(node.evidence_strength)}
                      </div>
                    </div>

                    {/* Tier Progression Visualizer */}
                    <div className="bg-[#fcf9f8] p-2 rounded-lg border border-[#2d2d2d]/30 flex items-center justify-between gap-1 text-[11px] font-['Karla']">
                      <div className={`flex items-center gap-1 font-bold ${node.evidence_strength >= 1 ? "text-primary" : "text-[#737782]"}`}>
                        <span>{node.evidence_strength >= 1 ? "✓" : "○"}</span>
                        <span>1. Mentioned</span>
                      </div>
                      <span className="text-[#2d2d2d]/30">➔</span>
                      <div className={`flex items-center gap-1 font-bold ${node.evidence_strength >= 2 ? "text-[#1b8a3b]" : "text-[#737782]"}`}>
                        <span>{node.evidence_strength >= 2 ? "✓" : "○"}</span>
                        <span>2. Demonstrated</span>
                      </div>
                      <span className="text-[#2d2d2d]/30">➔</span>
                      <div className={`flex items-center gap-1 font-bold ${node.evidence_strength >= 3 ? "text-secondary" : "text-[#737782]"}`}>
                        <span>{node.evidence_strength >= 3 ? "★" : "○"}</span>
                        <span>3. Measurable Impact</span>
                      </div>
                    </div>

                    <div className="text-xs text-[#424750] grid grid-cols-1 sm:grid-cols-2 gap-2 font-['Karla']">
                      <div>
                        <span className="text-[#737782] block text-[10px] font-bold">
                          MATCHED VIA:
                        </span>
                        <span className="text-[#1b1c1c] font-bold">
                          {node.matched_via.length > 0
                            ? node.matched_via.join(", ")
                            : "Direct Keyword"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#737782] block text-[10px] font-bold">
                          SOURCE SECTION:
                        </span>
                        <span className="text-[#1b1c1c] font-medium truncate block">
                          {node.evidence_source}
                        </span>
                      </div>
                    </div>

                    {node.quote && (
                      <div className="text-xs text-[#1b1c1c] bg-[#fff9c4]/50 p-2.5 rounded-lg border border-[#2d2d2d] font-['Kalam'] italic space-y-1">
                        <div>"{node.quote}"</div>
                        {node.ml_reason && (
                          <div className="not-italic text-[10px] font-sans font-bold text-primary pt-1 border-t border-dashed border-[#2d2d2d]/30">
                            ML Model Reason: {node.ml_reason}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SKILL GAP MAP */}
          {activeTab === "skills" && (
            <div className="space-y-4">
              <h4 className="font-['Kalam'] text-sm font-bold text-[#1b1c1c] uppercase tracking-wider">
                Full JD Requirements Coverage Matrix
              </h4>

              <div className="border-2 border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d] rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left text-xs font-['Karla'] text-[#1b1c1c]">
                  <thead className="bg-[#f0eded] border-b-2 border-[#2d2d2d] font-['Kalam'] font-bold text-xs text-[#1b1c1c]">
                    <tr>
                      <th className="p-3">Requirement</th>
                      <th className="p-3">Priority</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Evidence Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-[#2d2d2d]/20">
                    {jd?.must_have_skills.map((skill, i) => {
                      const isMatched = candidate.matched_requirements.includes(skill);
                      const isPartial = candidate.partial_requirements.includes(skill);
                      const node = candidate.evidence_graph.find((n) => n.requirement === skill);
                      return (
                        <tr key={i} className="hover:bg-[#fdfbf7]">
                          <td className="p-3 font-bold text-[#1b1c1c]">{skill}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-[#d6e3ff] text-primary border border-[#2d2d2d] rounded shadow-[1px_1px_0px_#2d2d2d]">
                              MUST-HAVE
                            </span>
                          </td>
                          <td className="p-3">
                            {isMatched ? (
                              <span className="text-[#1b8a3b] font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> MATCHED
                              </span>
                            ) : isPartial ? (
                              <span className="text-primary font-bold flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5" /> TRANSFERABLE
                              </span>
                            ) : (
                              <span className="text-secondary font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" /> MISSING
                              </span>
                            )}
                          </td>
                          <td className="p-3">{getTierBadge(node?.evidence_strength || 0)}</td>
                        </tr>
                      );
                    })}

                    {(jd?.should_have_skills || []).map((skill, i) => {
                      const isMatched = candidate.matched_requirements.includes(skill);
                      const isPartial = candidate.partial_requirements.includes(skill);
                      const node = candidate.evidence_graph.find((n) => n.requirement === skill);
                      return (
                        <tr key={`nice-${i}`} className="hover:bg-[#fdfbf7]">
                          <td className="p-3 text-[#424750]">{skill}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 text-[10px] bg-[#f0eded] text-[#424750] border border-[#2d2d2d]/30 rounded">
                              NICE-TO-HAVE
                            </span>
                          </td>
                          <td className="p-3">
                            {isMatched ? (
                              <span className="text-[#1b8a3b] font-bold">✓ MATCHED</span>
                            ) : isPartial ? (
                              <span className="text-primary font-bold">≈ PARTIAL</span>
                            ) : (
                              <span className="text-[#737782]">✕ MISSING</span>
                            )}
                          </td>
                          <td className="p-3">{getTierBadge(node?.evidence_strength || 0)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: UNDER THE HOOD (RAW NLP METRICS) */}
          {activeTab === "underthehood" && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-white border-2 border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] text-xs font-mono text-[#424750]">
                // Raw deterministic scoring parameters for judge inspection
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border-2 border-[#2d2d2d] shadow-[3px_3px_0px_#2d2d2d] p-4 rounded-xl">
                  <span className="text-[11px] text-[#737782] block mb-1 font-bold font-['Kalam']">
                    BM25 Okapi Score
                  </span>
                  <span className="text-2xl font-bold font-mono text-primary">
                    {candidate.under_the_hood.bm25_score.toFixed(2)}
                  </span>
                </div>
                <div className="bg-white border-2 border-[#2d2d2d] shadow-[3px_3px_0px_#2d2d2d] p-4 rounded-xl">
                  <span className="text-[11px] text-[#737782] block mb-1 font-bold font-['Kalam']">
                    Raw MiniLM Cosine Sim
                  </span>
                  <span className="text-2xl font-bold font-mono text-primary">
                    {candidate.under_the_hood.raw_cosine_similarity.toFixed(4)}
                  </span>
                </div>
                <div className="bg-white border-2 border-[#2d2d2d] shadow-[3px_3px_0px_#2d2d2d] p-4 rounded-xl">
                  <span className="text-[11px] text-[#737782] block mb-1 font-bold font-['Kalam']">
                    Fuzzy Token Ratio Score
                  </span>
                  <span className="text-2xl font-bold font-mono text-[#1b8a3b]">
                    {candidate.under_the_hood.fuzzy_token_score.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Transferable breakdown */}
              {candidate.under_the_hood.transferable_matches.length > 0 && (
                <div className="p-4 rounded-xl bg-white border-2 border-[#2d2d2d] shadow-[3px_3px_0px_#2d2d2d] space-y-2">
                  <span className="text-xs font-bold text-[#1b1c1c] block font-['Kalam']">
                    Transferable Ontology Linkages:
                  </span>
                  <div className="space-y-1.5 font-['Karla']">
                    {candidate.under_the_hood.transferable_matches.map((m, i) => (
                      <div key={i} className="text-xs text-[#1b1c1c] flex items-center justify-between">
                        <span>
                          {m.requirement} ← supported by{" "}
                          <span className="text-primary font-bold">
                            {m.supported_by.join(", ")}
                          </span>
                        </span>
                        <span className="font-mono text-[#737782]">
                          +{m.credit * 100}% credit
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw Evidence Levels mapping */}
              <div className="p-4 rounded-xl bg-white border-2 border-[#2d2d2d] shadow-[3px_3px_0px_#2d2d2d] space-y-2">
                <span className="text-xs font-bold text-[#1b1c1c] block font-['Kalam']">
                  Per-Requirement Raw Evidence Tiers:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(candidate.under_the_hood.raw_evidence_levels).map(
                    ([req, lvl], i) => (
                      <div
                        key={i}
                        className="px-2.5 py-1.5 bg-[#fcf9f8] rounded border border-[#2d2d2d] flex items-center justify-between text-[11px]"
                      >
                        <span className="text-[#1b1c1c] truncate max-w-[110px] font-medium font-['Karla']">
                          {req}
                        </span>
                        <span
                          className={`font-bold font-mono ${
                            lvl === 3
                              ? "text-[#1b8a3b]"
                              : lvl === 2
                              ? "text-primary"
                              : lvl === 1
                              ? "text-tertiary"
                              : "text-[#737782]"
                          }`}
                        >
                          L{lvl}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
