#!/usr/bin/env node
/**
 * Prepares the event photos for the site.
 *
 *   assets-src/<original>.JPG  →  src/assets/<new-name>.jpg   (graded master, 2400px long edge)
 *                              →  assets-src/_grade-check.jpg  (before/after contact sheet)
 *                              →  public/og.jpg               (1200×630 social card)
 *
 * Every photo gets the same warm grade so the page reads as one album.
 * EXIF/GPS is stripped (sharp drops all metadata unless asked to keep it).
 *
 * Run: npm run images            (skips masters that are already up to date)
 *      npm run images -- --force (rebuild everything)
 *
 * To add a photo: drop the original in assets-src/, add a line to SOURCES below,
 * run the script, then point a slot at it in src/content/site.ts.
 * Camera RAW files (.CR2 etc.) are converted with macOS `sips` first.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, statSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import opentype from "opentype.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC_DIR = join(ROOT, "assets-src");
const OUT_DIR = join(ROOT, "src/assets");
const FORCE = process.argv.includes("--force");

const LONG_EDGE = 2400;
const JPEG_QUALITY = 85;

/**
 * source file → new name. `crop` is a destructive crop as fractions of the
 * auto-oriented original ({ left, top, width, height }). Only the hero uses one,
 * because its ceiling is never shown; everything else relies on `focal` in site.ts.
 * The same original can appear twice under different names (the hero has a tall
 * crop for phones).
 * `violet: false` skips the LED-cove correction for photos without purple ceiling
 * light, so real blue shirts and purple outfits keep their colour.
 */
const SOURCES = [
  {
    file: "Branon_Website_Media_2843.JPG",
    name: "hero-branon-mic",
    // Cut the ceiling and the stage on the left so Branon sits in the left third
    // and the curtains on the right become the text area.
    crop: { left: 0.325, top: 0.05, width: 0.675, height: 0.71 },
  },
  {
    // Portrait crop of the same photo for phones, so they download a narrow file.
    file: "Branon_Website_Media_2843.JPG",
    name: "hero-branon-mic-tall",
    crop: { left: 0.33, top: 0.05, width: 0.3, height: 0.85 },
  },
  { file: "Branon_Website_Media_2862.JPG", name: "birthday-fifty" },
  { file: "Branon_Website_Media_2967.JPG", name: "engage-phones" },
  { file: "Branon_Website_Media_3027.JPG", name: "games-slip" },
  { file: "Branon_Website_Media_3231.JPG", name: "dance-floor" },
  { file: "Branon_Website_Media_DSC09800.JPG", name: "cafe-gathering" },
  // Added 2026-10-11: a college hall, a 25th anniversary and an engagement.
  { file: "Emcee_Material_IMG_0894.jpg", name: "hall-dance", violet: false },
  { file: "Emcee_Material_IMG_3357.CR2", name: "anniversary-portrait", violet: false },
  { file: "Emcee_Material_IMG_3430.CR2", name: "anniversary-dance", violet: false },
  { file: "Emcee_Material_Oct_6_2023_(1).jpg", name: "engagement-shades", violet: false },
  { file: "Emcee_Material_Oct_6_2023.jpg", name: "engagement-laugh", violet: false },
];

/* ------------------------------------------------------------------ grade */

// Warm the whites, pull blue out of the LED spill.
const RECOMB = [
  [1.06, 0.02, 0],
  [0, 1.0, 0],
  [0, 0.02, 0.9],
];

/**
 * The banquet halls have blue/violet LED coves. After the global warm grade they
 * still read lilac, so desaturate that hue band only (and nudge it toward warm
 * grey) on the raw pixels. Skin, gold, red and teal fabrics sit well outside it.
 */
function tameViolet(data, channels) {
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    const max = Math.max(r, g, b);
    const chroma = max - Math.min(r, g, b);
    // Only blue-dominant or magenta pixels can sit in the band.
    if (chroma < 0.04 || b <= g) continue;

    let hue;
    if (max === r) hue = 60 * (((g - b) / chroma) % 6);
    else if (max === g) hue = 60 * ((b - r) / chroma + 2);
    else hue = 60 * ((r - g) / chroma + 4);
    if (hue < 0) hue += 360;

    // Full strength 235°–305°, fading out by 210° and 325°.
    let w = 0;
    if (hue >= 235 && hue <= 305) w = 1;
    else if (hue > 210 && hue < 235) w = (hue - 210) / 25;
    else if (hue > 305 && hue < 325) w = (325 - hue) / 20;
    if (w === 0) continue;

    const sat = chroma / max;
    const k = w * Math.min(1, sat * 3.5) * 0.9; // strongest on saturated LEDs
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    // Pull toward a warm neutral of the same luminance.
    data[i] = Math.round(255 * Math.min(1, r + (y * 1.04 - r) * k));
    data[i + 1] = Math.round(255 * Math.min(1, g + (y - g) * k));
    data[i + 2] = Math.round(255 * Math.min(1, b + (y * 0.9 - b) * k));
  }
}

