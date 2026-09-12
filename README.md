# InternLoom — Smart Shortlisting Engine

> **A 100% offline, auditable candidate intelligence engine combining semantic NLP, explicit skill ontology matching, contextual Evidence Tiers (0–3), custom local ML components (Evidence Classifier + Learning-to-Rank), and a Weighted Hybrid Ranker to help recruiters make fast, defensible, and bias-resistant shortlisting decisions.**

---

## 🏆 Hackathon Judge Quick Checklist (The 5 Critical Questions)

| Question | InternLoom Answer | Verification in App |
|---|---|---|
| **1. Can I understand what this does in 30 seconds?** | Yes. Upload resumes & JD → instant deterministic hybrid ranking with interactive radar charts, skill gap matrix, and top recruiter recommendations. | **Ranked Shortlist** tab & **Recruiter Brief** banner |
| **2. Can I verify why Candidate A outranked Candidate B?** | Yes. Transparent mathematical delta breakdown with exclusive skill matrices and head-to-head comparison dossiers. | **Compare Dossier** tab & `POST /api/query` comparator |
| **3. Can you prove semantic AND keyword matching both matter?** | Yes. BM25-only, MiniLM-only, and Hybrid rank orders demonstrably diverge (verified in live table and pytest). | **Ablation Proof** & **Evaluation Lab** tabs |
| **4. Can I trust the evidence on screen?** | Yes. Zero external LLM scoring or hallucination. Every metric traces directly to verbatim resume excerpts categorized into Evidence Tiers 0–3, and validated by a local ML classifier (90% CV Acc). | **Decision Audit** tab in candidate modal |
| **5. Does this look like a real product with real technical depth?** | Yes. Live formula weight calibration, ML Hybrid Blending Ratio (α) slider, JD bias & equity sanitizer, real CSV & JSON audit dossier downloads, and 28/28 passing automated unit tests. | Full Recruiter Studio & **Evaluation Lab** |

---

## 🤖 Custom ML Architecture (Iteration 4)

InternLoom uses machine learning to learn evidence quality and ranking preferences, while deterministic rules provide the auditability and safety layer.

**Learned models are optimization layers, not sources of truth.**

### A. Evidence Classifier (`backend/ml/evidence/`)

A local scikit-learn pipeline that classifies resume evidence spans against JD requirements into Tiers 0–3, replacing the previous rule-only heuristics with learned probabilistic predictions.

| Property | Value |
|---|---|
| **Model Type** | Logistic Regression (TF-IDF word + char N-gram features + dense NLP features) |
| **Training Data** | 80 curated examples across Tiers 0–3 with group IDs (development seed) |
| **Cross-Validation** | 4-fold GroupKFold (group-aware to prevent near-duplicate leakage) |
| **CV Accuracy** | **90.00%** (VALIDATED METRIC) |
| **Macro F1** | **0.8987** |
| **Safety Guardrails** | Bare skill lists bounded to Tier 1; false positive numbers bounded to Tier 2; non-bleed rules enforced deterministically |
| **Inference** | 100% local, CPU-only, zero cloud calls |

### B. Learning-to-Rank Model (`backend/ml/ranking/`)

A pairwise preference logistic regression that learns how 15 normalized matching signals should be weighted to reproduce observed recruiter candidate preferences.

| Property | Value |
|---|---|
| **Model Type** | Pairwise Preference Logistic Regression (no intercept, 15 features) |
| **Objective** | $P(A \succ B) = \sigma(w^T(x_A - x_B))$ — weights directly interpretable as feature importances |
| **Features** | semantic_similarity, bm25_score, explicit_skill_match, required_coverage, preferred_coverage, evidence_strength, experience_project_depth, education_role_fit, direct_skill_count, transferable_skill_count, missing_required_count, tier_2_count, tier_3_count, strongest_evidence_score, critical_requirement_coverage |
| **Pairwise Dev Accuracy** | **80.00%** (DIAGNOSTIC — development preference seed) |
| **Hybrid Blending** | $\text{Final Score} = \alpha \cdot \text{Deterministic} + (1-\alpha) \cdot \text{LearnedML}$ where $\alpha \in [0, 1]$ |
| **Default Alpha (α)** | 0.75 (75% Deterministic / 25% Learned ML) |

### C. Ethical AI Exclusion Audit

10 demographic and pedigree attributes are **strictly excluded** from all features used by both models:

