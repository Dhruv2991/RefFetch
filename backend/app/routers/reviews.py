import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Review, ReviewSection, Paper, Chunk
from app.schemas import ReviewOut, ReviewCreate, SectionUpdate, SectionDraftRequest
from app.services.ai import draft_review_section

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("/", response_model=ReviewOut)
def create_review(req: ReviewCreate, db: Session = Depends(get_db)):
    review = Review(title=req.title)
    db.add(review)
    db.flush()

    for i, name in enumerate(req.section_names):
        db.add(ReviewSection(review_id=review.id, name=name, content="", order=i))

    db.commit()
    db.refresh(review)
    return review


@router.get("/", response_model=list[ReviewOut])
def list_reviews(db: Session = Depends(get_db)):
    return db.query(Review).order_by(Review.created_at.desc()).all()


@router.get("/{review_id}", response_model=ReviewOut)
def get_review(review_id: uuid.UUID, db: Session = Depends(get_db)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(404, "Review not found")
    return review


@router.delete("/{review_id}")
def delete_review(review_id: uuid.UUID, db: Session = Depends(get_db)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(404, "Review not found")
    db.delete(review)
    db.commit()
    return {"ok": True}


@router.patch("/sections/{section_id}", response_model=ReviewOut)
def update_section(section_id: uuid.UUID, update: SectionUpdate, db: Session = Depends(get_db)):
    section = db.query(ReviewSection).filter(ReviewSection.id == section_id).first()
    if not section:
        raise HTTPException(404, "Section not found")
    section.content = update.content
    db.commit()
    review = db.query(Review).filter(Review.id == section.review_id).first()
    return review


@router.post("/sections/{section_id}/draft", response_model=ReviewOut)
def draft_section(section_id: uuid.UUID, req: SectionDraftRequest, db: Session = Depends(get_db)):
    section = db.query(ReviewSection).filter(ReviewSection.id == section_id).first()
    if not section:
        raise HTTPException(404, "Section not found")
    if not req.paper_ids:
        raise HTTPException(400, "Select at least one paper to draft from")

    papers_data = []
    for pid in req.paper_ids:
        paper = db.query(Paper).filter(Paper.id == pid).first()
        if not paper:
            continue
        chunks = db.query(Chunk).filter(Chunk.paper_id == pid).limit(3).all()
        papers_data.append(
            {
                "title": paper.title,
                "summary": paper.summary or "",
                "excerpts": [c.content for c in chunks],
            }
        )

    if not papers_data:
        raise HTTPException(404, "None of the selected papers were found")

    draft = draft_review_section(section.name, papers_data, req.instructions)
    section.content = draft
    db.commit()

    review = db.query(Review).filter(Review.id == section.review_id).first()
    return review
