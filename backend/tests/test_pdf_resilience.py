import os
import tempfile
import pytest
from backend.parsers.pdf_parser import PDFResumeParser
from backend.ranking.hybrid_ranker import HybridCandidateRanker
from backend.jd_intel.jd_parser import JDParser


def test_pdf_parsing_resilience_and_edge_cases():
    parser = PDFResumeParser()
    jd_parser = JDParser()
    ranker = HybridCandidateRanker()

    jd = jd_parser.parse_jd("Job Title: Software Engineer\nMust Have: JavaScript, React.js, Git\nResponsibilities: Build web applications.")

    temp_dir = tempfile.gettempdir()
    
    # 1. Corrupt PDF bytes
    corrupt_pdf_path = os.path.join(temp_dir, "test_corrupt.pdf")
    with open(corrupt_pdf_path, "wb") as f:
        f.write(b"CORRUPTED INVALID HEADER NON-PDF DATA \x00\xff")
    
    cand_corrupt = parser.parse_text_or_pdf(corrupt_pdf_path, candidate_id="cand_corrupt", candidate_name="Corrupt PDF")
    assert cand_corrupt.parsing_status in ["corrupted", "scanned_or_empty"]
    
    # 2. Empty text
    cand_empty = parser.parse_text_or_pdf("", candidate_id="cand_empty", candidate_name="Empty Candidate")
    assert cand_empty.parsing_status == "scanned_or_empty"

    # 3. Very Short Resume (Student Equity)
    short_text = "Devin Wright\nSkills: React.js, TypeScript\nProject: Built CampusApp with React."
    cand_short = parser.parse_text_or_pdf(short_text, candidate_id="cand_short", candidate_name="Devin Short")
    assert cand_short.parsing_status == "success"
    assert cand_short.word_count > 0

    # 4. Very Long Resume
    long_text = "Senior Engineer Profile\n" + ("Built microservices with React.js and Node.js. " * 500)
    cand_long = parser.parse_text_or_pdf(long_text, candidate_id="cand_long", candidate_name="Long Candidate")
    assert cand_long.parsing_status == "success"

    # 5. Batch processing including all edge cases together MUST NOT CRASH
    batch = [cand_corrupt, cand_empty, cand_short, cand_long]
    ranked = ranker.rank_candidates(batch, jd)

    assert len(ranked) == 4
    # The valid short and long candidates should rank above corrupt and empty
    assert ranked[0].candidate_id in ["cand_short", "cand_long"]
    assert ranked[1].candidate_id in ["cand_short", "cand_long"]
    assert ranked[2].final_score == 0.0 or ranked[3].final_score == 0.0

    # Clean up temp files
    if os.path.exists(corrupt_pdf_path):
        os.remove(corrupt_pdf_path)
