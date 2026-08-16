"use client";

import { useEffect, useRef, useState } from "react";
import { Paper, fetchPapers, uploadPaper, askQuestion, comparePapers, queryMemory, fetchGraph } from "@/lib/api";
import Dashboard from "./Dashboard";
import PaperDetailsPanel from "./PaperDetailsPanel";
import ResearchGraph from "./ResearchGraph";
import LitReviewBuilder from "./LitReviewBuilder";
import Markdown from "./Markdown";
import { downloadComparisonReport, downloadMemoryReport, downloadFullReport, PdfSection } from "@/lib/download";
import { fetchFullReport } from "@/lib/api";
import AuthGate from "./AuthGate";
import { supabase } from "@/lib/supabaseClient";

const NAV_ITEMS: { key: "dashboard" | "review" | "graph" | "memory"; label: string; activeClass: string }[] = [
  { key: "dashboard", label: "Dashboard", activeClass: "bg-gold/20 text-gold-bright" },
  { key: "review", label: "Lit Review", activeClass: "bg-gold/20 text-gold-bright" },
  { key: "graph", label: "Graph", activeClass: "bg-teal/20 text-teal" },
  { key: "memory", label: "Memory", activeClass: "bg-teal/20 text-teal" },
];

function AppShell({ session }: { session: any }) {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [uploading, setUploading] = useState(false);
  const [activePaperId, setActivePaperId] = useState<string | undefined>();
  const [view, setView] = useState<"dashboard" | "chat" | "details" | "compare" | "memory" | "graph" | "review" | "fullreport">("dashboard");
  const [graphEdgeCount, setGraphEdgeCount] = useState(0);
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
    fetchGraph()
      .then((g) => setGraphEdgeCount(g.edges.length))
      .catch(() => setGraphEdgeCount(0));
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
    <main className="min-h-screen bg-ink-deep grain-surface desk-glow">
      {/* Top header bar */}
      <header className="border-b border-hairline-soft bg-ink/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <h1 className="font-serif text-xl font-semibold text-paper leading-none">
              <span className="highlight-mark">RefFetch</span>
            </h1>
            <p className="hidden sm:block text-[11px] text-paper-faint font-mono">your research, remembered</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:block text-xs text-paper-faint truncate max-w-[220px]">
              {session?.user?.email}
            </span>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-xs text-paper-faint hover:text-rose transition-colors border border-hairline hover:border-rose/40 rounded-md px-2.5 py-1.5"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* Library column */}
        <section className="space-y-5">
          <button
            onClick={runFullReport}
            className="group w-full bg-gradient-to-r from-gold to-gold-bright text-ink font-semibold px-4 py-3 rounded-xl text-sm hover:brightness-105 active:brightness-95 transition shadow-pop"
          >
            <span className="inline-flex items-center gap-1.5">
              <span className="text-[15px] leading-none group-hover:rotate-12 transition-transform">✦</span>
              Generate Full Analysis Report
            </span>
          </button>
          <p className="text-[11px] text-paper-faint -mt-3.5 px-0.5 leading-relaxed">
            Runs a complete analysis across your whole library — overview, synthesis, and gaps — as one PDF.
          </p>

          <div>
            <p className="tab-label mb-2 px-0.5">Views</p>
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
          </div>

          <div
            className="border border-dashed border-hairline rounded-xl p-4 text-sm text-paper-faint cursor-pointer hover:border-gold-dim hover:text-paper-muted hover:bg-gold-wash transition-colors"
            onClick={() => fileInput.current?.click()}
          >
            <span className="inline-flex items-center gap-2">
              <span className="text-base leading-none">{uploading ? "" : "＋"}</span>
              {uploading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                  Uploading &amp; summarizing...
                </span>
              ) : (
                "Upload a PDF"
              )}
            </span>
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

          <div>
            <p className="tab-label mb-2 px-0.5">Library · {papers.length}</p>
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
                <div className="text-xs text-paper-faint px-3 py-4 rounded-lg border border-hairline-soft bg-ink-card/40 text-center leading-relaxed">
                  Nothing here yet.
                  <br />
                  Upload a PDF above to start your library.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right column: chat, details, compare, memory, graph, review */}
        <section className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-7rem)] bg-ink-raised rounded-2xl border border-hairline shadow-panel overflow-hidden">
          {activePaper && !compareMode && (view === "chat" || view === "details") && (
            <div className="flex items-center gap-1 border-b border-hairline shrink-0 px-2 bg-ink-raised/60">
              <button
                className={`px-3.5 py-3 text-sm font-medium transition-colors relative ${
                  view === "chat" ? "text-gold-bright" : "text-paper-faint hover:text-paper-muted"
                }`}
                onClick={() => setView("chat")}
              >
                Chat
                {view === "chat" && <span className="absolute left-3.5 right-3.5 -bottom-px h-0.5 bg-gold rounded-full" />}
              </button>
              <button
                className={`px-3.5 py-3 text-sm font-medium transition-colors relative ${
                  view === "details" ? "text-gold-bright" : "text-paper-faint hover:text-paper-muted"
                }`}
                onClick={() => setView("details")}
              >
                Details, tags &amp; highlights
                {view === "details" && <span className="absolute left-3.5 right-3.5 -bottom-px h-0.5 bg-gold rounded-full" />}
              </button>
            </div>
          )}

          {view === "dashboard" ? (
            <Dashboard
              papers={papers}
              graphEdgeCount={graphEdgeCount}
              onSelectPaper={(id) => {
                setActivePaperId(id);
                setView("details");
                setCompareMode(false);
              }}
              userName={session?.user?.user_metadata?.full_name || session?.user?.email?.split("@")[0]}
            />
          ) : view === "fullreport" ? (
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
                    <div key={i} className="bg-ink-card rounded-xl p-5 border border-hairline-soft shadow-card">
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
                    <div className="bg-ink-card rounded-xl p-4 mb-3 border border-hairline-soft shadow-card">
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
                <div className="bg-ink-card rounded-xl p-4 border border-hairline-soft shadow-card">
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
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {chatLog.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center px-6">
                    <p className="font-serif text-paper-muted text-base mb-1.5">Ask your library anything</p>
                    <p className="text-paper-faint text-sm max-w-xs leading-relaxed">
                      Ask a question about your papers, or use the tabs above to compare, remember, or map your
                      library.
                    </p>
                  </div>
                )}
                {chatLog.map((m, i) => (
                  <div
                    key={i}
                    className={`p-3.5 rounded-xl max-w-[85%] text-sm leading-relaxed shadow-card ${
                      m.role === "user"
                        ? "bg-gold/15 border border-gold/20 text-paper ml-auto whitespace-pre-wrap"
                        : "bg-ink-card border border-hairline-soft text-paper"
                    }`}
                  >
                    {m.role === "assistant" ? <Markdown>{m.content}</Markdown> : m.content}
                  </div>
                ))}
                {asking && (
                  <div className="flex items-center gap-2 text-paper-faint text-sm">
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-paper-faint animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-paper-faint animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-paper-faint animate-bounce" />
                    </span>
                    Thinking
                  </div>
                )}
              </div>
              <div className="p-3.5 border-t border-hairline flex gap-2 bg-ink-raised/60">
                <input
                  className="flex-1 bg-ink-card border border-hairline rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-gold-dim transition-colors placeholder:text-paper-faint"
                  placeholder="Ask something about your research..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                />
                <button
                  className="bg-gold hover:bg-gold-bright text-ink px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
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

export default function Home() {
  return <AuthGate>{(session) => <AppShell session={session} />}</AuthGate>;
}
