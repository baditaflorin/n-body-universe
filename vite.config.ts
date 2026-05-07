import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { defineConfig } from "vite";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as {
  version: string;
};

export default defineConfig({
  base: "/n-body-universe/",
  plugins: [react()],
  publicDir: "public",
  build: {
    outDir: "docs",
    emptyOutDir: false,
    assetsDir: "assets",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          three: ["three"],
        },
      },
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_COMMIT__: JSON.stringify("main"),
    __APP_FULL_COMMIT__: JSON.stringify("main"),
    __APP_REPO_URL__: JSON.stringify("https://github.com/baditaflorin/n-body-universe"),
    __APP_PAYPAL_URL__: JSON.stringify("https://www.paypal.com/paypalme/florinbadita"),
  },
});
