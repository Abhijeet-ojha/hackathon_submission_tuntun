import os
import shutil
import tempfile
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ..models import (
    AnalysisResponse, CandidateScoreOutput, ComparisonDelta,
    JDIntelligence, ResumeIntelligence, ScoringWeights, FlaggedRequirement
)
from ..parsers.pdf_parser import PDFResumeParser
from ..jd_intel.jd_parser import JDParser
from ..ontology.skill_ontology import SkillOntology
from ..ranking.hybrid_ranker import HybridCandidateRanker
from ..explanations.comparator import CandidateComparator
from ..explanations.bias_detector import JDBiasDetector
from ..explanations.query_engine import RecruiterQueryEngine


app = FastAPI(
    title="InternLoom Smart Shortlisting Engine API",
    description="Evidence-driven hybrid candidate ranking engine without external LLMs or APIs.",
    version="1.0.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize core services
ontology = SkillOntology()
pdf_parser = PDFResumeParser()
jd_parser = JDParser(ontology)
ranker = HybridCandidateRanker(ontology=ontology)
comparator = CandidateComparator()
bias_detector = JDBiasDetector()
query_engine = RecruiterQueryEngine(ontology=ontology)

# In-memory cached demo state for fast live testing
CACHED_DEMO_ANALYSIS: Optional[AnalysisResponse] = None
CACHED_PARSED_CANDIDATES: List[ResumeIntelligence] = []
CACHED_JD: Optional[JDIntelligence] = None


class RescoreRequest(BaseModel):
    jd: JDIntelligence
    candidates_raw: Optional[List[Dict[str, Any]]] = None
    weights: ScoringWeights


class CompareRequest(BaseModel):
    candidate_a: CandidateScoreOutput
    candidate_b: CandidateScoreOutput


class JDBiasRequest(BaseModel):
    jd_text: str
    role_title: Optional[str] = None


class RecruiterQueryRequest(BaseModel):
    query: str
    analysis: Optional[AnalysisResponse] = None



@app.get("/")
def root():
    return {
        "engine": "InternLoom Smart Shortlisting Engine",
        "status": "online",
        "semantic_model": "all-MiniLM-L6-v2 (100% offline)",
        "external_api_calls": "0 (strictly local)"
    }


@app.get("/api/ontology")
def get_ontology():
    return {
        "skills": ontology.get_all_skills(),
        "total_skills": len(ontology.skills_data)
    }


@app.post("/api/bias-check")
def check_jd_bias(req: JDBiasRequest):
    jd = jd_parser.parse_jd(req.jd_text, req.role_title)
    flags = bias_detector.analyze_jd(jd)
    return {
        "role_title": jd.role_title,
        "flagged_requirements": flags,
        "must_have_count": len(jd.must_have_skills),
        "nice_to_have_count": len(jd.nice_to_have_skills)
    }


@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_batch(
    jd_text: Optional[str] = Form(None),
    jd_file: Optional[UploadFile] = File(None),
    resumes: List[UploadFile] = File(...),
    weights_json: Optional[str] = Form(None)
):
    global CACHED_PARSED_CANDIDATES, CACHED_JD, CACHED_DEMO_ANALYSIS

    # 1. Parse JD Text
    final_jd_text = jd_text or ""
    if jd_file and jd_file.filename:
        content = await jd_file.read()
        try:
            final_jd_text = content.decode("utf-8")
        except UnicodeDecodeError:
            # Try PDF extract if JD is PDF
            temp_jd_path = os.path.join(tempfile.gettempdir(), f"jd_{jd_file.filename}")
            with open(temp_jd_path, "wb") as f:
                f.write(content)
            extracted, _ = pdf_parser.extract_text_from_pdf(temp_jd_path)
            final_jd_text = extracted
            if os.path.exists(temp_jd_path):
                os.remove(temp_jd_path)

    if not final_jd_text.strip():
        raise HTTPException(status_code=400, detail="Job description is required (either text or file).")

    jd = jd_parser.parse_jd(final_jd_text)
    CACHED_JD = jd

    # 2. Parse Resumes
    parsed_candidates: List[ResumeIntelligence] = []
    
    for i, file in enumerate(resumes):
        cand_id = f"cand_{i+1:02d}"
        filename = file.filename or f"resume_{i+1}.pdf"
        base_name = os.path.splitext(filename)[0].replace("_", " ").title()

        # Save to temp file
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, f"{cand_id}_{filename}")
        
        file_bytes = await file.read()
        with open(temp_path, "wb") as f:
            f.write(file_bytes)

        # Parse PDF
        try:
            cand_intel = pdf_parser.parse_text_or_pdf(temp_path, candidate_id=cand_id, candidate_name=base_name)
        except Exception:
            cand_intel = ResumeIntelligence(
                candidate_id=cand_id,
                candidate_name=base_name,
                parsing_status="corrupted"
            )
        finally:
            # Privacy: remove temp file immediately
            if os.path.exists(temp_path):
                os.remove(temp_path)

        parsed_candidates.append(cand_intel)

    CACHED_PARSED_CANDIDATES = parsed_candidates

    # Parse weights if provided
    weights = ScoringWeights()
    if weights_json:
        try:
            weights = ScoringWeights.model_validate_json(weights_json)
        except Exception:
            weights = ScoringWeights()

    # 3. Hybrid Ranking
    ranked_candidates = ranker.rank_candidates(parsed_candidates, jd, weights)

    # 4. Ablation Check
    ablation = ranker.compute_ablation(parsed_candidates, jd)

    # Summary metrics
    total = len(ranked_candidates)
    passed_must = sum(1 for c in ranked_candidates if c.components.required_coverage >= 70.0)
    avg_score = sum(c.final_score for c in ranked_candidates) / total if total > 0 else 0.0

    response = AnalysisResponse(
        jd=jd,
        candidates=ranked_candidates,
        weights=weights,
        total_candidates=total,
        passed_must_haves_count=passed_must,
        average_score=round(avg_score, 2),
        ablation_summary=ablation
    )

    CACHED_DEMO_ANALYSIS = response
    return response


