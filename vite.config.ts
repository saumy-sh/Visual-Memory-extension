import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  const isContent = mode === "content";
  const rollupInput: Record<string, string> = isContent
    ? { "content/index": resolve(__dirname, "src/content/index.tsx") }
    : {
        "background/service-worker": resolve(__dirname, "src/background/service-worker.ts"),
        "popup/popup": resolve(__dirname, "src/popup/popup.ts"),
      };

  return {
    plugins: [react()],
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    build: {
      outDir: "dist",
      emptyOutDir: isContent ? false : true,
      rollupOptions: {
        input: rollupInput,
        output: {
          format: isContent ? "iife" : "es",
          entryFileNames: "[name].js",
          chunkFileNames: "chunks/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash][extname]",
          inlineDynamicImports: isContent ? true : false,
        },
      },
    },
    publicDir: isContent ? false : "public",
  };
});