import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        muted: "var(--muted)",
        border: "var(--border)",
        accent: "var(--accent)",
        accentSoft: "var(--accent-soft)",
      },
      boxShadow: {
        glow: "0 20px 60px rgba(27, 58, 45, 0.18)",
      },
      backgroundImage: {
        "hero-pattern":
          "radial-gradient(circle at top left, rgba(224, 143, 28, 0.16), transparent 36%), radial-gradient(circle at top right, rgba(29, 78, 216, 0.14), transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.88), rgba(247, 244, 237, 0.96))",
      },
    },
  },
  plugins: [],
};

export default config;
