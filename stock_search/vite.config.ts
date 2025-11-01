import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  // GitHub Pages デプロイ時のみリポジトリ名をベースパスに設定
  // ローカル開発時は "/" を使用
  base: mode === "github-pages" ? "/yfinance-jp-screener/" : "/",
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
}));
