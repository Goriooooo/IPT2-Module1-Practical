/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'playfair': ['Playfair Display', 'serif'],
      },
      colors: {
        charcoal: "#1C1C1C",   // Charcoal Black
        chalk: "#F4F4F4",      // Chalk White
        beige: "#D6C6A8",      // Warm Beige
        coffee: "#6B4E3D",     // Coffee Brown
        olive: "#5C6652",      // Muted Olive Green
      },
    },
  },
  plugins: [],
}

