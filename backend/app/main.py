from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import papers, chat, compare, memory, graph, reviews

app = FastAPI(title="Research Copilot API")

app.add_middleware(
    CORSMiddleware,
    # "*" is fine for local dev — browser extensions have unpredictable
    # chrome-extension:// origins. Lock this down before any real deployment.
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(papers.router)
app.include_router(chat.router)
app.include_router(compare.router)
app.include_router(memory.router)
app.include_router(graph.router)
app.include_router(reviews.router)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/")
def health():
    return {"status": "ok"}