/** Warm grade on a raw RGB buffer. Returns a raw buffer of the same size. */
async function grade({ data, info }, { violet = true } = {}) {
  const graded = await sharp(data, { raw: info })
    .recomb(RECOMB)
    .modulate({ brightness: 1.02, saturation: 1.04 })
    .gamma(1.05)
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (violet) tameViolet(graded.data, graded.info.channels);
  return graded;
}

const RAW = /\.(cr2|cr3|nef|arw|dng|raf|orf|rw2)$/i;

/** sharp can't decode camera RAW; let macOS render it to a lossless TIFF first. */
function decodable(file) {
  if (!RAW.test(file)) return { path: file, cleanup() {} };
  if (process.platform !== "darwin") throw new Error(`${file} is a camera RAW file. Convert it to JPEG or TIFF first (sips is macOS-only).`);
  const dir = mkdtempSync(join(tmpdir(), "prepare-images-"));
  const out = join(dir, "raw.tiff");
  execFileSync("sips", ["-s", "format", "tiff", file, "--out", out], { stdio: "ignore" });
  return { path: out, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

async function oriented(file) {
  const input = decodable(file);
  try {
    return await orientedPixels(input.path);
  } finally {
    input.cleanup();
  }
}

async function orientedPixels(file) {
  const { data, info } = await sharp(file, { failOn: "none" })
    .rotate() // auto-orient from EXIF
    .toColourspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, info };
}

function upToDate(srcPath, outPath) {
  if (FORCE || !existsSync(outPath)) return false;
  return statSync(outPath).mtimeMs >= Math.max(statSync(srcPath).mtimeMs, statSync(fileURLToPath(import.meta.url)).mtimeMs);
}

/* ------------------------------------------------------------------ main */

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  if (!existsSync(SRC_DIR)) {
    const missing = SOURCES.filter((s) => !existsSync(join(OUT_DIR, `${s.name}.jpg`)));
    if (missing.length) throw new Error(`assets-src/ is missing and these masters do not exist: ${missing.map((m) => m.name).join(", ")}`);
    console.log("prepare-images: no assets-src/, using the committed masters in src/assets/");
    return;
  }

  const sheetRows = [];
  let changed = false;

  for (const source of SOURCES) {
    const srcPath = join(SRC_DIR, source.file);
    const outPath = join(OUT_DIR, `${source.name}.jpg`);
    if (!existsSync(srcPath)) {
      if (existsSync(outPath)) {
        console.log(`  ${source.name}: original missing, keeping existing master`);
        continue;
      }
      throw new Error(`Missing source image: assets-src/${source.file}`);
    }
    if (upToDate(srcPath, outPath)) {
      console.log(`  ${source.name}: up to date`);
      continue;
    }
    changed = true;

    const { data, info } = await oriented(srcPath);
    let base = sharp(data, { raw: info });
    if (source.crop) {
      const { left, top, width, height } = source.crop;
      base = base.extract({
        left: Math.round(left * info.width),
        top: Math.round(top * info.height),
        width: Math.round(width * info.width),
        height: Math.round(height * info.height),
      });
    }
    const resized = await base
      .resize({ width: LONG_EDGE, height: LONG_EDGE, fit: "inside", withoutEnlargement: true })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const before = sharp(resized.data, { raw: resized.info });
    const after = await grade(resized, { violet: source.violet ?? true });
    const afterBuf = await sharp(after.data, { raw: after.info }).jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();
    writeFileSync(outPath, afterBuf); // no withMetadata(): EXIF, GPS and ICC are dropped
    const meta = await sharp(afterBuf).metadata();
    console.log(`  ${source.name}: ${meta.width}×${meta.height}, ${(afterBuf.length / 1024).toFixed(0)} KB`);

    sheetRows.push({
      name: source.name,
      before: await before.clone().resize({ width: 640, height: 640, fit: "inside" }).jpeg().toBuffer(),
      after: await sharp(afterBuf).resize({ width: 640, height: 640, fit: "inside" }).jpeg().toBuffer(),
    });
  }

  if (sheetRows.length) await contactSheet(sheetRows);
  if (changed || FORCE || !existsSync(join(ROOT, "public/og.jpg"))) await ogImage();
}

/* ------------------------------------------------------------ contact sheet */

