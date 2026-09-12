from typing import Dict, List
from ..models import CandidateScoreOutput, ComparisonDelta


class CandidateComparator:
    def __init__(self):
        pass

    def compare_candidates(
        self,
        candidate_a: CandidateScoreOutput,
        candidate_b: CandidateScoreOutput
    ) -> ComparisonDelta:
        """
        Generates pairwise diff and structured bullet comparison for Why A over B.
        """
        score_delta = round(candidate_a.final_score - candidate_b.final_score, 2)
        superior_id = candidate_a.candidate_id if score_delta >= 0 else candidate_b.candidate_id

        # Component deltas (A - B)
        comp_deltas: Dict[str, float] = {
            "semantic": round(candidate_a.components.semantic - candidate_b.components.semantic, 2),
            "keyword": round(candidate_a.components.keyword - candidate_b.components.keyword, 2),
            "required_coverage": round(candidate_a.components.required_coverage - candidate_b.components.required_coverage, 2),
            "preferred_coverage": round(candidate_a.components.preferred_coverage - candidate_b.components.preferred_coverage, 2),
            "evidence_strength": round(candidate_a.components.evidence_strength - candidate_b.components.evidence_strength, 2),
            "experience_relevance": round(candidate_a.components.experience_relevance - candidate_b.components.experience_relevance, 2),
            "education_fit": round(candidate_a.components.education_fit - candidate_b.components.education_fit, 2),
        }

        # Requirement diffs
        set_a_matched = set(candidate_a.matched_requirements + candidate_a.partial_requirements)
        set_b_matched = set(candidate_b.matched_requirements + candidate_b.partial_requirements)

        exclusive_a = sorted(list(set_a_matched - set_b_matched))
        exclusive_b = sorted(list(set_b_matched - set_a_matched))

        # Generate structured bullet summary
        bullets: List[str] = []
        lead_cand = candidate_a if score_delta >= 0 else candidate_b
        trail_cand = candidate_b if score_delta >= 0 else candidate_a
        abs_delta = abs(score_delta)

        if abs_delta < 1.0:
            bullets.append(f"Near-parity match: {lead_cand.candidate_name} and {trail_cand.candidate_name} have nearly identical scoring profiles (diff of {abs_delta:.1f} pts).")
        else:
            bullets.append(f"{lead_cand.candidate_name} ranks higher by +{abs_delta:.1f} points (Score: {lead_cand.final_score:.1f} vs {trail_cand.final_score:.1f}).")

        # Check required coverage delta
        req_diff = comp_deltas["required_coverage"] if score_delta >= 0 else -comp_deltas["required_coverage"]
        if abs(req_diff) >= 5.0:
            bullets.append(f"Must-Have Coverage: {lead_cand.candidate_name} holds a {abs(req_diff):.1f}% advantage in satisfying core requirements.")

        # Check evidence strength delta
        ev_diff = comp_deltas["evidence_strength"] if score_delta >= 0 else -comp_deltas["evidence_strength"]
        if abs(ev_diff) >= 10.0:
            bullets.append(f"Evidence Depth: {lead_cand.candidate_name} demonstrated higher evidence tiers (Tier 2/3 verified outcomes vs keyword mentions).")

        # Exclusive skills
        lead_exclusive = exclusive_a if score_delta >= 0 else exclusive_b
        trail_exclusive = exclusive_b if score_delta >= 0 else exclusive_a

        if lead_exclusive:
            bullets.append(f"Unique Capabilities in {lead_cand.candidate_name}: Satisfies {', '.join(lead_exclusive[:3])} which {trail_cand.candidate_name} lacks.")

        if trail_exclusive:
            bullets.append(f"Counter-Strengths in {trail_cand.candidate_name}: Uniquely provides {', '.join(trail_exclusive[:2])}.")

        # Semantic relevance
        sem_diff = comp_deltas["semantic"] if score_delta >= 0 else -comp_deltas["semantic"]
        if abs(sem_diff) >= 8.0:
            bullets.append(f"Contextual Relevance: {lead_cand.candidate_name}'s past projects align closer to the JD's specific domain duties (+{abs(sem_diff):.1f}% semantic similarity).")

        return ComparisonDelta(
            candidate_a=candidate_a,
            candidate_b=candidate_b,
            score_delta=score_delta,
            superior_candidate_id=superior_id,
            summary_bullets=bullets,
            exclusive_to_a=exclusive_a,
            exclusive_to_b=exclusive_b,
            component_deltas=comp_deltas
        )
