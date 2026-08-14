"use client";

export default function Landing({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="bg-cream text-text-900 min-h-screen">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <span className="font-serif text-lg font-semibold">RefFetch</span>
          <span className="text-[10px] font-mono text-text-400 border border-text-400/30 rounded-full px-2 py-0.5">
            AI research desk
          </span>
        </div>
        <button
          onClick={onGetStarted}
          className="bg-accent hover:bg-accent-dark text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
        >
          Get started
        </button>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto text-center px-6 pt-16 pb-20">
        <p className="text-xs font-mono text-accent uppercase tracking-wide mb-4">Research, without the re-reading</p>
        <h1 className="font-serif text-5xl md:text-6xl font-semibold leading-[1.05] mb-6">
          Every paper you read,
          <br />
          remembered and connected.
        </h1>
        <p className="text-text-600 text-lg max-w-xl mx-auto mb-8">
          Upload papers, and RefFetch summarizes, compares, and answers questions —
          always grounded in what you've actually read, never a guess.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onGetStarted}
            className="bg-accent hover:bg-accent-dark text-white text-sm font-medium px-6 py-3 rounded-full transition-colors"
          >
            Start for free
          </button>
          <a href="#how-it-works" className="text-text-600 hover:text-text-900 text-sm font-medium px-4 py-3">
            See how it works ↓
          </a>
        </div>
      </section>

      {/* Hero visual: two mock cards */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-cream-raised rounded-2xl border border-text-900/5 shadow-sm p-6">
            <p className="text-[10px] font-mono text-text-400 uppercase mb-3">Auto summary</p>
            <h3 className="font-serif text-lg font-semibold mb-2">Attention Is All You Need</h3>
            <p className="text-sm text-text-600 leading-relaxed">
              Introduces the Transformer, a sequence model built entirely on attention mechanisms — no
              recurrence, no convolution.
            </p>
          </div>
          <div className="bg-navy-deep rounded-2xl p-6 text-white flex flex-col justify-between">
            <p className="text-[10px] font-mono text-white/50 uppercase mb-3">Ask your papers</p>
            <p className="font-serif text-lg leading-snug">
              "What's the strongest limitation across everything I've read on RAG pipelines?"
            </p>
            <p className="text-xs text-white/50 mt-4 font-mono">→ grounded across 12 papers</p>
          </div>
        </div>
      </section>

      {/* Feature: every paper stays in the conversation */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p className="text-xs font-mono text-accent uppercase tracking-wide mb-3">Persistent memory</p>
          <h2 className="font-serif text-3xl font-semibold mb-4 leading-tight">
            Every paper stays in the conversation.
          </h2>
          <p className="text-text-600 leading-relaxed">
            Most tools treat each paper as an island. RefFetch remembers everything you've uploaded — ask
            about one paper, or synthesize across your entire library, and it's all grounded in your actual
            reading, not general knowledge.
          </p>
        </div>
        <div className="bg-cream-raised rounded-2xl border border-text-900/5 shadow-sm p-6">
          <p className="text-xs font-mono text-text-400 mb-3">research memory</p>
          <div className="space-y-2">
            <p className="text-sm bg-cream rounded-lg px-3 py-2">What have I read about diffusion models?</p>
            <p className="text-sm bg-accent/5 border border-accent/10 rounded-lg px-3 py-2 text-text-600">
              Three papers touch on this — Ho et al. establishes the core denoising framework, while
              Song & Ermon reframe it via score matching...
            </p>
          </div>
        </div>
      </section>

      {/* 3-column feature grid */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <p className="text-xs font-mono text-accent uppercase tracking-wide mb-3 text-center">Built for real research</p>
        <h2 className="font-serif text-3xl font-semibold mb-12 text-center leading-tight">
          Your papers, organized around the questions you're asking.
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: "Associative paper context",
              body: "A visual graph connects papers by topic similarity — see clusters and relationships at a glance.",
            },
            {
              title: "Tags that actually help",
              body: "Organize your library your way, with notes and highlights saved right alongside each paper.",
            },
            {
              title: "Matters that connect",
              body: "Compare methods and findings across papers, with contradictions and gaps surfaced explicitly.",
            },
          ].map((f) => (
            <div key={f.title} className="border-t border-text-900/10 pt-4">
              <h3 className="font-serif text-base font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-text-600 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dark section: compare */}
      <section className="bg-navy-deep text-white py-24">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs font-mono text-accent uppercase tracking-wide mb-3">Cross-paper synthesis</p>
            <h2 className="font-serif text-3xl font-semibold mb-4 leading-tight">
              Compare the argument, not just the abstracts.
            </h2>
            <p className="text-white/60 leading-relaxed">
              Select any papers and RefFetch breaks down methods, findings, agreements, and — critically —
              where they actually contradict each other. No more skimming five PDFs side by side.
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-white/40 font-mono text-[10px] uppercase mb-1">Agreements</p>
                <p className="text-white/80">Both papers converge on retrieval quality mattering more than model size.</p>
              </div>
              <div>
                <p className="text-white/40 font-mono text-[10px] uppercase mb-1">Contradictions</p>
                <p className="text-white/80">Paper 2 disputes Paper 1's chunking strategy as insufficient for tables.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capture context */}
      <section className="max-w-5xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-10 items-center">
        <div className="bg-cream-raised rounded-2xl border border-text-900/5 shadow-sm p-6">
          <p className="text-xs font-mono text-text-400 mb-3">browser extension</p>
          <p className="text-sm text-text-600">
            One click on arXiv saves the paper straight to your library — summarized before you've even
            finished reading the abstract.
          </p>
        </div>
        <div>
          <p className="text-xs font-mono text-accent uppercase tracking-wide mb-3">Capture as you browse</p>
          <h2 className="font-serif text-3xl font-semibold mb-4 leading-tight">
            Capture the context before it gets away.
          </h2>
          <p className="text-text-600 leading-relaxed">
            Save papers directly from arXiv with the RefFetch extension — no more open tabs you'll never
            get back to, no more "I'll read this later."
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-accent text-white py-20 text-center px-6">
        <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-6 max-w-lg mx-auto leading-tight">
          Give your research a longer memory.
        </h2>
        <button
          onClick={onGetStarted}
          className="bg-white text-accent hover:bg-white/90 text-sm font-semibold px-6 py-3 rounded-full transition-colors"
        >
          Start connecting your research
        </button>
      </section>

      <footer className="max-w-5xl mx-auto px-6 py-8 text-center text-xs text-text-400">
        RefFetch · <a href="/privacy" className="hover:text-text-600 underline">Privacy Policy</a>
      </footer>
    </div>
  );
}
