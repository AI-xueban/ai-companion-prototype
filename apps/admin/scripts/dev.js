const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');
const publicDir = path.resolve(__dirname, '../prototype');
const mimeTypes = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.zip': 'application/zip' };

const store = process.env.QUESTION_FEEDBACK_STORE || path.join(__dirname, '../question-feedback.local');
const reports = new Map();
try {
  for (const report of JSON.parse(fs.readFileSync(store, 'utf8'))) reports.set(report.id, report);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const port = Number(process.env.PORT || 8080);
const endpoint = '/api/question-feedback';

function reply(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(payload));
}

http.createServer(async (req, res) => {
  if (req.url !== endpoint) {
    if (req.method !== 'GET' && req.method !== 'HEAD') return reply(res, 405, { error: 'Method not allowed' });
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const file = path.resolve(publicDir, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!file.startsWith(publicDir + path.sep)) return reply(res, 404, { error: 'Not found' });
      const info = await fs.promises.stat(file);
      if (!info.isFile()) return reply(res, 404, { error: 'Not found' });
      res.writeHead(200, { 'Content-Type': mimeTypes[path.extname(file)] || 'application/octet-stream' });
      if (req.method === 'HEAD') return res.end();
      fs.createReadStream(file).on('error', () => res.destroy()).pipe(res);
      return;
    } catch {
      return reply(res, 404, { error: 'Not found' });
    }
  }
  const origin = req.headers.origin;
  if (origin && !/^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/.test(origin)) {
    return reply(res, 403, { error: 'Local preview only' });
  }
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }).end();
    return;
  }
  if (req.method === 'GET') {
    if (origin && origin !== 'http://' + req.headers.host) return reply(res, 403, { error: 'Admin preview only' });
    return reply(res, 200, [...reports.values()].reverse());
  }
  if (req.method !== 'POST') return reply(res, 405, { error: 'Method not allowed' });
  if (req.headers['content-type'] !== 'application/json') return reply(res, 415, { error: 'JSON required' });

  try {
    let body = '';
    for await (const chunk of req) {
      body += chunk;
      if (Buffer.byteLength(body) > 2_000_000) return reply(res, 413, { error: 'Feedback too large' });
    }
    const report = JSON.parse(body);
    if (!report || typeof report.id !== 'string' || typeof report.questionId !== 'string' ||
        typeof report.reasonLabel !== 'string' || !report.questionSnapshot || !report.practiceRequest) {
      return reply(res, 400, { error: 'Invalid feedback' });
    }
    if (!reports.has(report.id)) {
      try {
        fs.writeFileSync(store + '.tmp.local', JSON.stringify([...reports.values(), report]));
        fs.renameSync(store + '.tmp.local', store);
        reports.set(report.id, report);
      } catch {
        return reply(res, 500, { error: 'Unable to save feedback' });
      }
    }
    return reply(res, 200, { id: report.id });
  } catch {
    return reply(res, 400, { error: 'Invalid feedback' });
  }
}).listen(port, '127.0.0.1', () => console.log('Admin preview http://127.0.0.1:' + port));
