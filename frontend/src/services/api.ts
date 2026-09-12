import type {
  AnalysisResponse,
  CandidateScoreOutput,
  ComparisonDelta,
  JDIntelligence,
  ScoringWeights,
  AblationResult,
  FlaggedRequirement
} from "../types";

const API_BASE = "http://127.0.0.1:8000";

export async function getSampleData(): Promise<AnalysisResponse> {
  const res = await fetch(`${API_BASE}/api/sample-data`);
  if (!res.ok) {
    throw new Error(`Failed to fetch sample data: ${res.statusText}`);
  }
  return res.json();
}

export async function analyzeBatch(
  jdText: string,
  jdFile: File | null,
  resumeFiles: File[],
  weights?: ScoringWeights
): Promise<AnalysisResponse> {
  const formData = new FormData();
  if (jdText) {
    formData.append("jd_text", jdText);
  }
  if (jdFile) {
    formData.append("jd_file", jdFile);
  }
  resumeFiles.forEach((file) => {
    formData.append("resumes", file);
  });
  if (weights) {
    formData.append("weights_json", JSON.stringify(weights));
  }

  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Analysis failed");
  }

  return res.json();
}

export async function rescoreBatch(
  jd: JDIntelligence,
  weights: ScoringWeights,
  ranking_mode: "deterministic" | "learned" | "hybrid" = "hybrid",
  alpha: number = 0.75
): Promise<AnalysisResponse> {
  const res = await fetch(`${API_BASE}/api/rescore`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jd, weights, ranking_mode, alpha }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Rescore failed");
  }

  return res.json();
}

export async function compareCandidates(
  candidateA: CandidateScoreOutput,
  candidateB: CandidateScoreOutput
): Promise<ComparisonDelta> {
  const res = await fetch(`${API_BASE}/api/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ candidate_a: candidateA, candidate_b: candidateB }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Comparison failed");
  }

  return res.json();
}

export async function checkJDBias(
  jdText: string,
  roleTitle?: string
): Promise<{
  role_title: string;
  flagged_requirements: FlaggedRequirement[];
  must_have_count: number;
  nice_to_have_count: number;
}> {
  const res = await fetch(`${API_BASE}/api/bias-check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jd_text: jdText, role_title: roleTitle }),
  });

  if (!res.ok) {
    throw new Error("Bias check failed");
  }

  return res.json();
}

export async function getAblationCheck(): Promise<AblationResult> {
  const res = await fetch(`${API_BASE}/api/ablation`);
  if (!res.ok) {
    throw new Error("Failed to fetch ablation check");
  }
  return res.json();
}

export async function queryAnalysis(
  query: string,
  analysis?: AnalysisResponse
): Promise<import("../types").RecruiterQueryResult> {
  const res = await fetch(`${API_BASE}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, analysis }),
  });

  if (!res.ok) {
    throw new Error("Query processing failed");
  }

  return res.json();
}

export async function getEvaluationMetrics(): Promise<import("../types").EvaluationMetrics> {
  const res = await fetch(`${API_BASE}/api/evaluation-metrics`);
  if (!res.ok) {
    throw new Error("Failed to fetch evaluation metrics");
  }
  return res.json();
}

export async function loadDataset(track: string = "web_sde"): Promise<AnalysisResponse> {
  const res = await fetch(`${API_BASE}/api/load-dataset?track=${track}`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error("Failed to load dataset");
  }
  return res.json();
}

export function downloadShortlistCSV(analysis: AnalysisResponse) {
  const headers = [
    "Rank",
    "Candidate Name",
    "Final Score",
    "Must-Have Coverage %",
    "Semantic Relevance %",
    "Keyword Score %",
    "Evidence Strength %",
    "Top Highlight",
    "Remaining Gaps",
    "Evidence Confidence",
  ];

  const rows = analysis.candidates.map((c) => {
    const conf =
      c.components.evidence_strength >= 70
        ? "HIGH"
        : c.components.evidence_strength >= 40
        ? "MEDIUM"
        : "LOW";
    return [
      c.rank,
      `"${c.candidate_name}"`,
      c.final_score,
      c.components.required_coverage,
      c.components.semantic,
      c.components.keyword,
      c.components.evidence_strength,
      `"${(c.top_why.strongest_evidence || (c.reasons && c.reasons[0]) || "").replace(/"/g, '""')}"`,
      `"${c.missing_requirements.slice(0, 2).join("; ")}"`,
      conf,
    ].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Resify_Shortlist_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadAuditDossierJSON(analysis: AnalysisResponse) {
  const jsonStr = JSON.stringify(analysis, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Resify_Full_Audit_Dossier_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function getMLStatus(): Promise<import("../types").MLStatus> {
  const res = await fetch(`${API_BASE}/api/ml/status`);
  if (!res.ok) {
    throw new Error("Failed to fetch ML status");
  }
  return res.json();
}

export async function getMLEvaluationMetrics(): Promise<import("../types").MLEvaluationMetrics> {
  const res = await fetch(`${API_BASE}/api/ml/evaluation`);
  if (!res.ok) {
    throw new Error("Failed to fetch ML evaluation metrics");
  }
  return res.json();
}

export async function rescoreMLRanking(
  mode: "deterministic" | "learned" | "hybrid",
  alpha: number = 0.75,
  weights?: ScoringWeights
): Promise<AnalysisResponse> {
  const res = await fetch(`${API_BASE}/api/ml/ranking/rescore`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode, alpha, weights }),
  });
  if (!res.ok) {
    throw new Error("Failed to rescore ML ranking");
  }
  return res.json();
}

export async function predictEvidenceML(
  text: string,
  requirement: string = ""
): Promise<import("../types").EvidencePrediction> {
  const res = await fetch(`${API_BASE}/api/ml/evidence/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, requirement }),
  });
  if (!res.ok) {
    throw new Error("Failed to predict evidence tier");
  }
  return res.json();
}


