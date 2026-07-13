/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Bookmarked brand palette (mirrors apps/web globals.css design tokens)
        primary: {
          DEFAULT: "#B89DBB", // lavender
          light: "#D5C3D7",
          dark: "#94789A",
        },
        "puce-red": "#642F37",
        rust: "#C0350F",
        "royal-orange": "#F3904B",
        "orange-yellow": "#F7C767",
        // App-wide light lavender tint (mirrors web --color-background, nudged
        // toward the mockup's visible purple tint). Cards use `surface`.
        background: "#F4EEFA",
        surface: "#FCFAFE",
        ink: "#1A1A1A",
        "ink-muted": "#6B6B6B",
        "brand-border": "#E5DFEB",
      },
    },
  },
  plugins: [],
};
