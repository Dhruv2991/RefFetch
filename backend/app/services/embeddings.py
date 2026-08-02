"""
Local embedding generation. Using sentence-transformers keeps this free and
API-key-free for Phase 1. Swap this out later for Voyage AI or OpenAI
embeddings if you want higher-quality retrieval at scale.
"""

from functools import lru_cache

from sentence_transformers import SentenceTransformer


@lru_cache(maxsize=1)
def get_model():
    # Loaded once and cached — loading this per-request would be very slow.
    return SentenceTransformer("all-MiniLM-L6-v2")


def embed_text(text: str) -> list[float]:
    model = get_model()
    return model.encode(text, normalize_embeddings=True).tolist()


def embed_batch(texts: list[str]) -> list[list[float]]:
    model = get_model()
    return model.encode(texts, normalize_embeddings=True).tolist()


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
