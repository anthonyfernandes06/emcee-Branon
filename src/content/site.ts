/**
 * Everything on the page lives here: copy, photos, flags and contact details.
 * Components only read from this file.
 *
 * Search for "TODO:" to find every placeholder that still needs a real value.
 *
 * Adding a photo:
 *   1. Put the original in assets-src/ and add it to SOURCES in scripts/prepare-images.mjs
 *   2. Run `npm run images` (it lands in src/assets/<name>.jpg and is picked up below)
 *   3. Add its alt text to `alt`, then point any slot at it by name.
 */
import type { ImageMetadata } from "astro";

/* ------------------------------------------------------------------ photos */

const files = import.meta.glob<{ default: ImageMetadata }>("../assets/*.{jpg,jpeg,png,webp}", { eager: true });

/** Every graded master in src/assets/, keyed by file name without extension. */
export const images: Record<string, ImageMetadata> = Object.fromEntries(
  Object.entries(files).map(([path, mod]) => [path.split("/").pop()!.replace(/\.\w+$/, ""), mod.default]),
);

export const alt: Record<string, string> = {
  "hero-branon-mic": "Branon speaking into a microphone, one arm outstretched, in a decorated banquet hall.",
  "hero-branon-mic-tall": "Branon speaking into a microphone, one arm outstretched, in a decorated banquet hall.",
  "birthday-fifty": "Branon hosting a 50th birthday, standing on the mic beside the smiling guest of honour.",
  "engage-phones": "Guests laughing and holding up their phones as Branon leads a game.",
  "games-slip": "Branon reads from a slip of paper while a group of guests in festive outfits laugh.",
  "dance-floor": "Branon dancing with a guest in a shimmering gown, other couples dancing behind them.",
  "cafe-gathering": "A lively group gathered around café tables under warm woven pendant lamps.",
  "hall-dance": "A packed hall of guests dancing along as Branon leads them from the front.",
  "anniversary-portrait": "Branon smiling in a blue shirt and tie in front of a floral 25th anniversary backdrop.",
  "anniversary-dance": "Branon dancing with his mic held high as guests at a 25th anniversary dance around him.",
  "engagement-shades": "Branon grinning in novelty sunglasses that read R+A, 2013 to 2023, flashing peace signs.",
  "engagement-laugh": "Branon laughing with a mic in hand at an engagement party, in a blue floral jacket.",
  "wedding-crew": "Branon in RA novelty sunglasses, posing with a crowd of laughing guests in festive outfits under chandeliers.",
};

/**
 * A photo in a slot.
 * - `focal` is the CSS object-position: the point of the photo that stays put.
 * - `zoom` (optional, default 1) crops in further around `focal` without a destructive crop.
 */
export type Photo = { image: string; focal?: string; zoom?: number };

/* ------------------------------------------------------------------- flags */

export const flags = {
  // TODO: [WHATSAPP] not confirmed yet. Set to true once `contact.whatsapp` is real.
  showWhatsApp: false,
  // TODO: confirm cafe-gathering is one of Branon's events. If not, set to false
  // and the tall Glimpse tile falls back to birthday-fifty.
  useCafeImage: true,
};

/* ----------------------------------------------------------------- contact */

export const contact = {
  email: "branon18@gmail.com",
  // Written as +91 XXXXX XXXXX; the tel: link strips the spaces.
  phone: "+91 95293 09864",
  // TODO: [WHATSAPP] wa.me link with the full number, e.g. https://wa.me/91XXXXXXXXXX
  whatsapp: "https://wa.me/91XXXXXXXXXX",
};

