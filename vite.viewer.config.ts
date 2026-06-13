import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

// Builds the React viewer bundle that will be served by the CLI runtime.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist/viewer",
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      input: resolve("src/viewer/main.tsx"),
      output: {
        entryFileNames: "app.js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
