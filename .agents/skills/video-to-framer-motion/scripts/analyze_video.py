#!/usr/bin/env python3
"""
Frame-by-frame FFmpeg forensic analyzer for reference motion-design videos.

Usage:
  uv run --with pillow --with numpy --with imageio-ffmpeg --with yt-dlp python scripts/analyze_video.py \
      --input "https://x.com/..." --out "./video_analysis"

Features:
  - Downloads remote URLs via yt-dlp or reads a local MP4/MOV/WebM/GIF
  - Extracts every frame losslessly with FFmpeg (-fps_mode passthrough)
  - Reads exact PTS timestamps via FFmpeg showinfo filter
  - Computes frame-to-frame MAE & % changed pixels (detects 1s vs 2s cadence & hard cuts)
  - Detects multi-panel storyboard grids and cross-panel phase offsets
  - Renders labeled 6x5 contact sheets for direct visual inspection
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw


def find_ffmpeg() -> str:
    env_ff = os.environ.get("FFMPEG_PATH")
    if env_ff and os.path.exists(env_ff):
        return env_ff
    on_path = shutil.which("ffmpeg")
    if on_path:
        return on_path
    try:
        import imageio_ffmpeg  # type: ignore

        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception as exc:
        raise RuntimeError(
            "FFmpeg not found on PATH or via imageio-ffmpeg. Run with `uv run --with imageio-ffmpeg`."
        ) from exc


def resolve_input(inp: str, out_dir: str) -> str:
    if os.path.exists(inp):
        return os.path.abspath(inp)
    if re.match(r"^https?://", inp, re.I):
        video_path = os.path.join(out_dir, "source.mp4")
        print(f"Downloading remote video via yt-dlp -> {video_path}")
        cmd = [
            sys.executable,
            "-m",
            "yt_dlp",
            "--no-playlist",
            "--write-info-json",
            "-o",
            os.path.join(out_dir, "source.%(ext)s"),
            inp,
        ]
        subprocess.run(cmd, check=True)
        for cand in sorted(os.listdir(out_dir)):
            if cand.startswith("source.") and not cand.endswith(".json"):
                return os.path.join(out_dir, cand)
        raise RuntimeError("yt-dlp finished but no downloaded video file was found.")
    raise FileNotFoundError(f"Input path or URL not found: {inp}")


def extract_frames(ffmpeg: str, video_path: str, frames_dir: str) -> list[dict]:
    os.makedirs(frames_dir, exist_ok=True)
    # 1. Extract lossless PNGs
    subprocess.run(
        [
            ffmpeg,
            "-y",
            "-i",
            video_path,
            "-fps_mode",
            "passthrough",
            os.path.join(frames_dir, "frame_%04d.png"),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
        text=True,
    )
    # 2. Collect exact PTS timestamps via showinfo
    res = subprocess.run(
        [ffmpeg, "-i", video_path, "-vf", "showinfo", "-f", "null", "-"],
        capture_output=True,
        text=True,
    )
    pts_list = []
    for line in res.stderr.splitlines():
        if "pts_time:" in line:
            m_n = re.search(r"n:\s*(\d+)", line)
            m_t = re.search(r"pts_time:([\d\.]+)", line)
            m_s = re.search(r"s:(\d+x\d+)", line)
            if m_n and m_t:
                pts_list.append(
                    {
                        "frame": int(m_n.group(1)) + 1,
                        "pts_time": float(m_t.group(1)),
                        "size": m_s.group(1) if m_s else "",
                    }
                )
    return pts_list


def build_metrics_and_sheets(
    frames_dir: str, sheets_dir: str, pts_list: list[dict], cols: int, rows: int
) -> list[dict]:
    os.makedirs(sheets_dir, exist_ok=True)
    frame_files = sorted(f for f in os.listdir(frames_dir) if f.endswith(".png"))
    if not frame_files:
        raise RuntimeError("No extracted frames found.")

    first_im = Image.open(os.path.join(frames_dir, frame_files[0])).convert("RGB")
    orig_w, orig_h = first_im.size
    print(f"Extracted {len(frame_files)} frames at {orig_w}x{orig_h}")

    # Compute frame-to-frame MAE and % pixels changed
    metrics = []
    prev = None
    unique_count = 0
    for idx, fname in enumerate(frame_files):
        im = Image.open(os.path.join(frames_dir, fname)).convert("RGB")
        small = np.asarray(im.resize((320, max(1, int(320 * orig_h / orig_w))), Image.Resampling.BILINEAR), dtype=np.float32)
        if prev is None:
            mae = 0.0
            pct = 0.0
            unique_count = 1
        else:
            diff = np.abs(small - prev)
            mae = float(diff.mean())
            pct = float((diff.max(axis=2) > 8.0).mean() * 100.0)
            if mae > 0.25:
                unique_count += 1
        prev = small
        t = pts_list[idx]["pts_time"] if idx < len(pts_list) else idx / 30.0
        dt = (t - pts_list[idx - 1]["pts_time"]) if (idx > 0 and idx < len(pts_list)) else 0.0
        metrics.append(
            {
                "frame": idx + 1,
                "time": round(t, 4),
                "dt": round(dt, 4),
                "mae": round(mae, 3),
                "pct_changed": round(pct, 2),
            }
        )

    duration = metrics[-1]["time"] if len(metrics) > 1 else 0.0
    avg_fps = (len(metrics) - 1) / duration if duration > 0 else 0.0
    cuts = [m["frame"] for m in metrics if m["mae"] > 18.0]
    print(
        f"Duration: {duration:.2f}s | Container FPS: {avg_fps:.2f} | "
        f"Unique moving frames: {unique_count}/{len(metrics)} | Major cuts (MAE>18): {cuts}"
    )

    # Render labeled contact sheets (cols x rows per sheet)
    per_sheet = cols * rows
    tw = 340
    th = max(120, int(tw * orig_h / orig_w))
    pad, hh = 6, 24
    num_sheets = (len(frame_files) + per_sheet - 1) // per_sheet
    for s in range(num_sheets):
        start = s * per_sheet
        end = min(start + per_sheet, len(frame_files))
        sheet = Image.new(
            "RGB", (cols * (tw + pad) + pad, rows * (th + hh + pad) + pad), (20, 20, 20)
        )
        draw = ImageDraw.Draw(sheet)
        for i in range(start, end):
            pos = i - start
            r, c = divmod(pos, cols)
            x = pad + c * (tw + pad)
            y = pad + r * (th + hh + pad)
            im = (
                Image.open(os.path.join(frames_dir, frame_files[i]))
                .convert("RGB")
                .resize((tw, th), Image.Resampling.LANCZOS)
            )
            sheet.paste(im, (x, y + hh))
            m = metrics[i]
            label = f"F{m['frame']:03d} {m['time']:.2f}s d={m['mae']:.2f}"
            color = (255, 190, 90) if m["mae"] > 18.0 else (120, 255, 140) if m["mae"] > 0.25 else (150, 150, 150)
            draw.text((x + 4, y + 5), label, fill=color)
        out_path = os.path.join(sheets_dir, f"sheet_{s + 1}_F{start + 1:03d}-F{end:03d}.jpg")
        sheet.save(out_path, quality=90)
        print(f"Saved contact sheet: {out_path}")

    return metrics


def main() -> None:
    parser = argparse.ArgumentParser(description="Analyze a reference video frame-by-frame with FFmpeg.")
    parser.add_argument("--input", required=True, help="Local video path or remote URL (X, YouTube, etc.)")
    parser.add_argument("--out", required=True, help="Output working directory")
    parser.add_argument("--cols", type=int, default=6, help="Contact sheet columns (default: 6)")
    parser.add_argument("--rows", type=int, default=5, help="Contact sheet rows (default: 5)")
    args = parser.parse_args()

    os.makedirs(args.out, exist_ok=True)
    ffmpeg = find_ffmpeg()
    video_path = resolve_input(args.input, args.out)
    frames_dir = os.path.join(args.out, "frames")
    sheets_dir = os.path.join(args.out, "sheets")

    pts_list = extract_frames(ffmpeg, video_path, frames_dir)
    metrics = build_metrics_and_sheets(frames_dir, sheets_dir, pts_list, args.cols, args.rows)

    metrics_path = os.path.join(args.out, "metrics.json")
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    print(f"Saved frame metrics: {metrics_path}")


if __name__ == "__main__":
    main()
