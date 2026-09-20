import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'var(--font-geist-sans)',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: {
          DEFAULT: '#121212',
          elevated: '#181818',
          highlight: '#242424',
        },
        accent: {
          DEFAULT: '#22c55e',
          hover: '#16a34a',
        },
        subtext: '#a1a1aa',
      },
    },
  },
  // BAGIAN INI YANG MENYEBABKAN ERROR:
  // Pastikan plugins adalah Array kosong [], bukan Object {}
  plugins: [], 
};

export default config;