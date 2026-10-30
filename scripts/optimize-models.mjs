// Compresses every raw export of assets-src/models/ (.glb) into public/models/ with gltfpack
// (Meshopt geometry, compressed textures). Usage: npm run models:optimize
import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const src = 'assets-src/models';
const out = 'public/models';

const glbFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return glbFiles(path);
    return name.endsWith('.glb') ? [path] : [];
  });

const files = glbFiles(src);
if (files.length === 0) console.log(`Aucun .glb dans ${src}.`);
for (const file of files) {
  const target = join(out, relative(src, file));
  mkdirSync(dirname(target), { recursive: true });
  const result = spawnSync('npx', ['gltfpack', '-i', file, '-o', target, '-cc', '-tc'], {
    stdio: 'inherit',
    shell: true,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
  console.log(`✓ ${target} (${Math.round(statSync(target).size / 1024)} Ko)`);
}
