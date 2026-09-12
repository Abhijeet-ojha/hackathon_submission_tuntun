import os
import fitz  # PyMuPDF
from .sample_loader import SAMPLE_JD_FULLSTACK, SAMPLE_JD_ML, SAMPLE_CANDIDATES_DATA


def generate_local_files():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, "data")
    jds_dir = os.path.join(data_dir, "sample_jds")
    resumes_dir = os.path.join(data_dir, "sample_resumes")

    os.makedirs(jds_dir, exist_ok=True)
    os.makedirs(resumes_dir, exist_ok=True)

    # 1. Write Sample JDs
    with open(os.path.join(jds_dir, "Fullstack_Engineer_Intern.txt"), "w", encoding="utf-8") as f:
        f.write(SAMPLE_JD_FULLSTACK)
    with open(os.path.join(jds_dir, "ML_Engineer_Intern.txt"), "w", encoding="utf-8") as f:
        f.write(SAMPLE_JD_ML)

    # 2. Write Sample Resumes as PDFs
    for item in SAMPLE_CANDIDATES_DATA:
        cand_id = item["id"]
        safe_name = item["name"].split("(")[0].strip().replace(" ", "_")
        pdf_path = os.path.join(resumes_dir, f"{cand_id}_{safe_name}.pdf")

        doc = fitz.open()
        page = doc.new_page(width=595, height=842)  # A4 size

        if item.get("status") == "corrupted":
            # Write invalid bytes
            with open(pdf_path, "wb") as f:
                f.write(b"%PDF-1.4 CORRUPTED BYTE STREAM INVALID FORMAT \x00\xff")
            continue
        elif item.get("status") == "scanned_or_empty":
            # Empty page without text
            doc.save(pdf_path)
            doc.close()
            continue

        # Render clean text onto page
        y = 50
        # Title / Name
        page.insert_text(fitz.Point(50, y), item["name"], fontsize=18, fontname="helv", color=(0.1, 0.2, 0.4))
        y += 22
        contact = f"Email: {item.get('email', '')} | Phone: {item.get('phone', '')}"
        page.insert_text(fitz.Point(50, y), contact, fontsize=9, fontname="helv", color=(0.4, 0.4, 0.4))
        y += 20
        page.draw_line(fitz.Point(50, y), fitz.Point(545, y), color=(0.8, 0.8, 0.8), width=1)
        y += 20

        for sec_name, sec_text in item["sections"].items():
            if not sec_text or y > 780:
                continue

            page.insert_text(fitz.Point(50, y), sec_name.upper(), fontsize=11, fontname="helv", color=(0.15, 0.35, 0.6))
            y += 14

            # Word wrap lines
            lines = sec_text.splitlines()
            for line in lines:
                if y > 800:
                    break
                # Wrap long line
                words = line.split()
                line_buf = ""
                for w in words:
                    test_buf = f"{line_buf} {w}".strip()
                    if len(test_buf) > 75:
                        page.insert_text(fitz.Point(55, y), line_buf, fontsize=9.5, fontname="helv", color=(0.2, 0.2, 0.2))
                        y += 13
                        line_buf = w
                    else:
                        line_buf = test_buf
                if line_buf and y <= 800:
                    page.insert_text(fitz.Point(55, y), line_buf, fontsize=9.5, fontname="helv", color=(0.2, 0.2, 0.2))
                    y += 14
            y += 8

        doc.save(pdf_path)
        doc.close()

    print(f"Generated sample files in {data_dir}")


if __name__ == "__main__":
    generate_local_files()
