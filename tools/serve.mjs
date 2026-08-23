import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = process.env.DTTD_ROOT
  ? resolve(process.env.DTTD_ROOT)
  : resolve(dirname(fileURLToPath(import.meta.url)), '..');
const requestedPort = Number(process.env.DTTD_PORT);
const port = Number.isInteger(requestedPort) && requestedPort > 0 ? requestedPort : 4173;
const host = '127.0.0.1';
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
};

function insideProject(candidate) {
  const pathFromRoot = relative(projectRoot, candidate);
  return pathFromRoot === '' || (!pathFromRoot.startsWith('..') && !isAbsolute(pathFromRoot));
}

function reply(response, status, message) {
  response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end(message);
}

const server = createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method || 'GET')) {
    reply(response, 405, 'Method not allowed');
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname);
  } catch (error) {
    reply(response, 400, 'Bad request');
    return;
  }

  let filePath = resolve(projectRoot, `.${pathname}`);
  if (!insideProject(filePath)) {
    reply(response, 403, 'Forbidden');
    return;
  }

  try {
    const information = await stat(filePath);
    if (information.isDirectory()) filePath = resolve(filePath, 'index.html');
    const fileInformation = await stat(filePath);
    if (!fileInformation.isFile() || !insideProject(filePath)) throw new Error('Not a file');
  } catch (error) {
    reply(response, 404, 'Not found');
    return;
  }

  response.writeHead(200, {
    'Cache-Control': 'no-cache',
    'Content-Length': String((await stat(filePath)).size),
    'Content-Type': mimeTypes[extname(filePath).toLowerCase()] || 'application/octet-stream',
  });
  if (request.method === 'HEAD') {
    response.end();
    return;
  }
  createReadStream(filePath).on('error', () => response.destroy()).pipe(response);
});

server.listen(port, host, () => {
  console.log(`Đấu Trường Tư Duy: http://${host}:${port}`);
  console.log('Nhấn Ctrl+C để dừng máy chủ.');
});
