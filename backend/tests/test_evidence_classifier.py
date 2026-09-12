import pytest
from backend.matching.evidence_extractor import EvidenceExtractor
from backend.ontology.skill_ontology import SkillOntology


def test_evidence_tier_classification():
    ontology = SkillOntology()
    extractor = EvidenceExtractor(ontology)

    # Level 1: Mentioned only in skill list
    sections_lvl1 = {"skills": "React.js, Node.js, Python, Git"}
    lvl1, quote1, sec1 = extractor.extract_evidence_for_skill("React.js", sections_lvl1, "")
    assert lvl1 == 1

    # Level 2: Demonstrated in project with action verb but no metric
    sections_lvl2 = {
        "projects": "Built e-commerce web application using React.js and Express with responsive layout."
    }
    lvl2, quote2, sec2 = extractor.extract_evidence_for_skill("React.js", sections_lvl2, "")
    assert lvl2 == 2

    # Level 3: Demonstrated with measurable outcome / metric
    sections_lvl3 = {
        "experience": "Engineered REST APIs using Node.js handling 15,000 req/sec with 99.99% uptime and reduced latency by 42%."
    }
    lvl3, quote3, sec3 = extractor.extract_evidence_for_skill("Node.js", sections_lvl3, "")
    assert lvl3 == 3
    assert "42%" in quote3 or "15,000" in quote3
