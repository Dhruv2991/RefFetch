import uuid
from datetime import datetime

from pydantic import BaseModel


class PaperOut(BaseModel):
    id: uuid.UUID
    title: str
    filename: str
    summary: str | None
    created_at: datetime
    tags: list[str] = []
    notes: str | None = None
    authors: str | None = None
    year: str | None = None

    class Config:
        from_attributes = True


class PaperUpdate(BaseModel):
    """Fields a user can edit after upload — all optional/partial."""
    tags: list[str] | None = None
    notes: str | None = None
    authors: str | None = None
    year: str | None = None
    title: str | None = None


class HighlightIn(BaseModel):
    excerpt: str
    comment: str | None = None


class HighlightOut(BaseModel):
    id: uuid.UUID
    paper_id: uuid.UUID
    excerpt: str
    comment: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    question: str
    paper_id: uuid.UUID | None = None  # None = search across whole library


class ChatResponse(BaseModel):
    answer: str
    sources_used: int


class CompareRequest(BaseModel):
    paper_ids: list[uuid.UUID]


class CompareResponse(BaseModel):
    comparison: str


class MemoryRequest(BaseModel):
    question: str


class MemoryResponse(BaseModel):
    answer: str
    papers_referenced: list[str]


class GraphNode(BaseModel):
    id: uuid.UUID
    title: str
    tags: list[str]


class GraphEdge(BaseModel):
    source: uuid.UUID
    target: uuid.UUID
    weight: float  # similarity score, 0-1


class GraphResponse(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]


class ReviewSectionOut(BaseModel):
    id: uuid.UUID
    name: str
    content: str
    order: int

    class Config:
        from_attributes = True


class ReviewOut(BaseModel):
    id: uuid.UUID
    title: str
    created_at: datetime
    sections: list[ReviewSectionOut]

    class Config:
        from_attributes = True


class ReviewCreate(BaseModel):
    title: str
    section_names: list[str] = [
        "Introduction",
        "Related Work",
        "Methods",
        "Comparison",
        "Research Gap",
        "References",
    ]


class SectionUpdate(BaseModel):
    content: str


class SectionDraftRequest(BaseModel):
    paper_ids: list[uuid.UUID]
    instructions: str | None = None
