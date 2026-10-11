#!/usr/bin/env node
/**
 * Publishes the site to GitHub Pages: builds it for https://<owner>.github.io/<repo>/
 * and force-pushes the result to the `gh-pages` branch of the `origin` remote.
 *
 * Run: npm run deploy
 *
 * One-time setup on GitHub: Settings → Pages → Build and deployment →
 * Source: "Deploy from a branch", Branch: gh-pages, folder: / (root).
 *
 * It builds from the files on disk, so commit and push `main` too, to keep the source
 * on GitHub in step with what's live.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { stdio: "inherit", ...opts });
const read = (cmd, args) => execFileSync(cmd, args, { encoding: "utf8" }).trim();

const remote = read("git", ["remote", "get-url", "origin"]);
const match = remote.match(/github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/);
if (!match) throw new Error(`origin is not a GitHub repository: ${remote}`);
const [, owner, repo] = match;

if (read("git", ["status", "--porcelain"])) {
  console.warn("Note: there are uncommitted changes. They will go live, but aren't on GitHub's main branch yet.\n");
}

const out = mkdtempSync(join(tmpdir(), "pages-"));
try {
  run("node", ["scripts/prepare-images.mjs"]);
  run("npx", ["astro", "build", "--outDir", out], { env: { ...process.env, PAGES_REPOSITORY: `${owner}/${repo}` } });
  // Pages runs Jekyll by default, which would hide the _astro/ folder.
  writeFileSync(join(out, ".nojekyll"), "");

  const name = read("git", ["config", "user.name"]);
  const email = read("git", ["config", "user.email"]);
  const source = read("git", ["rev-parse", "--short", "HEAD"]);
  const git = (...args) => run("git", ["-C", out, "-c", `user.name=${name}`, "-c", `user.email=${email}`, ...args]);
  git("init", "-q", "-b", "gh-pages");
  git("add", "-A");
  git("commit", "-q", "-m", `Deploy site from ${source}`);
  git("push", "--force", "--quiet", remote, "gh-pages");

  console.log(`\nPublished. Live in a minute or two at https://${owner.toLowerCase()}.github.io/${repo}/`);
} finally {
  rmSync(out, { recursive: true, force: true });
}
