# Hard-Won Gotchas & Frame-by-Frame QA Checklist

Load this reference during **Phase 3 (Visual QA)** and **Phase 4 (MP4 Export)** to catch
subtle motion, layout, and rendering bugs before finishing.

---

## 9 High-Impact Bugs to Prevent

1. **SVG `x`/`y` Double-Offset in Framer Motion**
   - *Symptom:* Earcups, limbs, or icons sit shifted down-right far away from their SVG anchor.
   - *Cause:* Putting `y={35}` on `<motion.rect>` AND `animate={{ y: 35 + delta }}` applies a
     CSS `translateY(35px)` **on top of** the SVG `y="35"` attribute (`35 + 35 = 70`).
   - *Fix:* Set resting geometry in static SVG `x`/`y` attributes and pass **relative deltas
     only** (`animate={{ x: deltaX, y: deltaY }}`).

2. **Compounded Squash & Stretch Ratio (`w/h = 1.82` Instead of `1.35`)**
   - *Symptom:* Character looks pancake-flat at the turnaround of a bounce or J-curve.
   - *Cause:* Setting `scaleX = 1.35` and `scaleY = 1 / 1.35 = 0.74` produces `w/h = 1.35 / 0.74 = 1.82`.
   - *Fix:* Always use `scaleX = Math.sqrt(r)` and `scaleY = 1 / Math.sqrt(r)`.

3. **Framer Motion FLIP `layout` Distortion at `2×` Export Scale**
   - *Symptom:* Works fine at `~1×` desktop preview, but inline icons stretch wildly horizontally
     or flanking words drift off-baseline in the `1920×1080` exported MP4.
   - *Cause:* FLIP `layout` mixes screen-pixel bounding boxes (`2×` scaled) with local CSS transforms.
   - *Fix:* Replace `layout` on inline expanding rows with animated flex-width containers
     (`animate={{ width: expanded ? targetW : gapW }}`) and plain `scale` on inner tokens.

4. **`AnimatePresence mode="wait"` Blank Gap & Ghost Character**
   - *Symptom:* Brief 200–400 ms empty white screen or faded gray silhouette between phrases.
   - *Cause:* Nesting a persistent character inside an unmounting `mode="wait"` phrase wrapper.
   - *Fix:* Keep one persistent `<GrokBotRig>` mounted as a sibling outside phrase swaps and
     animate its `y` position smoothly while flanking words pop out and new words snap in.

5. **Accessories Colliding with Adjacent Inline Text**
   - *Symptom:* Headset earcups or arms overlap `"r"` or `"a"` in `"Give your [bot] a phone"`.
   - *Cause:* `overflow-visible` SVG extends wider than the flex item's nominal `size`.
   - *Fix:* Set outer container width to `size * 1.08+` or reserve an explicit inline spacer
     (`w-[132px]`) matching the full visual silhouette including accessories.

6. **Coordinate Mismatch Teleport Before Target Landing**
   - *Symptom:* At `0.35×` slow motion, diving character jumps 30–70 px right as it switches
     into the UI avatar slot.
   - *Fix:* Anchor the single persistent character directly inside the target avatar container
     so the dive always terminates at `(0, 0)`.

7. **PowerShell `npm run dev -- --port 5173` Returning HTTP 404**
   - *Symptom:* Vite starts cleanly but serves an empty `404` page.
   - *Cause:* PowerShell consumes `--` before npm sees it, passing `5173` as Vite's project
     root directory (`vite 5173`).
   - *Fix:* Configure `server.port` in `vite.config.ts` and run plain `npm run dev`.

8. **React `useEffect` Cleanup Canceling Export Timers**
   - *Symptom:* `export_mp4.mjs` hangs until timeout waiting for `window.__EXPORT_DONE__`.
   - *Cause:* `window.__EXPORT_START__(0.5)` calls `setSpeed(0.5)` while `speed` is in the
     same `useEffect` dependency array whose cleanup calls `clearAll()`.
   - *Fix:* Split the `exportMode` hook registration into its own `useEffect` without `speed`
     in its dependency array.

9. **CDP Screencast Truncating the Settled Final Frame**
   - *Symptom:* Exported MP4 cuts off right as the final lockup finishes expanding.
   - *Cause:* Chrome's `Page.startScreencast` stops emitting frames once pixels stop changing.
   - *Fix:* Take one explicit `page.screenshot({ type: 'png' })` on `__EXPORT_DONE__` and set
     its FFmpeg concat duration to `Math.max(0.85, targetDuration - elapsed)`.

---

## Pre-Delivery QA Checklist

- [ ] `tsc && vite build` succeeds with 0 errors.
- [ ] Desktop (`1280×800`) and mobile (`390×844`) both have 0 console errors and 0 horizontal overflow.
- [ ] Slow-motion (`0.35×`) inspection confirms fluid splines, flush SVG parts, and zero landing snaps.
- [ ] Status telemetry sits cleanly below the stage with zero overlap over visuals.
- [ ] Exported `1920×1080` `60 fps` MP4 verified via 4×4 FFmpeg contact sheet (`read_file`).
