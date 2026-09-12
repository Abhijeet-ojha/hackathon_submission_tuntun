from typing import List
from ..models import JDIntelligence, FlaggedRequirement


class JDBiasDetector:
    def __init__(self):
        pass

    def analyze_jd(self, jd: JDIntelligence) -> List[FlaggedRequirement]:
        """
        Returns existing and enhanced flagged requirements for recruiter review.
        Flags only — never auto-edits the JD.
        """
        return jd.flagged_requirements
