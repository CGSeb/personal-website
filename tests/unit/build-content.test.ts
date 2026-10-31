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
  // Without colour codes, whatever the terminal.
  const output = `${result.stdout}\n${result.stderr}`.replace(/\u001b\[[0-9;]*m/g, '');
  return { status: result.status, output };
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
    // Astro stops at the first schema error, which depends on the file order of the system:
    // check that it names one of the invalid elements and the field in cause.
    expect(output).toMatch(/missing-translation|broken-ref|dup-copy|bad-period|no-alt/);
    expect(output).toMatch(/\b(title\.en|cover\.alt|period\.end|categories\[0\]|description|id)\b/);
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

  it('puts published content in the scene manifest, drafts left out (US6-2)', () => {
    for (const page of [join('fr', 'explorer'), join('en', 'explore')]) {
      const html = readFileSync(join(out, 'valid', page, 'index.html'), 'utf8');
      const json = /<script type="application\/json" id="scene-manifest">(.*?)<\/script>/s.exec(
        html,
      )?.[1];
      expect(json, page).toBeDefined();
      const keys = (JSON.parse(json!) as { key: string }[]).map((i) => i.key);
      expect(keys).toContain('project/alpha');
      expect(keys).toContain('project/beta');
      expect(keys.some((k) => k.includes('gamma-draft'))).toBe(false);
    }
  });
});