| Excluded Attribute | Reason |
|---|---|
| `candidate_name` | Demographic & ethnic proxy; strictly excluded to prevent bias |
| `gender` | Protected demographic class; strictly excluded |
| `age` | Protected class & anti-ageism equity guard; graduation year excluded |
| `photo` | Physical appearance & demographic proxy; strictly excluded |
| `address` | Geographic location & socioeconomic proxy; strictly excluded |
| `phone` | Geographic area code proxy; strictly excluded |
| `email` | Personal demographic identifier; strictly excluded |
| `college_prestige` | Socioeconomic pedigree bias; high project density prioritized instead |
| `nationality` | Protected immigration & national origin status; strictly excluded |
| `religion` | Protected demographic class; strictly excluded |

---

## 🎯 Hard Technical Guarantees

1. **Zero External AI / API Calls**: 100% offline local execution using `sentence-transformers` (`all-MiniLM-L6-v2`), `rank_bm25`, `rapidfuzz`, `PyMuPDF` (`fitz`) / `pdfplumber`, and `scikit-learn`. No OpenAI, Anthropic, or external API keys required.
2. **Deterministic & Inspectable**: No LLM-as-a-scorer hallucinations. Every score and explanation originates from structured evidence records with source citations and verified quotes.
3. **Dual-Signal Load-Bearing Architecture**: Both semantic NLP (MiniLM embeddings) AND keyword/ontology signals materially affect final rankings (verified via automated ablation testing).
4. **Contextual Evidence Tiers (0–3)**:
   - **Tier 0 (Absent)**: Requirement not found in candidate profile.
   - **Tier 1 (Mentioned)**: Listed as a keyword without project context.
   - **Tier 2 (Demonstrated)**: Used in project or work experience with active action verbs.
   - **Tier 3 (Measurable Impact)**: Demonstrated with quantified metrics, throughput numbers, latency reductions, or concrete deliverables.
5. **Transferable Skill Ontology**: Express.js + MongoDB gives transferable credit for Node.js / Backend without semantic bleeding (Python strictly never satisfies Java Spring Boot).
6. **Student Equity & Recency**: Short resumes with high project density are rewarded for evidence depth without negative penalties for shorter calendar years.
7. **JD Bias & Sanity Detector**: Flags unrealistic expectations (e.g. 5+ years experience for intern roles), narrow version locks (e.g. React 18.2.0 strictly), and exclusionary phrasing.
8. **Mathematical Score Contributions**: Every score component is bounded to $[0, 100]$ and scaled by the formula weight:
   $$\text{Final Score} = \sum_{i} \left( \text{Component Score}_i \times \frac{\text{Weight}_i}{\sum W} \right)$$
   All contributions sum exactly to the final candidate score.

---

## 🏗️ Architecture & Pipeline

```
PDF Resumes (15-18) ───► Text Extraction (PyMuPDF/pdfplumber) ───► Section Segmentation
Job Description (JD) ──► Rule-Based Intelligence Classifier (Must / Should / Nice)
                                      │
                                      ▼
                        Skill Ontology Normalization
                                      │
         ┌────────────────────────────┼────────────────────────────┐
         ▼                            ▼                            ▼
 Keyword / Fuzzy Match          BM25 Lexical Score        Semantic Embeddings
  (RapidFuzz + Ontology)         (Rank-BM25 Okapi)        (Local MiniLM Cosine)
         │                            │                            │
         └────────────────────────────┼────────────────────────────┘
                                      ▼
                       Evidence Strength Classifier
                      (Tier 0–3 Rules + ML Classifier)  ← NEW ML Layer
                                      │
                                      ▼
                        Weighted Hybrid Ranker
                    (7 Configurable Components)
                                      │
                                      ▼
                   Learning-to-Rank Hybrid Blending          ← NEW ML Layer
               α·Deterministic + (1-α)·LearnedML
                                      │
         ┌────────────────────────────┼────────────────────────────┐
         ▼                            ▼                            ▼
 Top-3 Explainability        Why A over B Diff          JD Bias Inspector
  (Traceable Quotes)         (Pairwise Compare)         (Flag & Suggest)
         │                            │                            │
         ▼                            ▼                            ▼
 Offline Recruiter Copilot    Evaluation Lab Metrics     Decision Audit Breakdown
```

---

## 📊 7-Factor Weighted Scoring Formula

