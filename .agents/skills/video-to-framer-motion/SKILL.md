---
name: video-to-framer-motion
description: >-
  Reverse-engineer reference animations or launch videos frame-by-frame with FFmpeg,
  recreate them in React + TypeScript + Framer Motion, visually audit mid-motion frames
  for smoothness and alignment, and export a verified 1080p 60fps H.264 MP4. Use when
  the user shares a video URL (X/Twitter, YouTube, Loom) or local MP4/MOV/GIF and asks
  to analyze animation mechanics, recreate motion graphics in Framer Motion, polish timing
  or alignment frame-by-frame, or render a Framer Motion prototype to MP4. Do not use
  for simple video transcoding, basic CSS hover transitions, or 3D WebGL/Three.js scenes.
---

# Video-to-Framer-Motion Production Pipeline

A repeatable four-phase workflow for turning any reference motion-design video into an
interactive, pixel-aligned Framer Motion prototype and a broadcast-clean `1920×1080`
`60 fps` MP4.

## Phase 1: Frame-by-Frame FFmpeg Forensics

Never guess animation timings by watching a video once. Extract every frame losslessly
and measure exact cadence, cuts, layout grids, and squash/stretch ratios first.

1. Run the bundled analysis CLI (handles `yt-dlp` download for URLs or local files,
   lossless FFmpeg extraction, PTS cadence, frame-to-frame MAE diffs, multi-panel grid
   detection, and labeled 6×5 contact sheets):
   ```powershell
   uv run --with pillow --with numpy --with imageio-ffmpeg --with yt-dlp python scripts/analyze_video.py --input "<url-or-path>" --out "<work-dir>"
   ```
2. Inspect the generated contact sheets (`sheets/sheet_*.jpg`) directly with `read_file`.
3. From the script's console table and contact sheets, extract these exact measurements
   before writing any animation code:
   - **True cadence:** Animating on 1s (`30 fps`, every frame unique) vs. 2s (`12–15 fps` holds).
   - **Hidden grid/phase structure:** Check whether a multi-panel showcase is actually one
     continuous sequence offset by a fixed frame stride (e.g., 6 panels offset by 96 frames).
   - **Beat durations in frames:** Word snap cadence (e.g., `3f / 4f / 2f`), blinks (`5f = 167 ms`),
     micro-pops (`4f`), camera zooms (`8–10f`), and reading holds (`20–30f`).
   - **Exact palette hex codes & background textures:** Sample background, ink, accent,
     and zoom `4×` on dark gradients to check for structured dot/pixel dithering grids.

## Phase 2: Build the Framer Motion Prototype

Read [references/motion-patterns.md](./references/motion-patterns.md) before coding
character rigs, inline typography reflow, UI dives, or responsive stages.

Follow these non-negotiable architectural rules:
- **Lock a `960×540` logical 16:9 canvas** via `ResizeObserver` (`ResponsiveStage`) so
  coordinates match 16:9 video frames and scale identically from `390px` mobile to `1920×1080`.
- **Keep status readouts outside/below the stage**—never float telemetry overlays on top
  of animated characters or UI mockups.
- **Calibrate `tokens.ts` to 30 fps (`frames(n) = n / 30`)** using crisp exponential ease-out
  (`[0.16, 1, 0.3, 1]`) and tuned springs instead of default symmetric eases.
- **Avoid Framer Motion FLIP `layout` inside CSS `transform: scale(k)` stages:** use
  flex-width spring containers for inline pill/token expansions (FLIP mis-scales when
  ancestors are scaled `≠ 1`, especially at `2×` during 1080p export).
- **Anchor moving characters inside their target UI container** when diving into an
  avatar or pill slot so `(0, 0)` guarantees exact landing before a 1-frame polarity flip.
- **Separate interactive tabs from the continuous sequence:** expose individual lab views
  (with slow-mo `0.35×`, spring sliders, and X-ray alpha-matte toggles) alongside a
  full-sequence player that supports `?export=1` frameless rendering.

## Phase 3: Frame-by-Frame Visual QA & Refinement

Build (`npm run build`), start the dev server (`npm run dev`—never pass `npm run dev -- --port`
in PowerShell because PowerShell strips `--` and passes the port number as Vite's root dir),
and inspect the rendered app in a real browser across desktop (`1280×800`) and mobile (`390×844`).

Check every item in [references/gotchas-and-qa.md](./references/gotchas-and-qa.md), especially:
1. **Slow-motion (`0.35×`) mid-transition captures** for every complex beat (dive entry,
   bottom-arc squash, inline word push-out, target landing + polarity flip).
2. **SVG transform audit:** Verify earcups/accessories sit flush on the character silhouette
   (never combine static SVG `x`/`y` with absolute `animate={{ x, y }}`).
3. **Volume-preserving squash math:** Verify `scaleX = √r` and `scaleY = 1/√r` so target
   aspect ratio `w/h = r` is not squared accidentally.
4. **Zero blank gaps or text collisions:** Keep persistent characters mounted outside
   `AnimatePresence mode="wait"` and reserve explicit outer box width for accessories.

Fix all observed defects in one focused pass, rebuild, and re-verify before exporting.

## Phase 4: Lossless-Source 1080p 60fps MP4 Export

1. Ensure the app exposes a clean `?export=1` full-bleed mode with `window.__EXPORT_READY__`,
   `window.__EXPORT_START__(speed)`, and `window.__EXPORT_DONE__` hooks—and keep the
   export `useEffect` isolated from `speed` state so calling `setSpeed()` never runs
   cleanup and cancels timers.
2. Run the bundled CDP + FFmpeg export script (captures lossless `1920×1080` PNGs at `0.5×`
   speed via Chrome/Edge CDP, restores `1.0×` timing with a clean final hold, encodes
   `60 fps` H.264 `yuv420p` CRF 15, and emits a 4×4 verification contact sheet):
   ```powershell
   node scripts/export_mp4.mjs --dist "<project>/dist" --out "<project>/export/final.mp4" --duration 11.3 --sheet "<work-dir>/verify_sheet.jpg"
   ```
3. **Mandatory Final Gate:** Open the generated `verify_sheet.jpg` with `read_file` and
   inspect all 16 frames for baseline alignment, zero FLIP distortion at `2×` scale, clean
   transitions, and a properly held final hero frame before declaring done.
