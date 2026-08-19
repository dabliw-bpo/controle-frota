import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d9eaff",
          200: "#bcdaff",
          300: "#8ec2ff",
          400: "#589fff",
          500: "#3179ff",
          600: "#1c58f5",
          700: "#1745e0",
          800: "#1938b5",
          900: "#1a358f",
          950: "#141f57",
        },
      },
    },
  },
  plugins: [],
};
export default config;
