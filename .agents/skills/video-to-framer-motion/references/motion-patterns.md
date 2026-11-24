# Framer Motion Engineering Patterns for Studio Motion Graphics

Load this reference during **Phase 2** when implementing character rigs, kinetic
typography, UI dives, or responsive stages.

---

## 1. Volume-Preserving Squash & Stretch Math

To achieve an observed target bounding-box aspect ratio `r = width / height` while
preserving area (`scaleX * scaleY === 1`):

```ts
const scaleX = Math.sqrt(r);
const scaleY = 1 / Math.sqrt(r);
// Example: target w/h = 1.35 -> scaleX = 1.162, scaleY = 0.861 (1.162 / 0.861 = 1.35)
// Example: target w/h = 0.79 -> scaleX = 0.889, scaleY = 1.125 (0.889 / 1.125 = 0.79)
```

Drive multi-point motion paths (e.g., J-curve entrance → bottom squash → rebound → apex
hangtime → damped float) with **one continuous Framer Motion `useAnimate` keyframe spline**
(`times: [...]`) rather than chained `setTimeout` state updates, which create velocity kinks.

---

## 2. Pure 2D SVG "2.5D Spherical Character Rig"

Create a convincing 3D head-turn from flat SVG layers:
1. **Alpha Matte Body:** `<clipPath id={clipId}><circle cx="50" cy="50" r={R} /></clipPath>`
   clips eyes cleanly when they wrap past the silhouette edge.
2. **Cosine Foreshortening:** Given normalized gaze `(gx, gy)` in `[-1, 1]`:
   ```ts
   const cosX = Math.cos(gx * 0.8);
   const halfGap = 8.2 * (0.66 + 0.34 * cosX);
   const leftEyeScaleX = Math.max(0.45, cosX * (gx < 0 ? 0.86 : 1.04));
   const rightEyeScaleX = Math.max(0.45, cosX * (gx > 0 ? 0.86 : 1.04));
   ```
3. **5-Frame Natural Blink (`167 ms` at 30 fps):**
   ```ts
   scaleY: [eyeScaleY, 0.45, 0.1, 0.02, 0.12, eyeScaleY]
   transition: { duration: 5 / 30, times: [0, 0.2, 0.4, 0.52, 0.72, 1], ease: 'linear' }
   ```
4. **Layered Parallax Accessories:** Place headband/earcups behind or around the body and
   foreground elements (e.g., mic boom) after the body; shift using **relative transform
   deltas only** (`animate={{ x: gx * 5, y: gy * 2.6 }}`) on elements whose static SVG
   `x`/`y` attributes already place them at rest.
5. **1-Frame Polarity Inversion:** Swap body/eye fills (`#08090c` ↔ `#ffffff`) via plain
   SVG `fill` props with zero CSS color transition so the flip happens cleanly on the
   exact landing frame.

---

## 3. Distortion-Free Inline Flexbox Reflow (No FLIP `layout` Inside Scaled Stages)

Framer Motion's `layout` FLIP projection reads screen-space `getBoundingClientRect()` and
applies local CSS transforms. Inside a `ResponsiveStage` scaled by `transform: scale(k)`
(`k = 0.35` on mobile or `k = 2.0` at `1920×1080` export), FLIP overshoots and stretches
child SVGs horizontally.

**Use flex-width spring containers instead:**

```tsx
<div className="flex items-center justify-center text-[40px] font-semibold">
  <span className="shrink-0 whitespace-nowrap">Its own</span>
  <motion.div
    initial={false}
    animate={{
      width: expanded ? 196 : 12,
      marginLeft: expanded ? 14 : 0,
      marginRight: expanded ? 14 : 0,
    }}
    transition={SPRING_LAYOUT}
    className="flex h-[50px] shrink-0 items-center justify-center overflow-hidden"
  >
    <AnimatePresence initial={false}>
      {expanded && (
        <motion.div
          initial={{ scale: 0.35, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.35, opacity: 0 }}
          transition={SPRING_LAYOUT}
        >
          {/* Fixed-width pill or circular character stays 100% undistorted */}
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
  <span className="shrink-0 whitespace-nowrap">number</span>
</div>
```

Both flanking words stay locked on the exact baseline and glide symmetrically outward at
every scale factor from `0.3×` to `4×`.

---

## 4. Target-Anchored Character-to-UI Dive (Zero Teleport)

When a mascot jumps from open canvas space into a UI slot (such as an iPhone Dynamic Island
avatar circle), **do not mount a separate floating bot in stage coordinates and swap it for
an avatar bot**. Instead:
1. Mount **one persistent `<GrokBotRig>`** directly inside the `46×46` avatar slot
   (`position: absolute; inset: 0;`).
2. At rest (`incoming`), offset it outward (`x: 205, y: -158, scale: 2.35`).
3. On `diving`, animate along a parabolic keyframe arc (`x: [205, 92, 0]`, `y: [-158, -196, 0]`,
   `scale: [2.35, 1.72, 1.0]`, `times: [0, 0.42, 1]`, `ease: ['easeOut', 'easeIn']`).
4. The exact frame it hits `(0, 0)`, toggle `inverted={true}`. Landing accuracy is
   mathematically `(0.0, 0.0)` regardless of viewport width or simultaneous parent slide.

---

## 5. Proportional 960×540 `ResponsiveStage` & Anti-Banding Dark Texture

Lock the inner canvas to `position: absolute; top: 0; left: 0; width: 960px; height: 540px; transform-origin: 0 0;`
and scale by `containerRect.width / 960` using both `ResizeObserver` and `window.resize`.

For dark gradient outros that resist H.264 8-bit color banding, overlay a subtle `2×2 px`
pixel grid on a `4 px` pitch over radial spotlights:

```css
.emerald-bitmap-bg {
  background-color: #04160f;
  background-image:
    radial-gradient(circle at 22% 82%, rgba(16, 128, 78, 0.52) 0%, rgba(7, 33, 25, 0.22) 45%, transparent 72%),
    repeating-conic-gradient(rgba(255, 255, 255, 0.032) 0% 25%, transparent 0% 50%);
  background-size: 100% 100%, 4px 4px;
}
```
