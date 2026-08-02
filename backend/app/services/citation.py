import re


def _cite_key(title: str, year: str | None) -> str:
    first_word = re.sub(r"[^a-zA-Z0-9]", "", title.split()[0]) if title else "paper"
    return f"{first_word}{year or ''}"


def to_bibtex(title: str, authors: str | None, year: str | None) -> str:
    key = _cite_key(title, year)
    authors_field = authors.replace(";", " and ") if authors else "Unknown"
    return (
        f"@article{{{key},\n"
        f"  title={{{title}}},\n"
        f"  author={{{authors_field}}},\n"
        f"  year={{{year or 'n.d.'}}}\n"
        f"}}"
    )


def to_apa(title: str, authors: str | None, year: str | None) -> str:
    authors_str = authors if authors else "Unknown author"
    year_str = year or "n.d."
    return f"{authors_str} ({year_str}). {title}."
