const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Include your TSX files here
  ],
  theme: {
    extend: {
      fontFamily: {
        // sans: ["InterVariable", ...defaultTheme.fontFamily.sans],
        segoe: ["Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
      backgroundImage: {
        "hero-pattern": "url('/src/assets/images/home_background.jpg')",
      },
    },
  },
  plugins: [],
};
