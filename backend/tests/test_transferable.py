import pytest
from backend.models import ResumeIntelligence, JDIntelligence
from backend.matching.keyword_matcher import KeywordMatcher
from backend.ontology.skill_ontology import SkillOntology


def test_transferable_support_express_mongo_to_node():
    ontology = SkillOntology()
    matcher = KeywordMatcher(ontology)

    # Candidate with NO literal mention of "Node.js" or "Node"
    candidate = ResumeIntelligence(
        candidate_id="cand_transferable",
        candidate_name="Transferable Developer",
        sections={
            "skills": "JavaScript, Express.js, MongoDB, RESTful API, Git",
            "projects": "Built e-commerce backend using Express.js and MongoDB database with 15 REST endpoints."
        },
        raw_text="JavaScript, Express.js, MongoDB, RESTful API, Git. Built e-commerce backend using Express.js and MongoDB."
    )

    jd = JDIntelligence(
        role_title="Backend Engineer",
        must_have_skills=["Node.js", "REST API"],
        should_have_skills=["Git"]
    )

    (
        kw_score, req_cov, pref_cov,
        matched, missing, partial,
        evidence_graph, under_the_hood
    ) = matcher.match_candidate(candidate, jd)

    # Node.js must be in partial (transferable) matches
    assert "Node.js" in partial
    assert "Node.js" not in missing
    # Required coverage must receive transferable credit (> 60%)
    assert req_cov >= 80.0
    # Must have transferable matches recorded
    assert len(under_the_hood.transferable_matches) > 0
    assert any(m["requirement"] == "Node.js" for m in under_the_hood.transferable_matches)
