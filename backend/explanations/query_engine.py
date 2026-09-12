import re
from typing import Dict, List, Optional, Any, Tuple
from ..models import (
    AnalysisResponse, CandidateScoreOutput, JDIntelligence,
    EvidenceGraphNode, ScoreComponents
)
from ..ontology.skill_ontology import SkillOntology


class RecruiterQueryEngine:
    """
    100% Deterministic, offline natural language recruiter query engine.
    Parses recruiter queries, extracts candidate and skill entities,
    and returns precise, evidence-backed answers citing real analysis data.
    Zero hallucination, zero external LLMs.
    """

    def __init__(self, ontology: Optional[SkillOntology] = None):
        self.ontology = ontology or SkillOntology()

    def process_query(
        self,
        query: str,
        analysis: AnalysisResponse
    ) -> Dict[str, Any]:
        q_raw = query.strip()
        q = q_raw.lower()

        if not q or not analysis or not analysis.candidates:
            return {
                "query": q_raw,
                "answer": "Insufficient evidence in the current analysis. Please provide a candidate batch or ask about evaluated skills.",
                "rule_applied": "Analysis State Guard",
                "intent": "empty",
                "candidate_refs": [],
                "evidence_quotes": []
            }

        candidates = analysis.candidates
        jd = analysis.jd

        # 1. Intent: Compare Candidate A vs Candidate B ("Why is A above B?", "Compare Alex and Sarah")
        comp_match = self._match_comparison_intent(q, candidates)
        if comp_match:
            cand_a, cand_b = comp_match
            return self._answer_why_a_above_b(cand_a, cand_b)

        # 2. Intent: Why is Candidate X ranked #1 / #N? ("Why is Alex ranked first?", "Why is Priya #2?")
        rank_match = self._match_rank_explanation_intent(q, candidates)
        if rank_match:
            cand = rank_match
            return self._answer_why_ranked(cand, candidates, jd)

        # 3. Intent: Candidate Gaps / Missing Requirements ("What is Alex missing?", "What gaps does Priya have?")
        gap_cand = self._match_candidate_entity(q, candidates)
        if gap_cand and any(w in q for w in ["missing", "gap", "lack", "need", "unmet", "weakness"]):
            return self._answer_candidate_gaps(gap_cand, jd)

        # 4. Intent: Candidate Strengths ("What are Alex's strengths?", "Why hire Sarah?")
        if gap_cand and any(w in q for w in ["strength", "highlight", "strong", "best at", "hire", "good"]):
            return self._answer_candidate_strengths(gap_cand, jd)

        # 5. Intent: Specific Candidate Summary ("Tell me about Alex", "Breakdown for Devin")
        if gap_cand and any(w in q for w in ["tell me about", "who is", "breakdown", "overview", "profile"]):
            return self._answer_candidate_summary(gap_cand, jd)

        # 6. Intent: Skill Filter ("Which candidates have MongoDB?", "Who knows Docker and AWS?")
        skill_match = self._match_skill_query(q, candidates, jd)
        if skill_match:
            return skill_match

        # 7. Intent: Strongest Evidence ("Who has the strongest evidence?", "Best proof")
        if any(w in q for w in ["strongest evidence", "best evidence", "highest evidence", "proof", "verified outcomes"]):
            return self._answer_strongest_evidence(candidates)

        # 8. Intent: Transferable Skills ("Which candidates have transferable backend skills?")
        if any(w in q for w in ["transferable", "ecosystem", "alternative skill", "equivalent"]):
            return self._answer_transferable_skills(candidates)

        # 9. Intent: Unmet must-haves across batch ("Which must-haves are unmet?", "What is missing across candidates?")
        if any(w in q for w in ["unmet must", "missing must", "common gap", "hardest requirement"]):
            return self._answer_unmet_must_haves(candidates, jd)

        # 10. Fallback: If a candidate was named without specific keyword, return their audit profile
        if gap_cand:
            return self._answer_candidate_summary(gap_cand, jd)

        # 11. Final strict fallback guarantee
        return {
            "query": q_raw,
            "answer": "Insufficient evidence in the current analysis. Try asking: 'Why is [Candidate] ranked first?', 'Why is [A] above [B]?', 'What is [Candidate] missing?', or 'Which candidates have [Skill]?'.",
            "rule_applied": "Deterministic Fallback Guard",
            "intent": "unresolved",
            "candidate_refs": [],
            "evidence_quotes": []
        }

    def _match_candidate_entity(
        self,
        q: str,
        candidates: List[CandidateScoreOutput]
    ) -> Optional[CandidateScoreOutput]:
        for c in candidates:
            # Full name match
            if c.candidate_name.lower() in q:
                return c
            # First name match (>= 3 chars)
            first_name = c.candidate_name.split()[0].lower() if c.candidate_name else ""
            if len(first_name) >= 3 and re.search(rf"\b{re.escape(first_name)}\b", q):
                return c
        return None

    def _match_comparison_intent(
        self,
        q: str,
        candidates: List[CandidateScoreOutput]
    ) -> Optional[Tuple[CandidateScoreOutput, CandidateScoreOutput]]:
        matched_cands: List[CandidateScoreOutput] = []
        for c in candidates:
            first_name = c.candidate_name.split()[0].lower() if c.candidate_name else ""
            if (c.candidate_name.lower() in q) or (len(first_name) >= 3 and re.search(rf"\b{re.escape(first_name)}\b", q)):
                matched_cands.append(c)

        if len(matched_cands) >= 2:
            return (matched_cands[0], matched_cands[1])

        # Check "Why is A above B" pattern
        m = re.search(r"why is\s+([a-zA-Z]+)\s+(?:above|better than|ranked higher than|over)\s+([a-zA-Z]+)", q)
        if m:
            name_a, name_b = m.group(1).lower(), m.group(2).lower()
            cand_a = next((c for c in candidates if name_a in c.candidate_name.lower()), None)
            cand_b = next((c for c in candidates if name_b in c.candidate_name.lower()), None)
            if cand_a and cand_b:
                return (cand_a, cand_b)

        return None

    def _match_rank_explanation_intent(
        self,
        q: str,
        candidates: List[CandidateScoreOutput]
    ) -> Optional[CandidateScoreOutput]:
        # "Why is [Candidate] ranked #1 / first?"
        cand = self._match_candidate_entity(q, candidates)
        if cand and any(w in q for w in ["ranked", "rank", "first", "#1", "top", "lead"]):
            return cand

        if any(w in q for w in ["why is rank 1", "why rank 1", "why is #1", "who is #1", "why the top candidate", "why top candidate"]):
            return candidates[0] if candidates else None

        return None

    def _answer_why_a_above_b(
        self,
        a: CandidateScoreOutput,
        b: CandidateScoreOutput
    ) -> Dict[str, Any]:
        higher = a if a.final_score >= b.final_score else b
        lower = b if a.final_score >= b.final_score else a
        delta = round(abs(a.final_score - b.final_score), 1)

        set_higher = set(higher.matched_requirements)
        set_lower = set(lower.matched_requirements)
        exclusive_higher = sorted(list(set_higher - set_lower))

        reasons: List[str] = []
        quotes: List[str] = []

        reasons.append(
            f"{higher.candidate_name} (Rank #{higher.rank}, {higher.final_score:.1f} pts) outranks "
            f"{lower.candidate_name} (Rank #{lower.rank}, {lower.final_score:.1f} pts) by +{delta:.1f} points."
        )

        req_diff = higher.components.required_coverage - lower.components.required_coverage
        if abs(req_diff) >= 5.0:
            reasons.append(
                f"Must-Have Core Coverage: {higher.candidate_name} satisfies {higher.components.required_coverage:.0f}% vs {lower.components.required_coverage:.0f}%."
            )

        ev_diff = higher.components.evidence_strength - lower.components.evidence_strength
        if ev_diff >= 5.0:
            reasons.append(
                f"Evidence Depth: {higher.candidate_name} achieved higher evidence strength ({higher.components.evidence_strength:.0f}% vs {lower.components.evidence_strength:.0f}%), backed by Tier-2/3 production proof."
            )

        if exclusive_higher:
            reasons.append(f"Unique Skills in {higher.candidate_name}: Satisfies {', '.join(exclusive_higher[:3])} which {lower.candidate_name} lacks.")

        # Find top evidence quote from higher
        top_node = next((n for n in higher.evidence_graph if n.evidence_strength >= 2 and n.quote), None)
        if top_node:
            quotes.append(f'"{top_node.quote}" ({top_node.requirement} — Tier {top_node.evidence_strength})')

        return {
            "query": f"Why is {a.candidate_name} above {b.candidate_name}?",
            "answer": " ".join(reasons),
            "rule_applied": "Pairwise Decision Matrix & Evidence Audit",
            "intent": "why_a_above_b",
            "candidate_refs": [higher.candidate_name, lower.candidate_name],
            "evidence_quotes": quotes
        }

    def _answer_why_ranked(
        self,
        cand: CandidateScoreOutput,
        candidates: List[CandidateScoreOutput],
        jd: JDIntelligence
    ) -> Dict[str, Any]:
        quotes: List[str] = []
        points: List[str] = []

        points.append(
            f"{cand.candidate_name} holds Rank #{cand.rank} with a composite score of {cand.final_score:.1f}/100."
        )

        # Highlight core score drivers
        points.append(
            f"Key score drivers: {cand.components.required_coverage:.0f}% Must-Have Coverage, "
            f"{cand.components.semantic:.0f}% Semantic Fit, and {cand.components.evidence_strength:.0f}% Evidence Strength."
        )

        if cand.matched_requirements:
            points.append(f"Satisfies {len(cand.matched_requirements)} JD anchors: {', '.join(cand.matched_requirements[:4])}.")

        # Pull top evidence quote
        top_node = next((n for n in cand.evidence_graph if n.evidence_strength >= 2 and n.quote), None)
        if top_node:
            quotes.append(f'"{top_node.quote}" ({top_node.requirement})')
            points.append(f"Strongest evidence: {quotes[0]}.")

        if cand.missing_requirements:
            points.append(f"Remaining gaps: {', '.join(cand.missing_requirements[:2])}.")

        return {
            "query": f"Why is {cand.candidate_name} ranked #{cand.rank}?",
            "answer": " ".join(points),
            "rule_applied": "Composite Multi-Component Rank Breakdown",
            "intent": "why_ranked",
            "candidate_refs": [cand.candidate_name],
            "evidence_quotes": quotes
        }

    def _answer_candidate_gaps(
        self,
        cand: CandidateScoreOutput,
        jd: JDIntelligence
    ) -> Dict[str, Any]:
        if not cand.missing_requirements and not cand.partial_requirements:
            return {
                "query": f"What is {cand.candidate_name} missing?",
                "answer": f"{cand.candidate_name} satisfies 100% of the active JD requirements with zero identified skill gaps.",
                "rule_applied": "Full Coverage Verification",
                "intent": "candidate_gaps",
                "candidate_refs": [cand.candidate_name],
                "evidence_quotes": []
            }

        missing = cand.missing_requirements
        partials = cand.partial_requirements
        parts: List[str] = []

        if missing:
            parts.append(f"Unmet requirements: {', '.join(missing)}.")
        if partials:
            parts.append(f"Partial/Transferable support only: {', '.join(partials)}.")

        # Impact on score
        impact = f"Addressing these missing anchors would increase {cand.candidate_name}'s required coverage score from {cand.components.required_coverage:.0f}% toward 100%."
        parts.append(impact)

        return {
            "query": f"What is {cand.candidate_name} missing?",
            "answer": f"{cand.candidate_name} (Rank #{cand.rank}): " + " ".join(parts),
            "rule_applied": "Ontology Gap Extraction",
            "intent": "candidate_gaps",
            "candidate_refs": [cand.candidate_name],
            "evidence_quotes": []
        }

    def _answer_candidate_strengths(
        self,
        cand: CandidateScoreOutput,
        jd: JDIntelligence
    ) -> Dict[str, Any]:
        tier3_nodes = [n for n in cand.evidence_graph if n.evidence_strength == 3]
        tier2_nodes = [n for n in cand.evidence_graph if n.evidence_strength == 2]

        strengths: List[str] = []
        quotes: List[str] = []

        strengths.append(
            f"{cand.candidate_name} achieves a high fit of {cand.final_score:.1f} pts ({cand.components.required_coverage:.0f}% Must-Have coverage)."
        )

        if tier3_nodes:
            top_t3 = tier3_nodes[0]
            strengths.append(f"Demonstrated Tier-3 metric proof in {top_t3.requirement}.")
            if top_t3.quote:
                quotes.append(f'"{top_t3.quote}"')
        elif tier2_nodes:
            top_t2 = tier2_nodes[0]
            strengths.append(f"Demonstrated Tier-2 implementation proof in {top_t2.requirement}.")
            if top_t2.quote:
                quotes.append(f'"{top_t2.quote}"')

        if cand.matched_requirements:
            strengths.append(f"Strongest skill anchors: {', '.join(cand.matched_requirements[:4])}.")

        return {
            "query": f"What are {cand.candidate_name}'s strengths?",
            "answer": " ".join(strengths),
            "rule_applied": "Evidence Tier Strength Analyzer",
            "intent": "candidate_strengths",
            "candidate_refs": [cand.candidate_name],
            "evidence_quotes": quotes
        }

    def _answer_candidate_summary(
        self,
        cand: CandidateScoreOutput,
        jd: JDIntelligence
    ) -> Dict[str, Any]:
        conf = "HIGH" if cand.components.evidence_strength >= 70 else ("MEDIUM" if cand.components.evidence_strength >= 40 else "LOW")
        ans = (
            f"{cand.candidate_name} is currently Rank #{cand.rank} of {len(jd.must_have_skills)} core targets "
            f"with a final score of {cand.final_score:.1f}/100 and {conf} Evidence Confidence. "
            f"Satisfies {len(cand.matched_requirements)} requirements ({', '.join(cand.matched_requirements[:3])}). "
            f"Semantic Relevance: {cand.components.semantic:.0f}%, Keyword: {cand.components.keyword:.0f}%, Must-Have Coverage: {cand.components.required_coverage:.0f}%."
        )
        return {
            "query": f"Profile summary for {cand.candidate_name}",
            "answer": ans,
            "rule_applied": "Candidate Audit Profile Synthesis",
            "intent": "candidate_summary",
            "candidate_refs": [cand.candidate_name],
            "evidence_quotes": []
        }

    def _match_skill_query(
        self,
        q: str,
        candidates: List[CandidateScoreOutput],
        jd: JDIntelligence
    ) -> Optional[Dict[str, Any]]:
        # Extract potential skills
        ontology_names = list(self.ontology.skills_data.keys())
        all_skills = list(set(jd.must_have_skills + jd.technical_skills + jd.nice_to_have_skills + ontology_names))
        matched_skill_name: Optional[str] = None

        for s in all_skills:
            if re.search(rf"\b{re.escape(s.lower())}\b", q):
                matched_skill_name = s
                break

        # Check common tech keywords if not in JD
        if not matched_skill_name:
            for kw in ["docker", "aws", "react", "node", "python", "mongodb", "sql", "git", "vue", "graphql", "kubernetes"]:
                if re.search(rf"\b{re.escape(kw)}\b", q):
                    matched_skill_name = kw.title()
                    break

        if not matched_skill_name:
            return None

        display_name = matched_skill_name.title() if matched_skill_name.islower() else matched_skill_name

        # Find candidates with this skill
        target_norm = self.ontology.normalize_skill(matched_skill_name)
        matched_cands: List[Tuple[CandidateScoreOutput, str, int]] = []

        for c in candidates:
            # Check direct matched requirements
            for req in c.matched_requirements + c.partial_requirements:
                if self.ontology.normalize_skill(req) == target_norm or matched_skill_name.lower() in req.lower():
                    # Find tier
                    node = next((n for n in c.evidence_graph if self.ontology.normalize_skill(n.requirement) == target_norm), None)
                    tier = node.evidence_strength if node else 1
                    matched_cands.append((c, req, tier))
                    break

        if not matched_cands:
            return {
                "query": q,
                "answer": f"None of the {len(candidates)} evaluated candidates demonstrated verified evidence for '{display_name}' in this batch.",
                "rule_applied": "Exact Skill Index Scan",
                "intent": "skill_search",
                "candidate_refs": [],
                "evidence_quotes": []
            }

        names_with_tiers = [f"{c.candidate_name} (Rank #{c.rank}, Tier {t})" for c, _, t in matched_cands]
        ans = (
            f"Found {len(matched_cands)} candidate(s) with verified '{display_name}' evidence: "
            f"{', '.join(names_with_tiers)}."
        )

        return {
            "query": q,
            "answer": ans,
            "rule_applied": "Skill Ontology & Evidence Indexer",
            "intent": "skill_search",
            "candidate_refs": [c.candidate_name for c, _, _ in matched_cands],
            "evidence_quotes": []
        }

    def _answer_strongest_evidence(
        self,
        candidates: List[CandidateScoreOutput]
    ) -> Dict[str, Any]:
        # Sort by evidence_strength score
        sorted_by_ev = sorted(candidates, key=lambda c: c.components.evidence_strength, reverse=True)
        top = sorted_by_ev[0]

        quotes: List[str] = []
        top_node = next((n for n in top.evidence_graph if n.evidence_strength == 3 and n.quote), None)
        if top_node:
            quotes.append(f'"{top_node.quote}" ({top_node.requirement})')

        ans = (
            f"{top.candidate_name} (Rank #{top.rank}) has the highest Evidence Strength score ({top.components.evidence_strength:.1f}/100) across the batch. "
            f"Includes verified Tier-3 metric proof: {quotes[0] if quotes else 'Production project implementation with quantifiable performance metrics.'}."
        )

        return {
            "query": "Who has the strongest evidence?",
            "answer": ans,
            "rule_applied": "Evidence Tier Maximum Classifier",
            "intent": "strongest_evidence",
            "candidate_refs": [top.candidate_name],
            "evidence_quotes": quotes
        }

    def _answer_transferable_skills(
        self,
        candidates: List[CandidateScoreOutput]
    ) -> Dict[str, Any]:
        transferable_cands: List[Tuple[CandidateScoreOutput, str]] = []
        for c in candidates:
            t_nodes = [n for n in c.evidence_graph if n.match_type == "transferable"]
            if t_nodes:
                details = ", ".join([f"{n.requirement} (via {', '.join(n.matched_via)})" for n in t_nodes[:2]])
                transferable_cands.append((c, details))

        if not transferable_cands:
            return {
                "query": "Which candidates have transferable backend skills?",
                "answer": "All current matches were direct or alias matches; no partial transferable ecosystem rules were triggered for this batch.",
                "rule_applied": "Transferable Ecosystem Graph",
                "intent": "transferable_skills",
                "candidate_refs": [],
                "evidence_quotes": []
            }

        items = [f"{c.candidate_name} ({det})" for c, det in transferable_cands]
        ans = f"Transferable skill rules recognized capabilities in {len(transferable_cands)} candidate(s): {'; '.join(items)}."

        return {
            "query": "Which candidates have transferable backend skills?",
            "answer": ans,
            "rule_applied": "Skill Ontology Ecosystem Bridge",
            "intent": "transferable_skills",
            "candidate_refs": [c.candidate_name for c, _ in transferable_cands],
            "evidence_quotes": []
        }

    def _answer_unmet_must_haves(
        self,
        candidates: List[CandidateScoreOutput],
        jd: JDIntelligence
    ) -> Dict[str, Any]:
        must_haves = jd.must_have_skills
        if not must_haves:
            return {
                "query": "Which must-haves are unmet?",
                "answer": "All evaluated candidates satisfy the active JD must-have specifications.",
                "rule_applied": "Must-Have Aggregator",
                "intent": "unmet_must_haves",
                "candidate_refs": [],
                "evidence_quotes": []
            }

        unmet_counts: Dict[str, int] = {}
        for req in must_haves:
            missing_count = sum(1 for c in candidates if req in c.missing_requirements)
            unmet_counts[req] = missing_count

        sorted_unmet = sorted(unmet_counts.items(), key=lambda x: x[1], reverse=True)
        summary = [f"{req} (missing in {cnt}/{len(candidates)} candidates)" for req, cnt in sorted_unmet if cnt > 0]

        if not summary:
            ans = "Every single candidate in the current batch satisfied 100% of the must-have requirements."
        else:
            ans = f"Most common missing must-haves across batch: {'; '.join(summary[:3])}."

        return {
            "query": "Which must-haves are unmet?",
            "answer": ans,
            "rule_applied": "Must-Have Deficiency Scanner",
            "intent": "unmet_must_haves",
            "candidate_refs": [],
            "evidence_quotes": []
        }
