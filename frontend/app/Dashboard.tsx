"use client";

import { useState } from "react";
import { FileText, Layers, Share2, Tag as TagIcon, Send } from "lucide-react";
import { Paper, askQuestion } from "@/lib/api";
import Markdown from "./Markdown";

type Props = {
  papers: Paper[];
  graphEdgeCount: number;
  onSelectPaper: (id: string) => void;
  userName?: string;
};

export default function Dashboard({ papers, graphEdgeCount, onSelectPaper, userName }: Props) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  const totalTags = new Set(papers.flatMap((p) => p.tags)).size;

  const handleAsk = async () => {
    if (!question.trim()) return;
    setAsking(true);
    setAnswer(null);
    try {
      const res = await askQuestion(question);
      setAnswer(res.answer);
    } catch {
      setAnswer("Something went wrong — try again.");
    } finally {
      setAsking(false);
    }
  };

  const stats = [
    { label: "Total Papers", value: papers.length, icon: FileText, color: "text-gold" },
    { label: "Summaries", value: papers.filter((p) => p.summary).length, icon: Layers, color: "text-teal" },
    { label: "Connections", value: graphEdgeCount, icon: Share2, color: "text-rose" },
    { label: "Tags", value: totalTags, icon: TagIcon, color: "text-gold-bright" },
  ];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-paper">Dashboard</h1>
        <p className="text-paper-faint text-sm mt-1">
          {userName ? `Welcome back, ${userName}!` : "Welcome back!"}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-ink-card border border-hairline rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <s.icon size={16} className={s.color} />
              <span className="text-xs text-paper-faint">{s.label}</span>
            </div>
            <p className="font-serif text-2xl font-semibold text-paper">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Recent papers */}
        <div className="bg-ink-card border border-hairline rounded-xl p-4">
          <h2 className="text-sm font-semibold text-paper mb-3">Recent Papers</h2>
          <div className="space-y-1">
            {papers.slice(0, 5).map((p) => (
              <button
                key={p.id}
                onClick={() => onSelectPaper(p.id)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-ink-hover transition-colors flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-sm text-paper truncate">{p.title}</p>
                  {p.authors && <p className="text-xs text-paper-faint truncate">{p.authors}</p>}
                </div>
                {p.tags[0] && (
                  <span className="shrink-0 text-[10px] font-mono text-teal bg-teal/10 px-2 py-0.5 rounded">
                    {p.tags[0]}
                  </span>
                )}
              </button>
            ))}
            {papers.length === 0 && <p className="text-xs text-paper-faint px-3">No papers yet.</p>}
          </div>
        </div>

        {/* Quick tags overview */}
        <div className="bg-ink-card border border-hairline rounded-xl p-4">
          <h2 className="text-sm font-semibold text-paper mb-3">Top Tags</h2>
          <div className="space-y-2">
            {Object.entries(
              papers.flatMap((p) => p.tags).reduce((acc: Record<string, number>, t) => {
                acc[t] = (acc[t] || 0) + 1;
                return acc;
              }, {})
            )
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([tag, count]) => (
                <div key={tag} className="flex items-center gap-3">
                  <span className="text-xs text-paper-muted w-20 truncate font-mono">{tag}</span>
                  <div className="flex-1 h-1.5 bg-ink-hover rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gold rounded-full"
                      style={{ width: `${Math.min(100, (count / papers.length) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-paper-faint w-4 text-right">{count}</span>
                </div>
              ))}
            {totalTags === 0 && <p className="text-xs text-paper-faint">No tags yet — add some in a paper's details.</p>}
          </div>
        </div>
      </div>

      {/* Quick AI research assistant */}
      <div className="bg-ink-card border border-hairline rounded-xl p-4">
        <h2 className="text-sm font-semibold text-paper mb-3">AI Research Assistant</h2>
        {answer && (
          <div className="bg-ink rounded-lg p-3 mb-3 text-sm">
            <Markdown>{answer}</Markdown>
          </div>
        )}
        {asking && <p className="text-xs text-paper-faint mb-3">Thinking...</p>}
        <div className="flex gap-2">
          <input
            className="flex-1 bg-ink border border-hairline rounded-md px-3 py-2 text-sm outline-none focus:border-gold-dim transition-colors"
            placeholder="Ask a research question..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          />
          <button
            onClick={handleAsk}
            disabled={asking}
            className="bg-gold hover:bg-gold-bright text-white px-3 py-2 rounded-md transition-colors flex items-center justify-center"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}