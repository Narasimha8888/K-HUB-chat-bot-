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
          50: 'var(--text-main)',
          100: 'var(--text-main)',
          200: 'var(--text-main)',
          300: 'var(--text-muted)',
          400: 'var(--text-muted)',
          500: 'var(--text-muted)',
          600: 'var(--text-muted)',
          700: 'var(--border-main)',
          800: 'var(--border-main)',
          900: 'var(--card)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      typography: {
        DEFAULT: {
          css: {
            color: 'var(--text-main)',
            '[class~="lead"]': { color: 'var(--text-muted)' },
            a: { color: 'var(--primary)' },
            strong: { color: 'var(--text-main)' },
            'ol > li::marker': { color: 'var(--text-muted)' },
            'ul > li::marker': { color: 'var(--text-muted)' },
            hr: { borderColor: 'var(--border-main)' },
            blockquote: {
              color: 'var(--text-muted)',
              borderLeftColor: 'var(--border-main)',
            },
            h1: { color: 'var(--text-main)' },
            h2: { color: 'var(--text-main)' },
            h3: { color: 'var(--text-main)' },
            h4: { color: 'var(--text-main)' },
            code: { color: 'var(--text-main)' },
            'a code': { color: 'var(--primary)' },
            pre: {
              color: 'var(--text-main)',
              backgroundColor: 'var(--card)',
            },
            thead: {
              color: 'var(--text-main)',
              borderBottomColor: 'var(--border-main)',
            },
            'tbody tr': { borderBottomColor: 'var(--border-main)' },
          },
        },
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
