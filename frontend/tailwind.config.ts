import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // In-app theme — now light/editorial to match the landing page.
        // Same semantic names as before (ink=background, paper=text,
        // gold=primary accent, teal=secondary, rose=compare-mode accent)
        // so every component that already uses these classes just works.
        ink: {
          DEFAULT: "#F7F5F1",
          raised: "#FFFFFF",
          card: "#F3F1EA",
          hover: "#EAE7DD",
        },
        hairline: "#E3E0D6",
        paper: {
          DEFAULT: "#14161C",
          muted: "#5B5F6B",
          faint: "#9A9DA6",
        },
        gold: {
          DEFAULT: "#2F5FE0",
          dim: "#8FA5EE",
          bright: "#1E3FA8",
        },
        teal: {
          DEFAULT: "#0D9488",
          dim: "#5FC4B8",
        },
        rose: {
          DEFAULT: "#D14848",
        },
        // Landing page palette (kept for the pre-sign-in marketing page)
        cream: "#F7F5F1",
        "cream-raised": "#FFFFFF",
        "text-900": "#14161C",
        "text-600": "#5B5F6B",
        "text-400": "#9A9DA6",
        accent: {
          DEFAULT: "#2F5FE0",
          dark: "#1E3FA8",
        },
        "navy-deep": "#10131C",
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
