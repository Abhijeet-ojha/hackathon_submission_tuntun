# InternLoom Learning-to-Rank Ranker (ML Component B)

The **Learning-to-Rank Ranker** is a local, pairwise preference model trained on 15 normalized candidate-JD matching features. It runs alongside the deterministic engine with configurable hybrid score blending ($\alpha \cdot \text{Det} + (1-\alpha) \cdot \text{ML}$).

## 15 Feature Schema

1. `semantic_similarity`: Cosine similarity of section embeddings
2. `bm25_score`: BM25 lexical token match
3. `explicit_skill_match`: Canonical skill match score
4. `required_coverage`: % of Must-Have requirements met
5. `preferred_coverage`: % of Nice-to-Have skills met
6. `evidence_strength`: Average evidence tier (0–3)
7. `experience_project_depth`: Project semantic alignment
8. `education_role_fit`: Degree and major rule match
9. `direct_skill_count`: Number of direct skill matches
10. `transferable_skill_count`: Inferred transferable bridge count
11. `missing_required_count`: Unmet must-have count (penalty feature)
12. `tier_2_count`: Demonstrated project count
13. `tier_3_count`: Quantified outcome metrics count
14. `strongest_evidence_score`: Highest single evidence tier
15. `critical_requirement_coverage`: Non-linear penalty on missing must-haves

## Excluded Sensitive Attributes

- `candidate_name`, `gender`, `age`, `photo`, `address`, `phone`, `email`, `college_prestige`, `nationality`, `religion` are strictly excluded from the feature space to preserve algorithmic fairness.

## Commands

```bash
# Train pairwise model on development preference seed
python -m backend.ml.ranking.train

# Evaluate feature weights & diagnostics
python -m backend.ml.ranking.evaluate
```
