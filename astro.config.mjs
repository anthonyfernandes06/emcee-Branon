// @ts-check
import { defineConfig } from "astro/config";

// The live domain: set `meta.siteUrl` in src/content/site.ts (served from the root).
// Until then the URL comes from where it's built, so Open Graph images get absolute URLs:
// - GitHub Pages (`npm run deploy`, or a GitHub Actions build): https://<owner>.github.io/<repo>/
// - Vercel: its production URL
// Local dev and preview stay at the root.
import { readFileSync } from "node:fs";
const siteTs = readFileSync(new URL("./src/content/site.ts", import.meta.url), "utf8");
const siteUrl = siteTs.match(/siteUrl:\s*"([^"]+)"/)?.[1];
const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const pagesRepo = process.env.PAGES_REPOSITORY ?? (process.env.GITHUB_ACTIONS === "true" ? process.env.GITHUB_REPOSITORY : undefined);
const [ghOwner, ghRepo] = (pagesRepo ?? "").split("/");
const onGitHubPages = Boolean(ghRepo) && !siteUrl;

export default defineConfig({
  site: siteUrl ?? (onGitHubPages ? `https://${ghOwner.toLowerCase()}.github.io` : vercelUrl ? `https://${vercelUrl}` : undefined),
  base: onGitHubPages ? `/${ghRepo}` : undefined,
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
