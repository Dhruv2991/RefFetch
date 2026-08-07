from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Paper, Chunk
from app.schemas import FullReportResponse, PdfSection
from app.services.ai import synthesize_memory
from app.services.compare import compare_papers

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/full", response_model=FullReportResponse)
def full_report(db: Session = Depends(get_db)):
    papers = db.query(Paper).all()
    if not papers:
        raise HTTPException(400, "Your library is empty — upload some papers first")

    sections = []

    # 1. Library overview: every paper, title + summary
    overview_lines = []
    for p in papers:
        overview_lines.append(f"## {p.title}")
        if p.authors or p.year:
            overview_lines.append(f"*{p.authors or 'Unknown author'} ({p.year or 'n.d.'})*")
        overview_lines.append(p.summary or "(no summary available)")
        if p.tags:
            overview_lines.append(f"Tags: {', '.join(p.tags)}")
    sections.append(PdfSection(heading="Library Overview", body="\n\n".join(overview_lines)))

    # 2. Cross-paper synthesis, only if there's more than one paper
    if len(papers) >= 2:
        papers_data = []
        for p in papers[:5]:  # cap at 5 for prompt size / quality, same as manual compare
            chunks = db.query(Chunk).filter(Chunk.paper_id == p.id).limit(3).all()
            papers_data.append(
                {"title": p.title, "summary": p.summary or "", "excerpts": [c.content for c in chunks]}
            )
        comparison = compare_papers(papers_data)
        sections.append(PdfSection(heading="Cross-Paper Synthesis", body=comparison))

    # 3. Overall research memory synthesis — a broad "what does this library
    # cover, and where are the gaps" pass, using the same machinery as the
    # Memory feature but with a fixed, comprehensive prompt.
    paper_summaries = [{"title": p.title, "summary": p.summary or ""} for p in papers]
    all_chunks = db.query(Chunk).limit(15).all()
    paper_titles_by_id = {p.id: p.title for p in papers}
    context_chunks = [
        {"title": paper_titles_by_id.get(c.paper_id, "Unknown"), "content": c.content} for c in all_chunks
    ]
    memory_answer = synthesize_memory(
        "Provide a comprehensive overview of this entire research library: what topics and methods "
        "it covers, what the strongest and weakest papers seem to be, and what obvious gaps or "
        "directions for further reading exist.",
        paper_summaries,
        context_chunks,
    )
    sections.append(PdfSection(heading="Overall Analysis & Gaps", body=memory_answer))

    return FullReportResponse(
        title="Research Library — Full Report",
        subtitle=f"{len(papers)} paper{'s' if len(papers) != 1 else ''} analyzed",
        sections=sections,
    )
