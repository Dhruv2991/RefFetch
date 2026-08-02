import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#11151C",
          raised: "#1A2029",
          card: "#1F2530",
          hover: "#252C38",
        },
        hairline: "#262D3A",
        paper: {
          DEFAULT: "#EDEAE1",
          muted: "#9298A3",
          faint: "#5C6270",
        },
        gold: {
          DEFAULT: "#D9A441",
          dim: "#8A6B2E",
          bright: "#F0C168",
        },
        teal: {
          DEFAULT: "#4FB6AE",
          dim: "#356F6A",
        },
        rose: {
          DEFAULT: "#D97878",
        },
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
