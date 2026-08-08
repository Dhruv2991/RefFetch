import { getAccessToken } from "./supabaseClient";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

/** Attaches the current Supabase session token to every API request. */
async function authedFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

async function authedJson(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  return authedFetch(path, { ...options, headers });
}

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
  const res = await authedFetch("/papers/");
  if (!res.ok) throw new Error("Failed to fetch papers");
  return res.json();
}

export async function uploadPaper(file: File): Promise<Paper> {
  const form = new FormData();
  form.append("file", file);
  const res = await authedFetch("/papers/upload", { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Upload failed");
  }
  return res.json();
}

export async function updatePaper(
  id: string,
  update: Partial<Pick<Paper, "tags" | "notes" | "authors" | "year" | "title">>
): Promise<Paper> {
  const res = await authedJson(`/papers/${id}`, { method: "PATCH", body: JSON.stringify(update) });
  if (!res.ok) throw new Error("Update failed");
  return res.json();
}

export async function fetchCitation(id: string, style: "bibtex" | "apa"): Promise<string> {
  const res = await authedFetch(`/papers/${id}/citation?style=${style}`);
  if (!res.ok) throw new Error("Failed to fetch citation");
  const data = await res.json();
  return data.citation;
}

export async function fetchHighlights(paperId: string): Promise<Highlight[]> {
  const res = await authedFetch(`/papers/${paperId}/highlights`);
  if (!res.ok) throw new Error("Failed to fetch highlights");
  return res.json();
}

export async function addHighlight(paperId: string, excerpt: string, comment?: string): Promise<Highlight> {
  const res = await authedJson(`/papers/${paperId}/highlights`, {
    method: "POST",
    body: JSON.stringify({ excerpt, comment: comment || null }),
  });
  if (!res.ok) throw new Error("Failed to add highlight");
  return res.json();
}

export async function deleteHighlight(paperId: string, highlightId: string): Promise<void> {
  const res = await authedFetch(`/papers/${paperId}/highlights/${highlightId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete highlight");
}

export async function deletePaper(paperId: string): Promise<void> {
  const res = await authedFetch(`/papers/${paperId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete paper");
}

export async function askQuestion(question: string, paperId?: string) {
  const res = await authedJson("/chat/", { method: "POST", body: JSON.stringify({ question, paper_id: paperId ?? null }) });
  if (!res.ok) throw new Error("Chat request failed");
  return res.json() as Promise<{ answer: string; sources_used: number }>;
}

export async function comparePapers(paperIds: string[]): Promise<string> {
  const res = await authedJson("/compare/", { method: "POST", body: JSON.stringify({ paper_ids: paperIds }) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Comparison failed");
  }
  const data = await res.json();
  return data.comparison;
}

export async function queryMemory(question: string): Promise<{ answer: string; papers_referenced: string[] }> {
  const res = await authedJson("/memory/", { method: "POST", body: JSON.stringify({ question }) });
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
  const res = await authedFetch("/graph/");
  if (!res.ok) throw new Error("Failed to fetch graph");
  return res.json();
}

export type PdfSection = { heading: string; body: string };
export type FullReport = { title: string; subtitle: string; sections: PdfSection[] };

export async function fetchFullReport(): Promise<FullReport> {
  const res = await authedFetch("/reports/full");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to generate report");
  }
  return res.json();
}

export type ReviewSection = { id: string; name: string; content: string; order: number };
export type Review = { id: string; title: string; created_at: string; sections: ReviewSection[] };

export async function fetchReviews(): Promise<Review[]> {
  const res = await authedFetch("/reviews/");
  if (!res.ok) throw new Error("Failed to fetch reviews");
  return res.json();
}

export async function createReview(title: string): Promise<Review> {
  const res = await authedJson("/reviews/", { method: "POST", body: JSON.stringify({ title }) });
  if (!res.ok) throw new Error("Failed to create review");
  return res.json();
}

export async function deleteReview(id: string): Promise<void> {
  const res = await authedFetch(`/reviews/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete review");
}

export async function updateSection(sectionId: string, content: string): Promise<Review> {
  const res = await authedJson(`/reviews/sections/${sectionId}`, { method: "PATCH", body: JSON.stringify({ content }) });
  if (!res.ok) throw new Error("Failed to save section");
  return res.json();
}

export async function draftSection(sectionId: string, paperIds: string[], instructions?: string): Promise<Review> {
  const res = await authedJson(`/reviews/sections/${sectionId}/draft`, {
    method: "POST",
    body: JSON.stringify({ paper_ids: paperIds, instructions: instructions || null }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to draft section");
  }
  return res.json();
}
