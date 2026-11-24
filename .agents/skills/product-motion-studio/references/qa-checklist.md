# Hard-Won Pitfalls & Slow-Motion QA Checklist

Load this reference during **Phase 3 (Visual QA)** and **Phase 4 (MP4 Export)** before
shipping any animation component or video export.

---

## Common Motion & Export Pitfalls

1. **SVG `x`/`y` Double-Offset:** Never set both static SVG `y={35}` and `animate={{ y: 35 + dy }}`
   on a Framer Motion SVG element—CSS `translateY` adds on top of the SVG attribute (`35 + 35 = 70`).
   Put resting coordinates in static SVG attributes and animate **relative deltas only**.
2. **Compounded Squash Ratio:** Setting `scaleX = 1.35, scaleY = 0.74` yields `w/h = 1.82`
   (pancake-flat), not `1.35`. Always use `scaleX = √r, scaleY = 1/√r`.
3. **FLIP `layout` Distortion Inside Scaled Stages:** `layout` projection breaks when an ancestor
   uses `transform: scale(k)` (`k ≠ 1`, e.g., `2×` at `1920×1080` export). Use animated flex-width
   wrappers for inline token expansions instead.
4. **`AnimatePresence mode="wait"` Blank Gap:** Never wrap a persistent hero mascot or icon
   inside an unmounting `mode="wait"` phrase swap—keep the hero element mounted as a sibling
   so transitions stay continuous with zero faded ghost frames.
5. **Accessory / Text Collisions:** SVGs with `overflow-visible` accessories (headsets, badges,
   shadows) exceed nominal `size`. Reserve explicit box width or center clearance.
6. **Cross-Coordinate Dive Teleport:** If an element moves from stage space into a nested UI
   slot, anchor it inside the target slot so it always lands on exact `(0, 0)` with zero snap.
7. **PowerShell `npm run dev -- --port` Bug:** PowerShell strips `--`, making Vite interpret
   the port number as a project directory and serve HTTP 404. Set `server.port` in
   `vite.config.ts` and run plain `npm run dev`.
8. **Export Hook Cleanup Race:** Calling `setSpeed()` inside `window.__EXPORT_START__` cancels
   all timers if `speed` is in the same `useEffect` dependency array as `clearAll`. Isolate
   export hook registration in its own `useEffect`.
9. **CDP Idle Final-Frame Cutoff:** Chrome's `Page.startScreencast` stops emitting frames once
   the final beat settles. Capture one explicit `page.screenshot({ type: 'png' })` on
   `__EXPORT_DONE__` and hold it through `targetDuration`.

---

## Pre-Delivery QA Gate

- [ ] `tsc && vite build` passes with zero errors.
- [ ] `MotionConfig reducedMotion="user"` wraps the app root (or `@media (prefers-reduced-motion: reduce)` honored).
- [ ] Desktop (`1280×800`) and mobile (`390×844`) verified with 0 console errors and 0 horizontal overflow.
- [ ] Key transitions checked at `0.35×` slow motion (fluid curves, flush SVG parts, zero landing snaps).
- [ ] Status readouts and controls sit cleanly outside the stage—never overlapping animated visuals.
- [ ] If exporting MP4: 4×4 FFmpeg verification sheet inspected via `read_file` confirming crisp
      alignment, zero `2×` distortion, and a settled final hero hold.
