// // @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// // or the app will break with duplicate plugins:
// //   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
// //     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
// //     error logger plugins, and sandbox detection (port/host/strictPort).
// // You can pass additional config via defineConfig({ vite: { ... } }) if needed.
// import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// export default defineConfig();
// vite.config.ts
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tanstackStart(),
    nitro(),
    viteReact(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
  ],
});