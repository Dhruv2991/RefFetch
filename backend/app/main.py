import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import papers, chat, compare, memory, graph, reviews, export, reports

app = FastAPI(title="Research Copilot API")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
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
app.include_router(export.router)
app.include_router(reports.router)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/")
def health():
    return {"status": "ok"}
