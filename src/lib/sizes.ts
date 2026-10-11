/**
 * Helpers for `sizes` on cropped photos.
 *
 * With `object-fit: cover`, the photo is often drawn wider than its box (a landscape
 * photo in a portrait window), and `zoom` makes it wider still. The browser needs the
 * drawn width, not the box width, to pick a sharp enough file from the srcset.
 */

/** How much wider than the box the photo is drawn. */
export function coverFactor(imageAspect: number, boxAspect: number, zoom = 1) {
  return Math.max(1, imageAspect / boxAspect) * zoom;
}

/**
 * Multiply every length in a `sizes` string, e.g.
 *   scaleSizes("(min-width: 900px) 340px, 78vw", 1.5)
 *   → "(min-width: 900px) calc(340px * 1.5), calc(78vw * 1.5)"
 */
export function scaleSizes(sizes: string, factor: number) {
  return sizes
    .split(/,(?![^(]*\))/)
    .map((entry) => entry.trim())
    .map((entry) => {
      const match = entry.match(/^(\(.+\))\s+(.+)$/);
      const media = match ? match[1] : "";
      const length = match ? match[2] : entry;
      const scaled = Math.abs(factor - 1) < 0.01 ? length : `calc(${length} * ${factor.toFixed(3)})`;
      return media ? `${media} ${scaled}` : scaled;
    })
    .join(", ");
}

/** Deterministic pseudo-random number in [-1, 1] from a string, for "random" tape tilts. */
export function wobble(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) / 0xffffffff) * 2 - 1;
}
