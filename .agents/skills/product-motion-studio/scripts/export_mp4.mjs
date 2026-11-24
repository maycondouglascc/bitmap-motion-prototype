#!/usr/bin/env node
/**
 * Lossless-source 1920x1080 60fps H.264 MP4 exporter for Framer Motion web prototypes.
 *
 * Expects the built web app (`--dist`) to support `/?export=1` with:
 *   - window.__EXPORT_READY__ = true
 *   - window.__EXPORT_START__(speed)
 *   - window.__EXPORT_DONE__ = true
 *
 * Usage:
 *   node scripts/export_mp4.mjs --dist ./dist --out ./export/final.mp4 --duration 11.3 --sheet ./verify.jpg
 */

import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
};

function parseArgs(argv) {
  const args = {
    dist: './dist',
    out: './export/final.mp4',
    sheet: '',
    width: 1920,
    height: 1080,
    fps: 60,
    speed: 0.5,
    duration: 11.3,
    query: '?export=1',
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--help' || k === '-h') args.help = true;
    else if (k === '--dist') args.dist = argv[++i];
    else if (k === '--out') args.out = argv[++i];
    else if (k === '--sheet') args.sheet = argv[++i];
    else if (k === '--width') args.width = Number(argv[++i]);
    else if (k === '--height') args.height = Number(argv[++i]);
    else if (k === '--fps') args.fps = Number(argv[++i]);
    else if (k === '--speed') args.speed = Number(argv[++i]);
    else if (k === '--duration') args.duration = Number(argv[++i]);
    else if (k === '--query') args.query = argv[++i];
  }
  return args;
}

function findBrowser() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Chrome/Edge executable not found. Set CHROME_PATH environment variable.');
}

function findFfmpeg() {
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
    return process.env.FFMPEG_PATH;
  }
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

function startStaticServer(distDir) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const reqPath = (req.url || '/').split('?')[0];
      const rel = reqPath === '/' ? 'index.html' : reqPath.replace(/^\/+/, '');
      const fullPath = path.join(distDir, rel);
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
      resolve({ server, port: server.address().port });
    });
  });
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(
      'Usage: node export_mp4.mjs --dist ./dist --out ./export/final.mp4 [--duration 11.3] [--fps 60] [--speed 0.5] [--sheet ./verify.jpg]',
    );
    return;
  }

  const { chromium } = await import('playwright-core');

  const distDir = path.resolve(args.dist);
  const outMp4 = path.resolve(args.out);
  if (!fs.existsSync(distDir)) {
    throw new Error(`Build directory not found: ${distDir}. Run npm run build first.`);
  }
  fs.mkdirSync(path.dirname(outMp4), { recursive: true });
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motion-export-'));

  const browserPath = findBrowser();
  const ffmpegPath = findFfmpeg();
  const { server, port } = await startStaticServer(distDir);
  const url = `http://127.0.0.1:${port}/${args.query}`;

  console.log(`Capturing ${args.width}x${args.height} PNG frames at ${args.speed}x from ${url}`);
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
      viewport: { width: args.width, height: args.height },
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
        // Ignore shutdown ack race
      }
      if (!recording) return;
      const idx = ++frameIndex;
      const fpath = path.join(tmpDir, `frame_${String(idx).padStart(5, '0')}.png`);
      fs.writeFileSync(fpath, Buffer.from(data, 'base64'));
      const tSec =
        typeof metadata?.timestamp === 'number' ? metadata.timestamp : performance.now() / 1000;
      capturedFrames.push({ fpath, tSec, wallSec: (performance.now() - recordWallStart) / 1000 });
    });

    await cdp.send('Page.startScreencast', {
      format: 'png',
      maxWidth: args.width,
      maxHeight: args.height,
      everyNthFrame: 1,
    });

    recording = true;
    recordWallStart = performance.now();
    await page.evaluate((spd) => window.__EXPORT_START__(spd), args.speed);

    await page.waitForFunction(() => Boolean(window.__EXPORT_DONE__), {
      timeout: Math.ceil((args.duration / args.speed) * 1000) + 15000,
    });

    // Guarantee a crisp settled final frame even after CDP stops emitting idle updates
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

  const concatLines = [];
  let totalSec = 0;
  for (let i = 0; i < capturedFrames.length; i++) {
    const cur = capturedFrames[i];
    const next = capturedFrames[i + 1];
    let dtRaw = next ? next.tSec - cur.tSec : 0.0333;
    if (dtRaw <= 0 || dtRaw > 2.0) {
      dtRaw = next ? Math.max(0.004, next.wallSec - cur.wallSec) : 0.0333;
    }
    let dtOut = Math.max(0.004, dtRaw * args.speed);
    if (!next) {
      dtOut = Math.max(0.85, args.duration - totalSec);
    }
    totalSec += dtOut;
    const escaped = cur.fpath.replace(/\\/g, '/').replace(/'/g, "'\\''");
    concatLines.push(`file '${escaped}'`);
    concatLines.push(`duration ${dtOut.toFixed(6)}`);
  }
  const lastEscaped = capturedFrames[capturedFrames.length - 1].fpath
    .replace(/\\/g, '/')
    .replace(/'/g, "'\\''");
  concatLines.push(`file '${lastEscaped}'`);

  const concatPath = path.join(tmpDir, 'frames.txt');
  fs.writeFileSync(concatPath, concatLines.join('\n'), 'utf8');

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
      args.duration.toFixed(2),
      '-vf',
      `scale=${args.width}:${args.height}:flags=lanczos,fps=${args.fps}`,
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
      outMp4,
    ],
    { stdio: 'inherit' },
  );

  if (args.sheet) {
    const sheetPath = path.resolve(args.sheet);
    fs.mkdirSync(path.dirname(sheetPath), { recursive: true });
    execFileSync(
      ffmpegPath,
      [
        '-y',
        '-i',
        outMp4,
        '-vf',
        `fps=16/${Math.max(1, args.duration - 0.1).toFixed(2)},scale=480:270,tile=4x4:padding=6:color=#181818`,
        '-frames:v',
        '1',
        '-q:v',
        '2',
        sheetPath,
      ],
      { stdio: 'inherit' },
    );
    console.log(`Verification contact sheet saved: ${sheetPath}`);
  }

  fs.rmSync(tmpDir, { recursive: true, force: true });
  const stat = fs.statSync(outMp4);
  console.log(`Exported: ${outMp4} (${(stat.size / 1024 / 1024).toFixed(2)} MiB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