@app.post("/api/rescore", response_model=AnalysisResponse)
def rescore_batch(req: RescoreRequest):
    global CACHED_PARSED_CANDIDATES, CACHED_JD, CACHED_DEMO_ANALYSIS

    jd = req.jd
    weights = req.weights

    candidates = CACHED_PARSED_CANDIDATES
    if not candidates and CACHED_DEMO_ANALYSIS:
        # Fallback to demo candidates
        pass

    if not candidates:
        raise HTTPException(status_code=400, detail="No active candidate batch in session. Please upload resumes first.")

    ranked_candidates = ranker.rank_candidates(candidates, jd, weights)
    ablation = ranker.compute_ablation(candidates, jd)

    total = len(ranked_candidates)
    passed_must = sum(1 for c in ranked_candidates if c.components.required_coverage >= 70.0)
    avg_score = sum(c.final_score for c in ranked_candidates) / total if total > 0 else 0.0

    response = AnalysisResponse(
        jd=jd,
        candidates=ranked_candidates,
        weights=weights,
        total_candidates=total,
        passed_must_haves_count=passed_must,
        average_score=round(avg_score, 2),
        ablation_summary=ablation
    )

    CACHED_DEMO_ANALYSIS = response
    return response


@app.post("/api/compare", response_model=ComparisonDelta)
def compare_two_candidates(req: CompareRequest):
    delta = comparator.compare_candidates(req.candidate_a, req.candidate_b)
    return delta


@app.get("/api/ablation")
def get_ablation_check():
    global CACHED_PARSED_CANDIDATES, CACHED_JD
    if not CACHED_PARSED_CANDIDATES or not CACHED_JD:
        # Load sample data first if cache is empty
        load_sample_data_internal()

    ablation = ranker.compute_ablation(CACHED_PARSED_CANDIDATES, CACHED_JD)
    return ablation


@app.get("/api/sample-data", response_model=AnalysisResponse)
def get_sample_data(track: Optional[str] = "standard"):
    global CACHED_DEMO_ANALYSIS
    if CACHED_DEMO_ANALYSIS is None or track != "standard":
        load_sample_data_internal(track)
    return CACHED_DEMO_ANALYSIS


@app.post("/api/load-dataset", response_model=AnalysisResponse)
def load_dataset_endpoint(track: str = "web_sde"):
    load_sample_data_internal(track)
    return CACHED_DEMO_ANALYSIS


def load_sample_data_internal(track: str = "standard"):
    global CACHED_PARSED_CANDIDATES, CACHED_JD, CACHED_DEMO_ANALYSIS
    from ..sample_loader import generate_sample_dataset, load_official_dataset
    
    if track in ["web_sde", "ml", "official"]:
        jd, candidates = load_official_dataset(track)
    else:
        jd, candidates = generate_sample_dataset()
        
    CACHED_JD = jd
    CACHED_PARSED_CANDIDATES = candidates
    weights = ScoringWeights()
    ranked = ranker.rank_candidates(candidates, jd, weights)
    ablation = ranker.compute_ablation(candidates, jd)

    total = len(ranked)
    passed_must = sum(1 for c in ranked if c.components.required_coverage >= 70.0)
    avg_score = sum(c.final_score for c in ranked) / total if total > 0 else 0.0

    CACHED_DEMO_ANALYSIS = AnalysisResponse(
        jd=jd,
        candidates=ranked,
        weights=weights,
        total_candidates=total,
        passed_must_haves_count=passed_must,
        average_score=round(avg_score, 2),
        ablation_summary=ablation
    )


