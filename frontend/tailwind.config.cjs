module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        faGreen: { 50: '#f0fbf6', 500: '#22c55e', 700: '#16a34a' },
        faGray:  { 50: '#f8fafb', 300: '#d1d5db', 700: '#374151' }
      },
      borderRadius: { 'xl-2': '1rem' }
    }
  },
  plugins: [],
}
