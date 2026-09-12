from typing import List, Tuple
from ..models import (
    CandidateScoreOutput, JDIntelligence, ScoreComponents,
    TopReasons, EvidenceGraphNode, UnderTheHoodMetrics
)


class ExplainabilityEngine:
    def __init__(self):
        pass

    def generate_candidate_explanation(
        self,
        candidate_name: str,
        components: ScoreComponents,
        matched_reqs: List[str],
        missing_reqs: List[str],
        partial_reqs: List[str],
        evidence_graph: List[EvidenceGraphNode],
        jd: JDIntelligence,
        parsing_status: str
    ) -> Tuple[TopReasons, List[str]]:
        """
        Assembles structured, deterministic explanation templates directly from
        the candidate's evidence graph and component scores.
        """
        highlights: List[str] = []
        gaps: List[str] = []
        strongest_evidence = ""
        potential_risk = ""
        bullet_reasons: List[str] = []

        if parsing_status in ["scanned_or_empty", "corrupted"]:
            return (
                TopReasons(
                    matched_highlights=["Document unreadable or scanned without OCR text."],
                    missing_gaps=["All requirements unverified due to PDF extraction failure."],
                    strongest_evidence="N/A",
                    potential_risk="PDF is scanned/image-based or corrupted. Needs manual resume review or OCR."
                ),
                ["Could not extract selectable text from PDF."]
            )

        # 1. Identify Strongest Evidence Quote (Tier 3 > Tier 2 > Tier 1)
        sorted_by_strength = sorted(
            [node for node in evidence_graph if node.evidence_strength > 0 and node.quote],
            key=lambda n: (n.evidence_strength, n.match_confidence),
            reverse=True
        )

        if sorted_by_strength:
            best_node = sorted_by_strength[0]
            strongest_evidence = f"[{best_node.requirement} - Level {best_node.evidence_strength}]: \"{best_node.quote}\""
        else:
            strongest_evidence = "Skills listed without contextual project/experience outcome metrics."

        # 2. Build Matched Highlights
        tier3_nodes = [n for n in evidence_graph if n.evidence_strength == 3]
        tier2_nodes = [n for n in evidence_graph if n.evidence_strength == 2]
        trans_nodes = [n for n in evidence_graph if n.match_type == "transferable"]

        if tier3_nodes:
            top_t3 = tier3_nodes[0]
            highlights.append(f"Demonstrated quantified impact in {top_t3.requirement} with verifiable outcomes.")
        
        if len(tier3_nodes) > 1:
            highlights.append(f"High evidence density: {len(tier3_nodes)} requirements backed by measurable metrics.")
        elif tier2_nodes:
            highlights.append(f"Demonstrated hands-on project implementation in {', '.join([n.requirement for n in tier2_nodes[:2]])}.")

        if trans_nodes:
            top_trans = trans_nodes[0]
            supports_str = ", ".join(top_trans.matched_via)
            highlights.append(f"Strong transferable background: {supports_str} supports {top_trans.requirement} requirement.")

        if components.required_coverage >= 90:
            highlights.append(f"Exceptional core alignment with {components.required_coverage:.0f}% must-have skill coverage.")

        if not highlights and matched_reqs:
            highlights.append(f"Matches key keywords: {', '.join(matched_reqs[:3])}.")

        # 3. Build Missing Gaps
        must_missing = [m for m in jd.must_have_skills if m in missing_reqs]
        if must_missing:
            gaps.append(f"Missing core must-have: {', '.join(must_missing)}.")
        
        nice_missing = [n for n in (jd.should_have_skills + jd.nice_to_have_skills) if n in missing_reqs]
        if nice_missing:
            gaps.append(f"Lacks preferred background in {', '.join(nice_missing[:2])}.")

        if not gaps:
            gaps.append("No critical requirement gaps identified.")

        # 4. Identify Potential Risks
        if must_missing:
            potential_risk = f"Missing {len(must_missing)} required must-have skills ({', '.join(must_missing[:2])})."
        elif components.evidence_strength < 40.0:
            potential_risk = "Skills are listed primarily as keywords without verified project demonstration."
        elif components.semantic < 50.0:
            potential_risk = "Lower semantic correlation with the specific domain responsibilities."
        else:
            potential_risk = "Low risk: Candidate displays verified competencies matching role specifications."

        # 5. Assemble Bullet Reasons
        bullet_reasons.append(f"Final Score: {components.semantic * 0.25 + components.keyword * 0.25 + components.required_coverage * 0.20 + components.preferred_coverage * 0.10 + components.evidence_strength * 0.10 + components.experience_relevance * 0.05 + components.education_fit * 0.05:.1f}/100")
        bullet_reasons.append(f"Must-Have Coverage: {components.required_coverage:.1f}% ({len(jd.must_have_skills) - len(must_missing)}/{len(jd.must_have_skills)} satisfied)")
        bullet_reasons.append(f"Evidence Strength Score: {components.evidence_strength:.1f}% based on project depth and outcome metrics")
        if trans_nodes:
            bullet_reasons.append(f"Transferable matches: {len(trans_nodes)} skills satisfied through adjacent ecosystem technologies")

        return (
            TopReasons(
                matched_highlights=highlights[:4],
                missing_gaps=gaps[:3],
                strongest_evidence=strongest_evidence,
                potential_risk=potential_risk
            ),
            bullet_reasons
        )
