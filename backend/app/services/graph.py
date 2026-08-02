import numpy as np

SIMILARITY_THRESHOLD = 0.35  # edges below this are too weak to be meaningful
MAX_EDGES_PER_PAPER = 5  # keep the graph readable rather than fully connected


def compute_paper_vector(chunk_embeddings: list[list[float]]) -> list[float] | None:
    """A paper's overall embedding is just the mean of its chunk embeddings —
    cheap and good enough for a topic-similarity graph."""
    if not chunk_embeddings:
        return None
    return np.mean(np.array(chunk_embeddings), axis=0).tolist()


def cosine_similarity(a: list[float], b: list[float]) -> float:
    a_arr, b_arr = np.array(a), np.array(b)
    denom = np.linalg.norm(a_arr) * np.linalg.norm(b_arr)
    if denom == 0:
        return 0.0
    return float(np.dot(a_arr, b_arr) / denom)


def build_edges(paper_vectors: dict, threshold: float = SIMILARITY_THRESHOLD) -> list[dict]:
    """
    paper_vectors: {paper_id: vector}
    Returns edges above threshold, capped per-paper so hub papers don't
    turn the graph into an unreadable hairball.
    """
    ids = list(paper_vectors.keys())
    all_edges = []

    for i in range(len(ids)):
        for j in range(i + 1, len(ids)):
            sim = cosine_similarity(paper_vectors[ids[i]], paper_vectors[ids[j]])
            if sim >= threshold:
                all_edges.append({"source": ids[i], "target": ids[j], "weight": round(sim, 3)})

    # Cap edges per node: keep each paper's strongest connections only
    edges_by_node: dict = {}
    for e in all_edges:
        edges_by_node.setdefault(e["source"], []).append(e)
        edges_by_node.setdefault(e["target"], []).append(e)

    keep_ids = set()
    for node, edges in edges_by_node.items():
        top = sorted(edges, key=lambda e: -e["weight"])[:MAX_EDGES_PER_PAPER]
        for e in top:
            keep_ids.add((e["source"], e["target"]))

    return [e for e in all_edges if (e["source"], e["target"]) in keep_ids]
