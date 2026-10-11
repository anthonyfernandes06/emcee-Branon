/**
 * Hero image sources, shared by Hero.astro (the <picture>) and the page <head>
 * (the preload), so both point at exactly the same files.
 */
import { getImage } from "astro:assets";
import { hero, images } from "../content/site";

export const WIDTHS = [480, 800, 1200, 1600, 2000];
export const DESKTOP_MEDIA = "(min-width: 900px)";
export const MOBILE_MEDIA = "(max-width: 899px)";

function sizesFor(aspect: number, desktop: boolean) {
  // The card fills the viewport minus its inset. With object-fit: cover the photo is drawn
  // at the card width when the viewport is wider than the photo, else at height × aspect.
  const inset = desktop ? 40 : 24;
  const ratio = `${Math.round(aspect * 1000)}/1000`;
  return `(min-aspect-ratio: ${ratio}) calc(100vw - ${inset}px), calc((100vh - ${inset}px) * ${aspect.toFixed(3)})`;
}

async function sourceSet(key: string, desktop: boolean) {
  const src = images[key];
  if (!src) throw new Error(`site.ts: no image called "${key}" in src/assets/`);
  const aspect = src.width / src.height;
  const [avif, webp, jpg] = await Promise.all(
    (["avif", "webp", "jpg"] as const).map((format) => getImage({ src, format, widths: WIDTHS })),
  );
  return {
    src,
    sizes: sizesFor(aspect, desktop),
    avif: avif.srcSet.attribute,
    webp: webp.srcSet.attribute,
    jpg: jpg.srcSet.attribute,
    fallback: jpg.src,
  };
}

export async function heroSources() {
  const desktop = await sourceSet(hero.photo.image, true);
  const mobile = hero.photoMobile ? await sourceSet(hero.photoMobile.image, false) : null;
  const poster = await getImage({ src: images[hero.photo.image], format: "webp", width: 1600 });
  return { desktop, mobile, poster: poster.src };
}
