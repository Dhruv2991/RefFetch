import os

import httpx
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")


def _groq_chat(messages: list[dict], system: str | None = None) -> str:
    payload_messages = []
    if system:
        payload_messages.append({"role": "system", "content": system})
    payload_messages.extend(messages)

    response = httpx.post(
        GROQ_URL,
        headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
        json={"model": MODEL, "messages": payload_messages, "max_tokens": 1000},
        timeout=60.0,
    )
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]


def summarize_paper(full_text: str) -> str:
    prompt = f"""You are summarizing an academic paper for a researcher's library.
Produce a concise summary with these sections:

**Summary** (2-3 sentences)
**Novelty** (what's new here)
**Method** (brief)
**Limitations**
**Datasets used** (if any)

Paper text (may be truncated):
{full_text[:8000]}
"""
    return _groq_chat([{"role": "user", "content": prompt}])


def synthesize_memory(question: str, paper_summaries: list[dict], context_chunks: list[dict]) -> str:
    """
    Broader than answer_with_context: this is for library-wide recall
    questions like 'what have I read about X'. It grounds the answer in
    every paper's summary (for breadth) plus specific matching chunks
    (for detail), and is explicitly told to name which papers it's drawing
    from throughout — not just at the end.
    """
    summaries_block = "\n".join(
        f"- {s['title']}: {s['summary'][:200]}" for s in paper_summaries
    )
    chunks_block = "\n\n---\n\n".join(
        f"[{c['title']}]\n{c['content']}" for c in context_chunks
    )

    system = f"""You are a research assistant with access to everything the user has
read. Answer the question by synthesizing across their whole paper library.

All papers in the library (titles + summaries, for breadth):
{summaries_block}

Specific relevant excerpts (for detail, use these for specifics/quotes):
{chunks_block}

Name which paper(s) each point comes from as you go (e.g. "In [Paper Title]...").
If nothing in the library is relevant to the question, say so plainly instead
of guessing.
"""

    return _groq_chat([{"role": "user", "content": question}], system=system)


def draft_review_section(section_name: str, papers: list[dict], instructions: str | None) -> str:
    """
    papers: list of {title, summary, excerpts}
    Drafts one section of a literature review, grounded in the selected
    papers' summaries + excerpts. Returns editable prose the user refines.
    """
    paper_blocks = []
    for p in papers:
        excerpts = "\n".join(f"  - {e[:300]}" for e in p["excerpts"][:3])
        paper_blocks.append(f"- {p['title']}\n  Summary: {p['summary']}\n  Excerpts:\n{excerpts}")
    papers_block = "\n\n".join(paper_blocks)

    extra = f"\n\nAdditional instructions from the user: {instructions}" if instructions else ""

    prompt = f"""Draft the "{section_name}" section of a literature review, using
ONLY the papers below as source material. Write in clear academic prose,
reference papers by name (not just "this paper"), and keep it to 2-4
paragraphs — this is a first draft the user will edit themselves, not a
final polished section.{extra}

Source papers:

{papers_block}
"""
    return _groq_chat([{"role": "user", "content": prompt}])


def answer_with_context(question: str, context_chunks: list[str], chat_history: list[dict]) -> str:
    """RAG-style answer: grounds the response in retrieved chunks from the
    user's paper library, and cites which snippet each claim came from."""
    context_block = "\n\n---\n\n".join(
        f"[Source {i+1}]\n{chunk}" for i, chunk in enumerate(context_chunks)
    )

    system = f"""You are a research assistant answering questions using ONLY the
provided source excerpts from the user's paper library. Cite sources inline
like [Source 1]. If the excerpts don't contain the answer, say so clearly
instead of guessing.

Sources:
{context_block}
"""

    messages = chat_history + [{"role": "user", "content": question}]
    return _groq_chat(messages, system=system)
