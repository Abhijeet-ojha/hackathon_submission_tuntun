import re
from typing import Tuple, Optional, List
from ..ontology.skill_ontology import SkillOntology


ACTION_VERBS = [
    r"\b(?:built|developed|engineered|implemented|architected|created|designed|integrated|deployed|refactored|optimized|automated|maintained|configured|trained|evaluated|tested|spearheaded|authored|orchestrated|fine-tuned|benchmarked)\b"
]

METRIC_PATTERNS = [
    r"\b\d+(?:\.\d+)?%",                                # 40%, 99.9%
    r"\b\d+\s*(?:ms|seconds|minutes|hours|days)\b",      # 200ms, 2 seconds
    r"\b(?:reduced|improved|increased|boosted|cut|saved|accelerated|scaled|handled|processed|optimized)\s+(?:by\s+)?(?:\d+|\$|latency|throughput|performance|accuracy|f1)",
    r"\b\d+[\d,]*\+?\s*(?:users|requests|req/s|rps|queries|records|qps|events|downloads|stars|views|students|clients|million|billion|k\b)",
    r"\b(?:1st|2nd|3rd|winner|finalist|top\s+\d+%)\b",
    r"\b\$\s*\d+[\d,]*"                                 # $10,000
]


class EvidenceExtractor:
    def __init__(self, ontology: Optional[SkillOntology] = None):
        self.ontology = ontology or SkillOntology()
        self.action_regex = re.compile("|".join(ACTION_VERBS), re.IGNORECASE)
        self.metric_regexes = [re.compile(p, re.IGNORECASE) for p in METRIC_PATTERNS]

    def extract_evidence_for_skill(self, skill: str, resume_sections: dict, raw_text: str) -> Tuple[int, str, str]:
        """
        Computes (evidence_level, evidence_quote, source_section) for a given skill.
        evidence_level:
          0 = Absent
          1 = Mentioned only
          2 = Demonstrated in project/role
          3 = Demonstrated with quantified metrics/outcomes
        """
        canonical = self.ontology.normalize_skill(skill) or skill
        aliases = [skill.lower()]
        entry = self.ontology.get_canonical_entry(canonical)
        if entry:
            aliases.extend([a.lower() for a in entry.get("aliases", [])])

        best_level = 0
        best_quote = ""
        best_section = ""

        # Priority scan order: projects -> experience -> internships -> certifications -> skills -> other -> profile
        scan_order = ["projects", "experience", "internships", "achievements", "certifications", "skills", "profile", "other"]

        for sec_name in scan_order:
            sec_text = resume_sections.get(sec_name, "")
            if not sec_text:
                continue

            sentences = self._split_into_sentences(sec_text)
            for sent in sentences:
                if self._contains_any_alias(sent, aliases):
                    level = self._classify_sentence_evidence(sent, sec_name)
                    if level > best_level:
                        best_level = level
                        best_quote = sent.strip()
                        best_section = sec_name
                        if best_level == 3:
                            # Found top tier evidence, no need to search further
                            return best_level, best_quote, best_section

        # If not found in structured sections, search raw text
        if best_level == 0 and raw_text:
            sentences = self._split_into_sentences(raw_text)
            for sent in sentences:
                if self._contains_any_alias(sent, aliases):
                    level = self._classify_sentence_evidence(sent, "general")
                    if level > best_level:
                        best_level = level
                        best_quote = sent.strip()
                        best_section = "general"

        return best_level, best_quote, best_section

    def _contains_any_alias(self, text: str, aliases: List[str]) -> bool:
        lower = text.lower()
        for alias in aliases:
            # Word boundary regex check
            pattern = rf"(?i)(?:\b|(?<=[^a-zA-Z0-9])){re.escape(alias)}(?:\b|(?=[^a-zA-Z0-9]))"
            if re.search(pattern, lower):
                return True
        return False

    def _classify_sentence_evidence(self, sentence: str, section_name: str) -> int:
        if not sentence or len(sentence.strip()) < 3:
            return 0

        has_action = bool(self.action_regex.search(sentence))
        has_metric = any(rgx.search(sentence) for rgx in self.metric_regexes)

        # Check for numbers / quantifiers in combination with action words
        has_numeric_token = bool(re.search(r"\b\d+(?:\.\d+)?\b", sentence))

        if (has_action or section_name in ["projects", "experience", "internships"]) and (has_metric or (has_action and has_numeric_token)):
            return 3
        elif has_action or section_name in ["projects", "experience", "internships"]:
            return 2
        else:
            return 1

    def _split_into_sentences(self, text: str) -> List[str]:
        # Split by bullet points, newlines, or sentence punctuation
        raw_chunks = re.split(r"[\r\n•\-\*\t]+|[.!?]\s+", text)
        clean_chunks = []
        for chunk in raw_chunks:
            clean = chunk.strip()
            if len(clean) > 8:
                clean_chunks.append(clean)
        return clean_chunks
