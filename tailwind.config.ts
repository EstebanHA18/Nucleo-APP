import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        apple: {
          blue: "#0071e3",
          "blue-hover": "#0077ed",
          indigo: "#5e5ce6",
          purple: "#af52de",
          pink: "#ff2d55",
          red: "#ff3b30",
          orange: "#ff9500",
          yellow: "#ffcc00",
          green: "#34c759",
          teal: "#5ac8fa",
          gray: {
            50: "#fbfbfd",
            100: "#f5f5f7",
            200: "#e8e8ed",
            300: "#d2d2d7",
            400: "#86868b",
            500: "#6e6e73",
            600: "#424245",
            700: "#333336",
            800: "#1d1d1f",
            900: "#161617",
            950: "#000000",
          },
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "SF Pro Display",
          "Geist",
          "Inter",
          "sans-serif",
        ],
        mono: ["SF Mono", "JetBrains Mono", "monospace"],
      },
      boxShadow: {
        apple: "0 4px 24px -1px rgba(0, 0, 0, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.04)",
        "apple-hover": "0 12px 32px -4px rgba(0, 0, 0, 0.1), 0 4px 12px -2px rgba(0, 0, 0, 0.05)",
        "apple-modal": "0 24px 60px -12px rgba(0, 0, 0, 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
