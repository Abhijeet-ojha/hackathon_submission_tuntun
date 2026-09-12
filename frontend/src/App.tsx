import React, { useState, useEffect } from "react";
import type {
  AnalysisResponse,
  CandidateScoreOutput,
  ScoringWeights,
} from "./types";
import {
  getSampleData,
  analyzeBatch,
  rescoreBatch,
  queryAnalysis,
  downloadShortlistCSV,
  downloadAuditDossierJSON,
} from "./services/api";

import { Navbar } from "./components/Navbar";
import { UploadZone } from "./components/UploadZone";
import { StatsOverview } from "./components/StatsOverview";
import { CandidateCard } from "./components/CandidateCard";
import { CandidateDetailModal } from "./components/CandidateDetailModal";
import { CandidateComparisonView } from "./components/CandidateComparisonView";
import { SkillGapMatrix } from "./components/SkillGapMatrix";
import { JDBiasInspector } from "./components/JDBiasInspector";
import { AblationView } from "./components/AblationView";
import { HowItWorksExplainer } from "./components/HowItWorksExplainer";
import { EvaluationLab } from "./components/EvaluationLab";
import { WeightsDrawer } from "./components/WeightsDrawer";
import {
  AlertCircle,
  FileCheck2,
  Download,
  Printer,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Award,
  Cpu,
  Sliders,
} from "lucide-react";

