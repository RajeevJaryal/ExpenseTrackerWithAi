/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Cabinet Grotesk", "sans-serif"],
        body:    ["Instrument Sans", "sans-serif"],
      },
      colors: {
        violet:  { DEFAULT: "#7c6ff7", light: "#a89cf7", dark: "#5a4fd4" },
        rose:    { DEFAULT: "#f472b6" },
        amber:   { DEFAULT: "#fbbf24" },
        emerald: { DEFAULT: "#34d399" },
        cyan:    { DEFAULT: "#22d3ee" },
      },
      backgroundImage: {
        "grad":  "linear-gradient(135deg,#7c6ff7,#f472b6)",
        "grad2": "linear-gradient(135deg,#22d3ee,#34d399)",
        "grad3": "linear-gradient(135deg,#fbbf24,#f472b6)",
      },
      borderRadius: { "2xl":"1rem","3xl":"1.25rem","4xl":"1.5rem","5xl":"2rem" },
    },
  },
  plugins: [],
};