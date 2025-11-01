import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isGitHubPages = mode === "github-pages";

  return {
    plugins: [react(), tailwindcss()],
    base: isGitHubPages ? "/yfinance-jp-screener/" : "/",
    build: {
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom", "react-router-dom"],
            papaparse: ["papaparse"],
          },
        },
      },
    },
  };
});