| Component | Default Weight | How It's Computed | Contribution Formula |
|---|---|---|---|
| **Semantic Relevance** | 25% | Cosine similarity of JD requirement chunks vs. resume section embeddings via local MiniLM-L6-v2 | $\text{Score} \times 0.25 / \sum W$ |
| **Explicit Skill / Keyword Match** | 25% | RapidFuzz token and partial matching against canonicalized ontology aliases | $\text{Score} \times 0.25 / \sum W$ |
| **Required (Must-Have) Coverage** | 20% | % of mandatory requirements satisfied (1.0x for direct, 0.65x for transferable) | $\text{Score} \times 0.20 / \sum W$ |
| **Preferred Skill Coverage** | 10% | % of should-have and nice-to-have skills matched | $\text{Score} \times 0.10 / \sum W$ |
| **Evidence Strength** | 10% | Average evidence tier (0–3) across matched skills scaled to 100% | $\text{Score} \times 0.10 / \sum W$ |
| **Experience & Project Depth** | 5% | Semantic similarity of candidate's project/experience text vs. JD responsibilities | $\text{Score} \times 0.05 / \sum W$ |
| **Education & Role Fit** | 5% | Rule-based match against degree and major requirements in JD | $\text{Score} \times 0.05 / \sum W$ |

*Recruiters can adjust all 7 weights live using the in-app Formula & ML Tuner drawer, choose archetypes (Hybrid Default, 100% Rules Strict, Evidence Heavy, 100% Learned ML), and control the ML blend α slider.*

---

## 🔬 Evaluation Lab & Empirical Metrics

The **Evaluation Lab** provides a judge-facing audit cockpit with computed empirical metrics across the candidate pool:
- **Evaluated Batch**: Candidate count and total parsed JD anchors.
- **Evidence Coverage Rate**: Percentage of candidates with verified Tier 2+ evidence.
- **Semantic vs. BM25 Divergence %**: Demonstrates rank ordering shift between pure lexical retrieval and dense semantic embeddings.
- **Ontology Bridges Count**: Quantitative tracking of inferred transferable skill matches.
- **Evidence Tier Distribution**: Live counts of Tier 3 (Metrics), Tier 2 (Actions), and Tier 1 (Keywords).
- **Ablation Divergence Table**: Side-by-side comparison of BM25-only rank, MiniLM-only rank, and Hybrid score.
- **Custom ML Components Validation**: 90.00% CV Accuracy badge, 4×4 confusion matrix, LTR diagnostics, and 10-item Ethical AI Exclusion Audit Table.

---

## 💬 Deterministic Recruiter Query Engine

InternLoom features an **offline natural query parser** that answers recruiter questions without calling external LLMs:
- *"Why is Alex ranked first?"* → Multi-component score breakdown with top evidence quotes and Must-Have coverage.
- *"Why is Priya ranked above Carlos?"* → Score differential, exclusive strengths, and tier advantages.
- *"Which candidates have React?"* → Scans ontology index and returns ranked list with evidence citations.
- *"What are Sarah's gaps?"* → Returns unmet JD requirements and recommended interview probing questions.
- **Strict Fallback Guarantee**: If an intent cannot be resolved with high confidence, returns *"Insufficient evidence in the current analysis."* rather than hallucinating.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.10+ (tested on Python 3.12)
- Node.js 18+ & npm

### 2. Start the Backend (FastAPI)
```bash
# In project root:
python backend_runner.py
# Or directly via uvicorn:
python -m uvicorn backend.api.server:app --host 127.0.0.1 --port 8000
```
Backend API will be live at `http://127.0.0.1:8000` (interactive Swagger docs at `http://127.0.0.1:8000/docs`).

### 3. Start the Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Frontend Dashboard will be live at `http://localhost:5173`.

---

## 🧪 Comprehensive Automated Test Suite (28/28 Passing)

Run the full pytest suite:
```bash
python -m pytest backend/tests/ -v
```

