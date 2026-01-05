/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Neutral backgrounds
        'auro-bg0': '#0B0C10',
        'auro-bg1': '#0F1118',
        'auro-surface0': 'rgba(26, 28, 36, 0.72)',
        'auro-surface1': 'rgba(35, 38, 51, 0.74)',
        'auro-surface2': 'rgba(44, 48, 64, 0.78)',
        
        // Strokes and borders
        'auro-stroke-subtle': 'rgba(255, 255, 255, 0.08)',
        'auro-stroke-strong': 'rgba(255, 255, 255, 0.14)',
        'auro-divider': 'rgba(255, 255, 255, 0.06)',
        
        // Text colors
        'auro-text-primary': '#F4F6FF',
        'auro-text-secondary': 'rgba(244, 246, 255, 0.72)',
        'auro-text-tertiary': 'rgba(244, 246, 255, 0.52)',
        'auro-text-disabled': 'rgba(244, 246, 255, 0.34)',
        'auro-text-inverse': '#0B0C10',
        
        // Accent colors
        'auro-accent': '#8B5CF6',
        'auro-accent-soft': 'rgba(139, 92, 246, 0.22)',
        'auro-accent-glow': 'rgba(139, 92, 246, 0.35)',
        
        // Semantic colors
        'auro-success': '#34D399',
        'auro-warning': '#FBBF24',
        'auro-danger': '#FB7185',
        'auro-info': '#60A5FA',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['SF Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '1.25' }],
        'sm': ['13px', { lineHeight: '1.25' }],
        'md': ['14px', { lineHeight: '1.45' }],
        'lg': ['16px', { lineHeight: '1.25' }],
        'xl': ['20px', { lineHeight: '1.25' }],
        '2xl': ['28px', { lineHeight: '1.25' }],
        '3xl': ['40px', { lineHeight: '1.1' }],
      },
      borderRadius: {
        'sm': '10px',
        'md': '14px',
        'lg': '18px',
        'xl': '24px',
        '2xl': '32px',
        'pill': '999px',
      },
      spacing: {
        '0': '0px',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '14': '56px',
        '16': '64px',
      },
      backdropBlur: {
        'panel': '18px',
        'card': '14px',
        'control': '10px',
      },
      boxShadow: {
        'panel': '0 20px 60px -20px rgba(0, 0, 0, 0.55), inset 0 2px 0 0 rgba(255, 255, 255, 0.04)',
        'card': '0 14px 40px -18px rgba(0, 0, 0, 0.55), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        'control': '0 10px 26px -16px rgba(0, 0, 0, 0.55), inset 0 1px 0 0 rgba(255, 255, 255, 0.06)',
        'glow-accent': '0 0 22px 0 rgba(139, 92, 246, 0.30)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.26s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}

