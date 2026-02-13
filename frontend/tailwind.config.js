/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Amazon Ember"', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        display: ['"Amazon Ember"', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      colors: {
        primary: '#1e40af', // Blue
        secondary: '#7c3aed', // Purple
        accent: '#f59e0b', // Amber
        success: '#10b981', // Green
        danger: '#ef4444', // Red
        warning: '#f97316', // Orange
      },
      spacing: {
        'safe': '1rem',
        'safe-lg': '2rem',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}
