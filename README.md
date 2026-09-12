# InternLoom Smart Shortlisting Engine

> **An evidence-driven candidate intelligence engine that combines semantic understanding, explicit skill matching, contextual evidence, and transparent ranking to help recruiters make faster, more defensible decisions.**

---

## 🎯 Key Capabilities & Hard Guarantees

1. **Zero External AI/API Calls**: 100% offline local NLP execution using `sentence-transformers` (`all-MiniLM-L6-v2`), `rank_bm25`, `rapidfuzz`, and `PyMuPDF` (`fitz`) / `pdfplumber`. No external API keys required.
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
                                      │
                                      ▼
                        Recruiter SaaS Dashboard
```

---

## 📊 7-Factor Weighted Scoring Formula

| Component | Default Weight | How It's Computed |
|---|---|---|
| **Semantic Relevance** | 25% | Cosine similarity of JD requirement chunks vs. resume section embeddings via local MiniLM-L6-v2 |
| **Explicit Skill / Keyword Match** | 25% | RapidFuzz token and partial matching against canonicalized ontology aliases |
| **Required (Must-Have) Coverage** | 20% | % of mandatory requirements satisfied (1.0x for direct, 0.65x for transferable) |
| **Preferred Skill Coverage** | 10% | % of should-have and nice-to-have skills matched |
| **Evidence Strength** | 10% | Average evidence tier (0–3) across matched skills scaled to 100% |
| **Experience & Project Depth** | 5% | Semantic similarity of candidate's project/experience text vs. JD responsibilities |
| **Education & Role Fit** | 5% | Rule-based match against degree and major requirements in JD |

*Recruiters can adjust all 7 weights live using the in-app Formula Weight Tuner drawer.*

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.10+ (tested on Python 3.12)
- Node.js 18+ & npm

### 2. Start the Backend (FastAPI)
```bash
# In project root:
python -m uvicorn backend.api.server:app --reload --port 8000
```
Backend API will be live at `http://127.0.0.1:8000` (docs at `http://127.0.0.1:8000/docs`).

### 3. Start the Frontend (React + Vite)
```bash
cd frontend
npm run dev
```
Frontend Dashboard will be live at `http://localhost:5173`.

---

## 🧪 Test Suite

Run the full pytest suite:
```bash
python -m pytest backend/tests/ -v
```

### Verified Test Cases:
1. `test_ontology.py`: Canonical normalization (`"NodeJS" == "Node.js"`, `"ReactJS" == "React.js"`, `"RESTful API" ≈ "REST API"`).
2. `test_transferable.py`: `Express + MongoDB` experience raises Node.js relevance without the literal string "Node.js".
3. `test_negative_bleed.py`: `Python` strictly never satisfies `Java Spring Boot`.
4. `test_pdf_resilience.py`: Corrupt PDF, empty PDF, scanned PDF, short student resume, and long resume all process safely in batch without crashing.
5. `test_ablation.py`: Keyword-only, semantic-only, and hybrid rankings produce divergent orderings, proving both signals are load-bearing.
6. `test_evidence_classifier.py`: Verifies Tier 0, 1, 2, and 3 classifications on sample sentences.

---

## 📂 Project Structure

```
├── backend/
│   ├── api/             # FastAPI routes (/api/analyze, /api/rescore, /api/compare, etc.)
│   ├── jd_intel/        # Rule-based JD parser, requirement classifier, and bias detector
│   ├── matching/        # KeywordMatcher, BM25Scorer, SemanticScorer, EvidenceExtractor
│   ├── ontology/        # Curated skill ontology (skills.json + SkillOntology class)
│   ├── parsers/         # PDF parser (fitz + pdfplumber fallback) and section segmenter
│   ├── ranking/         # Weighted hybrid scorer and ablation engine
│   ├── explanations/    # Top-3 why-this-candidate, why-A-over-B comparator, bias detector
│   ├── models.py        # Typed Pydantic models for data contracts
│   ├── sample_loader.py # Demo dataset loader (16 realistic resumes + sample JDs)
│   └── tests/           # Full pytest test suite
├── frontend/
│   ├── src/
│   │   ├── components/  # Radar charts, candidate cards, evidence graph, comparison view
│   │   ├── services/    # API client communicating with backend
│   │   ├── types/       # TypeScript interface contracts
│   │   ├── App.tsx      # Main application state and view router
│   │   └── index.css    # Tailwind CSS and glassmorphism design system
├── data/
│   ├── sample_jds/      # Sample Job Descriptions (Full-Stack & ML Engineer)
│   └── sample_resumes/  # 16 realistic PDF resumes for local testing
└── README.md
```
