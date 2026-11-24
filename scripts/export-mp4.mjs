import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const EXPORT_DIR = path.join(ROOT, 'export');
const OUT_MP4 = path.join(EXPORT_DIR, 'bitmap-motion-final.mp4');

const WIDTH = 1920;
const HEIGHT = 1080;
// Capture at 0.5x realtime so every fast 4-frame slam & word snap gets ~60+ lossless PNGs/sec,
// then restore 1.0x speed via exact frame durations in FFmpeg -> 11.30s 60fps H.264 MP4.
const CAPTURE_SPEED = 0.5;
const TARGET_DURATION_SEC = 11.3;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
};

function findBrowser() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Could not find Chrome or Edge executable on this machine.');
}

function findFfmpeg() {
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
    return process.env.FFMPEG_PATH;
  }
  // Check common uv imageio-ffmpeg cache on Windows/macOS/Linux before falling back to PATH
  const uvArchiveRoot = path.join(os.homedir(), 'AppData', 'Local', 'uv', 'cache', 'archive-v0');
  if (fs.existsSync(uvArchiveRoot)) {
    for (const entry of fs.readdirSync(uvArchiveRoot)) {
      const binDir = path.join(uvArchiveRoot, entry, 'Lib', 'site-packages', 'imageio_ffmpeg', 'binaries');
      if (fs.existsSync(binDir)) {
        const exe = fs.readdirSync(binDir).find((f) => f.startsWith('ffmpeg') && f.endsWith('.exe'));
        if (exe) return path.join(binDir, exe);
      }
    }
  }
  return 'ffmpeg';
}

function startStaticServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const reqPath = (req.url || '/').split('?')[0];
      const rel = reqPath === '/' ? 'index.html' : reqPath.replace(/^\/+/, '');
      const fullPath = path.join(DIST, rel);
      if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const ext = path.extname(fullPath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      fs.createReadStream(fullPath).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({ server, port: addr.port });
    });
  });
}

