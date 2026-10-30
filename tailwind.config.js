/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        taskflow: {
          dark: {
            bg: '#1e1e1e',
            sidebar: '#191919',
            card: '#262626',
            hover: '#2e2e2e',
            border: '#333333',
            text: '#f2f2f2',
            muted: '#9a9a9a',
            subtle: '#666666'
          },
          accent: {
            red: '#dc4c3e',
            redHover: '#c53b27',
            orange: '#ea580c',
            blue: '#2563eb',
            green: '#16a34a'
          },
          priority: {
            1: '#dc4c3e', // Urgent (Red)
            2: '#e58e26', // High (Orange)
            3: '#3867d6', // Medium (Blue)
            4: '#718093'  // None / Low (Muted)
          }
        }
      }
    },
  },
  plugins: [],
}

