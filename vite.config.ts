// vite.config.ts
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("@supabase")) return "vendor-supabase";
          if (id.includes("@mux")) return "vendor-mux";
          if (
            id.includes("media-chrome") ||
            id.includes("hls.js") ||
            id.includes("custom-media-element") ||
            id.includes("media-tracks")
          ) {
            return "vendor-media";
          }
          if (id.includes("html-to-image") || id.includes("qrcode"))
            return "vendor-export";
          if (id.includes("zod")) return "vendor-validation";
        },
      },
    },
  },
  plugins: [
    tanstackStart(),
    nitro(),
    viteReact(),
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
  ],
});
