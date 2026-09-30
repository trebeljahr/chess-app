import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "127.0.0.1",
    port: Number(process.env.PORT ?? 0),
    strictPort: true,
    proxy: {
      "/trpc": {
        target: `http://127.0.0.1:${process.env.API_PORT ?? 3514}`,
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    outDir: "dist/client",
  },
});
