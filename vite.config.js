import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiBase = env.VITE_API_BASE_URL || "https://trip-maker-backend.vercel.app/api/v1";
  const apiOrigin = apiBase.replace(/\/api\/v1\/?$/, "");
  const isLocalApi = /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?/i.test(apiOrigin);

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: isLocalApi ? {
        "/api": {
          target: apiOrigin,
          changeOrigin: true,
          secure: false,
        },
        "/socket.io": {
          target: apiOrigin,
          changeOrigin: true,
          ws: true,
          secure: false,
        },
      } : undefined,
    },
  };
});
