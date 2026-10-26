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
        forest: {
          50: "#f2f8f4",
          100: "#e1efe4",
          200: "#c4decb",
          300: "#99c4a5",
          400: "#6aa57a",
          500: "#468757",
          600: "#346d43",
          700: "#2a5637",
          800: "#24452e",
          900: "#1c3b24", // Deep Amazonian Forest Green
          950: "#0d1f13",
        },
        vanilla: {
          50: "#fdfbf7",
          100: "#faf6ee", // Cream background
          200: "#f2e9d7",
          300: "#e6d5b4",
          400: "#d9bc8c",
          500: "#c8944e", // Brand Gold / Ochre
          600: "#b57d3d",
          700: "#966232",
          800: "#7a4e2c",
          900: "#654127",
        },
        itec: {
          green: "#1C6B37",
          light: "#34A853",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
