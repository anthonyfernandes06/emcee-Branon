/**
 * Glimpse lightbox. Photo tiles are plain links to the full-size image, so they work
 * without JS; with JS they open in a <dialog> instead. showModal() traps focus and
 * closes on Escape; focus goes back to the tile on close.
 */
const dialog = document.querySelector<HTMLDialogElement>("[data-lightbox-dialog]");

if (dialog && typeof dialog.showModal === "function") {
  const picture = dialog.querySelector("picture")!;
  const source = picture.querySelector("source")!;
  const img = picture.querySelector("img")!;
  const video = dialog.querySelector("video")!;
  let opener: HTMLElement | null = null;

  document.querySelectorAll<HTMLAnchorElement>("[data-lightbox]").forEach((tile) => {
    tile.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      opener = tile;
      const videoSrc = tile.dataset.video;
      picture.hidden = Boolean(videoSrc);
      video.hidden = !videoSrc;
      if (videoSrc) {
        dialog.setAttribute("aria-label", "Video");
        video.src = videoSrc;
      } else {
        dialog.setAttribute("aria-label", "Photo");
        source.sizes = tile.dataset.fullSizes ?? "100vw";
        source.srcset = tile.dataset.fullAvif ?? "";
        img.src = tile.href;
        img.alt = tile.dataset.fullAlt ?? "";
      }
      dialog.showModal();
      if (videoSrc) video.play().catch(() => {});
    });
  });

  // Click on the dark backdrop (outside the frame) closes too.
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener("close", () => {
    video.pause();
    video.removeAttribute("src");
    video.load();
    opener?.focus();
  });
}
