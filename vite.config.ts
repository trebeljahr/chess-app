import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/trpc": {
        target: "http://localhost:6100",
        changeOrigin: true,
        ws: true
      }
    }
  },
  build: {
    outDir: "dist/client"
  }
});
