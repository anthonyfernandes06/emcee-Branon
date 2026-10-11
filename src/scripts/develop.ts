/**
 * The Polaroid "develops": each print starts washed out and comes through in full
 * colour the first time it scrolls into view. Runs once per Polaroid.
 *
 * The washed-out look only applies under `html.can-develop`, which the inline head
 * script sets when JS runs and reduced motion is off. So without JS, or with reduced
 * motion, photos simply show in full colour.
 */
const STAGGER_MS = 140;
const root = document.documentElement;

/** Resolves once the print's photo has arrived, so the develop isn't spent on an empty window. */
function photoReady(print: HTMLElement) {
  const img = print.querySelector("img");
  if (!img || (img.complete && img.naturalWidth > 0)) return Promise.resolve();
  return new Promise<void>((resolve) => {
    img.addEventListener("load", () => resolve(), { once: true });
    img.addEventListener("error", () => resolve(), { once: true });
  });
}

if (root.classList.contains("can-develop")) {
  const observer = new IntersectionObserver(
    (entries) => {
      // Prints that enter together develop one after another, left to right.
      const entering = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.left - b.boundingClientRect.left)
        .map((entry) => entry.target as HTMLElement);
      entering.forEach((print, i) => {
        observer.unobserve(print);
        photoReady(print).then(() => {
          print.style.setProperty("--develop-delay", `${i * STAGGER_MS}ms`);
          // Two frames so the washed-out state is painted before the transition starts.
          requestAnimationFrame(() => requestAnimationFrame(() => print.classList.remove("is-undeveloped")));
        });
      });
    },
    { threshold: 0.35 },
  );
  document.querySelectorAll<HTMLElement>("[data-develop].is-undeveloped").forEach((print) => observer.observe(print));
}