/** True while a contact value is still a placeholder (kept out of the JSON-LD). */
export const isPlaceholder = (value: string) => /\[|X{3,}/.test(value);

// Flows into the hero sub-line, the "Where" detail, meta description and JSON-LD.
export const serviceArea = ["Mumbai", "Thane"];

export const languages = ["English", "Hindi", "Konkani"];

/** "A", "A and B", "A, B and C". Never middle dots. */
export const listSentence = (items: string[]) =>
  items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

/* -------------------------------------------------------------------- meta */

export const meta = {
  title: "Branon, your friendly neighbourhood Mangalorean host",
  description: `MC for weddings, anniversaries and birthdays in ${listSentence(serviceArea)}. Hosts in ${listSentence(languages)}. Weekends only.`,
  // TODO: the live domain, e.g. "https://branon.in". On Vercel the production URL is used until this is set.
  siteUrl: null as string | null,
  ogImage: "/og.jpg",
  jobTitle: "Event host (MC)",
};

/* -------------------------------------------------------------------- nav */

export const nav = {
  wordmark: "Branon",
  doodle: "host",
  cta: "Get in touch",
};

/* -------------------------------------------------------------------- hero */

export const hero = {
  photo: { image: "hero-branon-mic", focal: "32% 20%" } as Photo,
  // Optional narrower crop for phones (< 900px). Set to null to use `photo` everywhere.
  photoMobile: { image: "hero-branon-mic-tall", focal: "50% 6%" } as Photo | null,
  // Both crops are made in prepare-images.mjs so the ceiling never shows. The focal points
  // put Branon in the left third on desktop and his face and mic in the top half on phones.
  // Where the handwritten note sits over the photo, as % of the card.
  notePosition: {
    desktop: { left: "1.8%", top: "33%" },
    tablet: { right: "16%", top: "9%" },
    mobile: { right: "5%", top: "9.5%" },
  },
  // TODO (optional): a hero video, e.g. "/video/hero.mp4" in public/. 1080p or lower, under 8 MB, 8–15 s.
  // The photo above is used as its poster, and as the fallback for reduced motion and Save-Data.
  heroVideo: null as string | null,
  title: "Your friendly neighbourhood Mangalorean host.",
  sub: `Weddings, anniversaries and birthdays across ${listSentence(serviceArea)}. I'll even get your shyest uncle on the dance floor.`,
  cta: "Get in touch",
  note: "that's me, the one with the mic",
};

/* ------------------------------------------------------------------- about */

export const about = {
  title: "Hi, I'm Branon.",
  body: "Monday to Friday, I'm a Forensic Auditor at EY: a proud corporate majdoor. On weekends, I'm the guy with the mic at your party. I've run an event company, I love to dance, and I'm Mangalorean, so feeding people and making them laugh is basically in the blood.",
  polaroid: {
    photo: { image: "engagement-shades", focal: "51% 50%" } as Photo,
    caption: "wearing the couple's merch, obviously.",
    tilt: -3,
  },
  stickers: [
    { text: "Ran an event company", tilt: -3 },
    { text: "Forensic Auditor at EY (Mon to Fri)", tilt: 2.5 },
    { text: "Will dance. Will make you dance.", tilt: -1.5 },
    { text: "Speaks English, Hindi and Konkani", tilt: 3.5 },
  ],
};

/* ----------------------------------------------------------------- glimpse */

/**
 * The bento follows the original sketch. Areas:
 *   A tall | B wide       | E tall
 *          | C     | D   |
 *   F wide        | G wide
 */
export type Tile =
  | { area: "a" | "b" | "c" | "d" | "e" | "f" | "g"; kind: "photo"; photo: Photo }
  | { area: "a" | "b" | "c" | "d" | "e" | "f" | "g"; kind: "video"; src: string; poster: Photo; label: string }
  | { area: "a" | "b" | "c" | "d" | "e" | "f" | "g"; kind: "polaroid"; photo: Photo; tilt: number }
  | {
      area: "a" | "b" | "c" | "d" | "e" | "f" | "g";
      kind: "text";
      title: string;
      body: string;
      tone: "sage" | "paper";
      doodle?: string;
    };

// TODO (optional): a short clip for the wide B tile, e.g. "/video/glimpse.mp4" in public/.
// When set, B becomes a video tile and C becomes a Polaroid crop of engage-phones.
const glimpseVideo: string | null = null;

export const glimpse = {
  title: "A glimpse into my events",
  lead: "Every crowd is different. The laughter is always the same though.",
  tiles: [
    flags.useCafeImage
      ? { area: "a", kind: "photo", photo: { image: "cafe-gathering", focal: "50% 60%" } }
      : { area: "a", kind: "photo", photo: { image: "birthday-fifty", focal: "40% 30%" } },
    glimpseVideo
      ? {
          area: "b",
          kind: "video",
          src: glimpseVideo,
          poster: { image: "engage-phones", focal: "45% 45%" },
          label: "Play a short clip from one of my events",
        }
      : { area: "b", kind: "photo", photo: { image: "hall-dance", focal: "42% 68%", zoom: 1.35 } },
    glimpseVideo
      ? { area: "c", kind: "polaroid", photo: { image: "engage-phones", focal: "38% 48%", zoom: 2.2 }, tilt: 2 }
      : {
          area: "c",
          kind: "text",
          title: "Get them moving",
          body: "If the dance floor is empty, that's my problem to fix.",
          tone: "paper",
        },
    {
      area: "d",
      kind: "text",
      title: "Engage with guests",
      body: "I don't talk at the crowd. I pull them in, uncles & aunties included.",
      tone: "sage",
    },
    { area: "e", kind: "photo", photo: { image: "dance-floor", focal: "50% 55%" } },
    {
      area: "f",
      kind: "text",
      title: "Fun games",
      body: "Games people actually want to play. Yes, even the ones who said they wouldn't.",
      tone: "paper",
      doodle: "round two?",
    },
    { area: "g", kind: "photo", photo: { image: "anniversary-dance", focal: "50% 40%" } },
  ] as Tile[],
};

/* -------------------------------------------------------------- kind words */

export type Testimonial = {
  name: string;
  /** null until the real quote arrives. Never write a stand-in quote here. */
  quote: string | null;
  placeholder: string;
  /** Optional photo; when set the card becomes a mini Polaroid and the quote moves below it. */
  photo: Photo | null;
  tilt: number;
  offset: number;
  tape?: "corner";
};

export const kindWords = {
  title: "Kind words",
  lead: "From the people I hosted for!",
  items: [
    {
      name: "Marina Fernandes",
      quote: "My friends had such a blast at my birthday! I thought everyone would just have dinner and leave, but so many got up to play games and dance. It was so much more fun than I’d expected!",
      placeholder: "Quote coming soon. She's still deciding which story to tell.",
      photo: null,
      tilt: -3,
      offset: 0,
    },
    {
      name: "John and Priscilla Rodrigues",
      quote: "He made our 25th Anniversary extra special; all our guests had a great time and were constantly engaged.",
      placeholder: "Quote coming soon. They're still deciding which story to tell.",
      photo: null,
      tilt: 2,
      offset: 32,
      tape: "corner",
    },
    {
      name: "Ryan & Andrea",
      quote: "Branon brings the vibe to the party & that's what he did for our engagement as well. The crowd was constantly grooving.",
      placeholder: "Quote coming soon. They're still deciding which story to tell.",
      photo: null,
      tilt: -1.5,
      offset: 12,
    },
  ] as Testimonial[],
};

/* ------------------------------------------------------------- what I host */

export type HostCard = {
  title: string;
  /** "empty" until real photos arrive; switch to "mini" and add `photo` to fill it. */
  variant: "empty" | "mini" | "note";
  photo?: Photo;
  /** For the note card: a big handwritten mark in the window. */
  mark?: string;
  caption: string;
  line: string;
  tilt: number;
};

export const whatIHost = {
  title: "What I host",
  lead: "If there's a crowd and a mic, I'm interested.",
  cards: [
    {
      title: "Weddings",
      variant: "mini",
      photo: { image: "wedding-crew", focal: "55% 50%" },
      caption: "Nobody gets left out.",
      line: "From the first entry to the last dance.",
      tilt: -2,
    },
    {
      title: "Anniversaries",
      variant: "mini",
      photo: { image: "anniversary-portrait", focal: "50% 45%", zoom: 1.3 },
      caption: "Hosting their 25th. No pressure.",
      line: "Years of love, one very good night.",
      tilt: 2.5,
    },
    {
      title: "Birthdays",
      variant: "mini",
      photo: { image: "birthday-fifty", focal: "45% 30%", zoom: 1.35 },
      caption: "Turning 50, turning it up.",
      line: "Whether you're turning 5 or 50.",
      tilt: -1.5,
    },
    {
      title: "Something else?",
      variant: "note",
      mark: "?",
      caption: "Ask me.",
      line: "Got another reason to celebrate? Let's talk.",
      tilt: 2,
    },
  ] as HostCard[],
  details: [
    { term: "Languages", detail: listSentence(languages) },
    { term: "Where", detail: listSentence(serviceArea) },
    { term: "When", detail: "Weekends only. Weekdays belong to the spreadsheets." },
  ],
};

/* ---------------------------------------------------------------- contact */

export const contactSection = {
  title: "Let's make some memories.",
  lead: "Tell me the date, the occasion and how loud you want it. I host on weekends.",
  copy: "Copy",
  copied: "Copied",
  whatsappLabel: "Message on WhatsApp",
  front: {
    photo: { image: "engagement-laugh", focal: "52% 30%", zoom: 1.1 } as Photo,
    caption: "save me a dance",
    tilt: -4,
  },
  back: { tilt: 8 },
};

export const footer = {
  line: "Hosted with love in Mumbai.",
  credit: { before: "Website built by", name: "Anthony", url: "https://heavenly-neptune-845247.framer.app/" },
};
