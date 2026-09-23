import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { emotionboard } from './emotionboard-content.mjs';

const root = fileURLToPath(new URL('../public/emotionboard/', import.meta.url));
for (const folder of ['loops', 'posters']) mkdirSync(join(root, folder), { recursive: true });
for (const item of emotionboard.filter(item => item.file.endsWith('.mp4'))) {
  const input = join(root, item.file);
  const run = args => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
  run(['-i', input, '-map', '0:v:0', '-an', '-c:v', 'libx264', '-crf', '23', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', join(root, 'loops', `${item.id}.mp4`)]);
  run(['-ss', String(item.posterTime), '-i', input, '-frames:v', '1', '-vf', 'scale=540:-2', '-c:v', 'libwebp', '-quality', '82', join(root, 'posters', `${item.id}.webp`)]);
  console.log(`Prepared ${item.id}: silent H.264 loop + WebP poster.`);
}
