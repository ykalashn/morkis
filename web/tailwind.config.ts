import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        cream: "#F7F7F7",
        ink: "#3C3C3C",
        moss: "#006D5B",
        coral: "#FF4B4B",
        muted: "#AFAFAF",
        card: "#FFFFFF",
        border: "#E5E5E5"
      }
    }
  },
  plugins: []
};

export default config;
