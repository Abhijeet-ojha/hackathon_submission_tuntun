export type FlaggedRequirement = {
  requirement: string;
  reason: string;
  severity: "info" | "warning" | "high";
  suggestion: string;
};

export type JDIntelligence = {
  role_title: string;
  must_have_skills: string[];
  should_have_skills: string[];
  nice_to_have_skills: string[];
  technical_skills: string[];
  soft_skills: string[];
  education_requirements: string[];
  experience_requirements: string[];
  responsibilities: string[];
  domain_requirements: string[];
  flagged_requirements: FlaggedRequirement[];
  raw_text: string;
};

export type ExtractedSkill = {
  raw_text: string;
  canonical: string;
  evidence_level: number;
  evidence_text: string;
  source_section: string;
  confidence: number;
};

export type EvidenceGraphNode = {
  requirement: string;
  matched_via: string[];
  evidence_source: string;
  evidence_strength: number; // 0, 1, 2, 3
  match_confidence: number;
  match_type: "direct" | "transferable" | "keyword_only" | "semantic_only";
  quote: string;
  ml_tier?: number;
  ml_confidence?: number;
  ml_probabilities?: Record<string, number>;
  ml_reason?: string;
};

export type ScoreComponents = {
  semantic: number;
  keyword: number;
  required_coverage: number;
  preferred_coverage: number;
  evidence_strength: number;
  experience_relevance: number;
  education_fit: number;
};

export type TopReasons = {
  matched_highlights: string[];
  missing_gaps: string[];
  strongest_evidence: string;
  potential_risk: string;
};

export type UnderTheHoodMetrics = {
  bm25_score: number;
  raw_cosine_similarity: number;
  fuzzy_token_score: number;
  must_have_matches: string[];
  must_have_missing: string[];
  transferable_matches: Array<{
    requirement: string;
    supported_by: string[];
    credit: number;
  }>;
  raw_evidence_levels: Record<string, number>;
};

export type FeatureContribution = {
  feature_name: string;
  feature_label: string;
  feature_value: number;
  contribution_pts: number;
  direction: "positive" | "negative" | "neutral";
};

export type CandidateScoreOutput = {
  candidate_id: string;
  candidate_name: string;
  rank: number;
  final_score: number;
  components: ScoreComponents;
  matched_requirements: string[];
  missing_requirements: string[];
  partial_requirements: string[];
  evidence_graph: EvidenceGraphNode[];
  reasons: string[];
  top_why: TopReasons;
  under_the_hood: UnderTheHoodMetrics;
  sections_summary: Record<string, number>;
  parsing_status: string;
  learned_score?: number;
  deterministic_score?: number;
  rank_delta?: number;
  primary_drivers?: string[];
  counter_signals?: string[];
  feature_contributions?: FeatureContribution[];
  model_explanation?: string;
  ranking_mode?: "deterministic" | "learned" | "hybrid";
  alpha?: number;
};

export type ScoringWeights = {
  semantic: number;
  keyword: number;
  required_coverage: number;
  preferred_coverage: number;
  evidence_strength: number;
  experience_relevance: number;
  education_fit: number;
};

export type ComparisonDelta = {
  candidate_a: CandidateScoreOutput;
  candidate_b: CandidateScoreOutput;
  score_delta: number;
  superior_candidate_id: string;
  summary_bullets: string[];
  exclusive_to_a: string[];
  exclusive_to_b: string[];
  component_deltas: Record<string, number>;
};

export type AblationSummaryItem = {
  rank: number;
  candidate_id: string;
  candidate_name: string;
  score: number;
};

export type AblationResult = {
  is_divergent: boolean;
  keyword_only: AblationSummaryItem[];
  semantic_only: AblationSummaryItem[];
  hybrid: AblationSummaryItem[];
};

export type MLStatus = {
  offline: boolean;
  status: string;
  evidence_model: {
    available: boolean;
    version: string;
    type: string;
  };
  ranking_model: {
    available: boolean;
    version: string;
    type: string;
  };
  active_mode: "deterministic" | "learned" | "hybrid";
  default_alpha: number;
  offline_guarantee: string;
};

export type AnalysisResponse = {
  jd: JDIntelligence;
  candidates: CandidateScoreOutput[];
  weights: ScoringWeights;
  total_candidates: number;
  passed_must_haves_count: number;
  average_score: number;
  ablation_summary?: AblationResult;
  ml_status?: {
    offline: boolean;
    evidence_model_available: boolean;
    ranking_model_available: boolean;
    mode: string;
    alpha: number;
  };
  ranking_mode?: "deterministic" | "learned" | "hybrid";
  alpha?: number;
};

export type RecruiterQueryResult = {
  query: string;
  answer: string;
  rule_applied: string;
  intent: string;
  candidate_refs: string[];
  evidence_quotes: string[];
};

export type EvaluationMetrics = {
  total_candidates_evaluated: number;
  total_target_requirements: number;
  evidence_coverage_rate_pct: number;
  semantic_vs_bm25_divergence_pct: number;
  direct_matches_count: number;
  transferable_matches_count: number;
  missing_anchors_count: number;
  tier_distribution: {
    tier_3_metric_outcomes: number;
    tier_2_implementation_proof: number;
    tier_1_keyword_mentions: number;
  };
  deterministic_verification: string;
  model_architecture: string;
  ablation_proof_ready: boolean;
};

export type MLEvaluationMetrics = {
  offline: boolean;
  validated_metrics: {
    evidence_classifier: {
      dataset_version: string;
      dataset_type: string;
      sample_count: number;
      cv_accuracy: number;
      cv_macro_f1: number;
      per_class_metrics: Record<string, {
        precision: number;
        recall: number;
        f1: number;
        support: number;
      }>;
      confusion_matrix: number[][];
      verification_badge: string;
    };
  };
  ranking_diagnostics: {
    ranking_model: {
      dataset_version: string;
      dataset_type: string;
      ground_truth_status: string;
      pairwise_dev_accuracy: number;
      feature_weights: Record<string, number>;
      diagnostic_badge: string;
    };
  };
  sensitive_features_audit: Array<{
    attribute: string;
    reason: string;
  }>;
  offline_guarantee: string;
};

export type EvidencePrediction = {
  tier: number;
  label: string;
  confidence: number;
  probabilities: Record<string, number>;
  reason: string;
  model_version: string;
  is_rule_validated: boolean;
  status: string;
};
