import uuid
from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()


class Paper(Base):
    __tablename__ = "papers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    filename = Column(String, nullable=False)
    summary = Column(Text, nullable=True)
    full_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Phase 2: organization + citation fields
    tags = Column(ARRAY(String), default=list, server_default="{}")
    notes = Column(Text, nullable=True)
    authors = Column(String, nullable=True)  # free-text, e.g. "Smith, J.; Doe, A."
    year = Column(String, nullable=True)

    chunks = relationship("Chunk", back_populates="paper", cascade="all, delete-orphan")
    highlights = relationship("Highlight", back_populates="paper", cascade="all, delete-orphan")


class Highlight(Base):
    """A saved excerpt from a paper, with an optional user comment."""

    __tablename__ = "highlights"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    paper_id = Column(UUID(as_uuid=True), ForeignKey("papers.id", ondelete="CASCADE"))
    excerpt = Column(Text, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    paper = relationship("Paper", back_populates="highlights")


class Review(Base):
    """A literature review document made up of ordered, editable sections."""

    __tablename__ = "reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    sections = relationship(
        "ReviewSection", back_populates="review", cascade="all, delete-orphan", order_by="ReviewSection.order"
    )


class ReviewSection(Base):
    __tablename__ = "review_sections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    review_id = Column(UUID(as_uuid=True), ForeignKey("reviews.id", ondelete="CASCADE"))
    name = Column(String, nullable=False)  # e.g. "Introduction", "Related Work"
    content = Column(Text, default="")
    order = Column(Integer, default=0)

    review = relationship("Review", back_populates="sections")


class Chunk(Base):
    """A chunk of a paper's text, with its embedding, used for retrieval (RAG)."""

    __tablename__ = "chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    paper_id = Column(UUID(as_uuid=True), ForeignKey("papers.id", ondelete="CASCADE"))
    content = Column(Text, nullable=False)
    # Anthropic doesn't provide its own embedding model, so we embed
    # locally with sentence-transformers (see services/embeddings.py).
    # all-MiniLM-L6-v2 outputs 384-dim vectors — change this if you swap models.
    embedding = Column(Vector(384))

    paper = relationship("Paper", back_populates="chunks")


class ChatMessage(Base):
    """Stores chat history per paper (or global, if paper_id is null)."""

    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    paper_id = Column(UUID(as_uuid=True), ForeignKey("papers.id", ondelete="CASCADE"), nullable=True)
    role = Column(String, nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