@app.post("/api/query")
def recruiter_query_endpoint(req: RecruiterQueryRequest):
    global CACHED_DEMO_ANALYSIS
    analysis = req.analysis or CACHED_DEMO_ANALYSIS
    if not analysis:
        load_sample_data_internal()
        analysis = CACHED_DEMO_ANALYSIS

    result = query_engine.process_query(req.query, analysis)
    return result


@app.get("/api/evaluation-metrics")
def get_evaluation_metrics():
    global CACHED_DEMO_ANALYSIS, CACHED_PARSED_CANDIDATES, CACHED_JD
    if not CACHED_DEMO_ANALYSIS:
        load_sample_data_internal()

    analysis = CACHED_DEMO_ANALYSIS
    candidates = analysis.candidates
    jd = analysis.jd

    total_candidates = len(candidates)
    total_requirements = len(jd.must_have_skills + jd.technical_skills)

    # Match types breakdown
    total_direct = 0
    total_transferable = 0
    total_missing = 0
    total_tier3 = 0
    total_tier2 = 0
    total_tier1 = 0

    for c in candidates:
        for node in c.evidence_graph:
            if node.match_type == "direct":
                total_direct += 1
            elif node.match_type == "transferable":
                total_transferable += 1
            if node.evidence_strength == 3:
                total_tier3 += 1
            elif node.evidence_strength == 2:
                total_tier2 += 1
            elif node.evidence_strength == 1:
                total_tier1 += 1
        total_missing += len(c.missing_requirements)

    total_evidence_nodes = sum(len(c.evidence_graph) for c in candidates)
    evidence_coverage_pct = round(
        (sum(1 for c in candidates if c.components.evidence_strength >= 50.0) / total_candidates) * 100.0
        if total_candidates > 0 else 0.0, 1
    )

    # Semantic vs BM25 Divergence: % of pairs where semantic rank disagrees with BM25 rank
    ablation = analysis.ablation_summary or {}
    bm25_ranks = {item["candidate_id"]: item["rank"] for item in ablation.get("keyword_only", [])}
    sem_ranks = {item["candidate_id"]: item["rank"] for item in ablation.get("semantic_only", [])}
    divergence_count = 0
    for cid, b_rank in bm25_ranks.items():
        s_rank = sem_ranks.get(cid, b_rank)
        if abs(b_rank - s_rank) >= 2:
            divergence_count += 1
    
    divergence_rate_pct = round((divergence_count / total_candidates) * 100.0 if total_candidates > 0 else 0.0, 1)

    return {
        "total_candidates_evaluated": total_candidates,
        "total_target_requirements": total_requirements,
        "evidence_coverage_rate_pct": evidence_coverage_pct,
        "semantic_vs_bm25_divergence_pct": divergence_rate_pct,
        "direct_matches_count": total_direct,
        "transferable_matches_count": total_transferable,
        "missing_anchors_count": total_missing,
        "tier_distribution": {
            "tier_3_metric_outcomes": total_tier3,
            "tier_2_implementation_proof": total_tier2,
            "tier_1_keyword_mentions": total_tier1,
        },
        "deterministic_verification": "100% Deterministic (Zero Cloud AI)",
        "model_architecture": "Hybrid (MiniLM Embeddings + BM25 + RapidFuzz + Skill Ontology)",
        "ablation_proof_ready": bool(ablation)
    }


@app.get("/api/export/csv")
def export_shortlist_csv():
    global CACHED_DEMO_ANALYSIS
    if not CACHED_DEMO_ANALYSIS:
        load_sample_data_internal()

    import csv
    import io
    from fastapi.responses import Response

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Rank", "Candidate Name", "Final Score", "Must-Have Coverage %",
        "Semantic Relevance %", "Keyword Score %", "Evidence Strength %",
        "Top Highlight", "Remaining Gaps", "Evidence Confidence"
    ])

    for c in CACHED_DEMO_ANALYSIS.candidates:
        conf = "HIGH" if c.components.evidence_strength >= 70 else ("MEDIUM" if c.components.evidence_strength >= 40 else "LOW")
        writer.writerow([
            c.rank,
            c.candidate_name,
            c.final_score,
            c.components.required_coverage,
            c.components.semantic,
            c.components.keyword,
            c.components.evidence_strength,
            c.top_why.strongest_evidence or (c.reasons[0] if c.reasons else ""),
            "; ".join(c.missing_requirements[:2]),
            conf
        ])

    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=internloom_shortlist.csv"}
    )


