/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        base: '#0A0A0A',
        navy: {
          950: '#050B24',
          900: '#0B2A8F',
          500: '#2F7BFF',
        },
        surface: {
          DEFAULT: 'rgba(255, 255, 255, 0.04)',
          light: 'rgba(255, 255, 255, 0.92)',
          border: 'rgba(255, 255, 255, 0.10)',
        },
        primary: {
          start: '#6D3AEA',
          end: '#8B5CF6',
          DEFAULT: '#8B5CF6',
          500: '#8B5CF6',
          600: '#6D3AEA',
        },
        accent: {
          start: '#FF3D9A',
          end: '#FF7AC6',
          DEFAULT: '#FF3D9A',
          pink: '#FF3D9A',
        },
        info: '#2F7BFF',
        severity: {
          low: '#22C55E',
          medium: '#FACC15',
          high: '#FB923C',
          critical: '#EF4444',
        },
        dark: {
          900: '#0A0A0A',
          800: '#141419',
          700: '#23232A',
        },
        muted: 'rgba(255, 255, 255, 0.55)',
      },
      borderRadius: {
        '3xl': '24px',
        pill: '9999px',
      },
      boxShadow: {
        'glow-purple': '0 0 35px -5px rgba(139, 92, 246, 0.4)',
        'glow-pink': '0 0 35px -5px rgba(255, 61, 154, 0.45)',
        'glow-blue': '0 0 35px -5px rgba(47, 123, 255, 0.4)',
        'glow-critical': '0 0 25px 0 rgba(239, 68, 68, 0.35)',
        'dock': '0 20px 40px -10px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.12)',
        'glass-inner': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.15)',
      },
      backgroundImage: {
        'gradient-purple': 'linear-gradient(135deg, #6D3AEA 0%, #8B5CF6 100%)',
        'gradient-pink': 'linear-gradient(135deg, #FF3D9A 0%, #FF7AC6 100%)',
        'gradient-navy': 'linear-gradient(180deg, #050B24 0%, #0B2A8F 50%, #2F7BFF 100%)',
        'gradient-glass': 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
      },
    },
  },
  plugins: [],
};
