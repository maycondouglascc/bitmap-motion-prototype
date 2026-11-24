---
name: product-motion-studio
description: >-
  Design, choreograph, and build original product-launch video animations and polished
  interactive UI micro-interactions in React + TypeScript + Framer Motion, then optionally
  export them as 1920x1080 60fps H.264 MP4 videos. Use when the user wants to create a new
  product launch animation, feature showcase video, animated hero visual, kinetic typography
  sequence, mascot/icon rig, Dynamic Island or chat UI interaction, or web/app motion
  prototype in Framer Motion. Do not use for static UI pages without motion, simple CSS
  hover transitions, raw video editing/transcoding, or 3D WebGL/Three.js scenes.
---

# Product Motion Studio

Create studio-grade **product launch videos** and **interactive app/site micro-interactions**
using React + Framer Motion—built on crisp 30/60 fps timing budgets, zero-fade kinetic
typography, tactile spring physics, and verified `1920×1080` MP4 export.

## Phase 1: Creative Brief & Beat Storyboard

Before writing code, define the animation's structure in 30 seconds (ask the user only if
the product name, core feature beats, or deliverable format is unspecified):

1. **Choose Deliverable Mode:**
   - **Product Launch Video (MP4 / Showcase):** Fixed `960×540` logical 16:9 canvas (`ResponsiveStage`),
     multi-beat storyboard (4–6 beats, `8–20 s` total), frameless `?export=1` mode for `1920×1080`
     `60 fps` MP4 rendering, plus an interactive workbench with beat jumps and speed controls.
   - **App / Site Interaction:** Drop-in React + Framer Motion component(s) honoring
     `MotionConfig reducedMotion="user"`, calibrated springs, and responsive layout without
     requiring a video stage wrapper.
2. **Storyboard the Beats & Palette:** Read [references/choreography-grammar.md](./references/choreography-grammar.md)
   to map the user's product story onto proven studio beats (*Hook → Inline Value Prop →
   Hero UI Action → Focused UI Push-In → High-Contrast Dark Payoff*), restrained 4-color
   tokens, and exact 30 fps frame budgets.

## Phase 2: Build with Calibrated Framer Motion Primitives

Read [references/framer-motion-recipes.md](./references/framer-motion-recipes.md) before
coding rigs, kinetic type, inline token expansions, UI zooms, or responsive stages.

Core studio rules:
- **Crisp timing over sluggish fades:** Use exponential ease-out (`[0.16, 1, 0.3, 1]`),
  `1–2` frame word snaps, `4`-frame UI pops, `5`-frame character blinks, `8–10`-frame UI
  morphs, and `20–30`-frame reading holds. Keep subtle secondary life alive during holds.
- **Volume-preserving physics:** Drive multi-point paths (arc entries, bounces, settles) with
  continuous `useAnimate` keyframe splines (`scaleX = √r`, `scaleY = 1/√r`), never stepped
  `setTimeout` chains.
- **Motivated hard cuts:** Cut cleanly between scenes (`0 ms` crossfade) with the incoming
  beat already mid-motion (spinning subject, gliding card, sliding mockup) to preserve flow.
- **Distortion-free inline reflow:** Inside scaled `ResponsiveStage` containers, animate
  flex-width spring slots (`width: 0 → targetW`) instead of Framer Motion FLIP `layout`
  so text stays baseline-locked and icons stay circular at every scale (`390px` to `1080p`).
- **Target-anchored UI transitions:** Mount elements that dive into a UI slot directly inside
  the target container so they land mathematically at `(0, 0)` before any polarity flip.

## Phase 3: Slow-Motion Visual QA & Polish

Build (`npm run build`), start Vite (`npm run dev`—never pass `npm run dev -- --port` in
PowerShell), and inspect in a real browser across desktop (`1280×800`) and mobile (`390×844`).

Run every check in [references/qa-checklist.md](./references/qa-checklist.md):
1. Inspect key transitions at **`0.35×` slow motion** to catch velocity kinks, spatial snaps,
   accessory collisions, or blank-stage gaps.
2. Confirm clean status/control placement (never float captions over animated visuals),
   zero console errors, and zero horizontal overflow on mobile.
3. Fix all defects in a single focused pass and re-verify before export.

## Phase 4: Export Verified 1080p 60fps MP4 (Launch Videos)

When the deliverable includes a video file:
1. Expose `?export=1` full-bleed frameless mode with `window.__EXPORT_READY__`,
   `window.__EXPORT_START__(speed)`, and `window.__EXPORT_DONE__` (keep export hook
   registration in its own `useEffect` without `speed` in its dependency array).
2. Run the bundled lossless-source CDP + FFmpeg exporter (captures PNG frames at `0.5×`
   speed, restores `1.0×` timing with a clean final hold, encodes `60 fps` H.264 `yuv420p`
   CRF 15, and renders a 4×4 contact sheet):
   ```powershell
   node scripts/export_mp4.mjs --dist "<project>/dist" --out "<project>/export/launch.mp4" --duration <seconds> --sheet "<work-dir>/verify_sheet.jpg"
   ```
3. **Final Verification Gate:** Open `verify_sheet.jpg` with `read_file` and verify all 16
   frames for crisp alignment, zero `2×` scale distortion, and a settled final hero lockup.
