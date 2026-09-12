# InternLoom — Smart Shortlisting Engine

> **A 100% deterministic, offline candidate intelligence engine that combines semantic NLP, explicit skill ontology matching, contextual evidence tiers (0–3), and auditable mathematical ranking to help recruiters make fast, defensible, and bias-resistant shortlisting decisions.**

---

## 🏆 Hackathon Judge Quick Checklist (The 5 Critical Questions)

| Question | InternLoom Answer | Verification in App |
|---|---|---|
| **1. Can I understand what this does in 30 seconds?** | Yes. Upload resumes & JD $\rightarrow$ instant deterministic hybrid ranking with interactive radar charts, skill gap matrix, and top recruiter recommendations. | **Ranked Shortlist** tab & **Recruiter Brief** banner |
| **2. Can I verify why Candidate A outranked Candidate B?** | Yes. Transparent mathematical delta breakdown with exclusive skill matrices and head-to-head comparison dossiers. | **Compare Dossier** tab & `POST /api/query` comparator |
| **3. Can you prove semantic AND keyword matching both matter?** | Yes. BM25-only, MiniLM-only, and Hybrid rank orders demonstrably diverge (verified in live table and pytest). | **Ablation Proof** & **Evaluation Lab** tabs |
| **4. Can I trust the evidence on screen?** | Yes. Zero external LLM scoring or hallucination. Every metric traces directly to verbatim resume excerpts categorized into Evidence Tiers 0–3. | **Decision Audit** tab in candidate modal |
| **5. Does this look like a real product with real technical depth?** | Yes. Live formula weight calibration, JD bias & equity sanitizer, real CSV & JSON audit dossier downloads, and 13/13 passing automated unit tests. | Full Recruiter Studio & **Evaluation Lab** |

---

## 🎯 Hard Technical Guarantees

1. **Zero External AI / API Calls**: 100% offline local execution using `sentence-transformers` (`all-MiniLM-L6-v2`), `rank_bm25`, `rapidfuzz`, and `PyMuPDF` (`fitz`) / `pdfplumber`. No OpenAI, Anthropic, or external API keys required.
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
                           (Tier 0–3 Heuristics)
                                      │
                                      ▼
                        Weighted Hybrid Ranker
                    (7 Configurable Components)
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

*Recruiters can adjust all 7 weights live using the in-app Formula Weight Tuner drawer or choose archetypes (Balanced, Semantic-Heavy, Strict Skills, Project-Driven).*

---

## 🔬 Evaluation Lab & Empirical Metrics

The **Evaluation Lab** provides a judge-facing audit cockpit with computed empirical metrics across the candidate pool:
- **Evaluated Batch**: Candidate count and total parsed JD anchors.
- **Evidence Coverage Rate**: Percentage of candidates with verified Tier 2+ evidence.
- **Semantic vs. BM25 Divergence %**: Demonstrates rank ordering shift between pure lexical retrieval and dense semantic embeddings.
- **Ontology Bridges Count**: Quantitative tracking of inferred transferable skill matches.
- **Evidence Tier Distribution**: Live counts of Tier 3 (Metrics), Tier 2 (Actions), and Tier 1 (Keywords).
- **Ablation Divergence Table**: Side-by-side comparison of BM25-only rank, MiniLM-only rank, and Hybrid score.

---

## 💬 Deterministic Recruiter Query Engine

InternLoom features an **offline natural query parser** that answers recruiter questions without calling external LLMs:
- *"Why is Alex ranked first?"* $\rightarrow$ Multi-component score breakdown with top evidence quotes and Must-Have coverage.
- *"Why is Priya ranked above Carlos?"* $\rightarrow$ Score differential, exclusive strengths, and tier advantages.
- *"Which candidates have React?"* $\rightarrow$ Scans ontology index and returns ranked list with evidence citations.
- *"What are Sarah's gaps?"* $\rightarrow$ Returns unmet JD requirements and recommended interview probing questions.
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

## 🧪 Comprehensive Automated Test Suite (13/13 Passing)

Run the full pytest suite:
```bash
python -m pytest backend/tests/ -v
```

### Verified Test Cases:
1. `test_ablation.py`: Keyword-only, semantic-only, and hybrid rankings produce divergent orderings, proving both signals are load-bearing.
2. `test_comparator.py`: Validates mathematical score delta, exclusive skills identification, and reason generation in pairwise comparisons.
3. `test_evidence_classifier.py`: Verifies Tier 0, 1, 2, and 3 classifications on sample sentences with metrics and action verbs.
4. `test_negative_bleed.py`: Protects negative skill boundaries — `Python` strictly never satisfies `Java Spring Boot`.
5. `test_ontology.py`: Canonical normalization (`"NodeJS" == "Node.js"`, `"ReactJS" == "React.js"`, `"RESTful API" ≈ "REST API"`).
6. `test_pdf_resilience.py`: Corrupt PDF, empty PDF, scanned PDF, short student resume, and long resume all process safely in batch without crashing.
7. `test_query_engine.py` (4 tests):
   - `test_recruiter_query_engine_why_rank_1`: Deterministic breakdown of Rank #1.
   - `test_recruiter_query_engine_why_a_above_b`: Comparative explanation between two candidates.
   - `test_recruiter_query_engine_skill_search`: Exact candidate filtering by skill query.
   - `test_recruiter_query_engine_fallback_on_unresolved`: Zero-hallucination fallback on ambiguous queries.
8. `test_ranking_determinism.py` (2 tests):
   - `test_ranking_is_100_percent_deterministic`: Identical scores and ranks across multiple runs.
   - `test_score_components_are_strictly_bounded_0_to_100`: Verifies all 7 components are normalized within $[0, 100]$.
9. `test_transferable.py`: `Express + MongoDB` experience raises Node.js relevance without the literal string "Node.js".

---

## 📂 Project Structure

```
├── backend/
│   ├── api/             # FastAPI routes (/api/analyze, /api/rescore, /api/query, /api/evaluation-metrics, /api/export/csv)
│   ├── jd_intel/        # Rule-based JD parser, requirement classifier, and bias detector
│   ├── matching/        # KeywordMatcher, BM25Scorer, SemanticScorer, EvidenceExtractor
│   ├── ontology/        # Curated skill ontology (skills.json + SkillOntology class)
│   ├── parsers/         # PDF parser (fitz + pdfplumber fallback) and section segmenter
│   ├── ranking/         # Weighted hybrid scorer and ablation engine
│   ├── explanations/    # Top-3 why-this-candidate, why-A-over-B comparator, query engine
│   ├── models.py        # Typed Pydantic models for data contracts
│   ├── sample_loader.py # Demo dataset loader (16 realistic resumes + sample JDs)
│   └── tests/           # 13 automated pytest test suites
├── frontend/
│   ├── src/
│   │   ├── components/  # RecruiterBrief, DecisionAudit, EvaluationLab, CandidateCard, SkillGapMatrix, CompareDossier, etc.
│   │   ├── services/    # API client with CSV/JSON exports and query endpoints
│   │   ├── types/       # TypeScript interface contracts
│   │   ├── App.tsx      # Main application state, views, and copilot query handler
│   │   └── index.css    # Paper notebook design system & glassmorphism tokens
│   ├── package.json
│   └── vite.config.ts
├── data/
│   ├── sample_jds/      # Sample Job Descriptions (Full-Stack & ML Engineer)
│   └── sample_resumes/  # 16 realistic PDF resumes for local testing
├── backend_runner.py    # Uvicorn launcher
└── README.md
```