async function main() {
  if (!fs.existsSync(DIST)) {
    throw new Error('dist/ not found. Run `npm run build` first.');
  }
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bitmap-export-'));

  const browserPath = findBrowser();
  const ffmpegPath = findFfmpeg();
  const { server, port } = await startStaticServer();
  const url = `http://127.0.0.1:${port}/?export=1`;

  console.log(`Serving dist/ on ${url}`);
  console.log(`Capturing lossless ${WIDTH}x${HEIGHT} PNG stream at ${CAPTURE_SPEED}x speed via Chrome CDP...`);

  const browser = await chromium.launch({
    executablePath: browserPath,
    headless: true,
    args: ['--disable-gpu-vsync', '--hide-scrollbars', '--force-color-profile=srgb'],
  });

  const capturedFrames = [];
  let recording = false;
  let recordWallStart = 0;

  try {
    const context = await browser.newContext({
      viewport: { width: WIDTH, height: HEIGHT },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);

    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    await page.waitForFunction(() => Boolean(window.__EXPORT_READY__), { timeout: 10000 });
    await page.waitForTimeout(200);

    let frameIndex = 0;
    cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
      try {
        await cdp.send('Page.screencastFrameAck', { sessionId });
      } catch {
        // Ignore ack errors during shutdown
      }
      if (!recording) return;
      const idx = ++frameIndex;
      const fname = `frame_${String(idx).padStart(5, '0')}.png`;
      const fpath = path.join(tmpDir, fname);
      fs.writeFileSync(fpath, Buffer.from(data, 'base64'));
      const tSec =
        typeof metadata?.timestamp === 'number'
          ? metadata.timestamp
          : performance.now() / 1000;
      capturedFrames.push({ fpath, tSec, wallSec: (performance.now() - recordWallStart) / 1000 });
    });

    await cdp.send('Page.startScreencast', {
      format: 'png',
      maxWidth: WIDTH,
      maxHeight: HEIGHT,
      everyNthFrame: 1,
    });

    // Save initial t=0 frame right before starting
    recording = true;
    recordWallStart = performance.now();
    await page.evaluate((spd) => window.__EXPORT_START__(spd), CAPTURE_SPEED);

    await page.waitForFunction(() => Boolean(window.__EXPORT_DONE__), {
      timeout: Math.ceil((TARGET_DURATION_SEC / CAPTURE_SPEED) * 1000) + 15000,
    });
    // Capture one guaranteed crisp settled final frame
    const finalBuf = await page.screenshot({ type: 'png' });
    const finalIdx = ++frameIndex;
    const finalPath = path.join(tmpDir, `frame_${String(finalIdx).padStart(5, '0')}.png`);
    fs.writeFileSync(finalPath, finalBuf);
    const nowWall = (performance.now() - recordWallStart) / 1000;
    const lastTs = capturedFrames.length ? capturedFrames[capturedFrames.length - 1].tSec + 0.04 : nowWall;
    capturedFrames.push({ fpath: finalPath, tSec: lastTs, wallSec: nowWall });

    recording = false;

    await cdp.send('Page.stopScreencast');
    await context.close();
  } finally {
    await browser.close();
    server.close();
  }

  if (capturedFrames.length < 10) {
    throw new Error(`Too few frames captured (${capturedFrames.length}).`);
  }

  console.log(`Captured ${capturedFrames.length} lossless PNG frames. Building exact-timing concat list...`);

  // Build FFmpeg concat demuxer file with exact per-frame durations scaled by CAPTURE_SPEED
  const concatLines = [];
  let totalSec = 0;
  for (let i = 0; i < capturedFrames.length; i++) {
    const cur = capturedFrames[i];
    const next = capturedFrames[i + 1];
    let dtRaw = next ? next.tSec - cur.tSec : 0.0333;
    if (dtRaw <= 0 || dtRaw > 2.0) {
      dtRaw = next ? Math.max(0.004, next.wallSec - cur.wallSec) : 0.0333;
    }
    let dtOut = Math.max(0.004, dtRaw * CAPTURE_SPEED);
    // Hold the settled final lockup frame cleanly through TARGET_DURATION_SEC
    if (!next) {
      dtOut = Math.max(0.85, TARGET_DURATION_SEC - totalSec);
    }
    totalSec += dtOut;
    const escapedPath = cur.fpath.replace(/\\/g, '/').replace(/'/g, "'\\''");
    concatLines.push(`file '${escapedPath}'`);
    concatLines.push(`duration ${dtOut.toFixed(6)}`);
  }
  // FFmpeg concat demuxer requires repeating the final file entry without duration
  const lastEscaped = capturedFrames[capturedFrames.length - 1].fpath
    .replace(/\\/g, '/')
    .replace(/'/g, "'\\''");
  concatLines.push(`file '${lastEscaped}'`);

  const concatPath = path.join(tmpDir, 'frames.txt');
  fs.writeFileSync(concatPath, concatLines.join('\n'), 'utf8');
  console.log(`Concat timeline duration: ${totalSec.toFixed(2)}s -> encoding 1920x1080 60fps MP4...`);

  execFileSync(
    ffmpegPath,
    [
      '-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      concatPath,
      '-t',
      TARGET_DURATION_SEC.toFixed(2),
      '-vf',
      `scale=${WIDTH}:${HEIGHT}:flags=lanczos,fps=60`,
      '-c:v',
      'libx264',
      '-profile:v',
      'high',
      '-level:v',
      '4.2',
      '-pix_fmt',
      'yuv420p',
      '-crf',
      '15',
      '-preset',
      'slow',
      '-movflags',
      '+faststart',
      '-an',
      OUT_MP4,
    ],
    { stdio: 'inherit' },
  );

  // Clean up temporary PNGs
  fs.rmSync(tmpDir, { recursive: true, force: true });
  const stat = fs.statSync(OUT_MP4);
  console.log(`\nExported successfully: ${OUT_MP4} (${(stat.size / 1024 / 1024).toFixed(2)} MiB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
