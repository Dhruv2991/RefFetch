from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Paper, Chunk
from app.schemas import CompareRequest, CompareResponse
from app.services.compare import compare_papers

router = APIRouter(prefix="/compare", tags=["compare"])


@router.post("/", response_model=CompareResponse)
def compare(req: CompareRequest, db: Session = Depends(get_db)):
    if len(req.paper_ids) < 2:
        raise HTTPException(400, "Select at least 2 papers to compare")
    if len(req.paper_ids) > 5:
        raise HTTPException(400, "Comparing more than 5 papers at once gets unreliable — pick fewer")

    papers_data = []
    for pid in req.paper_ids:
        paper = db.query(Paper).filter(Paper.id == pid).first()
        if not paper:
            raise HTTPException(404, f"Paper {pid} not found")

        # Grab a handful of chunks as representative excerpts, so the
        # comparison is grounded in more than just the auto-summary.
        chunks = db.query(Chunk).filter(Chunk.paper_id == pid).limit(3).all()

        papers_data.append(
            {
                "title": paper.title,
                "summary": paper.summary or "(no summary available)",
                "excerpts": [c.content for c in chunks],
            }
        )

    comparison = compare_papers(papers_data)
    return CompareResponse(comparison=comparison)
