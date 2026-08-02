/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--color-primary)",
          light: "#D5C3D7",
          dark: "#94789A",
        },
        "puce-red": "var(--color-puce-red)",
        "on-primary": "var(--color-on-primary)",
        rust: "#C0350F",
        "royal-orange": "#F3904B",
        "orange-yellow": "#F7C767",
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        ink: "var(--color-ink)",
        "ink-muted": "var(--color-ink-muted)",
        "brand-border": "var(--color-brand-border)",
      },
    },
  },
  plugins: [],
};
