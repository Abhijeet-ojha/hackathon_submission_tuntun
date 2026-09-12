from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any


class FlaggedRequirement(BaseModel):
    requirement: str
    reason: str
    severity: str = "warning"  # "info" | "warning" | "high"
    suggestion: str = ""


class JDIntelligence(BaseModel):
    role_title: str = "Software Engineering Intern"
    must_have_skills: List[str] = Field(default_factory=list)
    should_have_skills: List[str] = Field(default_factory=list)
    nice_to_have_skills: List[str] = Field(default_factory=list)
    technical_skills: List[str] = Field(default_factory=list)
    soft_skills: List[str] = Field(default_factory=list)
    education_requirements: List[str] = Field(default_factory=list)
    experience_requirements: List[str] = Field(default_factory=list)
    responsibilities: List[str] = Field(default_factory=list)
    domain_requirements: List[str] = Field(default_factory=list)
    flagged_requirements: List[FlaggedRequirement] = Field(default_factory=list)
    raw_text: str = ""


class ExtractedSkill(BaseModel):
    raw_text: str
    canonical: str
    evidence_level: int = 0  # 0=absent, 1=mentioned, 2=demonstrated, 3=demonstrated with metrics
    evidence_text: str = ""
    source_section: str = ""
    confidence: float = 1.0


class ResumeIntelligence(BaseModel):
    candidate_id: str
    candidate_name: str = ""
    email: str = ""
    phone: str = ""
    sections: Dict[str, str] = Field(default_factory=lambda: {
        "profile": "",
        "education": "",
        "skills": "",
        "experience": "",
        "internships": "",
        "projects": "",
        "certifications": "",
        "achievements": "",
        "other": ""
    })
    extracted_skills: List[ExtractedSkill] = Field(default_factory=list)
    raw_text: str = ""
    parsing_status: str = "success"  # "success", "scanned_or_empty", "corrupted"
    word_count: int = 0


class EvidenceGraphNode(BaseModel):
    requirement: str
    matched_via: List[str] = Field(default_factory=list)
    evidence_source: str = ""
    evidence_strength: int = 0
    match_confidence: float = 0.0
    match_type: str = "direct"  # "direct" | "transferable" | "keyword_only" | "semantic_only"
    quote: str = ""


class ScoreComponents(BaseModel):
    semantic: float = 0.0
    keyword: float = 0.0
    required_coverage: float = 0.0
    preferred_coverage: float = 0.0
    evidence_strength: float = 0.0
    experience_relevance: float = 0.0
    education_fit: float = 0.0


class TopReasons(BaseModel):
    matched_highlights: List[str] = Field(default_factory=list)
    missing_gaps: List[str] = Field(default_factory=list)
    strongest_evidence: str = ""
    potential_risk: str = ""


class UnderTheHoodMetrics(BaseModel):
    bm25_score: float = 0.0
    raw_cosine_similarity: float = 0.0
    fuzzy_token_score: float = 0.0
    must_have_matches: List[str] = Field(default_factory=list)
    must_have_missing: List[str] = Field(default_factory=list)
    transferable_matches: List[Dict[str, Any]] = Field(default_factory=list)
    raw_evidence_levels: Dict[str, int] = Field(default_factory=dict)


class CandidateScoreOutput(BaseModel):
    candidate_id: str
    candidate_name: str
    rank: int = 1
    final_score: float
    components: ScoreComponents
    matched_requirements: List[str] = Field(default_factory=list)
    missing_requirements: List[str] = Field(default_factory=list)
    partial_requirements: List[str] = Field(default_factory=list)
    evidence_graph: List[EvidenceGraphNode] = Field(default_factory=list)
    reasons: List[str] = Field(default_factory=list)
    top_why: TopReasons = Field(default_factory=TopReasons)
    under_the_hood: UnderTheHoodMetrics = Field(default_factory=UnderTheHoodMetrics)
    sections_summary: Dict[str, int] = Field(default_factory=dict)
    parsing_status: str = "success"


class ScoringWeights(BaseModel):
    semantic: float = 0.25
    keyword: float = 0.25
    required_coverage: float = 0.20
    preferred_coverage: float = 0.10
    evidence_strength: float = 0.10
    experience_relevance: float = 0.05
    education_fit: float = 0.05


class ComparisonDelta(BaseModel):
    candidate_a: CandidateScoreOutput
    candidate_b: CandidateScoreOutput
    score_delta: float
    superior_candidate_id: str
    summary_bullets: List[str] = Field(default_factory=list)
    exclusive_to_a: List[str] = Field(default_factory=list)
    exclusive_to_b: List[str] = Field(default_factory=list)
    component_deltas: Dict[str, float] = Field(default_factory=dict)


class AnalysisResponse(BaseModel):
    jd: JDIntelligence
    candidates: List[CandidateScoreOutput] = Field(default_factory=list)
    weights: ScoringWeights
    total_candidates: int = 0
    passed_must_haves_count: int = 0
    average_score: float = 0.0
    ablation_summary: Optional[Dict[str, Any]] = None
