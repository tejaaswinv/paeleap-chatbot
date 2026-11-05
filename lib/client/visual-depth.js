/** Pointer-driven 3D card tilt, intentionally independent of React state. */
export function applyCardDepth(event) {
  const element = event?.currentTarget;
  if (!element?.style || typeof window === "undefined") return;
  if (event.pointerType && event.pointerType !== "mouse" && event.pointerType !== "pen") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ||
      !window.matchMedia?.("(hover: hover) and (pointer: fine)").matches) return;
  const rect = element.getBoundingClientRect?.();
  if (!rect || !rect.width || !rect.height) return;
  const x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1));
  const y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1));
  element.style.setProperty("--card-rotate-x", (-y * 5).toFixed(2) + "deg");
  element.style.setProperty("--card-rotate-y", (x * 7).toFixed(2) + "deg");
  element.style.setProperty("--card-light-x", ((x + 1) * 50).toFixed(1) + "%");
  element.style.setProperty("--card-light-y", ((y + 1) * 50).toFixed(1) + "%");
}

export function resetCardDepth(event) {
  const element = event?.currentTarget;
  if (!element?.style) return;
  element.style.setProperty("--card-rotate-x", "0deg");
  element.style.setProperty("--card-rotate-y", "0deg");
  element.style.setProperty("--card-light-x", "50%");
  element.style.setProperty("--card-light-y", "25%");
}
