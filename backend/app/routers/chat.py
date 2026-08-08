from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database import get_db
from app.auth import get_current_user_id
from app.models import Chunk, ChatMessage, Paper
from app.schemas import ChatRequest, ChatResponse
from app.services.embeddings import embed_text
from app.services.ai import answer_with_context

router = APIRouter(prefix="/chat", tags=["chat"])

TOP_K = 5


@router.post("/", response_model=ChatResponse)
def chat(req: ChatRequest, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    query_vector = embed_text(req.question)

    # Scope retrieval to only this user's papers — join Chunk -> Paper and
    # filter by owner, whether searching one paper or the whole library.
    query = (
        select(Chunk)
        .join(Paper, Chunk.paper_id == Paper.id)
        .filter(Paper.user_id == user_id)
        .order_by(Chunk.embedding.cosine_distance(query_vector))
        .limit(TOP_K)
    )
    if req.paper_id:
        query = query.filter(Chunk.paper_id == req.paper_id)

    top_chunks = db.execute(query).scalars().all()
    context_texts = [c.content for c in top_chunks]

    history_query = db.query(ChatMessage).filter(ChatMessage.paper_id == req.paper_id)
    history_rows = history_query.order_by(ChatMessage.created_at.desc()).limit(10).all()
    history_rows.reverse()
    chat_history = [{"role": m.role, "content": m.content} for m in history_rows]

    answer = answer_with_context(req.question, context_texts, chat_history)

    db.add(ChatMessage(paper_id=req.paper_id, role="user", content=req.question))
    db.add(ChatMessage(paper_id=req.paper_id, role="assistant", content=answer))
    db.commit()

    return ChatResponse(answer=answer, sources_used=len(context_texts))
