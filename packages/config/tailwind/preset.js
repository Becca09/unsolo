/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        unsolo: {
          primary: "#1F2F10",
          accent: "#6D8D08",
          neutral: "#E4E9DD",
          muted: "#6F7168",
          light: "#F4F2EA",
          surface: "#FFFFFF",
          border: "#E4E2D9",
          subtle: "#E9E7DF",
          sage: "#B9C68A",
          moss: "#4A5A1F",
        },
      },
      fontFamily: {
        sans: ["var(--font-sora)", "system-ui", "sans-serif"],
        display: ["var(--font-sora)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
