import re
from typing import List, Dict, Tuple, Optional
from ..models import JDIntelligence, FlaggedRequirement
from ..ontology.skill_ontology import SkillOntology


MUST_HAVE_TRIGGERS = [
    r"\brequired\b", r"\bmust[\s-]have\b", r"\bmust\b", r"\bmandatory\b", 
    r"\bessential\b", r"\bminimum qualifications?\b", r"\bcore requirements?\b",
    r"\bneeds? to have\b", r"\bproven experience in\b"
]

NICE_TO_HAVE_TRIGGERS = [
    r"\bpreferred\b", r"\bplus\b", r"\bbonus\b", r"\bnice[\s-]to[\s-]have\b",
    r"\bgood[\s-]to[\s-]have\b", r"\bfamiliarity with\b", r"\bexposure to\b",
    r"\bdesired\b", r"\boptional\b", r"\badvantageous\b"
]

DEGREE_PATTERNS = [
    r"(?i)\b(?:bachelor'?s?|master'?s?|phd|b\.?s\.?|m\.?s\.?|b\.?tech|m\.?tech|degree)\b(?:\s+(?:in|of)\s+[A-Za-z\s]+)?",
    r"(?i)\bcomputer science\b|\bsoftware engineering\b|\bdata science\b|\belectrical engineering\b|\binformation technology\b"
]

EXP_PATTERNS = [
    r"(?i)\b(\d+\+?\s*(?:-\s*\d+)?\s*(?:years?|yrs?|months?))\s+(?:of\s+)?(?:experience|exp)\b",
    r"(?i)\b(?:internship|intern|fresh graduate|entry[\s-]level|final year)\b"
]

BIAS_AND_OVERPIN_PATTERNS = [
    (r"(?i)\b(rockstar|ninja|guru|wizard|superhero|workaholic)\b", 
     "Aggressive/exclusionary buzzword that may discourage qualified candidates.", "warning", "Replace with 'proficient engineer' or 'collaborative problem solver'."),
    (r"(?i)\b(\d{2,}\+?\s*years?)\b", 
     "Excessive experience requirement for entry-level / intern scope.", "high", "For internships, specify fundamental coursework/projects rather than multi-year industry tenure."),
    (r"(?i)\b(?:version\s+\d+\.\d+\.\d+|\b[A-Za-z]+\s+v?\d+\.\d+\.\d+\s+strictly)\b", 
     "Overly narrow specific minor-version pin.", "info", "Consider allowing candidates proficient in the general framework (e.g. React 17+ or 18+)."),
    (r"(?i)\b(?:top[\s-]tier|ivy[\s-]league|tier-?1\s+colleges?\s+only)\b", 
     "Unnecessary educational pedigree bias that restricts talent pool.", "high", "Focus on demonstrated technical capability and project outcomes rather than institution rank.")
]


