"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-copilot">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="font-serif text-xl font-semibold text-paper mt-4 mb-2 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-serif text-base font-semibold text-gold-bright mt-4 mb-2 first:mt-0 pb-1 border-b border-hairline">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-serif text-sm font-semibold text-paper mt-3 mb-1">{children}</h3>
          ),
          p: ({ children }) => <p className="text-sm text-paper leading-relaxed mb-3">{children}</p>,
          strong: ({ children }) => <strong className="text-gold-bright font-semibold">{children}</strong>,
          em: ({ children }) => <em className="text-teal not-italic">{children}</em>,
          ul: ({ children }) => <ul className="list-none space-y-1.5 mb-3">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1.5 mb-3 text-sm">{children}</ol>,
          li: ({ children }) => (
            <li className="text-sm text-paper leading-relaxed pl-4 relative before:content-['—'] before:absolute before:left-0 before:text-gold-dim">
              {children}
            </li>
          ),
          code: ({ children }) => (
            <code className="font-mono text-xs bg-ink px-1.5 py-0.5 rounded text-teal">{children}</code>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-gold-dim pl-3 italic text-paper-muted my-3">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-3">
              <table className="text-xs w-full border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="text-left font-mono text-paper-muted border-b border-hairline py-1.5 pr-4">{children}</th>
          ),
          td: ({ children }) => <td className="py-1.5 pr-4 border-b border-hairline/50 text-paper">{children}</td>,
          hr: () => <hr className="border-hairline my-4" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
