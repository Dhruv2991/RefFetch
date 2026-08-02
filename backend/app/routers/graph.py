from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Paper, Chunk
from app.schemas import GraphResponse, GraphNode, GraphEdge
from app.services.graph import compute_paper_vector, build_edges

router = APIRouter(prefix="/graph", tags=["graph"])


@router.get("/", response_model=GraphResponse)
def get_graph(db: Session = Depends(get_db)):
    papers = db.query(Paper).all()

    paper_vectors = {}
    for p in papers:
        chunks = db.query(Chunk).filter(Chunk.paper_id == p.id).all()
        vector = compute_paper_vector([c.embedding for c in chunks])
        if vector is not None:
            paper_vectors[p.id] = vector

    edges = build_edges(paper_vectors)

    nodes = [GraphNode(id=p.id, title=p.title, tags=p.tags or []) for p in papers]
    edge_models = [GraphEdge(**e) for e in edges]

    return GraphResponse(nodes=nodes, edges=edge_models)
