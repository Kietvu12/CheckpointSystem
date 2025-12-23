/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#C51C62',
          light: '#D93D73',
          lighter: '#E85A8A',
          lightest: '#F5D0D8',
          dark: '#A0154F',
          darker: '#7A0F3C',
        },
      },
    },
  },
  plugins: [],
}

