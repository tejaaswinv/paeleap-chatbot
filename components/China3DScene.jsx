"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Lightweight true CSS-3D diorama: layered planes and four-sided lanterns
 * move in perspective. No WebGL, textures, network fetch or paid dependency.
 * Pointer motion uses one requestAnimationFrame per event burst and touches
 * the CSS variables directly, avoiding React rerenders on every mouse move.
 */
const VIEWS = Object.freeze([
  { x: -2, y: 0 },
  { x: -5, y: 11 },
  { x: -5, y: -11 }
]);

export default function China3DScene({ language = "en", children }) {
  const experienceRef = useRef(null);
  const frameRef = useRef(0);
  const [view, setView] = useState(0);

  useEffect(() => {
    const host = experienceRef.current;
    const stage = host?.closest(".china-hero-stage");
    if (!host || !stage || typeof window === "undefined") return undefined;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    let pendingX = VIEWS[view].x;
    let pendingY = VIEWS[view].y;

    function paint() {
      frameRef.current = 0;
      host.style.setProperty("--scene-rx", pendingX.toFixed(2) + "deg");
      host.style.setProperty("--scene-ry", pendingY.toFixed(2) + "deg");
    }
    function schedule(x, y) {
      pendingX = x;
      pendingY = y;
      if (!frameRef.current) frameRef.current = window.requestAnimationFrame(paint);
    }
    function reset() {
      schedule(reduced.matches ? 0 : VIEWS[view].x, reduced.matches ? 0 : VIEWS[view].y);
    }
    function move(event) {
      if (reduced.matches || !fine.matches ||
          (event.pointerType && event.pointerType !== "mouse" && event.pointerType !== "pen")) return;
      const rect = stage.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
      const y = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
      schedule(VIEWS[view].x - y * 3.5, VIEWS[view].y + x * 7.5);
    }
    stage.addEventListener("pointermove", move, { passive: true });
    stage.addEventListener("pointerleave", reset);
    reduced.addEventListener?.("change", reset);
    fine.addEventListener?.("change", reset);
    reset();
    return () => {
      stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerleave", reset);
      reduced.removeEventListener?.("change", reset);
      fine.removeEventListener?.("change", reset);
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = 0;
      }
    };
  }, [view]);

  return (
    <div ref={experienceRef} className="china-3d-experience" data-scene-view={view}>
      <div className="china-3d-world" aria-hidden="true">
        <div className="china-3d-backplane">{children}</div>
        <div className="china-3d-depth-haze china-3d-depth-haze-back" />
        <div className="china-3d-floating-islands">
          <span className="china-3d-island china-3d-island-left" />
          <span className="china-3d-island china-3d-island-right" />
        </div>
        <div className="china-3d-lantern china-3d-lantern-left">
          <span className="china-3d-lantern-cord" />
          <span className="china-3d-lantern-body">
            <i className="china-3d-lantern-face lantern-face-front" />
            <i className="china-3d-lantern-face lantern-face-right" />
            <i className="china-3d-lantern-face lantern-face-back" />
            <i className="china-3d-lantern-face lantern-face-left" />
            <i className="china-3d-lantern-glow" />
          </span>
          <span className="china-3d-lantern-tail" />
        </div>
        <div className="china-3d-lantern china-3d-lantern-right">
          <span className="china-3d-lantern-cord" />
          <span className="china-3d-lantern-body">
            <i className="china-3d-lantern-face lantern-face-front" />
            <i className="china-3d-lantern-face lantern-face-right" />
            <i className="china-3d-lantern-face lantern-face-back" />
            <i className="china-3d-lantern-face lantern-face-left" />
            <i className="china-3d-lantern-glow" />
          </span>
          <span className="china-3d-lantern-tail" />
        </div>
        <div className="china-3d-depth-haze china-3d-depth-haze-front" />
        <div className="china-3d-foreground">
          <svg viewBox="0 0 1200 90" preserveAspectRatio="none" focusable="false" aria-hidden="true">
            <path d="M0 90V55Q95 32 185 62T375 56Q475 16 590 55T825 56Q1034 15 1200 58V90Z"
              fill="#668b76" opacity=".22" />
            <path d="M0 90V80Q200 58 382 83T749 71Q974 50 1200 78V90Z"
              fill="#38685c" opacity=".2" />
            <path d="M0 90Q174 78 296 85T640 83Q864 68 1200 85"
              fill="none" stroke="#d5c8a4" strokeWidth="2" opacity=".65" />
          </svg>
        </div>
      </div>
      <button type="button" className="china-3d-view-control"
        aria-label={language === "zh" ? "旋转三维风景视角" : "Rotate the 3D landscape view"}
        title={language === "zh" ? "旋转三维视角" : "Rotate 3D perspective"}
        onClick={() => setView(previous => (previous + 1) % VIEWS.length)}>
        <span className="china-3d-view-icon" aria-hidden="true">
          <span className="china-3d-compass-ring"><span className="china-3d-compass-needle" /></span>
        </span>
        <span>{language === "zh" ? "旋转山水" : "Explore in 3D"}</span>
      </button>
    </div>
  );
}
