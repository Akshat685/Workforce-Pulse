import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        canvas: "#05070A",
        surface: "#0D1117",
        "surface-elevated": "#111827",
        border: "#1F2937",
        foreground: "#F8FAFC",
        muted: "#94A3B8",
        accent: {
          cyan: "#22D3EE",
          emerald: "#10B981"
        },
        brand: {
          50: "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
          800: "#155e75",
          900: "#164e63",
          950: "#083344"
        }
      },
      boxShadow: {
        card: "0 0 0 1px rgb(31 41 55 / 0.8), 0 4px 24px -4px rgb(0 0 0 / 0.45)",
        "card-hover": "0 0 0 1px rgb(34 211 238 / 0.15), 0 8px 32px -8px rgb(0 0 0 / 0.55)",
        glow: "0 0 48px -12px rgb(34 211 238 / 0.2)",
        "glow-emerald": "0 0 48px -12px rgb(16 185 129 / 0.2)"
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "glass-shine":
          "linear-gradient(135deg, rgba(248,250,252,0.04) 0%, rgba(248,250,252,0) 50%, rgba(34,211,238,0.03) 100%)"
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.45s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite"
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.65" }
        }
      }
    }
  },
  plugins: []
};

export default config;
