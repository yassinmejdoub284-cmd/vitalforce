import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: "#f5f5f5",
          100: "#e5e5e5",
          500: "#737373",
          700: "#404040",
          900: "#252525",
          950: "#111111"
        },
        gold: {
          100: "#fbf3d8",
          300: "#e3c56c",
          500: "#d4af37",
          700: "#876719"
        },
        cream: "#fafafa"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"]
      },
      boxShadow: {
        glow: "0 24px 80px rgba(212, 175, 55, 0.18)",
        green: "0 24px 80px rgba(0, 0, 0, 0.08)"
      },
      backgroundImage: {
        radialGold: "radial-gradient(circle at 20% 15%, rgba(245,207,100,.32), transparent 32%)",
        leafMist: "linear-gradient(135deg, rgba(255,255,255,.96), rgba(245,245,245,.72))"
      }
    }
  },
  plugins: []
};

export default config;
