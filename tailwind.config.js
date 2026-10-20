/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        galaxy: '#03020A',
        ground: '#03020A',
        ink: '#FFFFFF',
        muted: 'rgba(255,255,255,0.72)',
        rose: '#F26B9B',
        accent: '#F26B9B',
        paper: '#FFF6FA',
        'paper-ink': '#1A1218',
        blush: '#FFD6E5',
        champagne: '#F4D9A6',
        surface: '#141018',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body: ['"Nunito Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        taste: '0px',
      },
    },
  },
  plugins: [],
}
