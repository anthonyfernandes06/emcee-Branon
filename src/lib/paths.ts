/**
 * The site can be served from a sub-path (GitHub Pages: /emcee-Branon/). Astro adds the
 * base to its own assets; anything we write as "/file" goes through here.
 * Full URLs and in-page anchors pass through untouched.
 */
export function withBase(path: string) {
  if (!path.startsWith("/")) return path;
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}${path}`;
}
