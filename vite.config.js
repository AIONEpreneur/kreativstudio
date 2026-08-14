import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const webPort = Number(process.env.BENCH_WEB_PORT || 5200);
const apiPort = Number(process.env.BENCH_API_PORT || process.env.PORT || 8787);
const apiTarget = `http://localhost:${apiPort}`;

export default defineConfig({
  plugins: [react()],
  server: {
    port: webPort,
    proxy: {
      "/api": { target: apiTarget, changeOrigin: true },
      "/media": { target: apiTarget, changeOrigin: true },
      "/projects": { target: apiTarget, changeOrigin: true },
    },
  },
});
