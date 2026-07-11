import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#080D18",
          900: "#0E1526",
          850: "#121A30",
          800: "#17203B",
          700: "#212C4B",
          600: "#324066",
        },
        brand: {
          green: "#17B26A",
          greenDark: "#0E9257",
          amber: "#F59E0B",
          red: "#EF4A5E",
          blue: "#4C7CFF",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
};
export default config;
