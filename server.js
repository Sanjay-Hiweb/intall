// server.js — High-Performance Zero-Dependency Architectural Backend Server
// Supports native static asset serving, SQLite plan storage, BOM cost takeoff, and municipal bylaws audit.

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const url = require('node:url');

const { savePlan, getPlan, listRecentPlans } = require('./src/planStorage.js');
const { calculateBOM } = require('./src/bomEngine.js');
const { auditCompliance } = require('./src/auditEngine.js');

const PORT = process.env.PORT || 8000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.dxf': 'application/dxf',
  '.txt': 'text/plain; charset=utf-8'
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data, null, 2));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 5 * 1024 * 1024) { // 5MB cap
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  // --- REST API ROUTES ---
  if (pathname.startsWith('/api/')) {
    try {
      // 1. Health check
      if (pathname === '/api/health' && method === 'GET') {
        return sendJson(res, 200, {
          status: 'ok',
          server: 'Aether Architectural Studio API',
          version: '1.0.0',
          uptime: +(process.uptime()).toFixed(1)
        });
      }

      // 2. Save Plan (POST /api/plans)
      if (pathname === '/api/plans' && method === 'POST') {
        const body = await parseJsonBody(req);
        if (!body || !body.rooms) {
          return sendJson(res, 400, { error: 'Invalid plan data: rooms array required.' });
        }
        const result = savePlan(body);
        return sendJson(res, 200, { success: true, plan: result });
      }

      // 3. Get Plan by ID (GET /api/plans/:id)
      if (pathname.startsWith('/api/plans/') && method === 'GET') {
        const id = pathname.replace('/api/plans/', '').trim();
        const plan = getPlan(id);
        if (!plan) {
          return sendJson(res, 404, { error: `Plan with ID '${id}' not found.` });
        }
        return sendJson(res, 200, { success: true, plan: plan });
      }

      // 4. List Recent Plans (GET /api/plans)
      if (pathname === '/api/plans' && method === 'GET') {
        const limit = parseInt(parsedUrl.query.limit, 10) || 12;
        const plans = listRecentPlans(limit);
        return sendJson(res, 200, { success: true, count: plans.length, plans: plans });
      }

      // 5. Calculate BOM & Construction Cost Takeoff (POST /api/estimate)
      if (pathname === '/api/estimate' && method === 'POST') {
        const body = await parseJsonBody(req);
        const rooms = body.rooms || [];
        const plot = body.plot || { width: 35, length: 45 };
        const bom = calculateBOM(rooms, plot);
        return sendJson(res, 200, bom);
      }

      // 6. Municipal Building Code Audit (POST /api/audit)
      if (pathname === '/api/audit' && method === 'POST') {
        const body = await parseJsonBody(req);
        const rooms = body.rooms || [];
        const plot = body.plot || { width: 35, length: 45 };
        const audit = auditCompliance(rooms, plot);
        return sendJson(res, 200, audit);
      }

      // 7. Get Master Templates Catalogue (GET /api/templates)
      if (pathname === '/api/templates' && method === 'GET') {
        try {
          const templatesFile = path.join(PUBLIC_DIR, 'templates.js');
          const content = fs.readFileSync(templatesFile, 'utf8');
          // Extract JSON array from TEMPLATES = [...]
          const match = content.match(/const\s+TEMPLATES\s*=\s*(\[[\s\S]*?\]);/);
          if (match) {
            const templates = JSON.parse(match[1]);
            return sendJson(res, 200, { success: true, count: templates.length, templates });
          }
        } catch (e) {
          return sendJson(res, 500, { error: 'Failed loading templates catalogue', details: e.message });
        }
      }

      return sendJson(res, 404, { error: `Endpoint not found: ${method} ${pathname}` });
    } catch (err) {
      console.error('API Error:', err);
      return sendJson(res, 500, { error: 'Internal Server Error', message: err.message });
    }
  }

  // --- STATIC FILE SERVING ---
  let filePath = pathname === '/' ? path.join(PUBLIC_DIR, 'home.html') : path.join(PUBLIC_DIR, pathname);

  // Normalize path to prevent directory traversal
  filePath = path.normalize(filePath);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Access Denied');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // 404 Fallback
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>404 Not Found</title></head>
        <body style="font-family: sans-serif; padding: 40px; text-align: center;">
          <h2>404 — Page or Asset Not Found</h2>
          <p><a href="/home.html">Return to Home</a> · <a href="/index.html">Open Design Studio</a></p>
        </body>
        </html>
      `);
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🏛️  AETHER ARCHITECTURAL STUDIO BACKEND ACTIVE`);
  console.log(`📡  Server URL: http://localhost:${PORT}`);
  console.log(`🏠  Landing Page: http://localhost:${PORT}/home.html`);
  console.log(`📐  Design Studio: http://localhost:${PORT}/index.html`);
  console.log(`⚡  API Health: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});
