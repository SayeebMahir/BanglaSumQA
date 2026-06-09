"""
PDF Text Extractor — uses PyMuPDF for robust Bangla Unicode extraction.
Handles multi-column layouts and preserves reading order.
"""

import fitz  # PyMuPDF


def extract_text_from_pdf(pdf_path: str, max_pages: int = 50) -> str:
    """
    Extract all readable text from a PDF file.

    Args:
        pdf_path: Absolute path to the PDF file.
        max_pages: Maximum number of pages to process (default 50).

    Returns:
        Concatenated text from all pages, separated by double newlines.

    Raises:
        ValueError: If the PDF cannot be opened or is encrypted.
    """
    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        raise ValueError(f"PDF ফাইল খোলতে সমস্যা হয়েছে: {e}")

    if doc.is_encrypted:
        doc.close()
        raise ValueError("PDF ফাইলটি পাসওয়ার্ড-সুরক্ষিত। অনুগ্রহ করে আনলক করুন।")

    pages_text = []
    total_pages = min(len(doc), max_pages)

    for page_num in range(total_pages):
        page = doc[page_num]
        # Use "text" mode which preserves reading order and handles Bangla Unicode
        text = page.get_text("text", sort=True)
        cleaned = text.strip()
        if cleaned:
            pages_text.append(cleaned)

    doc.close()

    if not pages_text:
        raise ValueError(
            "PDF থেকে কোনো টেক্সট বের করা গেল না। "
            "এটি স্ক্যান করা ইমেজ-ভিত্তিক PDF হতে পারে।"
        )

    full_text = "\n\n".join(pages_text)

    # Basic cleanup: remove excessive blank lines
    import re
    full_text = re.sub(r"\n{3,}", "\n\n", full_text)
    full_text = re.sub(r" {2,}", " ", full_text)

    return full_text.strip()
