# Reusable Framer Motion Engineering Recipes

Load this reference during **Phase 2** to build smooth, distortion-free launch animations
and interactive app/site UI components.

---

## 1. Studio Motion Tokens (`src/motion/tokens.ts`)

```ts
export const frames = (n: number) => n / 30;
export const EASE_EXPO_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const SPRING_POP = { type: 'spring' as const, stiffness: 520, damping: 26, mass: 0.8 };
export const SPRING_LAYOUT = { type: 'spring' as const, stiffness: 380, damping: 30, mass: 0.9 };
export const SPRING_PUNCH = { type: 'spring' as const, stiffness: 460, damping: 24, mass: 0.75 };
```

---

## 2. Volume-Preserving Squash & Stretch + Continuous Splines

To hit a visual aspect ratio `r = width / height` while keeping area constant (`scaleX * scaleY === 1`):

```ts
const scaleX = Math.sqrt(r);
const scaleY = 1 / Math.sqrt(r);
// r = 1.35 squash  -> scaleX = 1.162, scaleY = 0.861
// r = 0.79 stretch -> scaleX = 0.889, scaleY = 1.125
```

Animate multi-point curved paths with **one continuous `useAnimate` keyframe array**
instead of stepped `setTimeout` state updates:

```ts
animate(
  scope.current,
  {
    x: [-168, -118, -58, -10, 0, 0, 0, 0],
    y: [-112, 18, 82, -26, -56, 16, -7, 0],
    scaleX: [0.89, 0.96, 1.162, 0.943, 1, 0.938, 1.03, 1],
    scaleY: [1.125, 1.04, 0.861, 1.06, 1, 1.066, 0.97, 1],
    rotate: [30, 12, -8, 4, 0, 0, 0, 0],
  },
  { duration: 1.25 / speed, times: [0, 0.1, 0.2, 0.34, 0.48, 0.7, 0.86, 1], ease: 'easeInOut' },
);
```

---

## 3. 2.5D Alpha-Matted SVG Character / Mascot Rig

Create tactile 3D head turns and eye tracking from lightweight 2D SVG:
- Clip facial features with `<clipPath id={clipId}><circle cx="50" cy="50" r={R} /></clipPath>`.
- Apply cosine foreshortening on gaze `(gx, gy)` in `[-1, 1]`:
  `cosX = Math.cos(gx * 0.8)`, `halfGap = 8.2 * (0.66 + 0.34 * cosX)`.
- Position accessories (earcups, glasses, badges, hats) using static SVG `x`/`y` attributes
  and animate **relative deltas only** (`animate={{ x: gx * 5, y: gy * 2.6 }}`).
- Reserve outer container width (`size * 1.08+`) so accessories never collide with flanking text.
- Invert polarity cleanly in 1 frame by swapping SVG `fill` props with no CSS color transition.

---

## 4. Distortion-Free Inline Flexbox Reflow

Inside a CSS-scaled `ResponsiveStage` (`transform: scale(k)`), **do not use Framer Motion
FLIP `layout` on inline expanding rows**—FLIP mixes `2×` screen coordinates with local CSS
pixels and stretches inner SVGs. Animate a flex-width wrapper instead:

```tsx
<div className="flex items-center justify-center text-[40px] font-semibold">
  <span className="shrink-0 whitespace-nowrap">Your own</span>
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
          {/* Fixed-size pill, icon, or badge stays 100% undistorted at any scale */}
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
  <span className="shrink-0 whitespace-nowrap">workspace</span>
</div>
```

---

## 5. Target-Anchored UI Dive + Staggered Character Wipe

- **Zero-Snap Dive:** Mount the single persistent hero icon/mascot directly inside the target
  UI slot (`position: absolute; inset: 0;`). Offset it outward at rest (`x: 205, y: -158, scale: 2.35`)
  and fly a parabolic arc straight to `(0, 0, scale: 1.0)` before toggling `inverted={true}`.
- **L→R Character Wipe:** Render each character index as a `<motion.span>` keyed by
  `${swapped ? 'to' : 'from'}-${idx}` with `delay: idx * 0.015 / speed` and `duration: 0.08 / speed`.
- **9-Frame 2D UI Camera Push-In:** Wrap a complex desktop UI mockup in `<motion.div animate={{ scale: zoomed ? 1.85 : 1, x: zoomed ? -110 : 0, y: zoomed ? -60 : 0 }} transition={{ duration: 0.3, ease: EASE_EXPO_OUT }}>` to focus cleanly on one thread or metric without cutting.

---

## 6. Origin-Locked `ResponsiveStage` & Export Hook Contract

Lock a `960×540` inner stage to `position: absolute; top: 0; left: 0; transform-origin: 0 0`
scaled by `outerRect.width / 960` on both `ResizeObserver` and `window.resize`.

For `?export=1` MP4 rendering, register export hooks in an **isolated `useEffect`** that does
NOT depend on `speed` state:

```ts
useEffect(() => {
  if (!exportMode) return;
  window.__EXPORT_DONE__ = false;
  window.__EXPORT_START__ = (exportSpeed = 1) => {
    setSpeed(exportSpeed);
    setRunKey((k) => k + 1);
    startSequence(0, exportSpeed);
  };
  window.__EXPORT_READY__ = true;
  return clearAll;
}, [exportMode, startSequence, clearAll]);
```

For anti-banding dark outros, layer a `2×2 px` pixel grid (`4 px` pitch) over radial glows:

```css
.studio-dark-grid {
  background-color: #04160f;
  background-image:
    radial-gradient(circle at 22% 82%, rgba(16, 128, 78, 0.5) 0%, transparent 65%),
    repeating-conic-gradient(rgba(255, 255, 255, 0.032) 0% 25%, transparent 0% 50%);
  background-size: 100% 100%, 4px 4px;
}
```
