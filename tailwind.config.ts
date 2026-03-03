import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        sw: {
          bg: "#0a0014",
          card: "#120024",
          "card-alt": "#1a0033",
          border: "#2d1054",
          "border-glow": "#ff2d95",
          neon: "#ff2d95",
          cyan: "#00f0ff",
          purple: "#b44dff",
          yellow: "#ffe44d",
          red: "#ff3355",
          green: "#00ff88",
          muted: "#7a5c99",
          text: "#e8d5ff",
          "text-bright": "#ffffff",
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', "Consolas", "monospace"],
      },
      boxShadow: {
        neon: "0 0 10px #ff2d9566, 0 0 40px #ff2d9522",
        "neon-cyan": "0 0 10px #00f0ff66, 0 0 40px #00f0ff22",
        "neon-purple": "0 0 10px #b44dff66, 0 0 40px #b44dff22",
        glow: "0 0 20px #ff2d9544, 0 0 60px #ff2d9511, inset 0 0 20px #ff2d9508",
      },
    },
  },
  plugins: [],
};
export default config;
