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
        background: 'var(--md-sys-color-background)',
        onBackground: 'var(--md-sys-color-on-background)',
        surface: 'var(--md-sys-color-surface)',
        onSurface: 'var(--md-sys-color-on-surface)',
        surfaceVariant: 'var(--md-sys-color-surface-variant)',
        onSurfaceVariant: 'var(--md-sys-color-on-surface-variant)',
        surfaceContainer: 'var(--md-sys-color-surface-container)',
        surfaceContainerHigh: 'var(--md-sys-color-surface-container-high)',
        primary: 'var(--md-sys-color-primary)',
        onPrimary: 'var(--md-sys-color-on-primary)',
        primaryContainer: 'var(--md-sys-color-primary-container)',
        onPrimaryContainer: 'var(--md-sys-color-on-primary-container)',
        secondary: 'var(--md-sys-color-secondary)',
        onSecondary: 'var(--md-sys-color-on-secondary)',
        secondaryContainer: 'var(--md-sys-color-secondary-container)',
        onSecondaryContainer: 'var(--md-sys-color-on-secondary-container)',
        tertiary: 'var(--md-sys-color-tertiary)',
        onTertiary: 'var(--md-sys-color-on-tertiary)',
        tertiaryContainer: 'var(--md-sys-color-tertiary-container)',
        onTertiaryContainer: 'var(--md-sys-color-on-tertiary-container)',
        outline: 'rgb(var(--md-sys-color-outline-rgb) / <alpha-value>)',
        outlineVariant: 'rgb(var(--md-sys-color-outline-variant-rgb) / <alpha-value>)',
      },
      borderColor: {
        DEFAULT: 'rgba(68, 71, 70, 0.35)',
      },
      fontFamily: {
        sans: ['Gotham', '"Noto Sans JP"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Gotham', '"Noto Sans JP"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
