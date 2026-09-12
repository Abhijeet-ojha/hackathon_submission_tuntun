import pytest
from backend.models import ResumeIntelligence, JDIntelligence
from backend.matching.keyword_matcher import KeywordMatcher
from backend.ontology.skill_ontology import SkillOntology


def test_python_never_satisfies_java_spring_boot():
    ontology = SkillOntology()
    matcher = KeywordMatcher(ontology)

    # Candidate with pure Python and Django/FastAPI
    python_candidate = ResumeIntelligence(
        candidate_id="cand_python_only",
        candidate_name="Python Specialist",
        sections={
            "skills": "Python, Django, FastAPI, Pandas, NumPy, Scikit-Learn",
            "experience": "Senior Python developer building web APIs with FastAPI and Django."
        },
        raw_text="Python, Django, FastAPI, Pandas, NumPy, Scikit-Learn. Senior Python developer building web APIs with FastAPI."
    )

    jd = JDIntelligence(
        role_title="Enterprise Java Developer",
        must_have_skills=["Java", "Spring Boot"],
        should_have_skills=["SQL"]
    )

    (
        kw_score, req_cov, pref_cov,
        matched, missing, partial,
        evidence_graph, under_the_hood
    ) = matcher.match_candidate(python_candidate, jd)

    # Both Java and Spring Boot MUST be in missing requirements
    assert "Java" in missing
    assert "Spring Boot" in missing
    assert "Java" not in matched
    assert "Spring Boot" not in matched
    assert "Java" not in partial
    assert "Spring Boot" not in partial
    # Required coverage must be 0%
    assert req_cov == 0.0
