import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        poly: {
          bg: "#0d0d0d",
          card: "#161616",
          border: "#2a2a2a",
          accent: "#00d4aa",
          red: "#ff4757",
          green: "#00d4aa",
          yellow: "#ffa502",
          muted: "#888888",
          text: "#e0e0e0",
        },
      },
    },
  },
  plugins: [],
};
export default config;
