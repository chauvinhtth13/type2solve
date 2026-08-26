import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { renderHtml } from '../../scripts/lib/html.mjs';
import { projectRoot } from '../../scripts/project.mjs';

const fixtureRoot = resolve(projectRoot, 'tests/fixtures/html');
const rendered = await renderHtml(resolve(fixtureRoot, 'index.html'), { rootDir: fixtureRoot });

assert.match(rendered, /<main>[\s\S]*<section>[\s\S]*<p>Đã ghép<\/p>/);
assert.doesNotMatch(rendered, /@include/);

await assert.rejects(
  renderHtml(resolve(fixtureRoot, 'cycle-a.html'), { rootDir: fixtureRoot }),
  /vòng lặp HTML include/,
);
await assert.rejects(
  renderHtml(resolve(fixtureRoot, 'escape.html'), { rootDir: fixtureRoot }),
  /ngoài HTML root/,
);

console.log('✓ HTML assembler: nested include, cycle detection and root boundary');
