/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accounting: {
          paper: '#E7ECDF',    // verde papel contable
          indigo: '#1E2A44',   // tinta indigo
          graphite: '#5B6570', // grafito secundario
          gold: '#C9971C',     // oro sello (percepciones)
          red: '#B5442E',      // rojo sello (deducciones)
          green: '#2F6F63',    // verde sello (interactivos)
        }
      },
      fontFamily: {
        serif: ['Spectral', 'Georgia', 'serif'],
        sans: ['"IBM Plex Sans"', 'Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
