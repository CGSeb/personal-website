// Checks the external links of the content (projects' links, organization and institution URLs,
// profiles). Failures are warnings: a site that is down for a moment must not block a release.
// Usage: node scripts/check-links.mjs [content-dir]
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const root = process.argv[2] ?? process.env.CONTENT_DIR ?? 'content';
const TIMEOUT_MS = 10_000;

/** @type {{ url: string; where: string }[]} */
const links = [];
const add = (url, where) => url && links.push({ url, where });

const profile = parse(readFileSync(join(root, 'profile.yaml'), 'utf8'));
for (const [i, p] of (profile.profiles ?? []).entries())
  add(p.url, `profile.yaml : profiles[${i}]`);

for (const collection of ['projects', 'education', 'experience']) {
  const dir = join(root, collection);
  if (!existsSync(dir)) continue;
  for (const id of readdirSync(dir)) {
    const file = join(dir, id, 'meta.yaml');
    if (!existsSync(file)) continue;
    const data = parse(readFileSync(file, 'utf8'));
    const where = `${collection}/${id}/meta.yaml`;
    for (const [i, link] of (data.links ?? []).entries()) add(link.url, `${where} : links[${i}]`);
    add(data.organizationUrl, `${where} : organizationUrl`);
    add(data.institutionUrl, `${where} : institutionUrl`);
  }
}

async function check({ url, where }) {
  const attempt = async (method) => {
    const res = await fetch(url, {
      method,
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'user-agent': 'personal-website link check' },
    });
    return res.status;
  };
  try {
    let status = await attempt('HEAD');
    // Some servers refuse HEAD; ask again with GET before reporting.
    if (status >= 400) status = await attempt('GET');
    return status < 400 ? null : `${where} : ${url} — HTTP ${status}`;
  } catch (error) {
    return `${where} : ${url} — ${error.name === 'TimeoutError' ? 'pas de réponse' : error.message}`;
  }
}

const problems = (await Promise.all(links.map(check))).filter(Boolean);
if (problems.length) {
  console.warn(
    `⚠ ${problems.length} lien(s) externe(s) en échec sur ${links.length} :\n- ${problems.join('\n- ')}`,
  );
} else {
  console.log(`✓ ${links.length} lien(s) externe(s) répondent.`);
}
