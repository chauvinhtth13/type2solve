import { readFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';

const INCLUDE_PATTERN = /^[\t ]*<!--\s*@include\s+([^\s]+)\s*-->[\t ]*$/gm;

function inside(rootDir, candidate) {
  const fromRoot = relative(rootDir, candidate);
  return fromRoot === '' || (!fromRoot.startsWith('..') && !isAbsolute(fromRoot));
}

function displayPath(rootDir, filePath) {
  return relative(rootDir, filePath).replaceAll('\\', '/') || '.';
}

async function renderFile(filePath, rootDir, stack) {
  const absolutePath = resolve(filePath);
  if (!inside(rootDir, absolutePath)) {
    throw new Error(`Include nằm ngoài HTML root: ${absolutePath}`);
  }
  if (stack.includes(absolutePath)) {
    const cycle = [...stack, absolutePath]
      .map((entry) => displayPath(rootDir, entry))
      .join(' -> ');
    throw new Error(`Phát hiện vòng lặp HTML include: ${cycle}`);
  }

  const source = (await readFile(absolutePath, 'utf8')).replace(/^\uFEFF/, '');
  const nextStack = [...stack, absolutePath];
  let rendered = '';
  let cursor = 0;

  for (const match of source.matchAll(INCLUDE_PATTERN)) {
    rendered += source.slice(cursor, match.index);
    const includePath = resolve(dirname(absolutePath), match[1]);
    if (!inside(rootDir, includePath)) {
      throw new Error(
        `${displayPath(rootDir, absolutePath)} include ra ngoài HTML root: ${match[1]}`,
      );
    }
    rendered += await renderFile(includePath, rootDir, nextStack);
    cursor = match.index + match[0].length;
  }

  return rendered + source.slice(cursor);
}

export async function renderHtml(entryFile, options = {}) {
  const absoluteEntry = resolve(entryFile);
  const rootDir = resolve(options.rootDir || dirname(absoluteEntry));
  if (!inside(rootDir, absoluteEntry)) {
    throw new Error(`HTML entry nằm ngoài HTML root: ${absoluteEntry}`);
  }
  return renderFile(absoluteEntry, rootDir, []);
}
