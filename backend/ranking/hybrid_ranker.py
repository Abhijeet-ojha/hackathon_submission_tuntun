import re
from typing import List, Dict, Tuple, Optional
from ..models import (
    ResumeIntelligence, JDIntelligence, CandidateScoreOutput,
    ScoreComponents, ScoringWeights, TopReasons, UnderTheHoodMetrics
)
from ..ontology.skill_ontology import SkillOntology
from ..matching.keyword_matcher import KeywordMatcher
from ..matching.bm25_scorer import BM25Scorer
from ..matching.semantic_scorer import SemanticScorer
from ..matching.evidence_extractor import EvidenceExtractor
from ..explanations.explainer import ExplainabilityEngine


class HybridCandidateRanker:
    def __init__(
        self,
        ontology: Optional[SkillOntology] = None,
        keyword_matcher: Optional[KeywordMatcher] = None,
        bm25_scorer: Optional[BM25Scorer] = None,
        semantic_scorer: Optional[SemanticScorer] = None,
        evidence_extractor: Optional[EvidenceExtractor] = None,
        explainer: Optional[ExplainabilityEngine] = None
    ):
        self.ontology = ontology or SkillOntology()
        self.keyword_matcher = keyword_matcher or KeywordMatcher(self.ontology)
        self.bm25_scorer = bm25_scorer or BM25Scorer()
        self.semantic_scorer = semantic_scorer or SemanticScorer()
        self.evidence_extractor = evidence_extractor or EvidenceExtractor(self.ontology)
        self.explainer = explainer or ExplainabilityEngine()

    def rank_candidates(
        self,
        candidates: List[ResumeIntelligence],
        jd: JDIntelligence,
        weights: Optional[ScoringWeights] = None
    ) -> List[CandidateScoreOutput]:
        """
        Processes a batch of candidates against a JD and returns sorted candidate score outputs.
        """
        if not candidates:
            return []

        weights = weights or ScoringWeights()

        # Step 1: Batch BM25 scoring across all candidates
        bm25_scores = self.bm25_scorer.score_candidates(candidates, jd)

        scored_outputs: List[CandidateScoreOutput] = []

        for candidate in candidates:
            # Check edge cases (corrupt/empty/scanned)
            if candidate.parsing_status in ["scanned_or_empty", "corrupted"]:
                score_out = self._create_failed_candidate_output(candidate, jd)
                scored_outputs.append(score_out)
                continue

            # Step 2: Keyword, Coverage, and Evidence Graph matching
            (
                keyword_score,
                required_coverage,
                preferred_coverage,
                matched_reqs,
                missing_reqs,
                partial_reqs,
                evidence_graph,
                under_the_hood
            ) = self.keyword_matcher.match_candidate(candidate, jd)

            # Step 3: Semantic Embeddings & Project Relevance
            semantic_score, proj_relevance, raw_cosine = self.semantic_scorer.compute_semantic_scores(
                candidate, jd
            )

            # Step 4: Evidence Strength Component Score (0 - 100)
            # Compute average evidence tier across matched requirements
            matched_nodes = [n for n in evidence_graph if n.evidence_strength > 0]
            if matched_nodes:
                # Level 3 = 100%, Level 2 = 66.7%, Level 1 = 33.3%
                avg_level = sum(n.evidence_strength for n in matched_nodes) / len(matched_nodes)
                evidence_strength_score = min(100.0, (avg_level / 3.0) * 100.0)
            else:
                evidence_strength_score = 0.0

            # Step 5: Education & Role Fit Score
            education_fit_score = self._compute_education_fit(candidate, jd)

            # Step 6: Combine components using normalized weights
            components = ScoreComponents(
                semantic=round(semantic_score, 2),
                keyword=round(keyword_score, 2),
                required_coverage=round(required_coverage, 2),
                preferred_coverage=round(preferred_coverage, 2),
                evidence_strength=round(evidence_strength_score, 2),
                experience_relevance=round(proj_relevance, 2),
                education_fit=round(education_fit_score, 2)
            )

            total_weight = (
                weights.semantic + weights.keyword + weights.required_coverage +
                weights.preferred_coverage + weights.evidence_strength +
                weights.experience_relevance + weights.education_fit
            )
            if total_weight <= 0:
                total_weight = 1.0

            final_score = (
                (components.semantic * weights.semantic) +
                (components.keyword * weights.keyword) +
                (components.required_coverage * weights.required_coverage) +
                (components.preferred_coverage * weights.preferred_coverage) +
                (components.evidence_strength * weights.evidence_strength) +
                (components.experience_relevance * weights.experience_relevance) +
                (components.education_fit * weights.education_fit)
            ) / total_weight

            # Update under the hood metrics
            under_the_hood.bm25_score = bm25_scores.get(candidate.candidate_id, 0.0)
            under_the_hood.raw_cosine_similarity = raw_cosine

            # Step 7: Explanations
            top_why, reasons = self.explainer.generate_candidate_explanation(
                candidate_name=candidate.candidate_name,
                components=components,
                matched_reqs=matched_reqs,
                missing_reqs=missing_reqs,
                partial_reqs=partial_reqs,
                evidence_graph=evidence_graph,
                jd=jd,
                parsing_status=candidate.parsing_status
            )

            sections_summary = {
                sec: len(text.split()) for sec, text in candidate.sections.items() if text
            }

            scored_outputs.append(CandidateScoreOutput(
                candidate_id=candidate.candidate_id,
                candidate_name=candidate.candidate_name,
                rank=1,
                final_score=round(final_score, 2),
                components=components,
                matched_requirements=matched_reqs,
                missing_requirements=missing_reqs,
                partial_requirements=partial_reqs,
                evidence_graph=evidence_graph,
                reasons=reasons,
                top_why=top_why,
                under_the_hood=under_the_hood,
                sections_summary=sections_summary,
                parsing_status=candidate.parsing_status
            ))

        # Step 8: Deterministic Sort & Assign Ranks
        # Primary: final_score descending, Secondary: required_coverage, Tertiary: evidence_strength
        scored_outputs.sort(
            key=lambda c: (c.final_score, c.components.required_coverage, c.components.evidence_strength),
            reverse=True
        )

        for i, cand_out in enumerate(scored_outputs):
            cand_out.rank = i + 1

        return scored_outputs

    def compute_ablation(
        self,
        candidates: List[ResumeIntelligence],
        jd: JDIntelligence
    ) -> Dict[str, List[Dict[str, any]]]:
        """
        Ablation Check:
        Computes Keyword-only ranking, Semantic-only ranking, and Hybrid ranking.
        Proves both signals are load-bearing and influence ranking order.
        """
        # Keyword-only weights (100% keyword/coverage, 0% semantic)
        kw_weights = ScoringWeights(
            semantic=0.0,
            keyword=0.50,
            required_coverage=0.30,
            preferred_coverage=0.10,
            evidence_strength=0.10,
            experience_relevance=0.0,
            education_fit=0.0
        )
        # Semantic-only weights (100% semantic/experience, 0% keyword)
        sem_weights = ScoringWeights(
            semantic=0.70,
            keyword=0.0,
            required_coverage=0.0,
            preferred_coverage=0.0,
            evidence_strength=0.05,
            experience_relevance=0.25,
            education_fit=0.0
        )
        # Standard Hybrid weights
        hybrid_weights = ScoringWeights()

        kw_ranked = self.rank_candidates(candidates, jd, kw_weights)
        sem_ranked = self.rank_candidates(candidates, jd, sem_weights)
        hybrid_ranked = self.rank_candidates(candidates, jd, hybrid_weights)

        def to_summary(rank_list):
            return [
                {
                    "rank": c.rank,
                    "candidate_id": c.candidate_id,
                    "candidate_name": c.candidate_name,
                    "score": c.final_score
                }
                for c in rank_list
            ]

        # Calculate divergence count
        kw_order = [c.candidate_id for c in kw_ranked]
        sem_order = [c.candidate_id for c in sem_ranked]
        hybrid_order = [c.candidate_id for c in hybrid_ranked]

        divergence = (kw_order != sem_order) or (kw_order != hybrid_order) or (sem_order != hybrid_order)

        return {
            "is_divergent": divergence,
            "keyword_only": to_summary(kw_ranked),
            "semantic_only": to_summary(sem_ranked),
            "hybrid": to_summary(hybrid_ranked)
        }

    def _compute_education_fit(self, candidate: ResumeIntelligence, jd: JDIntelligence) -> float:
        edu_text = candidate.sections.get("education", "") + " " + candidate.raw_text[:500]
        if not jd.education_requirements:
            return 85.0

        score = 70.0
        # Check computer science / engineering keywords
        if re.search(r"(?i)\b(?:computer science|software engineering|information technology|computer engineering|data science)\b", edu_text):
            score += 20.0
        # Check degree level
        if re.search(r"(?i)\b(?:bachelor|master|phd|b\.?s\.?|m\.?s\.?|b\.?tech|m\.?tech)\b", edu_text):
            score += 10.0

        return min(100.0, score)

    def _create_failed_candidate_output(self, candidate: ResumeIntelligence, jd: JDIntelligence) -> CandidateScoreOutput:
        components = ScoreComponents()
        top_why, reasons = self.explainer.generate_candidate_explanation(
            candidate_name=candidate.candidate_name,
            components=components,
            matched_reqs=[],
            missing_reqs=jd.must_have_skills,
            partial_reqs=[],
            evidence_graph=[],
            jd=jd,
            parsing_status=candidate.parsing_status
        )
        return CandidateScoreOutput(
            candidate_id=candidate.candidate_id,
            candidate_name=candidate.candidate_name,
            rank=999,
            final_score=0.0,
            components=components,
            matched_requirements=[],
            missing_requirements=jd.must_have_skills,
            partial_requirements=[],
            evidence_graph=[],
            reasons=reasons,
            top_why=top_why,
            under_the_hood=UnderTheHoodMetrics(),
            sections_summary={},
            parsing_status=candidate.parsing_status
        )
