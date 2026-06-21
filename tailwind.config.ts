import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fbf4ec",
          100: "#f1dfc8",
          500: "#a8662f",
          600: "#8a5226",
          700: "#6b3f1e",
        },
      },
    },
  },
  plugins: [],
};

export default config;
