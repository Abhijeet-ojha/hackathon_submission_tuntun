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
  weights: ScoringWeights
): Promise<AnalysisResponse> {
  const res = await fetch(`${API_BASE}/api/rescore`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jd, weights }),
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
