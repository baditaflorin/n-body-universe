import { rm } from "node:fs/promises";

const generated = [
  "docs/assets",
  "docs/wasm",
  "docs/index.html",
  "docs/404.html",
  "docs/favicon.svg",
  "docs/manifest.webmanifest",
  "docs/sw.js",
];

await Promise.all(generated.map((path) => rm(path, { force: true, recursive: true })));
