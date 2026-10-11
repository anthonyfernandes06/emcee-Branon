/**
 * "Copy" buttons next to the email and phone. Hidden without JS (the links still work);
 * with JS they copy the value and say "Copied" for 1.8s, announced politely.
 */
const RESET_MS = 1800;
const statusEl = document.querySelector<HTMLElement>("[data-copy-status]");

async function writeText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers / insecure origins: fall back to a hidden textarea.
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.cssText = "position:fixed;opacity:0;pointer-events:none";
    document.body.append(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

document.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((button) => {
  const label = button.textContent?.trim() ?? "Copy";
  const ariaLabel = button.getAttribute("aria-label") ?? label;
  let timer: number | undefined;
  button.hidden = false;

  button.addEventListener("click", async () => {
    if (!(await writeText(button.dataset.copy ?? ""))) return;
    const copied = button.dataset.copied ?? "Copied";
    button.textContent = copied;
    button.setAttribute("aria-label", copied);
    if (statusEl) statusEl.textContent = `${button.dataset.copy} copied`;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      button.textContent = label;
      button.setAttribute("aria-label", ariaLabel);
      if (statusEl) statusEl.textContent = "";
    }, RESET_MS);
  });
});
