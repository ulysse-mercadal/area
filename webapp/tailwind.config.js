/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sora': ['Sora', 'sans-serif'],
      },
      colors: {
        purple: {
          primary: '#7F22FE',
        }
      }
    },
  },
  plugins: [],
}
