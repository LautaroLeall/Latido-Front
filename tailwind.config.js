/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#1A1D29',
          soft: '#2A2E3D',
        },
        paper: {
          DEFAULT: '#FAF8F3',
          dim: '#F0ECE1',
        },
        amber: {
          DEFAULT: '#C89B3C',
          ink: '#8A6414',
        },
        teal: {
          DEFAULT: '#1F6F64',
          light: '#2A8F82',
        },
        alert: {
          red: '#B3423A',
        },
        line: {
          gray: '#D8D2C2',
        },
        // Texto secundario (contraste AA sobre Paper)
        muted: '#5F636B',
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'hard-teal': '3px 3px 0px 0px #1F6F64',
        'hard-ink': '3px 3px 0px 0px #1A1D29',
        'hard-line': '3px 3px 0px 0px #D8D2C2',
        'hard-red': '4px 4px 0px 0px #B3423A',
        'hard-amber': '3px 3px 0px 0px #C89B3C',
      },
      borderRadius: {
        none: '0px',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.35s ease-out both',
      },
    },
  },
  plugins: [],
};
