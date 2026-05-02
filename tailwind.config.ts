import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Built Titling"', 'sans-serif'],
        accent:  ['"Sporty Pro"', 'sans-serif'],
        script:  ['Chalky', 'cursive'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        oranje:        '#FF6B00',
        'oranje-light':'#FF8C33',
        'oranje-dark': '#CC5500',
        bg:            '#0D0D0D',
        bg2:           '#161616',
        bg3:           '#1E1E1E',
        bg4:           '#252525',
        gold:          '#FFB800',
        green:         '#2ECC71',
        red:           '#E74C3C',
      },
    },
  },
  plugins: [],
}

export default config
