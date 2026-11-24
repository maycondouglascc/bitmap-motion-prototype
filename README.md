# Bitmap Motion Prototype

Interactive **React + TypeScript + Framer Motion** study recreating the motion design techniques from Bitmap Studio's Grok Bot & Allo launch video, complete with a full-bleed `1920×1080` `60 fps` MP4 exporter.

## What's Inside

- **2.5D Spherical Character Rig (`src/components/GrokBotRig.tsx`)** — Pure 2D SVG rig using a circular `<clipPath>` alpha matte, cosine-foreshortened eye tracking, parallax headset band/earcups/mic boom, 5-frame (`167 ms`) blink keyframes, volume-preserving squash & stretch, instant 1-frame polarity inversion, and an Alpha Matte X-ray inspection mode.
- **Character Lab (`src/scenes/CharacterRigScene.tsx`)** — Continuous multi-keyframe J-curve entrance (`w/h: 0.79 → 1.35 → 0.89 → 1.00`), anticipation wind-up, `1.75×` impact camera punch-in, and interactive cursor gaze tracking.
- **Inline Pill & Dark Outro Reflow (`src/scenes/InlinePillScene.tsx`)** — Speech-cadence word snaps, persistent bot transition, distortion-free flex-width springs expanding `"Its own [pill] number"` with 10 sequential masked dots, dark emerald `2×2` pixel-grid `"Connect Allo to [bot] Grok Bot"`, and live spring stiffness/damping sliders.
- **Dynamic Island Dive & Call Morph (`src/scenes/DynamicIslandScene.tsx`)** — Avatar-anchored parabolic dive with zero-snap polarity flip, iPhone counter-motion slide, Accept button shrink + Decline `layout` glide, live audio equalizer waveform, left-to-right staggered character wipe (`Gonzalo Rascon` → `Forwarding Call`), and `0.35×` slow-motion inspection.
- **Continuous Full Sequence (`src/scenes/FullSequenceScene.tsx`)** — Chains all four beats with zero-fade hard cuts inside a proportionally scaled `960×540` `ResponsiveStage`.
- **Exported Master (`export/bitmap-motion-final.mp4`)** — `1920×1080`, `60 fps`, H.264 High (`yuv420p`) render captured directly from Chrome's compositor via CDP and encoded with FFmpeg.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173/` to explore the four interactive tabs.

## Export to MP4

Requires Chrome or Edge and `ffmpeg` available on `PATH` (or via `FFMPEG_PATH`):

```bash
npm run export:mp4
```

Outputs `export/bitmap-motion-final.mp4` (`1920×1080`, `60 fps`, H.264 `yuv420p`).
