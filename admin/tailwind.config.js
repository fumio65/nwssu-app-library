/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f7f5',
          100: '#d0eae4',
          200: '#a1d5c9',
          400: '#3a9080',
          600: '#06433C',
          700: '#053630',
          900: '#021f1b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