async function contactSheet(rows) {
  const CELL = 640;
  const PAD = 16;
  const LABEL = 36;
  const metas = await Promise.all(rows.map(async (r) => [await sharp(r.before).metadata(), await sharp(r.after).metadata()]));
  const rowHeights = metas.map(([a, b]) => Math.max(a.height, b.height) + LABEL);
  const width = PAD * 3 + CELL * 2;
  const height = PAD * (rows.length + 1) + rowHeights.reduce((s, h) => s + h, 0);
  const composites = [];
  const labels = [];
  let y = PAD;
  rows.forEach((row, i) => {
    labels.push(`<text x="${PAD}" y="${y + 24}" font-family="Helvetica, Arial" font-size="20" fill="#2E2118">${row.name}: before</text>`);
    labels.push(`<text x="${PAD * 2 + CELL}" y="${y + 24}" font-family="Helvetica, Arial" font-size="20" fill="#2E2118">after (warm grade)</text>`);
    composites.push({ input: row.before, left: PAD, top: y + LABEL });
    composites.push({ input: row.after, left: PAD * 2 + CELL, top: y + LABEL });
    y += rowHeights[i] + PAD;
  });
  composites.unshift({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${labels.join("")}</svg>`), left: 0, top: 0 });
  await sharp({ create: { width, height, channels: 3, background: "#F1E6D2" } })
    .composite(composites)
    .jpeg({ quality: 82 })
    .toFile(join(SRC_DIR, "_grade-check.jpg"));
  console.log("  wrote assets-src/_grade-check.jpg");
}

/* ------------------------------------------------------------------ og.jpg */

async function ogImage() {
  const W = 1200;
  const H = 630;
  const hero = join(OUT_DIR, "hero-branon-mic.jpg");
  // The hero master already puts Branon in the left third; the text takes the curtains.
  const photo = await sharp(hero).resize({ width: W, height: H, fit: "cover", position: "centre" }).toBuffer();

  const fontPath = join(ROOT, "node_modules/@fontsource/young-serif/files/young-serif-latin-400-normal.woff");
  const fontBuf = readFileSync(fontPath);
  const font = opentype.parse(fontBuf.buffer.slice(fontBuf.byteOffset, fontBuf.byteOffset + fontBuf.byteLength));
  const lines = ["Your friendly", "neighbourhood", "Mangalorean host."];
  const size = 56;
  const lineHeight = size * 1.08;
  const scale = size / font.unitsPerEm;

  // opentype.js can return a broken outline the second time it draws a composite
  // glyph, so draw each glyph once at the origin and translate copies of it.
  const outlines = new Map();
  const outline = (glyph) => {
    if (!outlines.has(glyph.index)) outlines.set(glyph.index, glyph.getPath(0, 0, size).commands);
    return outlines.get(glyph.index);
  };
  const translate = (commands, dx, dy) =>
    commands
      .map((c) => {
        const p = (k) => `${(c[`x${k}`] + dx).toFixed(2)} ${(c[`y${k}`] + dy).toFixed(2)}`;
        if (c.type === "M" || c.type === "L") return `${c.type}${(c.x + dx).toFixed(2)} ${(c.y + dy).toFixed(2)}`;
        if (c.type === "Q") return `Q${p(1)} ${(c.x + dx).toFixed(2)} ${(c.y + dy).toFixed(2)}`;
        if (c.type === "C") return `C${p(1)} ${p(2)} ${(c.x + dx).toFixed(2)} ${(c.y + dy).toFixed(2)}`;
        return "Z";
      })
      .join("");

  const laidOut = lines.map((line) => {
    const glyphs = font.stringToGlyphs(line);
    let advance = 0;
    const placed = glyphs.map((glyph, g) => {
      const at = advance;
      const next = glyphs[g + 1];
      advance += glyph.advanceWidth * scale + (next ? font.getKerningValue(glyph, next) * scale : 0);
      return { glyph, at };
    });
    return { placed, width: advance };
  });
  const blockWidth = Math.max(...laidOut.map((l) => l.width));
  const x = W - 72 - blockWidth;
  const startY = H - 92 - lineHeight * (lines.length - 1);
  const glyphPaths = [];
  laidOut.forEach(({ placed }, i) => {
    for (const { glyph, at } of placed) {
      const commands = outline(glyph);
      if (commands.length) glyphPaths.push(`<path d="${translate(commands, x + at, startY + i * lineHeight)}"/>`);
    }
  });

  const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="scrim" x1="1" y1="0" x2="0" y2="0">
        <stop offset="0" stop-color="#2E2118" stop-opacity=".82"/>
        <stop offset=".45" stop-color="#2E2118" stop-opacity=".55"/>
        <stop offset=".72" stop-color="#2E2118" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#scrim)"/>
    <g fill="#FFFDF7">${glyphPaths.join("")}</g>
    <rect x="${x}" y="${H - 62}" width="64" height="5" rx="2.5" fill="#E3A13A"/>
  </svg>`;

  await sharp(photo)
    .composite([{ input: Buffer.from(overlay), left: 0, top: 0 }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(join(ROOT, "public/og.jpg"));
  console.log("  wrote public/og.jpg");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
