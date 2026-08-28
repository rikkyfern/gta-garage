import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        garage: {
          bg: '#f8fbfc',
          surface: '#ffffff',
          panel: '#ffffff',
          border: '#e1e9ee',
          muted: '#f1f6f8',
          text: '#1b2433',
          subtle: '#637284',
          neon: '#23876c',
          'neon-blue': '#258fe6',
          'neon-amber': '#c28717',
          danger: '#c2413a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'garage-gradient': 'linear-gradient(135deg, #f8fbfc 0%, #ffffff 48%, #eef8f5 100%)',
      },
      boxShadow: {
        card: '0 16px 44px rgba(37,55,72,0.10)',
        lift: '0 24px 70px rgba(37,55,72,0.15)',
        neon: '0 0 0 1px rgba(35, 135, 108, 0.16), 0 14px 32px rgba(35, 135, 108, 0.10)',
        'neon-blue': '0 0 0 1px rgba(37, 143, 230, 0.16), 0 14px 32px rgba(37, 143, 230, 0.10)',
      },
    },
  },
  plugins: [],
}

export default config
