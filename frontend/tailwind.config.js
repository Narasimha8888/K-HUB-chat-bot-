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
        background: 'var(--background)',
        sidebar: 'var(--sidebar)',
        primary: 'var(--primary)',
        card: 'var(--card)',
        muted: 'var(--muted)',
        input: 'var(--bg-input)',
        main: 'var(--text-main)',
        gray: {
          400: 'var(--text-muted)',
          500: 'var(--text-muted)',
          600: 'var(--text-muted)',
          700: 'var(--border-main)',
          800: 'var(--border-main)',
          900: 'var(--card)',
        },
        white: 'var(--text-main)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
