import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/trpc": {
        target: "http://localhost:3514",
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    outDir: "dist/client",
  },
});
