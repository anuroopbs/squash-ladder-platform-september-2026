import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        court: {
          50: "#f2fbf6",
          100: "#e2f6ea",
          200: "#c6ecd6",
          300: "#96dab7",
          400: "#5fbf90",
          500: "#38a473",
          600: "#27845c",
          700: "#20694b",
          800: "#1c543e",
          900: "#194635",
          950: "#0b271d",
        },
        ember: {
          50: "#fff6ed",
          100: "#ffead4",
          200: "#ffd1a8",
          300: "#ffb070",
          400: "#ff8637",
          500: "#fd6412",
          600: "#ee4908",
          700: "#c53509",
          800: "#9c2c10",
          900: "#7e2710",
          950: "#441107",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};

export default config;
