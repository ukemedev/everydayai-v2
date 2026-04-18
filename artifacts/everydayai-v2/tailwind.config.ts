import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#ff5500",
          "orange-400": "#ff6a1a",
          "orange-300": "#ff8c4a",
        },
        surface: {
          0: "#080808",
          1: "#111111",
          2: "#1a1a1a",
          3: "#242424",
        },
        term: {
          green: "#00ff88",
          red: "#ff3333",
        }
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
        sans: ["Space Grotesk", "sans-serif"],
      },
      borderRadius: {
        brand: "4px",
        "brand-md": "8px",
      },
    },
  },
  plugins: [],
}

export default config
