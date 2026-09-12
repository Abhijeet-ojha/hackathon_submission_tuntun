import pytest
from backend.ontology.skill_ontology import SkillOntology


def test_ontology_normalization():
    ontology = SkillOntology()
    
    # Requirement §10: "NodeJS" == "Node.js", "ReactJS" == "React.js", "RESTful API" ≈ "REST API"
    assert ontology.normalize_skill("NodeJS") == "Node.js"
    assert ontology.normalize_skill("nodejs") == "Node.js"
    assert ontology.normalize_skill("Node.js") == "Node.js"
    assert ontology.normalize_skill("node js") == "Node.js"

    assert ontology.normalize_skill("ReactJS") == "React.js"
    assert ontology.normalize_skill("react.js") == "React.js"
    assert ontology.normalize_skill("React") == "React.js"

    assert ontology.normalize_skill("RESTful API") == "REST API"
    assert ontology.normalize_skill("REST APIs") == "REST API"
    assert ontology.normalize_skill("api development") == "REST API"

    assert ontology.normalize_skill("TypeScript") == "TypeScript"
    assert ontology.normalize_skill("TS") == "TypeScript"

    assert ontology.normalize_skill("PostgreSQL") == "PostgreSQL"
    assert ontology.normalize_skill("postgres") == "PostgreSQL"
