export const metadata = {
  title: "Privacy Policy — RefFetch",
};

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-ink grain-surface">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="font-serif text-3xl font-semibold text-paper mb-2">
          <span className="highlight-mark">Privacy Policy</span>
        </h1>
        <p className="text-paper-faint text-sm mb-10">Last updated: August 2026</p>

        <div className="space-y-8 text-paper text-sm leading-relaxed">
          <section>
            <h2 className="font-serif text-lg font-semibold text-gold-bright mb-2">What RefFetch is</h2>
            <p>
              RefFetch is a research tool — a website and a browser extension — that lets you upload academic
              papers (PDFs), get AI-generated summaries, chat with your library, compare papers, and build
              literature reviews. This policy covers both the website (reffetch.vercel.app) and the browser
              extension.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-gold-bright mb-2">What data we collect</h2>
            <p className="mb-2">When you use RefFetch, we process:</p>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>PDF files you upload, and the text extracted from them</li>
              <li>Tags, notes, and highlights you add to papers</li>
              <li>Questions you ask in chat, comparison, and research-memory features</li>
              <li>Literature review drafts you create and edit</li>
            </ul>
            <p className="mt-2">
              The extension additionally reads the URL of the active browser tab only when you click the
              extension icon, solely to detect whether you're on an arXiv paper page or a direct PDF link. It
              does not run in the background, does not track your browsing, and does not read page content
              beyond the URL.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-gold-bright mb-2">How your data is used</h2>
            <p>
              Uploaded papers and their extracted text are sent to third-party AI providers to generate
              summaries, answer questions, and produce comparisons:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-1 mt-2">
              <li>
                <strong className="text-paper">Groq</strong> — processes text to generate summaries, chat
                answers, comparisons, and literature review drafts
              </li>
              <li>
                <strong className="text-paper">Cohere</strong> — generates embeddings (numerical
                representations of text) used to power search and retrieval across your library
              </li>
            </ul>
            <p className="mt-2">
              These providers process the content of what you submit but are not used to build a profile of
              you personally. We don't sell your data, and we don't use it for advertising — RefFetch has no
              ads.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-gold-bright mb-2">Where your data is stored</h2>
            <p>
              Papers, summaries, tags, notes, highlights, and review drafts are stored in a PostgreSQL database
              hosted on Render. Data persists until you delete it or request deletion.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-gold-bright mb-2">What we don't do</h2>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>We don't track you across other websites</li>
              <li>We don't sell or share your data with advertisers</li>
              <li>The extension doesn't run in the background or monitor your browsing activity</li>
              <li>We don't use your data to train AI models</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-gold-bright mb-2">Your choices</h2>
            <p>
              You can delete individual papers, notes, and highlights directly in the app at any time. If you'd
              like your account data fully removed, contact us using the details below.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-gold-bright mb-2">Changes to this policy</h2>
            <p>
              If this policy changes, the "Last updated" date at the top of this page will change accordingly.
              Continued use of RefFetch after an update means you accept the revised policy.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold text-gold-bright mb-2">Contact</h2>
            <p>
              Questions about this policy or your data can be sent to{" "}
              <span className="text-teal font-mono">ddhruvgnayak@gmail.com</span>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
