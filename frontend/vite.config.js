import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("pdf-lib") || id.includes("fontkit") || id.includes("pako")) return "pdf";
        },
      },
    },
  },
  server: {
    port: 5173,
    watch: {
      ignored: ["**/public/samples/**"],
    },
    proxy: {
      "/api": "http://127.0.0.1:8000",
    },
  },
});
