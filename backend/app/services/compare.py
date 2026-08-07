from app.services.ai import _chat


def compare_papers(papers: list[dict]) -> str:
    """
    papers: list of {title, summary, excerpts: list[str]}
    Grounds the comparison in each paper's summary + a few representative
    chunks, rather than dumping full text (keeps prompt size sane and
    keeps the model focused on citable material).
    """
    paper_blocks = []
    for i, p in enumerate(papers):
        excerpts = "\n".join(f"  - {e[:300]}" for e in p["excerpts"][:3])
        paper_blocks.append(
            f"[Paper {i+1}] {p['title']}\n"
            f"Summary: {p['summary']}\n"
            f"Representative excerpts:\n{excerpts}"
        )

    papers_block = "\n\n".join(paper_blocks)

    prompt = f"""You are comparing {len(papers)} research papers for a researcher.
Using ONLY the information below, produce a structured comparison with these
sections:

**Methods** — how each paper's approach differs (reference papers as [Paper 1], [Paper 2], etc.)
**Key findings** — main results of each
**Agreements** — where the papers align or reinforce each other
**Contradictions or tensions** — where papers disagree, use different assumptions, or reach different conclusions. If you find none, say so explicitly rather than inventing one.
**Gaps** — what none of these papers address

Papers:

{papers_block}
"""
    return _chat([{"role": "user", "content": prompt}])
