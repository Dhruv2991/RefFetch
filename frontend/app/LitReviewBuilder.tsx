"use client";

import { useEffect, useState } from "react";
import {
  Paper,
  Review,
  fetchReviews,
  createReview,
  deleteReview,
  updateSection,
  draftSection,
} from "@/lib/api";
import { downloadReviewReport } from "@/lib/download";

export default function LitReviewBuilder({ papers }: { papers: Paper[] }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeReviewId, setActiveReviewId] = useState<string | undefined>();
  const [newTitle, setNewTitle] = useState("");
  const [activeSectionId, setActiveSectionId] = useState<string | undefined>();
  const [selectedPapers, setSelectedPapers] = useState<string[]>([]);
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);

  const loadReviews = () => fetchReviews().then(setReviews).catch(console.error);

  useEffect(() => {
    loadReviews();
  }, []);

  const activeReview = reviews.find((r) => r.id === activeReviewId);
  const activeSection = activeReview?.sections.find((s) => s.id === activeSectionId);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const review = await createReview(newTitle.trim());
    setNewTitle("");
    await loadReviews();
    setActiveReviewId(review.id);
    if (review.sections.length > 0) setActiveSectionId(review.sections[0].id);
  };

  const handleDelete = async (id: string) => {
    await deleteReview(id);
    if (activeReviewId === id) {
      setActiveReviewId(undefined);
      setActiveSectionId(undefined);
    }
    await loadReviews();
  };

  const handleSaveContent = async (content: string) => {
    if (!activeSectionId) return;
    const updated = await updateSection(activeSectionId, content);
    setReviews((rs) => rs.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handleDraft = async () => {
    if (!activeSectionId || selectedPapers.length === 0) return;
    setDrafting(true);
    setDraftError(null);
    try {
      const updated = await draftSection(activeSectionId, selectedPapers);
      setReviews((rs) => rs.map((r) => (r.id === updated.id ? updated : r)));
    } catch (e: any) {
      setDraftError(e.message || "Drafting failed");
    } finally {
      setDrafting(false);
    }
  };

  const togglePaper = (id: string) => {
    setSelectedPapers((sel) => (sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]));
  };

  return (
    <div className="flex h-full">
      {/* Reviews list */}
      <div className="w-56 border-r border-hairline p-3 space-y-2 overflow-y-auto">
        <div className="flex gap-1">
          <input
            className="flex-1 bg-ink-card rounded px-2 py-1 text-xs"
            placeholder="New review title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <button onClick={handleCreate} className="bg-ink-hover hover:bg-gray-600 px-2 rounded text-xs">
            +
          </button>
        </div>
        {reviews.map((r) => (
          <div key={r.id} className="flex items-center gap-1">
            <button
              className={`flex-1 text-left px-2 py-1.5 rounded text-xs ${
                activeReviewId === r.id ? "bg-gold/20" : "bg-ink-card hover:bg-ink-hover"
              }`}
              onClick={() => {
                setActiveReviewId(r.id);
                setActiveSectionId(r.sections[0]?.id);
              }}
            >
              {r.title}
            </button>
            <button onClick={() => handleDelete(r.id)} className="text-paper-faint hover:text-rose text-xs px-1">
              ×
            </button>
          </div>
        ))}
        {reviews.length === 0 && <p className="text-xs text-paper-faint">No reviews yet — create one above.</p>}
      </div>

      {/* Sections + editor */}
      {activeReview ? (
        <div className="flex-1 flex overflow-hidden">
          <div className="w-40 border-r border-hairline p-3 space-y-1 overflow-y-auto">
            <button
              onClick={() => downloadReviewReport(activeReview.title, activeReview.sections)}
              className="w-full text-xs px-2 py-1.5 rounded bg-gold/15 text-gold-bright hover:bg-gold/25 transition-colors mb-2"
            >
              ↓ Full report
            </button>
            {activeReview.sections.map((s) => (
              <button
                key={s.id}
                className={`w-full text-left px-2 py-1.5 rounded text-xs ${
                  activeSectionId === s.id ? "bg-gold/20" : "bg-ink-card hover:bg-ink-hover"
                }`}
                onClick={() => setActiveSectionId(s.id)}
              >
                {s.name}
                {s.content && <span className="text-teal ml-1">●</span>}
              </button>
            ))}
          </div>

          <div className="flex-1 flex flex-col p-3 overflow-hidden">
            {activeSection ? (
              <>
                <h3 className="font-serif text-base font-semibold mb-2 text-paper">{activeSection.name}</h3>

                <div className="mb-2">
                  <p className="text-xs text-paper-faint mb-1">Draft from papers:</p>
                  <div className="flex flex-wrap gap-1 mb-2 max-h-20 overflow-y-auto">
                    {papers.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => togglePaper(p.id)}
                        className={`text-[10px] px-2 py-1 rounded-full ${
                          selectedPapers.includes(p.id) ? "bg-gold" : "bg-ink-card hover:bg-ink-hover"
                        }`}
                      >
                        {p.title.slice(0, 25)}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleDraft}
                    disabled={drafting || selectedPapers.length === 0}
                    className="bg-gold hover:bg-gold-bright disabled:bg-ink-card disabled:text-paper-faint px-3 py-1.5 rounded text-xs"
                  >
                    {drafting ? "Drafting..." : "Draft with AI"}
                  </button>
                  {draftError && <p className="text-rose text-xs mt-1">{draftError}</p>}
                </div>

                <textarea
                  className="flex-1 bg-ink-card rounded p-3 text-sm resize-none outline-none"
                  value={activeSection.content}
                  onChange={(e) => {
                    const content = e.target.value;
                    setReviews((rs) =>
                      rs.map((r) =>
                        r.id === activeReview.id
                          ? {
                              ...r,
                              sections: r.sections.map((s) => (s.id === activeSection.id ? { ...s, content } : s)),
                            }
                          : r
                      )
                    );
                  }}
                  onBlur={(e) => handleSaveContent(e.target.value)}
                  placeholder="Draft with AI above, or write your own..."
                />
              </>
            ) : (
              <p className="text-paper-faint text-sm">Select a section.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-paper-faint text-sm">Create or select a review to get started.</p>
        </div>
      )}
    </div>
  );
}