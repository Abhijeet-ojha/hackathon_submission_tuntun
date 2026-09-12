/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#074588",
          container: "#2d5da1",
          fixed: "#d6e3ff",
          "fixed-dim": "#a9c7ff",
        },
        "on-primary": "#ffffff",
        "on-primary-container": "#c4d7ff",
        secondary: {
          DEFAULT: "#b71422",
          container: "#db3237",
          fixed: "#ffdad7",
          "fixed-dim": "#ffb3ae",
        },
        "on-secondary": "#ffffff",
        "on-secondary-container": "#fffbff",
        tertiary: {
          DEFAULT: "#636037",
          container: "#b1ad7d",
          fixed: "#eae4b1",
          "fixed-dim": "#cdc897",
        },
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#43411b",
        surface: {
          DEFAULT: "#fcf9f8",
          dim: "#dcd9d9",
          bright: "#fcf9f8",
          container: "#f0eded",
          "container-low": "#f6f3f2",
          "container-lowest": "#ffffff",
          "container-high": "#eae7e7",
          "container-highest": "#e4e2e1",
        },
        "on-surface": "#1b1c1c",
        "on-surface-variant": "#424750",
        outline: "#737782",
        "outline-variant": "#c3c6d2",
        "error-container": "#ffdad6",
        error: "#ba1a1a",
      },
      fontFamily: {
        sans: ["Karla", "system-ui", "sans-serif"],
        karla: ["Karla", "sans-serif"],
        epilogue: ["Epilogue", "sans-serif"],
        kalam: ["Kalam", "cursive", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        'paper-sm': '2px 2px 0px #2d2d2d',
        'paper': '3px 3px 0px #2d2d2d',
        'paper-md': '4px 4px 0px #2d2d2d',
        'paper-lg': '6px 6px 0px #2d2d2d',
      }
    },
  },
  plugins: [],
}
