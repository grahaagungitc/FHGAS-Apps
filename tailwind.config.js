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
        cyber: {
          cyan: "#00f3ff",
          pink: "#ff007f",
          dark: "#0b0e14",
        },
      },
      boxShadow: {
        'cyber-cyan': '0 0 15px rgba(0, 243, 255, 0.4)',
        'cyber-pink': '0 0 15px rgba(255, 0, 127, 0.4)',
      },
    },
  },
  plugins: [],
};