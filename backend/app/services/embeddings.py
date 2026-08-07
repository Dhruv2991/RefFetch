"""
Embedding generation via Cohere's free-tier API. Switched from local
sentence-transformers because loading PyTorch + the model in-process needed
more RAM than fits on typical free hosting tiers (Render's 512MB, etc).
Cohere's embed-english-light-v3.0 outputs 384-dim vectors, matching this
project's existing pgvector column — no schema change needed.
"""

import os

import httpx
from dotenv import load_dotenv

load_dotenv()

COHERE_API_KEY = os.getenv("COHERE_API_KEY")
COHERE_URL = "https://api.cohere.com/v1/embed"
MODEL = "embed-english-light-v3.0"


def _cohere_embed(texts: list[str], input_type: str) -> list[list[float]]:
    response = httpx.post(
        COHERE_URL,
        headers={"Authorization": f"Bearer {COHERE_API_KEY}", "Content-Type": "application/json"},
        json={"texts": texts, "model": MODEL, "input_type": input_type},
        timeout=30.0,
    )
    response.raise_for_status()
    return response.json()["embeddings"]


def embed_text(text: str) -> list[float]:
    # input_type="search_query" for the user's question at chat time
    return _cohere_embed([text], input_type="search_query")[0]


def embed_batch(texts: list[str]) -> list[list[float]]:
    # input_type="search_document" for paper chunks stored at upload time —
    # Cohere optimizes the embedding differently for queries vs documents.
    # Cohere's API caps batches at 96 texts; chunk larger batches if needed.
    if len(texts) <= 96:
        return _cohere_embed(texts, input_type="search_document")

    all_embeddings = []
    for i in range(0, len(texts), 96):
        batch = texts[i : i + 96]
        all_embeddings.extend(_cohere_embed(batch, input_type="search_document"))
    return all_embeddings


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 150) -> list[str]:
    """Simple sliding-window chunker. Good enough for Phase 1 — later you
    can swap in a smarter splitter that respects paragraph/section boundaries."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return [c for c in chunks if c.strip()]
