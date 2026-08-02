from pypdf import PdfReader


def _clean(text: str) -> str:
    """Postgres text columns reject NUL (0x00) bytes, which some PDFs
    (arXiv's included) leave behind after extraction."""
    return text.replace("\x00", "")


def extract_text_from_pdf(file_path: str) -> str:
    reader = PdfReader(file_path)
    pages = [_clean(page.extract_text() or "") for page in reader.pages]
    return "\n\n".join(pages)


def guess_title(full_text: str, fallback: str) -> str:
    """Very naive title guess: first non-empty line. Good enough for Phase 1;
    later you can ask Claude to extract the real title/authors/venue."""
    for line in full_text.splitlines():
        line = line.strip()
        if len(line) > 8:
            return _clean(line[:200])
    return _clean(fallback)
