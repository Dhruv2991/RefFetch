import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Dark violet "professional SaaS" theme — used both in-app and
        // on the landing page, via the same semantic token names.
        ink: {
          DEFAULT: "#0B0A14",
          deep: "#050409",
          raised: "#14121F",
          card: "#1A1730",
          hover: "#211C3D",
        },
        hairline: {
          DEFAULT: "#2A2547",
          soft: "#1D1935",
        },
        paper: {
          DEFAULT: "#EDEBF5",
          muted: "#A9A4C4",
          faint: "#6E6890",
        },
        gold: {
          DEFAULT: "#7C5CFC",
          dim: "#4A3B8A",
          bright: "#9B7FFF",
          wash: "#1C1735",
        },
        teal: {
          DEFAULT: "#4FD1C5",
          dim: "#2E8A80",
        },
        rose: {
          DEFAULT: "#F0648C",
        },
        // Landing page — reuses the same dark violet system.
        cream: "#0B0A14",
        "cream-raised": "#14121F",
        "text-900": "#F2F0FA",
        "text-600": "#A9A4C4",
        "text-400": "#6E6890",
        accent: {
          DEFAULT: "#7C5CFC",
          dark: "#9B7FFF",
        },
        "navy-deep": "#050409",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        pop: "0 8px 24px -6px rgba(124, 92, 252, 0.45)",
        panel: "0 20px 60px -20px rgba(0, 0, 0, 0.6)",
        card: "0 4px 16px -4px rgba(0, 0, 0, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;