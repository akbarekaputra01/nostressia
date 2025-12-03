import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        // Brand colors
        "brand-blue": "var(--brand-blue)",
        "brand-blue-light": "var(--brand-blue-light)",
        "brand-orange": "var(--brand-orange)",

        // Text colors
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",

        // Accent
        "accent-yellow": "var(--accent-yellow)",

        // Glassmorphism
        "glass-bg": "var(--glass-bg)",
        "glass-border": "var(--glass-border)",
        "glass-shadow": "var(--glass-shadow)",

        // Background gradients (Tailwind bisa pakai via bg-gradient-[name] kalau dibuat plugin)
        "bg-cream": "var(--bg-gradient-cream)",
        "bg-pink": "var(--bg-gradient-pink)",
        "bg-lavender": "var(--bg-gradient-lavender)",
      },
      boxShadow: {
        "glass": "0 4px 20px var(--glass-shadow)",
      },
      backdropBlur: {
        "glass": "12px",
      },
    },
  },
  plugins: [],
};
