import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user_id
from app.models import Review, ReviewSection, Paper, Chunk
from app.schemas import ReviewOut, ReviewCreate, SectionUpdate, SectionDraftRequest
from app.services.ai import draft_review_section

router = APIRouter(prefix="/reviews", tags=["reviews"])


def _get_owned_review(db: Session, review_id: uuid.UUID, user_id: str) -> Review:
    review = db.query(Review).filter(Review.id == review_id, Review.user_id == user_id).first()
    if not review:
        raise HTTPException(404, "Review not found")
    return review


def _get_owned_section(db: Session, section_id: uuid.UUID, user_id: str) -> ReviewSection:
    section = (
        db.query(ReviewSection)
        .join(Review, ReviewSection.review_id == Review.id)
        .filter(ReviewSection.id == section_id, Review.user_id == user_id)
        .first()
    )
    if not section:
        raise HTTPException(404, "Section not found")
    return section


@router.post("/", response_model=ReviewOut)
def create_review(req: ReviewCreate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    review = Review(user_id=user_id, title=req.title)
    db.add(review)
    db.flush()

    for i, name in enumerate(req.section_names):
        db.add(ReviewSection(review_id=review.id, name=name, content="", order=i))

    db.commit()
    db.refresh(review)
    return review


@router.get("/", response_model=list[ReviewOut])
def list_reviews(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    return db.query(Review).filter(Review.user_id == user_id).order_by(Review.created_at.desc()).all()


@router.get("/{review_id}", response_model=ReviewOut)
def get_review(review_id: uuid.UUID, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    return _get_owned_review(db, review_id, user_id)


@router.delete("/{review_id}")
def delete_review(review_id: uuid.UUID, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    review = _get_owned_review(db, review_id, user_id)
    db.delete(review)
    db.commit()
    return {"ok": True}


@router.patch("/sections/{section_id}", response_model=ReviewOut)
def update_section(
    section_id: uuid.UUID,
    update: SectionUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    section = _get_owned_section(db, section_id, user_id)
    section.content = update.content
    db.commit()
    return db.query(Review).filter(Review.id == section.review_id).first()


@router.post("/sections/{section_id}/draft", response_model=ReviewOut)
def draft_section(
    section_id: uuid.UUID,
    req: SectionDraftRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    section = _get_owned_section(db, section_id, user_id)
    if not req.paper_ids:
        raise HTTPException(400, "Select at least one paper to draft from")

    papers_data = []
    for pid in req.paper_ids:
        paper = db.query(Paper).filter(Paper.id == pid, Paper.user_id == user_id).first()
        if not paper:
            continue
        chunks = db.query(Chunk).filter(Chunk.paper_id == pid).limit(3).all()
        papers_data.append(
            {"title": paper.title, "summary": paper.summary or "", "excerpts": [c.content for c in chunks]}
        )

    if not papers_data:
        raise HTTPException(404, "None of the selected papers were found")

    draft = draft_review_section(section.name, papers_data, req.instructions)
    section.content = draft
    db.commit()

    return db.query(Review).filter(Review.id == section.review_id).first()
