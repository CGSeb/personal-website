// Compresses every raw export of assets-src/models/ (.glb) into public/models/ with gltfpack
// (Meshopt geometry, compressed textures). Usage: npm run models:optimize
//   -kn  keeps the named empties (slot.*, featured.*, camera.home, bounds) the scene reads
//   -km  keeps the named materials (screen, label) the scene fills
//   -kv  keeps the UVs of untextured surfaces, which receive an image or a badge at runtime
//   -vtf keeps those UVs as floats: quantized UVs need a texture transform, and these surfaces
//        have no texture in the file
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
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
  rmSync(target, { force: true });
  const result = spawnSync(
    'npx',
    ['gltfpack', '-i', file, '-o', target, '-cc', '-tc', '-kn', '-km', '-kv', '-vtf'],
    { stdio: 'inherit', shell: true },
  );
  // On Windows the npm build of gltfpack can abort on exit after writing its output (libuv
  // assertion): the written file decides, not the exit code.
  if (!existsSync(target)) {
    console.error(`✗ ${file} : gltfpack n'a rien écrit (code ${result.status})`);
    process.exit(result.status || 1);
  }
  console.log(`✓ ${target} (${Math.round(statSync(target).size / 1024)} Ko)`);
}
