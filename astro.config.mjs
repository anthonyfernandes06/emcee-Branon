// @ts-check
import { defineConfig } from "astro/config";

// The live domain: set `meta.siteUrl` in src/content/site.ts. Until then, Vercel's
// production URL is used so Open Graph images get absolute URLs.
import { readFileSync } from "node:fs";
const siteTs = readFileSync(new URL("./src/content/site.ts", import.meta.url), "utf8");
const siteUrl = siteTs.match(/siteUrl:\s*"([^"]+)"/)?.[1];
const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export default defineConfig({
  site: siteUrl ?? (vercelUrl ? `https://${vercelUrl}` : undefined),
  output: "static",
  devToolbar: { enabled: false },
  build: {
    inlineStylesheets: "always",
  },
  image: {
    service: {
      entrypoint: "astro/assets/services/sharp",
      config: {
        avif: { quality: 50, effort: 5 },
        webp: { quality: 70, effort: 5 },
        jpeg: { quality: 78, mozjpeg: true },
      },
    },
  },
});
