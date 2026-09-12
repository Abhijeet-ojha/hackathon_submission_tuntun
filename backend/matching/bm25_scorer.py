import re
from typing import List, Dict
from rank_bm25 import BM25Okapi
from ..models import ResumeIntelligence, JDIntelligence


class BM25Scorer:
    def __init__(self):
        pass

    def tokenize(self, text: str) -> List[str]:
        # Lowercase and split into alphanumeric tokens
        clean = re.sub(r"[^a-zA-Z0-9+#.]", " ", text.lower())
        tokens = [t for t in clean.split() if len(t) > 1]
        return tokens

    def score_candidates(
        self,
        candidates: List[ResumeIntelligence],
        jd: JDIntelligence
    ) -> Dict[str, float]:
        """
        Computes BM25 relevance scores for all candidates in the batch against the JD.
        Normalized to 0.0 - 100.0 scale.
        """
        if not candidates:
            return {}

        # Prepare corpus: weighted token list for each candidate (skills & projects given higher density)
        corpus = []
        for cand in candidates:
            # Emphasize projects + experience + skills
            text_block = (
                f"{cand.sections.get('skills', '')} " * 2 +
                f"{cand.sections.get('projects', '')} " * 2 +
                f"{cand.sections.get('experience', '')} " +
                f"{cand.raw_text}"
            )
            corpus.append(self.tokenize(text_block))

        # Check if corpus is completely empty
        if not any(len(doc) > 0 for doc in corpus):
            return {c.candidate_id: 50.0 for c in candidates}

        bm25 = BM25Okapi(corpus)

        # Prepare query from JD requirements & responsibilities
        query_text = (
            " ".join(jd.must_have_skills) * 3 + " " +
            " ".join(jd.technical_skills) * 2 + " " +
            " ".join(jd.responsibilities) + " " +
            jd.role_title
        )
        query_tokens = self.tokenize(query_text)
        if not query_tokens:
            query_tokens = self.tokenize(jd.raw_text)

        raw_scores = bm25.get_scores(query_tokens)
        max_score = max(raw_scores) if len(raw_scores) > 0 and max(raw_scores) > 0 else 1.0

        results = {}
        for i, cand in enumerate(candidates):
            norm_score = (raw_scores[i] / max_score) * 100.0 if max_score > 0 else 50.0
            results[cand.candidate_id] = round(float(norm_score), 2)

        return results