class JDParser:
    def __init__(self, ontology: Optional[SkillOntology] = None):
        self.ontology = ontology or SkillOntology()

    def parse_jd(self, jd_text: str, role_title_override: Optional[str] = None) -> JDIntelligence:
        text = jd_text.strip()
        lines = [l.strip() for l in text.splitlines() if l.strip()]

        # 1. Infer role title
        role_title = role_title_override or self._infer_role_title(lines, text)

        # 2. Extract sections (Responsibilities, Requirements, Nice to have, etc.)
        sections = self._segment_jd_sections(lines)

        # 3. Categorize skills via ontology + linguistic triggers
        must_have_skills = []
        should_have_skills = []
        nice_to_have_skills = []
        technical_skills = []
        soft_skills = []

        all_ontology_skills = self.ontology.get_all_skills()

        for skill_entry in all_ontology_skills:
            canonical = skill_entry.get("canonical")
            category = skill_entry.get("category", "technical")
            aliases = skill_entry.get("aliases", [canonical.lower()])

            matched_line, is_must, is_nice = self._check_skill_presence_and_priority(aliases, lines, sections)

            if matched_line is not None:
                if category == "soft_skills":
                    if canonical not in soft_skills:
                        soft_skills.append(canonical)
                else:
                    if canonical not in technical_skills:
                        technical_skills.append(canonical)

                if is_must:
                    if canonical not in must_have_skills:
                        must_have_skills.append(canonical)
                elif is_nice:
                    if canonical not in nice_to_have_skills:
                        nice_to_have_skills.append(canonical)
                else:
                    if canonical not in should_have_skills:
                        should_have_skills.append(canonical)

        # Ensure must-haves are not completely empty if technical skills were found
        if not must_have_skills and technical_skills:
            # First 3 technical skills default to must-have
            must_have_skills = technical_skills[:3]
            should_have_skills = [s for s in technical_skills[3:] if s not in nice_to_have_skills]

        # 4. Extract Education and Experience Requirements
        education_reqs = self._extract_regex_matches(text, DEGREE_PATTERNS)
        experience_reqs = self._extract_regex_matches(text, EXP_PATTERNS)

        # 5. Extract Responsibilities
        responsibilities = sections.get("responsibilities", [])
        if not responsibilities:
            # Fallback: extract bullet points from whole text
            responsibilities = [l for l in lines if l.startswith(("-", "*", "•", "1.", "2.", "3.", "4.", "5."))]

        # 6. Flag biases and over-pinned requirements
        flagged_requirements = self._detect_flags_and_biases(text, role_title)

        return JDIntelligence(
            role_title=role_title,
            must_have_skills=must_have_skills,
            should_have_skills=should_have_skills,
            nice_to_have_skills=nice_to_have_skills,
            technical_skills=technical_skills,
            soft_skills=soft_skills,
            education_requirements=education_reqs,
            experience_requirements=experience_reqs,
            responsibilities=responsibilities[:8],
            domain_requirements=[role_title],
            flagged_requirements=flagged_requirements,
            raw_text=text
        )

    def _infer_role_title(self, lines: List[str], full_text: str) -> str:
        for line in lines[:3]:
            if re.search(r"(?i)\b(?:engineer|developer|intern|scientist|analyst|architect|designer)\b", line):
                # Clean header prefix
                clean = re.sub(r"(?i)^(?:job title|role|position|opening)[:\s-]+", "", line)
                if len(clean.split()) <= 8:
                    return clean.strip()
        
        # Check text search
        match = re.search(r"(?i)(?:job title|role|position):\s*([A-Za-z0-9\s/–-]+)", full_text)
        if match:
            return match.group(1).strip()

        return "Software Engineering Intern"

    def _segment_jd_sections(self, lines: List[str]) -> Dict[str, List[str]]:
        sections: Dict[str, List[str]] = {
            "responsibilities": [],
            "requirements": [],
            "preferred": [],
            "general": []
        }
        current_sec = "general"

        for line in lines:
            lower = line.lower()
            if any(k in lower for k in ["responsibilit", "what you'll do", "day to day", "duties"]):
                current_sec = "responsibilities"
            elif any(k in lower for k in ["required", "requirements", "qualifications", "what you need", "must have", "must-have"]):
                current_sec = "requirements"
            elif any(k in lower for k in ["preferred", "nice to have", "bonus", "plus", "good to have"]):
                current_sec = "preferred"
            else:
                sections[current_sec].append(line)

        return sections

    def _check_skill_presence_and_priority(self, aliases: List[str], lines: List[str], sections: Dict[str, List[str]]) -> Tuple[Optional[str], bool, bool]:
        matched_line = None
        is_must = False
        is_nice = False

        for alias in aliases:
            # Word boundary regex
            pattern = re.compile(rf"(?i)(?:\b|(?<=[^a-zA-Z0-9])){re.escape(alias)}(?:\b|(?=[^a-zA-Z0-9]))")
            
            # Check preferred section first
            for l in sections.get("preferred", []):
                if pattern.search(l):
                    return l, False, True
            
            # Check requirements section
            for l in sections.get("requirements", []):
                if pattern.search(l):
                    is_must_trig = any(re.search(trig, l, re.I) for trig in MUST_HAVE_TRIGGERS)
                    is_nice_trig = any(re.search(trig, l, re.I) for trig in NICE_TO_HAVE_TRIGGERS)
                    if is_nice_trig:
                        return l, False, True
                    return l, True, False

            # Check general lines
            for l in lines:
                if pattern.search(l):
                    matched_line = l
                    if any(re.search(trig, l, re.I) for trig in MUST_HAVE_TRIGGERS):
                        is_must = True
                    elif any(re.search(trig, l, re.I) for trig in NICE_TO_HAVE_TRIGGERS):
                        is_nice = True
                    break

            if matched_line:
                break

        return matched_line, is_must, is_nice

    def _extract_regex_matches(self, text: str, patterns: List[str]) -> List[str]:
        results = []
        for pat in patterns:
            matches = re.finditer(pat, text)
            for m in matches:
                val = m.group(0).strip()
                if val and val not in results and len(val) > 2:
                    results.append(val)
        return results[:5]

    def _detect_flags_and_biases(self, text: str, role_title: str) -> List[FlaggedRequirement]:
        flags = []
        
        # Check intern/entry-level experience mismatch
        is_intern = bool(re.search(r"(?i)\b(?:intern|internship|entry[\s-]level|junior|fresher)\b", role_title + " " + text[:200]))
        exp_match = re.search(r"(?i)\b([3-9]|\d{2,})\+?\s*years?(?:\s+of)?\s+experience\b", text)
        if is_intern and exp_match:
            flags.append(FlaggedRequirement(
                requirement=exp_match.group(0),
                reason=f"Role is '{role_title}', but requires {exp_match.group(0)}, which is disproportionate for an internship.",
                severity="high",
                suggestion="Reduce requirement to relevant coursework, academic projects, or previous 3-6 month internship experience."
            ))

        for pattern, reason, severity, suggestion in BIAS_AND_OVERPIN_PATTERNS:
            match = re.search(pattern, text)
            if match:
                flags.append(FlaggedRequirement(
                    requirement=match.group(0),
                    reason=reason,
                    severity=severity,
                    suggestion=suggestion
                ))

        return flags
