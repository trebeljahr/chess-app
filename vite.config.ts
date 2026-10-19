import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwindcss()],
    // Literals in every build, so `import.meta.env.VITE_SENTRY_DSN ? import(...)`
    // folds away with no DSN and the SDK chunk is never emitted.
    define: {
      "import.meta.env.VITE_SENTRY_DSN": JSON.stringify(env.VITE_SENTRY_DSN?.trim() ?? ""),
      "import.meta.env.VITE_BUILD_COMMIT": JSON.stringify(env.COMMIT_SHA || env.GITHUB_SHA || ""),
    },
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
  };
});
