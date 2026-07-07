/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit_400Regular', 'Outfit_700Bold', 'Outfit_900Black', 'system-ui'],
        mono: ['JetBrainsMono_400Regular', 'JetBrainsMono_700Bold', 'monospace'],
        display: ['BebasNeue_400Regular', 'Impact', 'sans-serif'],
        condensed: ['BebasNeue_400Regular', 'sans-serif'],
      },
      colors: {
        gold: '#FFD700',
        misery: {
          black: '#0a0a0a',
          gold: '#FFD700',
          amber: '#fbbf24',
        },
      },
    },
  },
  plugins: [],
};
