export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export function downloadReviewReport(title: string, sections: { name: string; content: string }[]) {
  const date = new Date().toLocaleDateString();
  const body = sections
    .filter((s) => s.content.trim())
    .map((s) => `## ${s.name}\n\n${s.content.trim()}`)
    .join("\n\n---\n\n");

  const doc = `# ${title}\n\n*Generated with Research Copilot — ${date}*\n\n---\n\n${body}\n`;
  downloadTextFile(`${slugify(title)}.md`, doc);
}

export function downloadComparisonReport(paperTitles: string[], comparison: string) {
  const date = new Date().toLocaleDateString();
  const doc = `# Paper Comparison\n\n*Generated with Research Copilot — ${date}*\n\n**Papers compared:**\n${paperTitles
    .map((t) => `- ${t}`)
    .join("\n")}\n\n---\n\n${comparison}\n`;
  downloadTextFile(`comparison-${slugify(paperTitles[0] || "papers")}.md`, doc);
}

export function downloadMemoryReport(question: string, answer: string, papersReferenced: string[]) {
  const date = new Date().toLocaleDateString();
  const doc = `# Research Memory: ${question}\n\n*Generated with Research Copilot — ${date}*\n\n${answer}\n\n---\n\n**Drawn from:** ${papersReferenced.join(", ")}\n`;
  downloadTextFile(`memory-${slugify(question)}.md`, doc);
}