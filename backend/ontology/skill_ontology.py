import json
import os
from typing import Dict, List, Optional, Tuple, Set
import rapidfuzz
from rapidfuzz import fuzz


class SkillOntology:
    def __init__(self, skills_json_path: Optional[str] = None):
        if skills_json_path is None:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            skills_json_path = os.path.join(current_dir, "skills.json")
        
        self.skills_json_path = skills_json_path
        self.skills_data: Dict[str, dict] = {}
        self.alias_to_canonical: Dict[str, str] = {}
        self.canonical_to_entry: Dict[str, dict] = {}
        self.load_ontology()

    def load_ontology(self):
        if not os.path.exists(self.skills_json_path):
            raise FileNotFoundError(f"Ontology file not found at {self.skills_json_path}")
        
        with open(self.skills_json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            self.skills_data = data.get("skills", {})
            
        self.alias_to_canonical = {}
        self.canonical_to_entry = {}

        for key, entry in self.skills_data.items():
            canonical = entry.get("canonical", key.title())
            self.canonical_to_entry[canonical.lower()] = entry
            self.canonical_to_entry[key.lower()] = entry

            # Map key and all aliases
            self.alias_to_canonical[key.lower()] = canonical
            for alias in entry.get("aliases", []):
                self.alias_to_canonical[alias.lower()] = canonical

    def normalize_skill(self, text: str) -> Optional[str]:
        """Returns canonical name for text if an exact alias or high fuzzy match exists."""
        clean = text.strip().lower()
        if not clean:
            return None
        
        # 1. Direct alias match
        if clean in self.alias_to_canonical:
            return self.alias_to_canonical[clean]
        
        # 2. Punctuation normalized match (e.g. node.js -> nodejs, c++ -> cpp)
        clean_no_punct = clean.replace(".", "").replace("-", "").replace(" ", "")
        for alias, canonical in self.alias_to_canonical.items():
            alias_no_punct = alias.replace(".", "").replace("-", "").replace(" ", "")
            if clean_no_punct == alias_no_punct:
                return canonical
        
        # 3. Fuzzy match against aliases with strict threshold
        best_match = None
        best_score = 0.0
        for alias, canonical in self.alias_to_canonical.items():
            # Exact token ratio or partial ratio for compound phrases
            score = fuzz.ratio(clean, alias)
            if score > best_score and score >= 88.0:
                best_score = score
                best_match = canonical
                
        return best_match

    def is_transferable_support(self, candidate_skill: str, required_skill: str) -> bool:
        """
        Check if candidate_skill supports required_skill (e.g., Express + MongoDB supports Node.js).
        Strictly prevents unrelated domain bleeding (e.g., Python never supports Java).
        """
        cand_norm = self.normalize_skill(candidate_skill) or candidate_skill
        req_norm = self.normalize_skill(required_skill) or required_skill
        
        cand_key = cand_norm.lower()
        req_key = req_norm.lower()

        if cand_key == req_key:
            return True

        # Check candidate entry supports list
        cand_entry = self.canonical_to_entry.get(cand_key)
        if cand_entry:
            supports = [s.lower() for s in cand_entry.get("supports", [])]
            if req_key in supports or any(self.normalize_skill(s) == req_norm for s in supports):
                return True
        
        # Also check if required skill lists candidate in its aliases or ecosystem
        req_entry = self.canonical_to_entry.get(req_key)
        if req_entry:
            supported_by = [s.lower() for s in req_entry.get("supported_by", [])]
            if cand_key in supported_by or any(self.normalize_skill(s) == cand_norm for s in supported_by):
                return True
                
        return False

    def get_supported_skills(self, skill_name: str) -> List[str]:
        norm = self.normalize_skill(skill_name) or skill_name
        entry = self.canonical_to_entry.get(norm.lower())
        if entry:
            return entry.get("supports", [])
        return []

    def get_canonical_entry(self, skill_name: str) -> Optional[dict]:
        norm = self.normalize_skill(skill_name) or skill_name
        return self.canonical_to_entry.get(norm.lower())

    def get_all_skills(self) -> List[dict]:
        return list(self.skills_data.values())
