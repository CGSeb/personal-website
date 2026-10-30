// Builds the real site from the fixtures (CONTENT_DIR) to check what only a build shows:
// invalid content stops it (US6-2) and drafts appear nowhere (US6-3).
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

const root = join(import.meta.dirname, '..', '..');
const out = join(root, '.test-builds');

function build(fixture: 'valid' | 'invalid') {
  const result = spawnSync('npx', ['astro', 'build', '--outDir', `.test-builds/${fixture}`], {
    cwd: root,
    shell: true,
    encoding: 'utf8',
    env: {
      ...process.env,
      CONTENT_DIR: `tests/fixtures/content/${fixture}`,
      ASTRO_CACHE_DIR: `.test-builds/cache-${fixture}`,
      FORCE_COLOR: '0',
    },
  });
  return { status: result.status, output: `${result.stdout}\n${result.stderr}` };
}

const allFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? allFiles(path) : [path];
  });

afterAll(() => rmSync(out, { recursive: true, force: true }));

describe('build from fixtures', { timeout: 180_000 }, () => {
  it('stops on invalid content and names the file and field (US6-2)', () => {
    const { status, output } = build('invalid');
    expect(status).not.toBe(0);
    expect(output).toMatch(/tests[\\/]fixtures[\\/]content[\\/]invalid[\\/]projects[\\/]/);
    expect(output).toMatch(/texte alternatif|n'existe pas|manquant|dossier|après le début|cover/);
  });

  it('builds valid content and leaves drafts out everywhere (US6-3)', () => {
    const { status, output } = build('valid');
    expect(status, output).toBe(0);
    const dist = join(out, 'valid');
    expect(existsSync(join(dist, 'fr', 'projets', 'alpha', 'index.html'))).toBe(true);
    expect(existsSync(join(dist, 'fr', 'projets', 'gamma-draft'))).toBe(false);
    for (const file of allFiles(dist).filter((f) => /\.(html|xml|txt|json)$/.test(f))) {
      expect(readFileSync(file, 'utf8'), file).not.toContain('gamma-draft');
    }
    const exported = JSON.parse(readFileSync(join(dist, 'data', 'portfolio.json'), 'utf8'));
    expect(exported.projects.map((p: { id: string }) => p.id)).toEqual(['alpha', 'beta']);
  });
});
