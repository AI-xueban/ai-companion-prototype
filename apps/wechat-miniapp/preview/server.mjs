import http from 'node:http';
import { networkInterfaces } from 'node:os';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const port = Number(process.env.PORT || 4177);
const root = fileURLToPath(new URL('.', import.meta.url));
const server = http.createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url || '/', 'http://localhost').pathname;
    const assetName = pathname === '/assets/role-selection-approved-role-copy.png'
      ? 'role-selection-approved-role-copy.png'
      : pathname === '/assets/role-selection-approved-description-short.png'
        ? 'role-selection-approved-description-short.png'
      : pathname === '/assets/role-selection-approved-title-smaller.png'
        ? 'role-selection-approved-title-smaller.png'
      : pathname === '/assets/role-selection-approved.png'
        ? 'role-selection-approved.png'
        : null;
    const file = assetName ? join(root, 'assets', assetName) : join(root, 'index.html');
    const content = await readFile(file);
    response.writeHead(200, { 'Content-Type': assetName ? 'image/png' : 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(content);
  } catch { response.writeHead(500); response.end('Preview unavailable'); }
});
server.listen(port, '0.0.0.0', () => {
  const addresses = Object.values(networkInterfaces()).flat().filter((item) => item?.family === 'IPv4' && !item.internal).map((item) => item.address);
  console.log(`Local preview: http://127.0.0.1:${port}`);
  addresses.forEach((address) => console.log(`LAN preview: http://${address}:${port}`));
});
