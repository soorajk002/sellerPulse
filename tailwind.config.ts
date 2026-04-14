import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          DEFAULT: "#f26522",
          hover: "#d4581a",
          light: "#fff4ee",
          border: "#fcd0b5",
        },
        green: {
          DEFAULT: "#1e7e34",
          light: "#e8f5e9",
          border: "#a5d6a7",
        },
        red: {
          DEFAULT: "#c0392b",
          light: "#fdecea",
          border: "#f5c6c2",
        },
        amber: {
          DEFAULT: "#b45309",
          light: "#fffbeb",
          border: "#fde68a",
        },
        txt: {
          DEFAULT: "#1a1f2e",
          2: "#4a5568",
          3: "#8a96a8",
        },
        bd: "#e0e3e8",
        bg: {
          DEFAULT: "#f7f8fa",
          2: "#f0f2f5",
        },
      },
      fontFamily: {
        sans: ["Source Sans 3", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
