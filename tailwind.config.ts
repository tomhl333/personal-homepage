import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./data/**/*.{js,ts,jsx,tsx,mdx,json}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#F7F2E8",
        ink: "#243229",
        moss: "#315B46",
        sage: "#8EA28A",
        clay: "#C96E3B",
        fog: "#E7E3DA",
        lake: "#6D8FA3",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 20px 60px rgba(36, 50, 41, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
