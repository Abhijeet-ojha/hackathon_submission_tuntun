import os
from typing import List, Dict, Tuple, Optional
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from ..models import ResumeIntelligence, JDIntelligence


class SemanticScorer:
    _instance = None
    _model = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(SemanticScorer, cls).__new__(cls)
        return cls._instance

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        if self._model is None:
            self.model_name = model_name
            self._load_model()

    def _load_model(self):
        try:
            from sentence_transformers import SentenceTransformer
            # Disable symlinks warnings on windows
            os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
            self._model = SentenceTransformer(self.model_name)
        except Exception as e:
            # Fallback to local tf-idf / n-gram vectorizer if model download fails or offline
            print(f"[SemanticScorer] SentenceTransformer initialization warning: {e}. Using local Sklearn embeddings.")
            self._model = None

    def encode_text(self, texts: List[str]) -> np.ndarray:
        valid_texts = [t if t and t.strip() else "empty text" for t in texts]
        if self._model is not None:
            try:
                embeddings = self._model.encode(valid_texts, convert_to_numpy=True, show_progress_bar=False)
                return embeddings
            except Exception:
                pass
        
        # Robust local Sklearn TF-IDF fallback vectorizer
        from sklearn.feature_extraction.text import TfidfVectorizer
        vec = TfidfVectorizer(ngram_range=(1, 2), min_df=1, sublinear_tf=True)
        try:
            return vec.fit_transform(valid_texts).toarray()
        except Exception:
            return np.zeros((len(valid_texts), 384))

    def compute_semantic_scores(
        self,
        candidate: ResumeIntelligence,
        jd: JDIntelligence
    ) -> Tuple[float, float, float]:
        """
        Computes (overall_semantic_score, project_relevance_score, raw_cosine_sim).
        All returned as 0.0 - 100.0 scales.
        """
        # 1. JD Chunk Representation
        jd_req_text = " ".join(jd.must_have_skills + jd.technical_skills)
        jd_resp_text = " ".join(jd.responsibilities) if jd.responsibilities else jd.raw_text
        jd_full_query = f"{jd.role_title}. Requirements: {jd_req_text}. Responsibilities: {jd_resp_text}"

        # 2. Candidate Representations
        candidate_skills_text = candidate.sections.get("skills", "")
        candidate_projects_text = candidate.sections.get("projects", "")
        candidate_exp_text = candidate.sections.get("experience", "")
        
        # Combine projects and experience
        cand_exp_proj_text = f"{candidate_projects_text}\n{candidate_exp_text}".strip()
        if not cand_exp_proj_text:
            cand_exp_proj_text = candidate.raw_text

        candidate_full_text = (
            f"Skills: {candidate_skills_text}\n"
            f"Projects: {candidate_projects_text}\n"
            f"Experience: {candidate_exp_text}\n"
            f"{candidate.raw_text[:800]}"
        ).strip()

        if not candidate_full_text:
            return 0.0, 0.0, 0.0

        texts_to_embed = [
            jd_full_query,          # 0: JD Full
            jd_resp_text,           # 1: JD Responsibilities
            candidate_full_text,    # 2: Candidate Full
            cand_exp_proj_text      # 3: Candidate Projects/Exp
        ]

        embeddings = self.encode_text(texts_to_embed)

        # Cosine similarities
        # Shape: (4, dim)
        emb_jd_full = embeddings[0].reshape(1, -1)
        emb_jd_resp = embeddings[1].reshape(1, -1)
        emb_cand_full = embeddings[2].reshape(1, -1)
        emb_cand_proj = embeddings[3].reshape(1, -1)

        sim_full = float(cosine_similarity(emb_jd_full, emb_cand_full)[0][0])
        sim_proj = float(cosine_similarity(emb_jd_resp, emb_cand_proj)[0][0])

        # Normalize cosine [-1, 1] -> [0, 100] with non-linear calibration for MiniLM
        # MiniLM typically ranges 0.3 - 0.85 for related technical texts
        norm_full = self._calibrate_cosine(sim_full)
        norm_proj = self._calibrate_cosine(sim_proj)

        return round(norm_full, 2), round(norm_proj, 2), round(float(sim_full), 4)

    def _calibrate_cosine(self, sim: float) -> float:
        # MiniLM cosine calibration curve:
        # sim <= 0.1 -> 0
        # sim == 0.4 -> 50
        # sim == 0.7 -> 85
        # sim >= 0.85 -> 98+
        if sim <= 0.1:
            return max(0.0, sim * 100.0)
        calibrated = ((sim - 0.1) / (0.85 - 0.1)) * 95.0 + 5.0
        return float(np.clip(calibrated, 0.0, 100.0))
