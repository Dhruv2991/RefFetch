from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database import get_db
from app.models import Chunk, ChatMessage
from app.schemas import ChatRequest, ChatResponse
from app.services.embeddings import embed_text
from app.services.ai import answer_with_context

router = APIRouter(prefix="/chat", tags=["chat"])

TOP_K = 5


@router.post("/", response_model=ChatResponse)
def chat(req: ChatRequest, db: Session = Depends(get_db)):
    query_vector = embed_text(req.question)

    # Vector similarity search (pgvector cosine distance), optionally
    # scoped to a single paper. This is the core of the RAG pipeline —
    # it's what lets the assistant answer grounded in the user's own library.
    query = select(Chunk).order_by(Chunk.embedding.cosine_distance(query_vector)).limit(TOP_K)
    if req.paper_id:
        query = query.filter(Chunk.paper_id == req.paper_id)

    top_chunks = db.execute(query).scalars().all()
    context_texts = [c.content for c in top_chunks]

    # Pull recent chat history for continuity (scoped to same paper/global)
    history_query = db.query(ChatMessage).filter(ChatMessage.paper_id == req.paper_id)
    history_rows = history_query.order_by(ChatMessage.created_at.desc()).limit(10).all()
    history_rows.reverse()
    chat_history = [{"role": m.role, "content": m.content} for m in history_rows]

    answer = answer_with_context(req.question, context_texts, chat_history)

    db.add(ChatMessage(paper_id=req.paper_id, role="user", content=req.question))
    db.add(ChatMessage(paper_id=req.paper_id, role="assistant", content=answer))
    db.commit()

    return ChatResponse(answer=answer, sources_used=len(context_texts))