export function App() {
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateScoreOutput | null>(null);
  const [compareList, setCompareList] = useState<CandidateScoreOutput[]>([]);
  const [isWeightsOpen, setIsWeightsOpen] = useState<boolean>(false);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isQueryLoading, setIsQueryLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [assistantInput, setAssistantInput] = useState<string>("");
  const [assistantDialogue, setAssistantDialogue] = useState<{
    q: string;
    a: string;
    rule: string;
  } | null>({
    q: "Why is Rank 1 leading the candidate batch?",
    a: "The top candidate combines 100% Must-Have requirement coverage with verified Tier-3 production project metrics, outscoring candidates who only listed keywords.",
    rule: "Deterministic Multi-Signal Hybrid Ranking",
  });
  const [rankingMode, setRankingMode] = useState<"deterministic" | "learned" | "hybrid">("hybrid");
  const [alpha, setAlpha] = useState<number>(0.75);

  // Auto-load sample batch on mount
  useEffect(() => {
    loadSampleData();
  }, []);

  const loadSampleData = () => {
    setIsLoading(true);
    setErrorMessage(null);
    getSampleData()
      .then((data) => {
        setAnalysis(data);
        if (data.ranking_mode) setRankingMode(data.ranking_mode as any);
        if (data.alpha !== undefined) setAlpha(data.alpha);
        setIsLoading(false);
      })
      .catch(() => {
        setErrorMessage(
          "Could not connect to the local ranking engine backend. Ensure FastAPI server is running on http://127.0.0.1:8000."
        );
        setIsLoading(false);
      });
  };

  const handleAnalyze = async (jdText: string, jdFile: File | null, resumeFiles: File[]) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await analyzeBatch(jdText, jdFile, resumeFiles, analysis?.weights);
      setAnalysis(result);
      if (result.ranking_mode) setRankingMode(result.ranking_mode as any);
      if (result.alpha !== undefined) setAlpha(result.alpha);
      setActiveTab("dashboard");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to analyze candidate batch.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyWeights = async (
    newWeights: ScoringWeights,
    mode: "deterministic" | "learned" | "hybrid" = rankingMode,
    newAlpha: number = alpha
  ) => {
    if (!analysis) return;
    setIsLoading(true);
    try {
      const updated = await rescoreBatch(analysis.jd, newWeights, mode, newAlpha);
      setAnalysis(updated);
      setRankingMode(mode);
      setAlpha(newAlpha);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to re-score batch with new weights.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeSwitch = async (mode: "deterministic" | "learned" | "hybrid") => {
    if (!analysis) return;
    const newAlpha = mode === "deterministic" ? 1.0 : mode === "learned" ? 0.0 : 0.75;
    await handleApplyWeights(analysis.weights, mode, newAlpha);
  };

  const handleToggleCompare = (candidate: CandidateScoreOutput) => {
    setCompareList((prev) => {
      const exists = prev.some((c) => c.candidate_id === candidate.candidate_id);
      if (exists) {
        return prev.filter((c) => c.candidate_id !== candidate.candidate_id);
      }
      if (prev.length >= 2) {
        return [prev[0], candidate];
      }
      return [...prev, candidate];
    });
  };

  const handleAssistantSubmit = async (queryText?: string) => {
    const q = queryText || assistantInput;
    if (!q.trim() || !analysis) return;

    setIsQueryLoading(true);
    try {
      const res = await queryAnalysis(q, analysis);
      setAssistantDialogue({
        q: res.query,
        a: res.answer,
        rule: res.rule_applied,
      });
    } catch {
      setAssistantDialogue({
        q,
        a: "Insufficient evidence in the current analysis.",
        rule: "Deterministic Fallback",
      });
    } finally {
      setIsQueryLoading(false);
      setAssistantInput("");
    }
  };

  // Filter candidates
  const filteredCandidates = (analysis?.candidates || []).filter((cand) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = cand.candidate_name.toLowerCase().includes(q);
      const matchSkill = cand.matched_requirements.some((s) => s.toLowerCase().includes(q));
      if (!matchName && !matchSkill) return false;
    }

    // Filter categories
    if (filter === "strong") {
      return cand.final_score >= 80;
    }
    if (filter === "good") {
      return cand.final_score >= 65 && cand.final_score < 80;
    }
    if (filter === "partial") {
      return cand.final_score >= 50 && cand.final_score < 65;
    }
    if (filter === "limited") {
      return cand.final_score < 50;
    }
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#fcf9f8] text-[#1b1c1c] selection:bg-[#fff9c4] selection:text-[#1b1c1c]">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenWeights={() => setIsWeightsOpen(true)}
        onLoadSample={loadSampleData}
        isLoading={isLoading}
        totalCandidates={analysis?.total_candidates || 0}
      />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-[#ffdad6] border-2 border-[#2d2d2d] shadow-[3px_3px_0px_#2d2d2d] text-xs font-['Karla'] text-[#93000a] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-secondary shrink-0" />
              <span className="font-bold">{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="paper-btn px-2 py-1 bg-white border border-[#2d2d2d] rounded text-xs font-bold text-secondary cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* SET UP WORKSPACE TAB */}
        {activeTab === "setup" && (
          <UploadZone
            onAnalyze={handleAnalyze}
            onLoadSample={loadSampleData}
            isLoading={isLoading}
          />
        )}

        {/* RANKED SHORTLIST (MAIN DASHBOARD) */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {/* Interactive Top Action & Breadcrumb */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("setup")}
                  className="paper-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-[#1b1c1c] font-['Karla'] font-bold text-xs border-2 border-[#2d2d2d] shadow-[3px_3px_0px_#2d2d2d] hover:-translate-y-0.5 cursor-pointer"
                >
                  <span className="text-secondary font-bold font-['Kalam'] text-sm">
                    ←
                  </span>
                  <span>Edit role & staged resumes</span>
                </button>
                <span className="text-[#737782] font-['Karla'] text-xs hidden md:inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-primary">
                    folder_open
                  </span>
                  TechNova Solutions / Batch #409
                </span>
              </div>

              {/* Quick Tool Actions (Real Exports & Print) */}
              <div className="flex flex-wrap items-center gap-2">
                {compareList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("compare")}
                    className="paper-btn btn-red-action inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#ff4d4d] hover:bg-[#ff3333] text-white font-['Karla'] font-bold text-xs border-2 border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] cursor-pointer animate-bounce"
                  >
                    <span className="text-white">Compare ({compareList.length}/2) ➜</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="paper-btn inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-[#1b1c1c] font-['Karla'] font-bold text-xs border-2 border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] hover:bg-[#eae7e7] cursor-pointer"
                  title="Print or Save as PDF Dossier"
                >
                  <Printer className="w-3.5 h-3.5 text-primary" />
                  <span>Print PDF</span>
                </button>
                {analysis && (
                  <>
                    <button
                      type="button"
                      onClick={() => downloadShortlistCSV(analysis)}
                      className="paper-btn inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-[#1b1c1c] font-['Karla'] font-bold text-xs border-2 border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] hover:bg-[#eae7e7] cursor-pointer"
                      title="Download Shortlist in CSV spreadsheet format"
                    >
                      <Download className="w-3.5 h-3.5 text-secondary" />
                      <span>Export CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadAuditDossierJSON(analysis)}
                      className="paper-btn btn-red-action inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-[#ff4d4d] hover:bg-[#ff3333] text-white font-['Karla'] font-bold text-xs border-2 border-[#2d2d2d] shadow-[3px_3px_0px_#2d2d2d] cursor-pointer"
                      title="Download complete audited evaluation JSON"
                    >
                      <Download className="w-3.5 h-3.5 text-white" />
                      <span className="text-white">Audit JSON</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Page Headline Block with Physical Sketchbook Flair */}
            <div className="relative max-w-4xl">
              <div className="inline-flex items-center gap-2">
                <h1 className="font-['Kalam'] font-bold text-3xl sm:text-4xl leading-tight text-[#1b1c1c] tracking-tight">
                  Your shortlist is ready!
                </h1>
                <span className="font-['Kalam'] text-secondary text-2xl font-bold rotate-6 animate-pulse select-none">
                  ★
                </span>
              </div>
              <p className="font-['Karla'] text-base text-[#424750] mt-1 flex flex-wrap items-center gap-2 font-medium">
                <span>{analysis?.total_candidates || 18} candidates ranked against</span>
                <span className="font-bold text-primary bg-[#d6e3ff]/70 px-2 py-0.5 rounded border border-dashed border-primary">
                  {analysis?.jd?.role_title || "Junior Full Stack Developer Intern"}
                </span>
                <span className="text-[#737782]">at TechNova Solutions</span>
              </p>
            </div>

            {/* Custom ML Intelligence Mode Selector Bar */}
            <div className="bg-white p-3.5 sm:p-4 rounded-xl border-2 border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#eaf1ff] border border-primary/40 text-primary text-xs font-bold font-['Karla']">
                  <Cpu className="w-3.5 h-3.5 shrink-0" />
                  <span>ML Ranking Layer:</span>
                </div>
                <div className="inline-flex rounded-lg border-2 border-[#2d2d2d] p-0.5 bg-[#f0eded] shadow-[2px_2px_0px_#2d2d2d]">
                  <button
                    type="button"
                    onClick={() => handleModeSwitch("hybrid")}
                    className={`px-3 py-1 text-xs font-['Karla'] font-bold rounded-md transition-all cursor-pointer ${
                      rankingMode === "hybrid"
                        ? "bg-[#ff4d4d] text-white shadow-[1px_1px_0px_#2d2d2d]"
                        : "text-[#1b1c1c] hover:bg-white"
                    }`}
                  >
                    🛡️ Hybrid Blend (75% Det / 25% ML)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeSwitch("deterministic")}
                    className={`px-3 py-1 text-xs font-['Karla'] font-bold rounded-md transition-all cursor-pointer ${
                      rankingMode === "deterministic"
                        ? "bg-[#ff4d4d] text-white shadow-[1px_1px_0px_#2d2d2d]"
                        : "text-[#1b1c1c] hover:bg-white"
                    }`}
                  >
                    📋 100% Rules (Deterministic)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeSwitch("learned")}
                    className={`px-3 py-1 text-xs font-['Karla'] font-bold rounded-md transition-all cursor-pointer ${
                      rankingMode === "learned"
                        ? "bg-[#ff4d4d] text-white shadow-[1px_1px_0px_#2d2d2d]"
                        : "text-[#1b1c1c] hover:bg-white"
                    }`}
                  >
                    ⚡ 100% Learned (LTR Model)
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-['Karla']">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#d4edda] text-[#155724] border border-[#c3e6cb] font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#28a745] animate-pulse"></span>
                  Classifier: 90.0% CV
                </span>
                <button
                  type="button"
                  onClick={() => setIsWeightsOpen(true)}
                  className="paper-btn inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#fdfbf7] hover:bg-[#eae7e7] text-[#1b1c1c] font-bold border border-[#2d2d2d] shadow-[1px_1px_0px_#2d2d2d] cursor-pointer text-xs"
                >
                  <Sliders className="w-3 h-3 text-primary" />
                  <span>Tune α Blend</span>
                </button>
              </div>
            </div>

            {/* Recruiter Brief Hero Component */}
            {analysis && analysis.candidates.length >= 2 && (
              <div className="bg-[#fff9c4] border-2 border-[#2d2d2d] shadow-[5px_5px_0px_#2d2d2d] p-5 sm:p-6 rounded-xl relative [border-radius:15px_255px_15px_225px/225px_15px_255px_15px] space-y-4">
                <div className="flex items-center justify-between border-b-2 border-[#2d2d2d] pb-2.5">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-secondary" />
                    <h3 className="font-['Kalam'] font-bold text-xl text-[#1b1c1c]">
                      Recruiter Intelligence Brief
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-white border border-[#2d2d2d] text-primary">
                    Deterministic Rubric Proof
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Top Pick (#1) */}
                  <div className="lg:col-span-7 bg-white p-4 rounded-lg border-2 border-[#2d2d2d] shadow-[3px_3px_0px_#2d2d2d] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-primary text-white font-['Epilogue'] font-bold text-xs">
                          TOP RECOMMENDATION
                        </span>
                        <span className="font-['Epilogue'] font-bold text-base text-[#1b1c1c]">
                          {analysis.candidates[0].candidate_name}
                        </span>
                      </div>
                      <span className="font-['Kalam'] font-bold text-xl text-primary">
                        {analysis.candidates[0].final_score.toFixed(1)} pts
                      </span>
                    </div>

                    <p className="text-xs font-['Karla'] text-[#424750] leading-relaxed">
                      {analysis.candidates[0].reasons[0] || `Satisfies 100% must-haves with verified Tier-3 metric proof in projects.`}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-dashed border-[#2d2d2d]/30 text-[11px]">
                      <span className="font-bold text-secondary">Strongest Evidence:</span>
                      <span className="text-[#1b1c1c] italic font-['Kalam']">
                        "{analysis.candidates[0].top_why.strongest_evidence || analysis.candidates[0].reasons[1] || 'Verified production features'}"
                      </span>
                    </div>
                  </div>

                  {/* Runner Up (#2) */}
                  <div className="lg:col-span-5 bg-[#fdfbf7] p-4 rounded-lg border-2 border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-[#737782] font-['Karla']">
                          RUNNER-UP (RANK #2)
                        </span>
                        <span className="font-['Kalam'] font-bold text-base text-[#1b1c1c]">
                          {analysis.candidates[1].candidate_name} ({analysis.candidates[1].final_score.toFixed(1)} pts)
                        </span>
                      </div>
                      <p className="text-xs font-['Karla'] text-[#424750] leading-snug">
                        Why lower: {analysis.candidates[1].missing_requirements.length > 0
                          ? `Lacks ${analysis.candidates[1].missing_requirements.slice(0, 2).join(", ")} despite strong overall signals.`
                          : `Slightly lower evidence depth (${analysis.candidates[1].components.evidence_strength.toFixed(0)}% vs ${analysis.candidates[0].components.evidence_strength.toFixed(0)}%).`}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setCompareList([analysis.candidates[0], analysis.candidates[1]]);
                        setActiveTab("compare");
                      }}
                      className="paper-btn w-full py-1.5 px-2.5 rounded bg-white hover:bg-[#eae7e7] text-xs font-['Karla'] font-bold text-primary border border-[#2d2d2d] shadow-[1px_1px_0px_#2d2d2d] flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Compare #1 vs #2 Side-by-Side</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}


            {/* Top Metric Cut-Out Cards Strip & Search */}
            {analysis && (
              <StatsOverview
                candidates={analysis.candidates}
                selectedFilter={filter}
                onSelectFilter={setFilter}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            )}

            {/* Master Candidate Ranked Table / Ledger */}
            <div className="bg-white border-2 border-[#2d2d2d] shadow-[6px_6px_0px_#2d2d2d] rounded-xl overflow-hidden">
              {/* Stamped Ledger Header */}
              <div className="bg-[#f0eded] border-b-2 border-[#2d2d2d] px-4 py-3 hidden md:grid grid-cols-12 gap-4 text-[#1b1c1c] font-['Kalam'] font-bold text-sm tracking-wide">
                <div className="col-span-1 text-center">RANK</div>
                <div className="col-span-3">CANDIDATE & FIT TIER</div>
                <div className="col-span-2 text-center">MATCH SCORE</div>
                <div className="col-span-3">KEY MATCHES (JD RUBRIC)</div>
                <div className="col-span-2">GROWTH / MISSING</div>
                <div className="col-span-1 text-right">EVIDENCE</div>
              </div>

              {/* Rows */}
              {isLoading ? (
                <div className="p-8 text-center font-['Kalam'] font-bold text-lg text-primary animate-pulse">
                  Weighing candidate rubrics & embeddings...
                </div>
              ) : filteredCandidates.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <FileCheck2 className="w-10 h-10 text-[#737782] mx-auto" />
                  <h4 className="font-['Kalam'] font-bold text-base text-[#1b1c1c]">
                    No candidates match this filter
                  </h4>
                  <p className="text-xs text-[#737782] font-['Karla']">
                    Try clearing the search box or switching to "All".
                  </p>
                </div>
              ) : (
                <div className="divide-y-2 divide-[#2d2d2d]/20">
                  {filteredCandidates.map((cand) => (
                    <CandidateCard
                      key={cand.candidate_id}
                      candidate={cand}
                      onSelect={(c) => setSelectedCandidate(c)}
                      isSelectedForCompare={compareList.some(
                        (item) => item.candidate_id === cand.candidate_id
                      )}
                      onToggleCompare={handleToggleCompare}
                    />
                  ))}
                </div>
              )}

              {/* Footer Table Summary Notice */}
              <div className="bg-[#f0eded] border-t-2 border-[#2d2d2d] px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
                <span className="font-['Kalam'] text-xs font-bold text-[#424750]">
                  Showing {filteredCandidates.length} of {analysis?.total_candidates || 0} evaluated applicants.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFilter("all");
                    setSearchQuery("");
                  }}
                  className="font-['Karla'] font-bold text-xs text-primary hover:underline cursor-pointer"
                >
                  Reset filters & view all ▾
                </button>
              </div>
            </div>

            {/* 'Why these three?' Comparative Explanations Section */}
            {analysis && analysis.candidates.length >= 3 && (
              <div className="relative bg-[#e5e0d8]/50 border-2 border-[#2d2d2d] p-6 rounded-xl shadow-[4px_4px_0px_#2d2d2d]">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-4 h-4 rounded-full bg-secondary border-2 border-[#2d2d2d]"></div>
                  <h3 className="font-['Kalam'] font-bold text-2xl text-[#1b1c1c]">
                    Why these three?{" "}
                    <span className="text-[#424750] text-base font-normal">
                      Direct Rubric Comparison
                    </span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Card 1 */}
                  <div className="relative bg-[#fffef5] border-2 border-[#2d2d2d] p-4 rounded-lg shadow-[3px_3px_0px_#2d2d2d] -rotate-1 hover:rotate-0 transition-transform space-y-2">
                    <div className="absolute -top-3 left-6 w-20 h-4 bg-[#e5e0d8] border border-[#2d2d2d]/40 -rotate-2 pointer-events-none"></div>
                    <div className="flex items-center justify-between">
                      <span className="font-['Epilogue'] font-bold text-base text-[#1b1c1c]">
                        {analysis.candidates[0].candidate_name} (#1)
                      </span>
                      <span className="font-['Kalam'] text-secondary font-bold text-base">
                        {analysis.candidates[0].final_score.toFixed(0)}/100
                      </span>
                    </div>
                    <p className="font-['Karla'] text-xs leading-relaxed text-[#1b1c1c]">
                      {analysis.candidates[0].top_why.strongest_evidence}
                    </p>
                    <div className="pt-2 border-t border-dashed border-[#2d2d2d]/30 font-['Kalam'] text-xs text-secondary font-bold">
                      Key Differentiator: {analysis.candidates[0].top_why.differentiator || "Full-stack integration"}
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="relative bg-white border-2 border-[#2d2d2d] p-4 rounded-lg shadow-[3px_3px_0px_#2d2d2d] rotate-1 hover:rotate-0 transition-transform space-y-2">
                    <div className="absolute -top-3 left-6 w-20 h-4 bg-[#e5e0d8] border border-[#2d2d2d]/40 rotate-2 pointer-events-none"></div>
                    <div className="flex items-center justify-between">
                      <span className="font-['Epilogue'] font-bold text-base text-[#1b1c1c]">
                        {analysis.candidates[1].candidate_name} (#2)
                      </span>
                      <span className="font-['Kalam'] text-primary font-bold text-base">
                        {analysis.candidates[1].final_score.toFixed(0)}/100
                      </span>
                    </div>
                    <p className="font-['Karla'] text-xs leading-relaxed text-[#1b1c1c]">
                      {analysis.candidates[1].top_why.strongest_evidence}
                    </p>
                    <div className="pt-2 border-t border-dashed border-[#2d2d2d]/30 font-['Kalam'] text-xs text-primary font-bold">
                      Key Differentiator: {analysis.candidates[1].top_why.differentiator || "High core logic"}
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className="relative bg-white border-2 border-[#2d2d2d] p-4 rounded-lg shadow-[3px_3px_0px_#2d2d2d] -rotate-[0.5deg] hover:rotate-0 transition-transform space-y-2">
                    <div className="absolute -top-3 left-6 w-20 h-4 bg-[#e5e0d8] border border-[#2d2d2d]/40 -rotate-1 pointer-events-none"></div>
                    <div className="flex items-center justify-between">
                      <span className="font-['Epilogue'] font-bold text-base text-[#1b1c1c]">
                        {analysis.candidates[2].candidate_name} (#3)
                      </span>
                      <span className="font-['Kalam'] text-primary font-bold text-base">
                        {analysis.candidates[2].final_score.toFixed(0)}/100
                      </span>
                    </div>
                    <p className="font-['Karla'] text-xs leading-relaxed text-[#1b1c1c]">
                      {analysis.candidates[2].top_why.strongest_evidence}
                    </p>
                    <div className="pt-2 border-t border-dashed border-[#2d2d2d]/30 font-['Kalam'] text-xs text-tertiary font-bold">
                      Key Differentiator: {analysis.candidates[2].top_why.differentiator || "Clean repository actions"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Interactive AI Assistant & JD Calibration Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Recruiter Assistant Chat Bubble Card */}
              <div className="lg:col-span-8 bg-white border-2 border-[#2d2d2d] shadow-[5px_5px_0px_#2d2d2d] p-5 rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b-2 border-dashed border-[#2d2d2d]/30 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💬</span>
                    <h3 className="font-['Kalam'] font-bold text-xl text-[#1b1c1c]">
                      Ask about the ranking
                    </h3>
                  </div>
                  <span className="font-['Karla'] font-bold text-xs text-secondary bg-[#ffdad7] px-2.5 py-0.5 rounded border border-[#2d2d2d]">
                    Grounded in Resume Citations
                  </span>
                </div>

                {/* Simulated Dialogue */}
                {assistantDialogue && (
                  <div className="space-y-3">
                    {/* User Prompt */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs border border-[#2d2d2d] shrink-0">
                        YOU
                      </div>
                      <div className="bg-[#f0eded] px-3.5 py-2 rounded-lg border-2 border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d]">
                        <p className="font-['Karla'] font-bold text-xs text-[#1b1c1c]">
                          {assistantDialogue.q}
                        </p>
                      </div>
                    </div>

                    {/* Assistant Response */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-secondary text-white flex items-center justify-center font-['Kalam'] font-bold text-sm border border-[#2d2d2d] shrink-0">
                        ✎
                      </div>
                      <div className="bg-[#fff9c4] p-3.5 rounded-lg border-2 border-[#2d2d2d] shadow-[3px_3px_0px_#2d2d2d] max-w-2xl space-y-2">
                        <p className="font-['Karla'] text-xs sm:text-sm text-[#1b1c1c] leading-relaxed">
                          {assistantDialogue.a}
                        </p>
                        <div className="pt-2 border-t border-dashed border-[#2d2d2d]/40 flex items-center gap-2 text-xs font-['Kalam'] font-bold text-[#424750]">
                          <span>Rule applied: {assistantDialogue.rule}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Question Prompts */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleAssistantSubmit("What would make Priya Rank 1?")}
                    className="paper-btn px-2.5 py-1 rounded-full bg-[#fcf9f8] border border-[#2d2d2d] text-xs font-['Karla'] font-bold text-[#1b1c1c] hover:bg-[#fff9c4] shadow-[1px_1px_0px_#2d2d2d] cursor-pointer"
                  >
                    "What would make Priya Rank 1?"
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAssistantSubmit("Any candidates with Docker / AWS?")}
                    className="paper-btn px-2.5 py-1 rounded-full bg-[#fcf9f8] border border-[#2d2d2d] text-xs font-['Karla'] font-bold text-[#1b1c1c] hover:bg-[#fff9c4] shadow-[1px_1px_0px_#2d2d2d] cursor-pointer"
                  >
                    "Any candidates with Docker / AWS?"
                  </button>
                </div>

                {/* Question Input Field */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAssistantSubmit();
                  }}
                  className="flex items-center gap-2 pt-1"
                >
                  <input
                    type="text"
                    value={assistantInput}
                    onChange={(e) => setAssistantInput(e.target.value)}
                    placeholder="Ask any question about this candidate batch..."
                    className="flex-1 px-3.5 py-2 bg-[#fcf9f8] rounded-lg border-2 border-[#2d2d2d] font-['Karla'] text-xs sm:text-sm shadow-[2px_2px_0px_#2d2d2d] focus:outline-none focus:ring-2 focus:ring-[#fff9c4]"
                  />
                  <button
                    type="submit"
                    className="paper-btn btn-red-action px-4 py-2 rounded-lg bg-[#ff4d4d] hover:bg-[#ff3333] text-white font-['Kalam'] font-bold text-sm border-2 border-[#2d2d2d] shadow-[3px_3px_0px_#2d2d2d] cursor-pointer"
                  >
                    <span className="text-white">Ask ✎</span>
                  </button>
                </form>
              </div>

              {/* Post-It Note: JD Feedback & Calibration */}
              <div className="lg:col-span-4 relative bg-[#fff9c4] border-2 border-[#2d2d2d] shadow-[5px_5px_0px_#2d2d2d] p-5 rounded-xl rotate-1 hover:rotate-0 transition-transform space-y-3">
                {/* Red Thumbtack on top center */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-secondary border-2 border-[#2d2d2d] shadow-[1px_1px_0px_#2d2d2d] flex items-center justify-center pointer-events-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/80 block"></span>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <span className="material-symbols-outlined text-secondary text-xl">
                    psychology_alt
                  </span>
                  <h4 className="font-['Kalam'] font-bold text-lg text-[#1b1c1c]">
                    JD Rubric Calibration
                  </h4>
                </div>

                <p className="font-['Karla'] text-xs leading-snug text-[#1b1c1c]">
                  InternLoom dynamically normalizes strict degree constraints & year thresholds for early-career developers.
                </p>

                <div className="bg-white/80 p-3 rounded-lg border border-[#2d2d2d] space-y-1">
                  <span className="font-['Kalam'] text-xs font-bold text-secondary uppercase">
                    Student Equity Guard:
                  </span>
                  <p className="text-xs text-[#1b1c1c] font-['Karla']">
                    High project density and GitHub repository contributions are prioritized above rigid pedigree pins.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab("bias")}
                  className="paper-btn btn-red-action w-full py-2.5 px-3 rounded-lg bg-[#ff4d4d] hover:bg-[#ff3333] text-white font-['Kalam'] font-bold text-sm border-2 border-[#2d2d2d] shadow-[3px_3px_0px_#2d2d2d] transition-all text-center cursor-pointer"
                >
                  <span className="text-white">Open Bias Inspector ✎</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SKILL GAP MATRIX TAB */}
        {activeTab === "matrix" && (
          <SkillGapMatrix
            candidates={analysis?.candidates || []}
            jd={analysis?.jd || null}
            onSelectCandidate={(c) => setSelectedCandidate(c)}
          />
        )}

        {/* COMPARE TAB */}
        {activeTab === "compare" && (
          <CandidateComparisonView
            candidates={analysis?.candidates || []}
            initialCandA={compareList[0] || null}
            initialCandB={compareList[1] || null}
            jd={analysis?.jd || null}
          />
        )}

        {/* JD BIAS INSPECTOR TAB */}
        {activeTab === "bias" && (
          <JDBiasInspector jd={analysis?.jd || null} />
        )}

        {/* EVALUATION LAB TAB */}
        {activeTab === "eval-lab" && <EvaluationLab analysis={analysis} />}

        {/* ABLATION PROOF TAB */}
        {activeTab === "ablation" && <AblationView />}

        {/* HOW IT WORKS TAB */}
        {activeTab === "how-it-works" && <HowItWorksExplainer />}
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#fdfbf7] border-t-2 border-[#2d2d2d] mt-12 py-6">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-secondary border border-[#2d2d2d]"></span>
            <span className="font-['Karla'] font-bold text-xs text-[#424750]">
              InternLoom Notebook Engine • Tactile Recruiter Edition
            </span>
          </div>
          <div className="font-['Karla'] text-xs text-[#737782]">
            Crafted with ballpoint, cardstock & rubric precision • 100% Offline Local NLP Pipeline
          </div>
        </div>
      </footer>

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <CandidateDetailModal
          candidate={selectedCandidate}
          jd={analysis?.jd || null}
          onClose={() => setSelectedCandidate(null)}
          onCompareWithAnother={(c) => {
            handleToggleCompare(c);
            setActiveTab("compare");
            setSelectedCandidate(null);
          }}
        />
      )}

      {/* Formula & ML Weights Drawer */}
      <WeightsDrawer
        isOpen={isWeightsOpen}
        onClose={() => setIsWeightsOpen(false)}
        weights={
          analysis?.weights || {
            semantic: 0.25,
            keyword: 0.25,
            required_coverage: 0.20,
            preferred_coverage: 0.10,
            evidence_strength: 0.10,
            experience_relevance: 0.05,
            education_fit: 0.05,
          }
        }
        rankingMode={rankingMode}
        alpha={alpha}
        onApplyWeights={handleApplyWeights}
      />
    </div>
  );
}
