import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    fontFamily: {
      nunito: ["var(--font-nunito)", "sans-serif"],
    },
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        cream: {
          50: "#FFFDF2",
          100: "#FEFBE6",
          200: "#FDF7D0",
          300: "#FCF3BB",
        },
      },
      animation: {
        "fade-out": "1s fadeOut 3s ease-out forwards",
        "fade-in": "fadeIn 0.3s ease-in-out",
        "bounce": "bounce 1s infinite",
      },
      keyframes: {
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        bounce: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-25%)" },
        },
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.animation-delay-150': {
          'animation-delay': '150ms',
        },
        '.animation-delay-300': {
          'animation-delay': '300ms',
        },
        '.animation-delay-450': {
          'animation-delay': '450ms',
        },
        '.animation-delay-600': {
          'animation-delay': '600ms',
        },
      }
      addUtilities(newUtilities)
    }
  ],
  safelist: [
    'font-nunito',
    'animation-delay-150',
    'animation-delay-300',
    'animation-delay-450',
    'animation-delay-600',
  ],
};
export default config;
