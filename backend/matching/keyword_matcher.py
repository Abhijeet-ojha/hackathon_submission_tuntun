from typing import List, Dict, Tuple, Optional
import rapidfuzz
from rapidfuzz import fuzz
from ..models import (
    JDIntelligence, ResumeIntelligence, ExtractedSkill,
    EvidenceGraphNode, UnderTheHoodMetrics
)
from ..ontology.skill_ontology import SkillOntology
from .evidence_extractor import EvidenceExtractor


class KeywordMatcher:
    def __init__(self, ontology: Optional[SkillOntology] = None):
        self.ontology = ontology or SkillOntology()
        self.evidence_extractor = EvidenceExtractor(self.ontology)

    def match_candidate(
        self,
        candidate: ResumeIntelligence,
        jd: JDIntelligence
    ) -> Tuple[float, float, float, List[str], List[str], List[str], List[EvidenceGraphNode], UnderTheHoodMetrics]:
        """
        Evaluates candidate against JD requirements.
        Returns:
          (keyword_score, required_coverage, preferred_coverage,
           matched_reqs, missing_reqs, partial_reqs, evidence_graph, under_the_hood)
        """
        all_reqs = list(dict.fromkeys(jd.must_have_skills + jd.should_have_skills + jd.nice_to_have_skills + jd.technical_skills))
        if not all_reqs:
            all_reqs = ["General Software Engineering"]

        matched_reqs: List[str] = []
        missing_reqs: List[str] = []
        partial_reqs: List[str] = []
        evidence_graph: List[EvidenceGraphNode] = []
        transferable_matches: List[dict] = []
        raw_evidence_levels: Dict[str, int] = {}

        # Pre-extract all skills found in candidate text
        candidate_skills_map = self._extract_candidate_skills(candidate)

        total_direct_points = 0.0
        total_transferable_points = 0.0

        for req in all_reqs:
            req_canonical = self.ontology.normalize_skill(req) or req
            
            # 1. Check direct or alias match
            is_direct = False
            best_confidence = 0.0
            matched_alias = req
            
            if req_canonical.lower() in candidate_skills_map:
                is_direct = True
                best_confidence = 1.0
                matched_alias = candidate_skills_map[req_canonical.lower()]["raw_text"]
            else:
                # Fuzzy check across candidate raw text & extracted skills
                for cand_skill_key, skill_info in candidate_skills_map.items():
                    score = fuzz.ratio(req_canonical.lower(), cand_skill_key)
                    if score >= 88.0 and score > best_confidence * 100:
                        is_direct = True
                        best_confidence = score / 100.0
                        matched_alias = skill_info["raw_text"]

            # Extract evidence tier & quote
            ev_level, ev_quote, ev_section = self.evidence_extractor.extract_evidence_for_skill(
                req_canonical, candidate.sections, candidate.raw_text
            )
            raw_evidence_levels[req] = ev_level

            if is_direct:
                matched_reqs.append(req)
                total_direct_points += 1.0 * best_confidence
                
                evidence_graph.append(EvidenceGraphNode(
                    requirement=req,
                    matched_via=[matched_alias],
                    evidence_source=f"{ev_section.title()}: {ev_quote[:120]}" if ev_quote else ev_section.title(),
                    evidence_strength=ev_level,
                    match_confidence=round(best_confidence, 2),
                    match_type="direct",
                    quote=ev_quote
                ))
            else:
                # 2. Check transferable support skills
                transferable_supports = []
                for cand_skill_key, skill_info in candidate_skills_map.items():
                    if self.ontology.is_transferable_support(cand_skill_key, req_canonical):
                        transferable_supports.append(skill_info["canonical"])

                if transferable_supports:
                    partial_reqs.append(req)
                    # Partial transferable credit (0.65x)
                    trans_credit = 0.65
                    total_transferable_points += trans_credit
                    
                    # Gather evidence from the supporting skills
                    sup_ev_level = 0
                    sup_quote = ""
                    sup_section = ""
                    for sup in transferable_supports:
                        s_lvl, s_q, s_sec = self.evidence_extractor.extract_evidence_for_skill(
                            sup, candidate.sections, candidate.raw_text
                        )
                        if s_lvl > sup_ev_level:
                            sup_ev_level = s_lvl
                            sup_quote = s_q
                            sup_section = s_sec

                    raw_evidence_levels[req] = sup_ev_level

                    transferable_matches.append({
                        "requirement": req,
                        "supported_by": transferable_supports,
                        "credit": trans_credit
                    })

                    evidence_graph.append(EvidenceGraphNode(
                        requirement=req,
                        matched_via=transferable_supports,
                        evidence_source=f"Transferable ({', '.join(transferable_supports[:2])}) in {sup_section.title()}",
                        evidence_strength=sup_ev_level,
                        match_confidence=0.75,
                        match_type="transferable",
                        quote=sup_quote or f"Demonstrated transferable proficiency through {', '.join(transferable_supports)}"
                    ))
                else:
                    missing_reqs.append(req)
                    evidence_graph.append(EvidenceGraphNode(
                        requirement=req,
                        matched_via=[],
                        evidence_source="Not found in candidate profile",
                        evidence_strength=0,
                        match_confidence=0.0,
                        match_type="direct",
                        quote=""
                    ))

        # Coverage Computations
        must_haves = jd.must_have_skills if jd.must_have_skills else all_reqs[:3]
        nice_haves = [s for s in (jd.should_have_skills + jd.nice_to_have_skills) if s not in must_haves]

        must_matched = [m for m in must_haves if m in matched_reqs]
        must_partial = [m for m in must_haves if m in partial_reqs]
        must_missing = [m for m in must_haves if m in missing_reqs]

        required_coverage = 0.0
        if must_haves:
            # Full credit for direct, 0.65 for partial
            required_coverage = (len(must_matched) * 1.0 + len(must_partial) * 0.65) / len(must_haves) * 100.0
        else:
            required_coverage = 100.0

        preferred_coverage = 0.0
        if nice_haves:
            nice_matched = [n for n in nice_haves if n in matched_reqs]
            nice_partial = [n for n in nice_haves if n in partial_reqs]
            preferred_coverage = (len(nice_matched) * 1.0 + len(nice_partial) * 0.65) / len(nice_haves) * 100.0
        else:
            preferred_coverage = 100.0

        keyword_score = min(100.0, ((total_direct_points + total_transferable_points) / max(1, len(all_reqs))) * 100.0)

        under_the_hood = UnderTheHoodMetrics(
            fuzzy_token_score=round(keyword_score, 2),
            must_have_matches=must_matched + [f"{p} (transferable)" for p in must_partial],
            must_have_missing=must_missing,
            transferable_matches=transferable_matches,
            raw_evidence_levels=raw_evidence_levels
        )

        return (
            round(keyword_score, 2),
            round(required_coverage, 2),
            round(preferred_coverage, 2),
            matched_reqs,
            missing_reqs,
            partial_reqs,
            evidence_graph,
            under_the_hood
        )

    def _extract_candidate_skills(self, candidate: ResumeIntelligence) -> Dict[str, dict]:
        """Extracts all matching ontology skills found in candidate text."""
        skills_found: Dict[str, dict] = {}
        all_ontology_skills = self.ontology.get_all_skills()

        for entry in all_ontology_skills:
            canonical = entry.get("canonical", "")
            aliases = [canonical.lower()] + [a.lower() for a in entry.get("aliases", [])]

            found_alias = None
            # Search in skills section first, then projects, then experience, then raw text
            for sec_name in ["skills", "projects", "experience", "internships", "achievements"]:
                sec_text = candidate.sections.get(sec_name, "")
                for alias in aliases:
                    # check word boundary
                    if rapidfuzz.fuzz.partial_ratio(alias, sec_text.lower()) >= 92:
                        found_alias = alias
                        break
                if found_alias:
                    break

            if not found_alias:
                # check in raw text
                for alias in aliases:
                    if f" {alias} " in f" {candidate.raw_text.lower()} ":
                        found_alias = alias
                        break

            if found_alias:
                skills_found[canonical.lower()] = {
                    "canonical": canonical,
                    "raw_text": found_alias,
                    "category": entry.get("category", "technical")
                }

        return skills_found
