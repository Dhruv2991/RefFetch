import os
import shutil
import uuid

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Paper, Chunk, Highlight
from app.schemas import PaperOut, PaperUpdate, HighlightIn, HighlightOut
from app.services.pdf import extract_text_from_pdf, guess_title
from app.services.embeddings import chunk_text, embed_batch
from app.services.ai import summarize_paper
from app.services.citation import to_bibtex, to_apa

router = APIRouter(prefix="/papers", tags=["papers"])

UPLOAD_DIR = "uploaded_pdfs"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload", response_model=PaperOut)
def upload_paper(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported right now")

    file_id = str(uuid.uuid4())
    save_path = os.path.join(UPLOAD_DIR, f"{file_id}.pdf")
    with open(save_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    full_text = extract_text_from_pdf(save_path)
    if not full_text.strip():
        raise HTTPException(422, "Could not extract text from this PDF (it may be scanned/image-only)")

    title = guess_title(full_text, fallback=file.filename)
    summary = summarize_paper(full_text)

    paper = Paper(title=title, filename=file.filename, summary=summary, full_text=full_text)
    db.add(paper)
    db.flush()  # get paper.id before commit

    # Chunk + embed for retrieval
    chunks = chunk_text(full_text)
    if chunks:
        vectors = embed_batch(chunks)
        for content, vector in zip(chunks, vectors):
            db.add(Chunk(paper_id=paper.id, content=content, embedding=vector))

    db.commit()
    db.refresh(paper)
    return paper


@router.get("/", response_model=list[PaperOut])
def list_papers(db: Session = Depends(get_db)):
    return db.query(Paper).order_by(Paper.created_at.desc()).all()


@router.get("/{paper_id}", response_model=PaperOut)
def get_paper(paper_id: uuid.UUID, db: Session = Depends(get_db)):
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(404, "Paper not found")
    return paper


@router.patch("/{paper_id}", response_model=PaperOut)
def update_paper(paper_id: uuid.UUID, update: PaperUpdate, db: Session = Depends(get_db)):
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(404, "Paper not found")
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(paper, field, value)
    db.commit()
    db.refresh(paper)
    return paper


@router.get("/{paper_id}/citation")
def get_citation(paper_id: uuid.UUID, style: str = "bibtex", db: Session = Depends(get_db)):
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(404, "Paper not found")
    if style == "apa":
        return {"citation": to_apa(paper.title, paper.authors, paper.year)}
    return {"citation": to_bibtex(paper.title, paper.authors, paper.year)}


@router.post("/{paper_id}/highlights", response_model=HighlightOut)
def add_highlight(paper_id: uuid.UUID, highlight: HighlightIn, db: Session = Depends(get_db)):
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(404, "Paper not found")
    h = Highlight(paper_id=paper_id, excerpt=highlight.excerpt, comment=highlight.comment)
    db.add(h)
    db.commit()
    db.refresh(h)
    return h


@router.get("/{paper_id}/highlights", response_model=list[HighlightOut])
def list_highlights(paper_id: uuid.UUID, db: Session = Depends(get_db)):
    return db.query(Highlight).filter(Highlight.paper_id == paper_id).order_by(Highlight.created_at.desc()).all()


@router.delete("/{paper_id}/highlights/{highlight_id}")
def delete_highlight(paper_id: uuid.UUID, highlight_id: uuid.UUID, db: Session = Depends(get_db)):
    h = db.query(Highlight).filter(Highlight.id == highlight_id, Highlight.paper_id == paper_id).first()
    if not h:
        raise HTTPException(404, "Highlight not found")
    db.delete(h)
    db.commit()
    return {"ok": True}


@router.delete("/{paper_id}")
def delete_paper(paper_id: uuid.UUID, db: Session = Depends(get_db)):
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(404, "Paper not found")
    db.delete(paper)
    db.commit()
    return {"ok": True}
