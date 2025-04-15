import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'wood': {
          50: '#faf6f2',
          100: '#f2e8df',
          200: '#e6d1bf',
          300: '#d4b397',
          400: '#c19474',
          500: '#b17b5d',
          600: '#9c6550',
          700: '#825244',
          800: '#6c443c',
          900: '#5b3a35',
        },
        'forest': {
          50: '#f4f9f4',
          100: '#e4f3e4',
          200: '#c8e5c8',
          300: '#9ed09e',
          400: '#6eb46e',
          500: '#4d944d',
          600: '#3d783d',
          700: '#346134',
          800: '#2d4e2d',
          900: '#274227',
        },
        'charcoal': {
          50: '#f7f7f7',
          100: '#e3e3e3',
          200: '#c8c8c8',
          300: '#a4a4a4',
          400: '#818181',
          500: '#666666',
          600: '#515151',
          700: '#434343',
          800: '#383838',
          900: '#313131',
          950: '#1a1a1a',
        },
      },
      backgroundImage: {
        'wood-pattern': "url('/wood-pattern.png')",
      },
    },
  },
  plugins: [],
}

export default config 