### Verified Test Cases:
1. `test_ablation.py`: Keyword-only, semantic-only, and hybrid rankings produce divergent orderings, proving both signals are load-bearing.
2. `test_comparator.py`: Validates mathematical score delta, exclusive skills identification, and reason generation in pairwise comparisons.
3. `test_evidence_classifier.py`: Verifies Tier 0, 1, 2, and 3 classifications on sample sentences with metrics and action verbs.
4. `test_evidence_determinism.py`: Evidence classifier returns identical predictions across 10 repeated runs (100% deterministic).
5. `test_evidence_model_loading.py`: Evidence model loads from disk and is immediately available for inference.
6. `test_evidence_no_keyword_shortcut.py`: Bare skill lists (no verbs or metrics) are correctly bounded to Tier 1 maximum.
7. `test_evidence_numeric_false_positive.py`: Year numbers like "2021" are not falsely detected as performance metrics.
8. `test_evidence_prediction_schema.py`: Every prediction returns tier, confidence, label, reason, probabilities, and model_version.
9. `test_evidence_tier_boundaries.py`: Enforces Tier 2 cap on false positives and Tier 1 cap on bare keyword-only texts.
10. `test_hybrid_ranking.py`: Verifies that hybrid (α=0.75), deterministic (α=1.0), and learned (α=0.0) modes all produce valid and consistent rankings.
11. `test_ml_status.py`: `/api/ml/status` and `/api/ml/evaluation` endpoints return correct offline-mode indicators and evaluation data.
12. `test_negative_bleed.py`: Protects negative skill boundaries — `Python` strictly never satisfies `Java Spring Boot`.
13. `test_offline_inference.py`: Zero network calls are made during any inference (Evidence Classifier + LTR Ranker + MiniLM).
14. `test_ontology.py`: Canonical normalization (`"NodeJS" == "Node.js"`, `"ReactJS" == "React.js"`, `"RESTful API" ≈ "REST API"`).
15. `test_pdf_resilience.py`: Corrupt PDF, empty PDF, scanned PDF, short student resume, and long resume all process safely in batch without crashing.
16. `test_query_engine.py` (4 tests): Deterministic recruiter query engine with why-rank-1, why-A-above-B, skill search, and fallback on unresolved queries.
17. `test_ranker_loading.py`: Learned LTR ranker loads from disk and is available for inference.
18. `test_ranking_determinism.py` (2 tests): Identical scores and ranks across multiple runs + all 7 components bounded within $[0, 100]$.
19. `test_ranking_explainability.py`: Feature contributions and model explanations are produced for every candidate.
20. `test_ranking_fallback.py`: Graceful fallback to deterministic scoring when ML model is unavailable.
21. `test_ranking_feature_schema.py`: All 15 extracted features are bounded to $[0, 1]$ and named according to schema.
22. `test_ranking_missing_must_have.py`: Candidates missing must-have requirements are correctly penalized in learned ranking.
23. `test_ranking_no_sensitive_features.py`: Confirmed absence of all 10 demographic attributes from the feature extractor.
24. `test_transferable.py`: `Express + MongoDB` experience raises Node.js relevance without the literal string "Node.js".

---

## 📂 Project Structure

```
├── backend/
│   ├── api/             # FastAPI routes (/api/analyze, /api/rescore, /api/query, /api/ml/status, /api/ml/evaluation)
│   ├── jd_intel/        # Rule-based JD parser, requirement classifier, and bias detector
│   ├── matching/        # KeywordMatcher, BM25Scorer, SemanticScorer, EvidenceExtractor
│   ├── ml/
│   │   ├── evidence/    # Evidence Classifier (TF-IDF + NLP features + Logistic Regression, GroupKFold CV)
│   │   │   ├── data/    # evidence_seed.csv (80 training examples)
│   │   │   ├── model.joblib  # Trained model artifact
│   │   │   ├── classifier.py, features.py, train.py, evaluate.py, inference.py
│   │   │   └── README.md
│   │   └── ranking/     # Learning-to-Rank (Pairwise Preference Logistic Regression, 15 features)
│   │       ├── data/    # ranking_seed.csv (pairwise preference pairs)
│   │       ├── model.joblib  # Trained ranker artifact
│   │       ├── ranker.py, features.py, pairwise.py, train.py, evaluate.py, inference.py
│   │       └── README.md
│   ├── ontology/        # Curated skill ontology (skills.json + SkillOntology class)
│   ├── parsers/         # PDF parser (fitz + pdfplumber fallback) and section segmenter
│   ├── ranking/         # Weighted hybrid scorer and ablation engine
│   ├── explanations/    # Top-3 why-this-candidate, why-A-over-B comparator, query engine
│   ├── models.py        # Typed Pydantic models for data contracts
│   ├── sample_loader.py # Demo dataset loader (16 realistic resumes + sample JDs)
│   └── tests/           # 28 automated pytest test suites
├── frontend/
│   ├── src/
│   │   ├── components/  # RecruiterBrief, DecisionAudit, EvaluationLab, CandidateCard, SkillGapMatrix, CompareDossier, WeightsDrawer (ML α slider), etc.
│   │   ├── services/    # API client with CSV/JSON exports, ML status/evaluation/rescore endpoints
│   │   ├── types/       # TypeScript interface contracts (FeatureContribution, MLStatus, EvidencePrediction, etc.)
│   │   ├── App.tsx      # Main application state, ML mode switcher, and copilot query handler
│   │   └── index.css    # Paper notebook design system & glassmorphism tokens
│   ├── package.json
│   └── vite.config.ts
├── data/
│   ├── sample_jds/      # Sample Job Descriptions (Full-Stack & ML Engineer)
│   └── sample_resumes/  # 16 realistic PDF resumes for local testing
├── backend_runner.py    # Uvicorn launcher
└── README.md
```
