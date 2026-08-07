"use client";

import { useEffect, useRef, useState } from "react";
import { Paper, fetchPapers, uploadPaper, askQuestion, comparePapers, queryMemory } from "@/lib/api";
import PaperDetailsPanel from "./PaperDetailsPanel";
import ResearchGraph from "./ResearchGraph";
import LitReviewBuilder from "./LitReviewBuilder";
import Markdown from "./Markdown";
import { downloadComparisonReport, downloadMemoryReport, downloadFullReport, PdfSection } from "@/lib/download";
import { fetchFullReport } from "@/lib/api";

const NAV_ITEMS: { key: "review" | "graph" | "memory"; label: string; activeClass: string }[] = [
  { key: "review", label: "Lit Review", activeClass: "bg-gold/20 text-gold-bright" },
  { key: "graph", label: "Graph", activeClass: "bg-teal/20 text-teal" },
  { key: "memory", label: "Memory", activeClass: "bg-teal/20 text-teal" },
];

export default function Home() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [uploading, setUploading] = useState(false);
  const [activePaperId, setActivePaperId] = useState<string | undefined>();
  const [view, setView] = useState<"chat" | "details" | "compare" | "memory" | "graph" | "review" | "fullreport">("chat");
  const [question, setQuestion] = useState("");
  const [chatLog, setChatLog] = useState<{ role: string; content: string }[]>([]);
  const [asking, setAsking] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<string | null>(null);
  const [compareError, setCompareError] = useState<string | null>(null);

  const [memoryQuestion, setMemoryQuestion] = useState("");
  const [memoryAsking, setMemoryAsking] = useState(false);
  const [memoryAnswer, setMemoryAnswer] = useState<string | null>(null);
  const [memoryPapers, setMemoryPapers] = useState<string[]>([]);
  const [memoryError, setMemoryError] = useState<string | null>(null);

  const [fullReport, setFullReport] = useState<{ title: string; subtitle: string; sections: PdfSection[] } | null>(
    null
  );
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const runFullReport = async () => {
    setView("fullreport");
    setReportLoading(true);
    setReportError(null);
    setFullReport(null);
    try {
      const report = await fetchFullReport();
      setFullReport(report);
    } catch (e: any) {
      setReportError(e.message || "Failed to generate report");
    } finally {
      setReportLoading(false);
    }
  };

  const loadPapers = () => fetchPapers().then(setPapers).catch(console.error);

  useEffect(() => {
    loadPapers();
  }, []);

  const activePaper = papers.find((p) => p.id === activePaperId);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      await uploadPaper(file);
      await loadPapers();
    } catch (e) {
      alert("Upload failed — check backend is running");
    } finally {
      setUploading(false);
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    const q = question;
    setChatLog((log) => [...log, { role: "user", content: q }]);
    setQuestion("");
    setAsking(true);
    try {
      const res = await askQuestion(q, activePaperId);
      setChatLog((log) => [...log, { role: "assistant", content: res.answer }]);
    } catch (e) {
      setChatLog((log) => [...log, { role: "assistant", content: "Error: could not get a response." }]);
    } finally {
      setAsking(false);
    }
  };

  const updatePaperInList = (updated: Paper) => {
    setPapers((ps) => ps.map((p) => (p.id === updated.id ? updated : p)));
  };

  const toggleCompareSelection = (id: string) => {
    setSelectedForCompare((sel) => (sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]));
  };

  const runComparison = async () => {
    setComparing(true);
    setCompareError(null);
    setComparisonResult(null);
    setView("compare");
    try {
      const result = await comparePapers(selectedForCompare);
      setComparisonResult(result);
    } catch (e: any) {
      setCompareError(e.message || "Comparison failed");
    } finally {
      setComparing(false);
    }
  };

  const runMemoryQuery = async () => {
    if (!memoryQuestion.trim()) return;
    setMemoryAsking(true);
    setMemoryError(null);
    setMemoryAnswer(null);
    try {
      const res = await queryMemory(memoryQuestion);
      setMemoryAnswer(res.answer);
      setMemoryPapers(res.papers_referenced);
    } catch (e: any) {
      setMemoryError(e.message || "Memory query failed");
    } finally {
      setMemoryAsking(false);
    }
  };

  return (
    <main className="min-h-screen bg-ink grain-surface">
      <div className="max-w-7xl mx-auto p-6 grid grid-cols-[300px_1fr] gap-6">
        {/* Library column */}
        <section className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h1 className="font-serif text-2xl font-semibold text-paper">
              <span className="highlight-mark">Research Copilot</span>
            </h1>
          </div>

          <button
            onClick={runFullReport}
            className="w-full bg-gradient-to-r from-gold to-gold-bright text-ink font-semibold px-4 py-3 rounded-lg text-sm hover:opacity-90 transition-opacity shadow-lg shadow-gold/10"
          >
            ✦ Generate Full Analysis Report
          </button>
          <p className="text-[11px] text-paper-faint -mt-2">
            Runs a complete analysis across your whole library — overview, synthesis, and gaps — as one PDF.
          </p>

          <nav className="flex flex-wrap gap-1.5">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                className={`text-xs px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                  view === item.key ? item.activeClass : "bg-ink-card text-paper-muted hover:bg-ink-hover"
                }`}
                onClick={() => {
                  setView(item.key);
                  setCompareMode(false);
                }}
              >
                {item.label}
              </button>
            ))}
            <button
              className={`text-xs px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                compareMode ? "bg-rose/20 text-rose" : "bg-ink-card text-paper-muted hover:bg-ink-hover"
              }`}
              onClick={() => {
                setCompareMode(!compareMode);
                setSelectedForCompare([]);
              }}
            >
              Compare
            </button>
          </nav>

          <div
            className="border border-dashed border-hairline rounded-lg p-4 text-sm text-paper-faint cursor-pointer hover:border-gold-dim hover:text-paper-muted transition-colors"
            onClick={() => fileInput.current?.click()}
          >
            {uploading ? "Uploading & summarizing..." : "＋ Upload a PDF"}
            <input
              ref={fileInput}
              type="file"
              accept="application/pdf"
              hidden
              onChange={(e) => e.target.files && handleUpload(e.target.files[0])}
            />
          </div>

          {compareMode && (
            <button
              disabled={selectedForCompare.length < 2}
              onClick={runComparison}
              className="w-full bg-rose/90 hover:bg-rose disabled:bg-ink-card disabled:text-paper-faint text-ink px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Compare {selectedForCompare.length > 0 ? `(${selectedForCompare.length} selected)` : "(pick 2+)"}
            </button>
          )}

          <div className="space-y-1.5">
            {!compareMode && (
              <button
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  !activePaperId && view === "chat" ? "bg-gold/15 text-gold-bright" : "bg-ink-card text-paper-muted hover:bg-ink-hover"
                }`}
                onClick={() => {
                  setActivePaperId(undefined);
                  setView("chat");
                }}
              >
                Chat across whole library
              </button>
            )}
            {papers.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                {compareMode && (
                  <input
                    type="checkbox"
                    checked={selectedForCompare.includes(p.id)}
                    onChange={() => toggleCompareSelection(p.id)}
                    className="shrink-0 accent-rose"
                  />
                )}
                <button
                  className={`flex-1 text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    activePaperId === p.id && !compareMode
                      ? "bg-gold/15 text-gold-bright"
                      : "bg-ink-card text-paper-muted hover:bg-ink-hover"
                  }`}
                  onClick={() => {
                    if (compareMode) {
                      toggleCompareSelection(p.id);
                    } else {
                      setActivePaperId(p.id);
                      setView("chat");
                    }
                  }}
                  title={p.title}
                >
                  <span className="font-serif">{p.title.slice(0, 46)}</span>
                  {p.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {p.tags.slice(0, 3).map((t) => (
                        <span key={t} className="font-mono text-[10px] text-teal bg-teal/10 px-1.5 py-0.5 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              </div>
            ))}
            {papers.length === 0 && (
              <p className="text-xs text-paper-faint px-1">No papers yet — upload one to get started.</p>
            )}
          </div>
        </section>

        {/* Right column: chat, details, compare, memory, graph, review */}
        <section className="flex flex-col h-[88vh] bg-ink-raised rounded-xl border border-hairline overflow-hidden">
          {activePaper && !compareMode && (view === "chat" || view === "details") && (
            <div className="flex border-b border-hairline shrink-0">
              <button
                className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                  view === "chat" ? "text-gold-bright border-b-2 border-gold" : "text-paper-faint hover:text-paper-muted"
                }`}
                onClick={() => setView("chat")}
              >
                Chat
              </button>
              <button
                className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                  view === "details" ? "text-gold-bright border-b-2 border-gold" : "text-paper-faint hover:text-paper-muted"
                }`}
                onClick={() => setView("details")}
              >
                Details, tags & highlights
              </button>
            </div>
          )}

          {view === "fullreport" ? (
          <div className="flex-1 overflow-y-auto p-6">
            {reportLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-paper-muted text-sm">Analyzing your entire library — summaries, cross-paper synthesis, and gaps...</p>
                <p className="text-paper-faint text-xs mt-1">This can take 20-40 seconds for larger libraries.</p>
              </div>
            )}
            {reportError && <p className="text-rose text-sm">{reportError}</p>}
            {fullReport && (
              <>
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <h2 className="font-serif text-2xl font-semibold text-paper">
                      <span className="highlight-mark">{fullReport.title}</span>
                    </h2>
                    <p className="text-paper-faint text-sm mt-1">{fullReport.subtitle}</p>
                  </div>
                  <button
                    onClick={() => downloadFullReport(fullReport.title, fullReport.subtitle, fullReport.sections)}
                    className="shrink-0 bg-gold hover:bg-gold-bright text-ink px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    ↓ Download PDF
                  </button>
                </div>
                <div className="mt-6 space-y-6">
                  {fullReport.sections.map((s, i) => (
                    <div key={i} className="bg-ink-card rounded-lg p-5">
                      {s.heading && (
                        <h3 className="font-serif text-lg font-semibold text-gold-bright mb-3 pb-2 border-b border-hairline">
                          {s.heading}
                        </h3>
                      )}
                      <Markdown>{s.body}</Markdown>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : view === "review" ? (
            <div className="flex-1 overflow-hidden">
              <LitReviewBuilder papers={papers} />
            </div>
          ) : view === "graph" ? (
            <div className="flex-1 overflow-y-auto">
              <ResearchGraph
                onSelectPaper={(id) => {
                  setActivePaperId(id);
                  setView("details");
                  setCompareMode(false);
                }}
              />
            </div>
          ) : view === "memory" ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-hairline">
                <p className="text-xs text-paper-faint mb-2">
                  Ask across everything you've ever uploaded — e.g. "What have I read about diffusion models?" or
                  "Have I read anything that challenges this paper's conclusions?"
                </p>
                <div className="flex gap-2">
                  <input
                    className="flex-1 bg-ink-card border border-hairline rounded-md px-3 py-2 text-sm outline-none focus:border-teal/50 transition-colors"
                    placeholder="Ask your research memory..."
                    value={memoryQuestion}
                    onChange={(e) => setMemoryQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && runMemoryQuery()}
                  />
                  <button
                    className="bg-teal hover:bg-teal/90 text-ink px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    onClick={runMemoryQuery}
                    disabled={memoryAsking}
                  >
                    Ask
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {memoryAsking && <p className="text-paper-faint text-sm">Searching your library...</p>}
                {memoryError && <p className="text-rose text-sm">{memoryError}</p>}
                {memoryAnswer && (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-paper-faint">Answer</p>
                      <button
                        onClick={() => downloadMemoryReport(memoryQuestion, memoryAnswer, memoryPapers)}
                        className="text-xs px-2.5 py-1 rounded bg-teal/15 text-teal hover:bg-teal/25 transition-colors flex items-center gap-1"
                      >
                        ↓ Download PDF
                      </button>
                    </div>
                    <div className="bg-ink-card rounded-lg p-4 mb-3">
                      <Markdown>{memoryAnswer}</Markdown>
                    </div>
                    {memoryPapers.length > 0 && (
                      <div>
                        <p className="text-xs text-paper-faint mb-1.5">Drawn from:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {memoryPapers.map((t) => (
                            <span key={t} className="font-mono text-[10px] text-teal bg-teal/10 px-2 py-1 rounded">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
                {!memoryAsking && !memoryAnswer && !memoryError && (
                  <p className="text-paper-faint text-sm">Your answer will appear here.</p>
                )}
              </div>
            </div>
          ) : view === "compare" ? (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-serif text-lg font-semibold text-paper">
                  <span className="highlight-mark">Comparison</span>
                </h2>
                {comparisonResult && (
                  <button
                    onClick={() =>
                      downloadComparisonReport(
                        papers.filter((p) => selectedForCompare.includes(p.id)).map((p) => p.title),
                        comparisonResult
                      )
                    }
                    className="text-xs px-2.5 py-1 rounded bg-rose/15 text-rose hover:bg-rose/25 transition-colors"
                  >
                    ↓ Download PDF
                  </button>
                )}
              </div>
              {comparing && <p className="text-paper-faint text-sm">Comparing papers...</p>}
              {compareError && <p className="text-rose text-sm">{compareError}</p>}
              {comparisonResult && (
                <div className="bg-ink-card rounded-lg p-4">
                  <Markdown>{comparisonResult}</Markdown>
                </div>
              )}
            </div>
          ) : view === "details" && activePaper ? (
            <div className="flex-1 overflow-y-auto p-4">
              <PaperDetailsPanel paper={activePaper} onUpdated={updatePaperInList} />
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatLog.length === 0 && (
                  <p className="text-paper-faint text-sm">
                    Ask a question about your papers, or use the tabs above to compare, remember, or map your
                    library.
                  </p>
                )}
                {chatLog.map((m, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg max-w-[85%] text-sm leading-relaxed ${
                      m.role === "user" ? "bg-gold/20 text-paper ml-auto whitespace-pre-wrap" : "bg-ink-card text-paper"
                    }`}
                  >
                    {m.role === "assistant" ? <Markdown>{m.content}</Markdown> : m.content}
                  </div>
                ))}
                {asking && <div className="text-paper-faint text-sm">Thinking...</div>}
              </div>
              <div className="p-3 border-t border-hairline flex gap-2">
                <input
                  className="flex-1 bg-ink-card border border-hairline rounded-md px-3 py-2 text-sm outline-none focus:border-gold-dim transition-colors"
                  placeholder="Ask something about your research..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                />
                <button
                  className="bg-gold hover:bg-gold-bright text-ink px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  onClick={handleAsk}
                  disabled={asking}
                >
                  Send
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
