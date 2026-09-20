import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ivoire: "#FBF9F5",
        sable: {
          50: "#F9F6F0",
          100: "#F2EDE1",
          200: "#E5DAC4",
          300: "#D7C6A6",
          400: "#C2A97B",
          500: "#A98D56",
        },
        vertProfond: {
          50: "#EAF2EE",
          100: "#D5E5DD",
          600: "#1E583E",
          700: "#174530",
          800: "#113424",
          900: "#0B2318",
        },
        bleuNuit: {
          50: "#ECEFF4",
          100: "#D9DFE9",
          700: "#1F2E45",
          800: "#172335",
          900: "#0F1723",
          950: "#0A0F17",
        },
      },
      fontFamily: {
        arabic: ["Amiri", "Noto Naskh Arabic", "serif"],
        latin: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
