import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/core/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        canvas: 'var(--bg-canvas)',
        header: 'var(--bg-header)',
        surface: 'var(--bg-surface)',
        'surface-subtle': 'var(--bg-surface-subtle)',
        'surface-hover': 'var(--bg-surface-hover)',
        subtle: 'var(--border-subtle)',
        strong: 'var(--border-strong)',
        fg: 'var(--text-primary)',
        'fg-secondary': 'var(--text-secondary)',
        'fg-muted': 'var(--text-muted)',
      },
      keyframes: {
        twinkle: {
          '0%, 100%': { opacity: '0.45', transform: 'scale(0.85)' },
          '50%': { opacity: '1', transform: 'scale(1.15)' },
        },
        floatCloud: {
          '0%, 100%': { transform: 'translateX(0px)' },
          '50%': { transform: 'translateX(2px)' },
        },
      },
      animation: {
        twinkle: 'twinkle 2.2s ease-in-out infinite',
        'float-cloud': 'floatCloud 3.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
