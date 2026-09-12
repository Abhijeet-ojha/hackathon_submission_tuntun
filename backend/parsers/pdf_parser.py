import re
import os
from typing import Dict, Tuple, Optional
import fitz  # PyMuPDF
import pdfplumber
from ..models import ResumeIntelligence, ExtractedSkill


# Standard resume section header regex patterns
SECTION_PATTERNS = {
    "education": r"(?i)^(?:education|academic background|academics|qualifications|degrees?|educational background)",
    "skills": r"(?i)^(?:technical skills|skills|core competencies|technologies|proficiencies|tools & technologies|tech stack|key skills)",
    "experience": r"(?i)^(?:work experience|professional experience|experience|employment history|work history)",
    "internships": r"(?i)^(?:internships?|internship experience|industry experience)",
    "projects": r"(?i)^(?:projects|academic projects|key projects|personal projects|technical projects|portfolio)",
    "certifications": r"(?i)^(?:certifications?|certificates|licenses & certifications|training|courses)",
    "achievements": r"(?i)^(?:achievements|awards|honors|publications|extracurricular activities|leadership)",
    "profile": r"(?i)^(?:summary|profile|about me|objective|professional summary|biography)"
}

EMAIL_REGEX = r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"
PHONE_REGEX = r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}"


class PDFResumeParser:
    def __init__(self):
        pass

    def extract_text_from_pdf(self, pdf_path: str) -> Tuple[str, str]:
        """
        Extract text from PDF file using PyMuPDF (fitz) with pdfplumber fallback.
        Returns (raw_text, status) where status is 'success', 'scanned_or_empty', or 'corrupted'.
        """
        if not os.path.exists(pdf_path):
            return "", "corrupted"

        raw_text = ""
        # 1. Try PyMuPDF
        try:
            doc = fitz.open(pdf_path)
            for page in doc:
                text = page.get_text("text")
                if text:
                    raw_text += text + "\n"
            doc.close()
        except Exception:
            raw_text = ""

        # 2. Fallback to pdfplumber if PyMuPDF extracted very little text
        if len(raw_text.strip()) < 40:
            try:
                with pdfplumber.open(pdf_path) as pdf:
                    for page in pdf.pages:
                        extracted = page.extract_text()
                        if extracted:
                            raw_text += extracted + "\n"
            except Exception:
                pass

        cleaned_text = self._clean_text(raw_text)
        if not cleaned_text:
            return "", "scanned_or_empty"

        return cleaned_text, "success"

    def extract_text_from_docx(self, docx_path: str) -> Tuple[str, str]:
        """
        Extract text from DOCX file using python-docx with table support.
        """
        if not os.path.exists(docx_path):
            return "", "corrupted"
        try:
            import docx
            doc = docx.Document(docx_path)
            full_text = []
            for para in doc.paragraphs:
                if para.text and para.text.strip():
                    full_text.append(para.text.strip())
            for table in doc.tables:
                for row in table.rows:
                    row_text = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                    if row_text:
                        full_text.append(" | ".join(row_text))
            raw_text = "\n".join(full_text)
            cleaned = self._clean_text(raw_text)
            return cleaned, ("success" if len(cleaned) > 20 else "scanned_or_empty")
        except Exception:
            return "", "corrupted"

    def extract_text_from_txt(self, txt_path: str) -> Tuple[str, str]:
        """
        Extract text from plain text or XML file.
        """
        if not os.path.exists(txt_path):
            return "", "corrupted"
        try:
            with open(txt_path, "r", encoding="utf-8", errors="ignore") as f:
                raw_text = f.read()
            if txt_path.lower().endswith(".xml"):
                raw_text = re.sub(r"<[^>]+>", " ", raw_text)
            cleaned = self._clean_text(raw_text)
            return cleaned, ("success" if len(cleaned) > 20 else "scanned_or_empty")
        except Exception:
            return "", "corrupted"

    def parse_text_or_pdf(self, file_path_or_text: str, candidate_id: str, candidate_name: Optional[str] = None) -> ResumeIntelligence:
        """
        Parses PDF/DOCX/TXT/XML file or raw string text into ResumeIntelligence.
        """
        raw_text = ""
        status = "success"

        if os.path.exists(file_path_or_text):
            ext = os.path.splitext(file_path_or_text)[1].lower()
            if ext == ".pdf":
                raw_text, status = self.extract_text_from_pdf(file_path_or_text)
            elif ext in [".docx", ".doc"]:
                raw_text, status = self.extract_text_from_docx(file_path_or_text)
            elif ext in [".txt", ".xml", ".md"]:
                raw_text, status = self.extract_text_from_txt(file_path_or_text)
            else:
                raw_text, status = self.extract_text_from_pdf(file_path_or_text)

            if not candidate_name:
                base = os.path.basename(file_path_or_text)
                clean_base = os.path.splitext(base)[0]
                clean_base = re.sub(r"^(?:resume|cv|sde|web_dev|ai_dev|data_science|sales|video_editing)__?", "", clean_base, flags=re.IGNORECASE)
                clean_base = clean_base.replace("_", " ").replace("-", " ").strip()
                candidate_name = clean_base.title() if clean_base else "Candidate"
        else:
            raw_text = self._clean_text(file_path_or_text)
            status = "success" if len(raw_text.strip()) > 20 else "scanned_or_empty"
            if not candidate_name:
                candidate_name = f"Candidate {candidate_id}"

        # Segment sections
        sections = self.segment_sections(raw_text)

        # Extract contact info
        email_match = re.search(EMAIL_REGEX, raw_text)
        phone_match = re.search(PHONE_REGEX, raw_text)
        email = email_match.group(0) if email_match else ""
        phone = phone_match.group(0) if phone_match else ""

        # If name is still placeholder, attempt heuristic from first non-empty line
        if not candidate_name or candidate_name.startswith("Candidate") or len(candidate_name.split()) > 5:
            lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
            if lines and len(lines[0].split()) <= 4 and "@" not in lines[0] and not any(c.isdigit() for c in lines[0]):
                candidate_name = lines[0].title()

        word_count = len(raw_text.split())

        return ResumeIntelligence(
            candidate_id=candidate_id,
            candidate_name=candidate_name or f"Candidate {candidate_id}",
            email=email,
            phone=phone,
            sections=sections,
            raw_text=raw_text,
            parsing_status=status,
            word_count=word_count
        )

    def segment_sections(self, text: str) -> Dict[str, str]:
        """
        Segments raw text into structured standard resume sections.
        """
        sections: Dict[str, str] = {
            "profile": "",
            "education": "",
            "skills": "",
            "experience": "",
            "internships": "",
            "projects": "",
            "certifications": "",
            "achievements": "",
            "other": ""
        }

        if not text:
            return sections

        lines = text.splitlines()
        current_section = "profile"
        section_lines: Dict[str, list] = {sec: [] for sec in sections}

        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue

            # Check if this line is a section header (usually short, <= 45 chars)
            detected_section = None
            if len(line_str) <= 45:
                clean_header = re.sub(r"^[\s#*\-_:]+|[\s#*\-_:]+$", "", line_str)
                for sec_key, pattern in SECTION_PATTERNS.items():
                    if re.match(pattern, clean_header):
                        detected_section = sec_key
                        break

            if detected_section:
                current_section = detected_section
            else:
                section_lines[current_section].append(line_str)

        for sec_key, l_list in section_lines.items():
            sections[sec_key] = "\n".join(l_list).strip()

        # If experience is empty but internships has content, or vice-versa, blend for robust matching
        if not sections["experience"] and sections["internships"]:
            sections["experience"] = sections["internships"]

        return sections

    def _clean_text(self, text: str) -> str:
        if not text:
            return ""
        # Remove null bytes and non-printable unicode control chars
        text = text.replace("\x00", " ")
        text = re.sub(r"[\r\f\v]", "\n", text)
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n\s*\n+", "\n\n", text)
        return text.strip()
