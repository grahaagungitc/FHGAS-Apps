/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#5C61F4",
          "primary-hover": "#4F46E5",
          dark: "#1E1B4B",
          purple: "#8B5CF6",
          yellow: "#FFB800",
          teal: "#2DD4BF",
          pink: "#FB7185",
          bg: "#F8FAFC",
        },
        cyber: {
          cyan: "#5C61F4",
          pink: "#FB7185",
          dark: "#1E1B4B",
        },
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(92, 97, 244, 0.08)',
        'soft-lg': '0 10px 30px -4px rgba(92, 97, 244, 0.12)',
        'cyber-cyan': '0 4px 14px rgba(92, 97, 244, 0.25)',
        'cyber-pink': '0 4px 14px rgba(251, 113, 133, 0.25)',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};