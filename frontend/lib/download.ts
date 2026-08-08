const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export type PdfSection = { heading: string; body: string };

async function downloadPdf(title: string, subtitle: string, sections: PdfSection[]) {
  const res = await fetch(`${API_BASE}/export/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, subtitle, sections }),
  });
  if (!res.ok) throw new Error("Failed to generate PDF");

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9]+/gi, "-").slice(0, 60)}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadReviewReport(title: string, sections: { name: string; content: string }[]) {
  const pdfSections = sections
    .filter((s) => s.content.trim())
    .map((s) => ({ heading: s.name, body: s.content }));
  return downloadPdf(title, "Literature Review — RefFetch", pdfSections);
}

export function downloadComparisonReport(paperTitles: string[], comparison: string) {
  return downloadPdf(
    "Paper Comparison",
    `Comparing: ${paperTitles.join(", ")}`,
    [{ heading: "", body: comparison }]
  );
}

export function downloadMemoryReport(question: string, answer: string, papersReferenced: string[]) {
  return downloadPdf(
    "Research Memory",
    question,
    [
      { heading: "", body: answer },
      { heading: "Drawn From", body: papersReferenced.map((p) => `- ${p}`).join("\n") },
    ]
  );
}

export function downloadPaperReport(
  title: string,
  authors: string | null,
  year: string | null,
  summary: string | null,
  notes: string | null,
  highlights: string[]
) {
  const sections: PdfSection[] = [];
  if (summary) sections.push({ heading: "Summary", body: summary });
  if (notes) sections.push({ heading: "Your Notes", body: notes });
  if (highlights.length > 0) {
    sections.push({ heading: "Highlights", body: highlights.map((h) => `- ${h}`).join("\n") });
  }
  const subtitle = authors || year ? `${authors || "Unknown author"} (${year || "n.d."})` : "";
  return downloadPdf(title, subtitle, sections);
}

export function downloadFullReport(title: string, subtitle: string, sections: PdfSection[]) {
  return downloadPdf(title, subtitle, sections);
}
