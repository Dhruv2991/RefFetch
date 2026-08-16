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
          raised: "#14121F",
          card: "#1A1730",
          hover: "#211C3D",
        },
        hairline: "#2A2547",
        paper: {
          DEFAULT: "#EDEBF5",
          muted: "#A9A4C4",
          faint: "#6E6890",
        },
        gold: {
          DEFAULT: "#7C5CFC",
          dim: "#4A3B8A",
          bright: "#9B7FFF",
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
    },
  },
  plugins: [],
};

export default config;