import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          deep: "#0B0E13",
          DEFAULT: "#11151C",
          raised: "#171C25",
          card: "#1D232E",
          hover: "#252C38",
        },
        hairline: {
          DEFAULT: "#262D3A",
          soft: "#1D2430",
        },
        paper: {
          DEFAULT: "#EDEAE1",
          muted: "#9298A3",
          faint: "#5C6270",
        },
        gold: {
          DEFAULT: "#D9A441",
          dim: "#8A6B2E",
          bright: "#F0C168",
          wash: "rgba(217,164,65,0.08)",
        },
        teal: {
          DEFAULT: "#4FB6AE",
          dim: "#356F6A",
          wash: "rgba(79,182,174,0.08)",
        },
        rose: {
          DEFAULT: "#D97878",
          wash: "rgba(217,120,120,0.08)",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      boxShadow: {
        panel: "0 1px 2px rgba(0,0,0,0.24), 0 12px 32px -12px rgba(0,0,0,0.45)",
        card: "0 1px 0 rgba(255,255,255,0.02) inset, 0 8px 20px -12px rgba(0,0,0,0.4)",
        pop: "0 8px 24px -8px rgba(217,164,65,0.25)",
      },
      letterSpacing: {
        wideish: "0.02em",
      },
    },
  },
  plugins: [],
};

export default config;
