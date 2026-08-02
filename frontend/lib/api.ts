const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export type Paper = {
  id: string;
  title: string;
  filename: string;
  summary: string | null;
  created_at: string;
  tags: string[];
  notes: string | null;
  authors: string | null;
  year: string | null;
};

export type Highlight = {
  id: string;
  paper_id: string;
  excerpt: string;
  comment: string | null;
  created_at: string;
};

export async function fetchPapers(): Promise<Paper[]> {
  const res = await fetch(`${API_BASE}/papers/`);
  if (!res.ok) throw new Error("Failed to fetch papers");
  return res.json();
}

export async function uploadPaper(file: File): Promise<Paper> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/papers/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

export async function updatePaper(
  id: string,
  update: Partial<Pick<Paper, "tags" | "notes" | "authors" | "year" | "title">>
): Promise<Paper> {
  const res = await fetch(`${API_BASE}/papers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(update),
  });
  if (!res.ok) throw new Error("Update failed");
  return res.json();
}

export async function fetchCitation(id: string, style: "bibtex" | "apa"): Promise<string> {
  const res = await fetch(`${API_BASE}/papers/${id}/citation?style=${style}`);
  if (!res.ok) throw new Error("Failed to fetch citation");
  const data = await res.json();
  return data.citation;
}

export async function fetchHighlights(paperId: string): Promise<Highlight[]> {
  const res = await fetch(`${API_BASE}/papers/${paperId}/highlights`);
  if (!res.ok) throw new Error("Failed to fetch highlights");
  return res.json();
}

export async function addHighlight(paperId: string, excerpt: string, comment?: string): Promise<Highlight> {
  const res = await fetch(`${API_BASE}/papers/${paperId}/highlights`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ excerpt, comment: comment || null }),
  });
  if (!res.ok) throw new Error("Failed to add highlight");
  return res.json();
}

export async function deleteHighlight(paperId: string, highlightId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/papers/${paperId}/highlights/${highlightId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete highlight");
}

export async function askQuestion(question: string, paperId?: string) {
  const res = await fetch(`${API_BASE}/chat/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, paper_id: paperId ?? null }),
  });
  if (!res.ok) throw new Error("Chat request failed");
  return res.json() as Promise<{ answer: string; sources_used: number }>;
}

export async function comparePapers(paperIds: string[]): Promise<string> {
  const res = await fetch(`${API_BASE}/compare/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paper_ids: paperIds }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Comparison failed");
  }
  const data = await res.json();
  return data.comparison;
}

export async function queryMemory(question: string): Promise<{ answer: string; papers_referenced: string[] }> {
  const res = await fetch(`${API_BASE}/memory/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Memory query failed");
  }
  return res.json();
}

export type GraphNode = { id: string; title: string; tags: string[] };
export type GraphEdge = { source: string; target: string; weight: number };
export type Graph = { nodes: GraphNode[]; edges: GraphEdge[] };

export async function fetchGraph(): Promise<Graph> {
  const res = await fetch(`${API_BASE}/graph/`);
  if (!res.ok) throw new Error("Failed to fetch graph");
  return res.json();
}

export type ReviewSection = { id: string; name: string; content: string; order: number };
export type Review = { id: string; title: string; created_at: string; sections: ReviewSection[] };

export async function fetchReviews(): Promise<Review[]> {
  const res = await fetch(`${API_BASE}/reviews/`);
  if (!res.ok) throw new Error("Failed to fetch reviews");
  return res.json();
}

export async function createReview(title: string): Promise<Review> {
  const res = await fetch(`${API_BASE}/reviews/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to create review");
  return res.json();
}

export async function deleteReview(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/reviews/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete review");
}

export async function updateSection(sectionId: string, content: string): Promise<Review> {
  const res = await fetch(`${API_BASE}/reviews/sections/${sectionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Failed to save section");
  return res.json();
}

export async function draftSection(sectionId: string, paperIds: string[], instructions?: string): Promise<Review> {
  const res = await fetch(`${API_BASE}/reviews/sections/${sectionId}/draft`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paper_ids: paperIds, instructions: instructions || null }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to draft section");
  }
  return res.json();
}
