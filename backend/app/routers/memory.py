from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database import get_db
from app.models import Paper, Chunk
from app.schemas import MemoryRequest, MemoryResponse
from app.services.embeddings import embed_text
from app.services.ai import synthesize_memory

router = APIRouter(prefix="/memory", tags=["memory"])

TOP_K_CHUNKS = 8


@router.post("/", response_model=MemoryResponse)
def query_memory(req: MemoryRequest, db: Session = Depends(get_db)):
    papers = db.query(Paper).all()
    if not papers:
        raise HTTPException(400, "Your library is empty — upload some papers first")

    paper_summaries = [{"title": p.title, "summary": p.summary or ""} for p in papers]
    paper_titles_by_id = {p.id: p.title for p in papers}

    query_vector = embed_text(req.question)
    query = (
        select(Chunk)
        .order_by(Chunk.embedding.cosine_distance(query_vector))
        .limit(TOP_K_CHUNKS)
    )
    top_chunks = db.execute(query).scalars().all()

    context_chunks = [
        {"title": paper_titles_by_id.get(c.paper_id, "Unknown paper"), "content": c.content}
        for c in top_chunks
    ]

    answer = synthesize_memory(req.question, paper_summaries, context_chunks)

    papers_referenced = sorted(set(c["title"] for c in context_chunks))
    return MemoryResponse(answer=answer, papers_referenced=papers_referenced)
