import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1a1a2e',
        accent: '#0066cc',
        cta: '#ff6b35',
        background: '#fafafa',
      },
    },
  },
  plugins: [],
} satisfies Config;
