"use client";

import { useEffect, useState } from "react";
import {
  Paper,
  Highlight,
  updatePaper,
  fetchCitation,
  fetchHighlights,
  addHighlight,
  deleteHighlight,
} from "@/lib/api";
import Markdown from "./Markdown";
import { downloadTextFile } from "@/lib/download";

export default function PaperDetailsPanel({
  paper,
  onUpdated,
}: {
  paper: Paper;
  onUpdated: (p: Paper) => void;
}) {
  const [tagInput, setTagInput] = useState("");
  const [notes, setNotes] = useState(paper.notes || "");
  const [authors, setAuthors] = useState(paper.authors || "");
  const [year, setYear] = useState(paper.year || "");
  const [citation, setCitation] = useState<string | null>(null);
  const [citationStyle, setCitationStyle] = useState<"bibtex" | "apa">("bibtex");
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [newExcerpt, setNewExcerpt] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNotes(paper.notes || "");
    setAuthors(paper.authors || "");
    setYear(paper.year || "");
    setCitation(null);
    fetchHighlights(paper.id).then(setHighlights).catch(console.error);
  }, [paper.id]);

  const saveField = async (update: Partial<Paper>) => {
    setSaving(true);
    try {
      const updated = await updatePaper(paper.id, update);
      onUpdated(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag || paper.tags.includes(tag)) return;
    saveField({ tags: [...paper.tags, tag] });
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    saveField({ tags: paper.tags.filter((t) => t !== tag) });
  };

  const loadCitation = async (style: "bibtex" | "apa") => {
    setCitationStyle(style);
    const c = await fetchCitation(paper.id, style);
    setCitation(c);
  };

  const handleAddHighlight = async () => {
    if (!newExcerpt.trim()) return;
    const h = await addHighlight(paper.id, newExcerpt.trim());
    setHighlights((hs) => [h, ...hs]);
    setNewExcerpt("");
  };

  const handleDeleteHighlight = async (id: string) => {
    await deleteHighlight(paper.id, id);
    setHighlights((hs) => hs.filter((h) => h.id !== id));
  };

  return (
    <div className="space-y-5 text-sm">
      <div>
        <div className="flex items-start justify-between gap-2 mb-1">
          <h2 className="font-serif font-semibold text-lg text-paper">{paper.title}</h2>
          <button
            onClick={() => {
              const parts = [`# ${paper.title}`];
              if (paper.authors || paper.year) parts.push(`*${paper.authors || "Unknown author"} (${paper.year || "n.d."})*`);
              if (paper.summary) parts.push(`## Summary\n\n${paper.summary}`);
              if (paper.notes) parts.push(`## Notes\n\n${paper.notes}`);
              if (highlights.length > 0) {
                parts.push(`## Highlights\n\n${highlights.map((h) => `> ${h.excerpt}`).join("\n\n")}`);
              }
              downloadTextFile(`${paper.title.slice(0, 50).replace(/[^a-z0-9]+/gi, "-")}.md`, parts.join("\n\n"));
            }}
            className="shrink-0 text-xs px-2.5 py-1 rounded bg-gold/15 text-gold-bright hover:bg-gold/25 transition-colors"
          >
            ↓ Download
          </button>
        </div>
        {paper.summary && (
          <div className="text-xs">
            <Markdown>{paper.summary}</Markdown>
          </div>
        )}
      </div>

      {/* Authors / Year for citations */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-paper-faint">Authors</label>
          <input
            className="w-full bg-ink-card rounded px-2 py-1 text-xs"
            value={authors}
            onChange={(e) => setAuthors(e.target.value)}
            onBlur={() => saveField({ authors })}
            placeholder="Smith, J.; Doe, A."
          />
        </div>
        <div>
          <label className="text-xs text-paper-faint">Year</label>
          <input
            className="w-full bg-ink-card rounded px-2 py-1 text-xs"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            onBlur={() => saveField({ year })}
            placeholder="2024"
          />
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="text-xs text-paper-faint block mb-1">Tags</label>
        <div className="flex flex-wrap gap-1 mb-2">
          {paper.tags.map((t) => (
            <span key={t} className="bg-gold/20 px-2 py-0.5 rounded-full text-xs flex items-center gap-1">
              {t}
              <button onClick={() => removeTag(t)} className="text-paper-muted hover:text-white">
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-1">
          <input
            className="flex-1 bg-ink-card rounded px-2 py-1 text-xs"
            placeholder="Add a tag..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTag()}
          />
          <button onClick={addTag} className="bg-ink-hover hover:bg-gray-600 px-2 rounded text-xs">
            Add
          </button>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs text-paper-faint block mb-1">Your notes</label>
        <textarea
          className="w-full bg-ink-card rounded px-2 py-1 text-xs min-h-[80px]"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => saveField({ notes })}
          placeholder="Write your own notes on this paper..."
        />
        {saving && <p className="text-xs text-paper-faint mt-1">Saving...</p>}
      </div>

      {/* Citation export */}
      <div>
        <label className="text-xs text-paper-faint block mb-1">Citation</label>
        <div className="flex gap-1 mb-2">
          <button
            className={`px-2 py-1 rounded text-xs ${citationStyle === "bibtex" && citation ? "bg-gold/25" : "bg-ink-card hover:bg-ink-hover"}`}
            onClick={() => loadCitation("bibtex")}
          >
            BibTeX
          </button>
          <button
            className={`px-2 py-1 rounded text-xs ${citationStyle === "apa" && citation ? "bg-gold/25" : "bg-ink-card hover:bg-ink-hover"}`}
            onClick={() => loadCitation("apa")}
          >
            APA
          </button>
        </div>
        {citation && (
          <pre className="bg-ink rounded p-2 text-xs whitespace-pre-wrap select-all">{citation}</pre>
        )}
      </div>

      {/* Highlights */}
      <div>
        <label className="text-xs text-paper-faint block mb-1">Highlights</label>
        <div className="flex gap-1 mb-2">
          <textarea
            className="flex-1 bg-ink-card rounded px-2 py-1 text-xs min-h-[50px]"
            placeholder="Paste a key excerpt to save..."
            value={newExcerpt}
            onChange={(e) => setNewExcerpt(e.target.value)}
          />
        </div>
        <button onClick={handleAddHighlight} className="bg-ink-hover hover:bg-gray-600 px-2 py-1 rounded text-xs mb-2">
          Save highlight
        </button>
        <div className="space-y-2">
          {highlights.map((h) => (
            <div key={h.id} className="bg-ink-card rounded p-2 text-xs relative">
              <p className="whitespace-pre-wrap pr-4">{h.excerpt}</p>
              <button
                onClick={() => handleDeleteHighlight(h.id)}
                className="absolute top-1 right-1 text-paper-faint hover:text-white"
              >
                ×
              </button>
            </div>
          ))}
          {highlights.length === 0 && <p className="text-xs text-paper-faint">No highlights saved yet.</p>}
        </div>
      </div>
    </div>
  );
}