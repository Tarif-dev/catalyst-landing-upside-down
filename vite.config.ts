// vite.config.ts
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tanstackStart(),
    nitro(),
    viteReact(),
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
  ],
  build: {
    // Increase chunk size limit to avoid unnecessary warning noise
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Split vendor libs into separate cacheable chunks
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          "supabase-vendor": ["@supabase/supabase-js"],
          "router-vendor": ["@tanstack/react-router"],
          "image-vendor": ["html-to-image", "qrcode"],
        },
      },
    },
    // Faster builds via terser
    minify: "esbuild",
    target: "es2020",
    // Enable CSS code splitting
    cssCodeSplit: true,
  },
});