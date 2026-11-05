// server.js — High-Performance Zero-Dependency Architectural Backend Server
// Supports native static asset serving, SQLite plan storage, BOM cost takeoff, municipal bylaws audit,
// and Google Identity Services OAuth 2.0 authentication with route protection and session management.

const http = require('node:http');
const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');
const url = require('node:url');
const crypto = require('node:crypto');

// Zero-dependency .env loader
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    try {
      const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const match = trimmed.match(/^([\w.-]+)\s*=\s*(.*)?$/);
        if (match && !process.env[match[1]]) {
          let value = match[2] || '';
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          process.env[match[1]] = value.trim();
        }
      }
    } catch (e) {
      console.warn('[Env] Could not read .env:', e.message);
    }
  }
}
loadEnv();

const { savePlan, getPlan, listRecentPlans } = require('./src/planStorage.js');
const { calculateBOM } = require('./src/bomEngine.js');
const { auditCompliance } = require('./src/auditEngine.js');

const PORT = parseInt(process.env.PORT, 10) || 8000;
const PUBLIC_DIR = __dirname;
const IS_PROD = process.env.NODE_ENV === 'production';

// Google OAuth 2.0 Credentials
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '630501607187-b0ridp4q7a5u5i7291q7u8peif7ujq5f.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `http://localhost:${PORT}/auth/google/callback`;

// Allowed redirect targets to strictly prevent open redirect vulnerabilities
const ALLOWED_REDIRECT_PATHS = [
  '/',
  '/index.html',
  '/home.html',
  '/signin',
  '/signin.html',
  '/terms.html',
  '/privacy.html'
];

function validateRedirectTarget(rawNext) {
  if (!rawNext || typeof rawNext !== 'string') return '/index.html';
  // Must begin with a single '/', cannot start with '//' or '/\'
  if (!rawNext.startsWith('/') || rawNext.startsWith('//') || rawNext.startsWith('/\\')) {
    return '/index.html';
  }
  const cleanPath = rawNext.split('?')[0].split('#')[0];
  if (ALLOWED_REDIRECT_PATHS.includes(cleanPath)) {
    return rawNext;
  }
  return '/index.html';
}

// =============================================================================
// USER & SESSION PERSISTENCE (Compliant with privacy: stores minimal fields)
// =============================================================================
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

const users = new Map();
const sessions = new Map();

function loadStorage() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(USERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      for (const [uid, user] of Object.entries(data)) {
        users.set(uid, user);
      }
    }
  } catch (err) {
    console.warn('[Storage] Could not read users:', err.message);
  }

  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
      for (const [sid, sess] of Object.entries(data)) {
        // Purge expired sessions
        if (sess.expiresAt && new Date(sess.expiresAt) < new Date()) continue;
        sessions.set(sid, sess);
      }
    }
  } catch (err) {
    console.warn('[Storage] Could not read sessions:', err.message);
  }
}

function persistUsers() {
  try {
    const data = Object.fromEntries(users.entries());
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.warn('[Storage] Could not persist users:', err.message);
  }
}

function persistSessions() {
  try {
    const data = Object.fromEntries(sessions.entries());
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.warn('[Storage] Could not persist sessions:', err.message);
  }
}

loadStorage();

function upsertUser({ id, email, name, given_name, picture }) {
  const now = new Date().toISOString();
  let user = users.get(id);
  if (!user) {
    user = {
      id,
      email: email.toLowerCase(),
      name: name || email.split('@')[0],
      given_name: given_name || (name ? name.split(' ')[0] : 'Architect'),
      picture: picture || '',
      created_at: now,
      last_login: now
    };
    users.set(id, user);
    console.log(`[Auth] Registered new architect: ${user.name} <${user.email}>`);
  } else {
    user.last_login = now;
    if (name) user.name = name;
    if (given_name) user.given_name = given_name;
    if (picture) user.picture = picture;
    users.set(id, user);
    console.log(`[Auth] Returning architect signed in: ${user.name} <${user.email}>`);
  }
  persistUsers();
  return user;
}

function createSession(user) {
  const sessionId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(32).toString('hex');
  const csrfToken = crypto.randomBytes(16).toString('hex');
  const sessionData = {
    userId: user.id,
    email: user.email,
    name: user.name,
    given_name: user.given_name,
    picture: user.picture,
    csrfToken,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  };
  sessions.set(sessionId, sessionData);
  persistSessions();
  return { sessionId, csrfToken };
}

// =============================================================================
// RATE LIMITING (Prevents brute force on auth endpoints: max 30 req/min per IP)
// =============================================================================
const rateLimitMap = new Map();

function checkRateLimit(req, limit = 30, windowMs = 60000) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();
  let timestamps = rateLimitMap.get(ip) || [];
  timestamps = timestamps.filter(t => now - t < windowMs);
  if (timestamps.length >= limit) {
    return false;
  }
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return true;
}

// =============================================================================
// MIME TYPES & HELPERS
// =============================================================================
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
    'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-Token'
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

function parseCookies(req) {
  const list = {};
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach(cookie => {
    let [name, ...rest] = cookie.split('=');
    name = name?.trim();
    if (!name) return;
    const value = rest.join('=').trim();
    list[name] = decodeURIComponent(value);
  });
  return list;
}

function getSession(req) {
  const cookies = parseCookies(req);
  const token = cookies.intall_session;
  if (!token) return null;
  const sess = sessions.get(token);
  if (!sess) return null;
  if (sess.expiresAt && new Date(sess.expiresAt) < new Date()) {
    sessions.delete(token);
    persistSessions();
    return null;
  }
  return { token, ...sess };
}

function getSessionUser(req) {
  const sess = getSession(req);
  if (!sess) return null;
  return {
    id: sess.userId,
    email: sess.email,
    name: sess.name,
    given_name: sess.given_name,
    picture: sess.picture,
    csrfToken: sess.csrfToken
  };
}

function makeSessionCookie(sessionId, isSecure) {
  return `intall_session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${isSecure ? '; Secure' : ''}`;
}

function makeLogoutCookie() {
  return 'intall_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

function httpsPostForm(urlString, postData) {
  return new Promise((resolve, reject) => {
    const target = new URL(urlString);
    const body = new URLSearchParams(postData).toString();
    const req = https.request(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
        'Accept': 'application/json',
        'User-Agent': 'INTALL-Studio-OAuth'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function httpsGetJson(urlString, headers = {}) {
  return new Promise((resolve, reject) => {
    const target = new URL(urlString);
    const req = https.request(target, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'INTALL-Studio-OAuth',
        ...headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// =============================================================================
// HTTP REQUEST ROUTER & MIDDLEWARE
// =============================================================================
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();
  const isSecure = IS_PROD || req.headers['x-forwarded-proto'] === 'https';

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-Token'
    });
    return res.end();
  }

  // ===========================================================================
  // 1. CLEAN URL SHORTCUTS & ROUTE ALIASES
  // ===========================================================================
  if (pathname === '/signin' || pathname === '/login') {
    // If user is already authenticated, skip sign-in screen and send straight to app
    const user = getSessionUser(req);
    if (user && method === 'GET') {
      const target = validateRedirectTarget(parsedUrl.query.next);
      res.writeHead(302, { 'Location': target });
      return res.end();
    }
    // Otherwise serve signin.html
    return serveStaticFile(path.join(PUBLIC_DIR, 'signin.html'), res);
  }

  if (pathname === '/terms') {
    return serveStaticFile(path.join(PUBLIC_DIR, 'terms.html'), res);
  }

  if (pathname === '/privacy') {
    return serveStaticFile(path.join(PUBLIC_DIR, 'privacy.html'), res);
  }

  // ===========================================================================
  // 2. ROUTE PROTECTION MIDDLEWARE
  //    The 2D/3D studio (/index.html) requires Google authentication.
  //    Unauthenticated users are safely redirected to /signin?next=/index.html.
  // ===========================================================================
  if (pathname === '/index.html') {
    const user = getSessionUser(req);
    if (!user) {
      console.log(`[Middleware] Protected route /index.html accessed without session. Redirecting to /signin.`);
      res.writeHead(302, { 'Location': '/signin?next=/index.html' });
      return res.end();
    }
  }

  // ===========================================================================
  // 3. GOOGLE IDENTITY SERVICES & OAUTH ENDPOINTS
  // ===========================================================================

  // (A) Verify Google Identity Services ID Token on Server (POST /api/auth/google/verify)
  if (pathname === '/api/auth/google/verify' && method === 'POST') {
    if (!checkRateLimit(req)) {
      return sendJson(res, 429, { error: 'Too many authentication attempts. Please slow down.' });
    }

    try {
      const body = await parseJsonBody(req);
      const credential = body.credential;
      if (!credential || typeof credential !== 'string') {
        return sendJson(res, 400, { error: 'Missing Google ID token credential.' });
      }

      // Verify ID token with Google's public token verification API
      const tokenInfoUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
      const tokenInfo = await httpsGetJson(tokenInfoUrl);

      if (!tokenInfo || tokenInfo.error || !tokenInfo.sub) {
        console.error('[GSI] Token verification failed:', tokenInfo?.error_description || tokenInfo?.error);
        return sendJson(res, 401, { error: 'Invalid Google credentials or token expired.' });
      }

      // 1. Verify Audience (MUST match our GOOGLE_CLIENT_ID)
      if (tokenInfo.aud !== GOOGLE_CLIENT_ID) {
        console.error(`[GSI] Audience mismatch: expected ${GOOGLE_CLIENT_ID}, received ${tokenInfo.aud}`);
        return sendJson(res, 401, { error: 'Token audience does not match INTALL application.' });
      }

      // 2. Verify Issuer
      if (tokenInfo.iss !== 'accounts.google.com' && tokenInfo.iss !== 'https://accounts.google.com') {
        console.error(`[GSI] Untrusted issuer: ${tokenInfo.iss}`);
        return sendJson(res, 401, { error: 'Untrusted token issuer.' });
      }

      // 3. Verify Expiry
      const nowSec = Math.floor(Date.now() / 1000);
      if (Number(tokenInfo.exp) < nowSec) {
        return sendJson(res, 401, { error: 'Google ID token has expired.' });
      }

      // Upsert minimal user record
      const user = upsertUser({
        id: tokenInfo.sub,
        email: tokenInfo.email,
        name: tokenInfo.name,
        given_name: tokenInfo.given_name,
        picture: tokenInfo.picture
      });

      // Issue session cookie
      const { sessionId, csrfToken } = createSession(user);
      const safeRedirect = validateRedirectTarget(body.next);

      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Set-Cookie': makeSessionCookie(sessionId, isSecure)
      });

      return res.end(JSON.stringify({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          given_name: user.given_name,
          picture: user.picture
        },
        csrfToken,
        redirect: safeRedirect
      }, null, 2));

    } catch (err) {
      console.error('[GSI] Error in verify endpoint:', err);
      return sendJson(res, 500, { error: 'Internal verification failure', message: err.message });
    }
  }

  // (B1) Development Demo Sign-In (Active only in non-production for local testing)
  if (!IS_PROD && pathname === '/auth/dev-login' && method === 'GET') {
    const rawReturn = parsedUrl.query.returnTo || parsedUrl.query.next || '/index.html';
    const returnTo = validateRedirectTarget(rawReturn);
    const devUser = upsertUser({
      id: 'demo-architect-id',
      email: 'architect@intall.in',
      name: 'Studio Architect',
      given_name: 'Architect',
      picture: ''
    });
    const { sessionId } = createSession(devUser);
    res.writeHead(302, {
      'Location': returnTo,
      'Set-Cookie': makeSessionCookie(sessionId, isSecure)
    });
    return res.end();
  }

  // (B2) Traditional OAuth2 Redirect Initiator (GET /auth/google)
  if (pathname === '/auth/google' && method === 'GET') {
    if (!checkRateLimit(req)) {
      return sendJson(res, 429, { error: 'Too many authentication attempts. Please slow down.' });
    }

    const rawReturn = parsedUrl.query.returnTo || parsedUrl.query.next || '/index.html';
    const returnTo = validateRedirectTarget(rawReturn);

    const stateObj = {
      returnTo,
      nonce: crypto.randomBytes(8).toString('hex')
    };
    const state = Buffer.from(JSON.stringify(stateObj)).toString('base64url');

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'select_account');

    res.writeHead(302, { 'Location': authUrl.toString() });
    return res.end();
  }

  // (C) OAuth2 Callback Handler (GET /auth/google/callback)
  if (pathname === '/auth/google/callback' && method === 'GET') {
    let returnTo = '/index.html';
    if (parsedUrl.query.state) {
      try {
        const decoded = JSON.parse(Buffer.from(parsedUrl.query.state, 'base64url').toString('utf8'));
        if (decoded.returnTo) {
          returnTo = validateRedirectTarget(decoded.returnTo);
        }
      } catch {
        // use default
      }
    }

    if (parsedUrl.query.error) {
      console.error('[OAuth] Google returned error:', parsedUrl.query.error);
      const redirectUrl = `/signin?auth_error=${encodeURIComponent(parsedUrl.query.error)}&next=${encodeURIComponent(returnTo)}`;
      res.writeHead(302, { 'Location': redirectUrl });
      return res.end();
    }

    const code = parsedUrl.query.code;
    if (!code) {
      res.writeHead(302, { 'Location': `/signin?auth_error=No_code_provided&next=${encodeURIComponent(returnTo)}` });
      return res.end();
    }

    try {
      const tokenData = await httpsPostForm('https://oauth2.googleapis.com/token', {
        code: code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code'
      });

      if (!tokenData || tokenData.error || !tokenData.access_token) {
        console.error('[OAuth] Token exchange failed:', tokenData);
        const msg = tokenData?.error_description || tokenData?.error || 'Token_exchange_failed';
        res.writeHead(302, { 'Location': `/signin?auth_error=${encodeURIComponent(msg)}&next=${encodeURIComponent(returnTo)}` });
        return res.end();
      }

      const profile = await httpsGetJson('https://www.googleapis.com/oauth2/v2/userinfo', {
        'Authorization': `Bearer ${tokenData.access_token}`
      });

      if (!profile || !profile.email) {
        res.writeHead(302, { 'Location': `/signin?auth_error=Profile_fetch_failed&next=${encodeURIComponent(returnTo)}` });
        return res.end();
      }

      const user = upsertUser({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        given_name: profile.given_name,
        picture: profile.picture
      });

      const { sessionId } = createSession(user);

      res.writeHead(302, {
        'Location': returnTo,
        'Set-Cookie': makeSessionCookie(sessionId, isSecure)
      });
      return res.end();

    } catch (err) {
      console.error('[OAuth] Exception in callback:', err);
      res.writeHead(302, { 'Location': `/signin?auth_error=${encodeURIComponent(err.message)}&next=${encodeURIComponent(returnTo)}` });
      return res.end();
    }
  }

  // (D) Sign Out (GET /auth/logout or POST /api/auth/logout)
  if ((pathname === '/auth/logout' || pathname === '/api/auth/logout') && (method === 'GET' || method === 'POST')) {
    const cookies = parseCookies(req);
    if (cookies.intall_session) {
      sessions.delete(cookies.intall_session);
      persistSessions();
    }

    if (pathname.startsWith('/api/')) {
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Set-Cookie': makeLogoutCookie()
      });
      return res.end(JSON.stringify({ success: true, message: 'Logged out successfully' }));
    } else {
      const returnTo = validateRedirectTarget(parsedUrl.query.returnTo || '/home.html');
      res.writeHead(302, {
        'Location': returnTo,
        'Set-Cookie': makeLogoutCookie()
      });
      return res.end();
    }
  }

  // (E) Account Deletion Compliance Endpoint (POST /api/auth/delete-account)
  if (pathname === '/api/auth/delete-account' && method === 'POST') {
    const session = getSession(req);
    if (!session) {
      return sendJson(res, 401, { error: 'Authentication required for account deletion.' });
    }

    // CSRF Verification
    const clientCsrf = req.headers['x-csrf-token'];
    if (!clientCsrf || clientCsrf !== session.csrfToken) {
      return sendJson(res, 403, { error: 'Invalid or missing CSRF token.' });
    }

    const userId = session.userId;
    // 1. Remove user
    users.delete(userId);
    persistUsers();

    // 2. Remove all sessions for this user
    for (const [sid, sess] of sessions.entries()) {
      if (sess.userId === userId) {
        sessions.delete(sid);
      }
    }
    persistSessions();

    console.log(`[Privacy] User account ${userId} permanently purged.`);

    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Set-Cookie': makeLogoutCookie()
    });
    return res.end(JSON.stringify({
      success: true,
      message: 'Your account and all associated drawing authorizations have been permanently erased.'
    }));
  }

  // ===========================================================================
  // 4. REST API ROUTES
  // ===========================================================================
  if (pathname.startsWith('/api/')) {
    try {
      // Health check
      if (pathname === '/api/health' && method === 'GET') {
        return sendJson(res, 200, {
          status: 'ok',
          server: 'INTALL Architectural Studio API',
          version: '1.2.0',
          uptime: +(process.uptime()).toFixed(1)
        });
      }

      // Current User Profile (GET /api/auth/me)
      if (pathname === '/api/auth/me' && method === 'GET') {
        const user = getSessionUser(req);
        return sendJson(res, 200, {
          authenticated: Boolean(user),
          user: user || null
        });
      }

      // Public Client Config (GET /api/auth/config)
      if (pathname === '/api/auth/config' && method === 'GET') {
        return sendJson(res, 200, {
          clientId: GOOGLE_CLIENT_ID,
          redirectUri: GOOGLE_REDIRECT_URI
        });
      }

      // Save Plan (POST /api/plans)
      if (pathname === '/api/plans' && method === 'POST') {
        const body = await parseJsonBody(req);
        if (!body || !body.rooms) {
          return sendJson(res, 400, { error: 'Invalid plan data: rooms array required.' });
        }
        const user = getSessionUser(req);
        if (user && !body.user_email) {
          body.user_email = user.email;
          body.user_name = user.name;
        }
        const result = savePlan(body);
        return sendJson(res, 200, { success: true, plan: result });
      }

      // Get Plan by ID (GET /api/plans/:id)
      if (pathname.startsWith('/api/plans/') && method === 'GET') {
        const id = pathname.replace('/api/plans/', '').trim();
        const plan = getPlan(id);
        if (!plan) {
          return sendJson(res, 404, { error: `Plan with ID '${id}' not found.` });
        }
        return sendJson(res, 200, { success: true, plan: plan });
      }

      // List Recent Plans (GET /api/plans)
      if (pathname === '/api/plans' && method === 'GET') {
        const limit = parseInt(parsedUrl.query.limit, 10) || 12;
        const plans = listRecentPlans(limit);
        return sendJson(res, 200, { success: true, count: plans.length, plans: plans });
      }

      // Calculate BOM & Cost Takeoff (POST /api/estimate)
      if (pathname === '/api/estimate' && method === 'POST') {
        const body = await parseJsonBody(req);
        const rooms = body.rooms || [];
        const plot = body.plot || { width: 35, length: 45 };
        const bom = calculateBOM(rooms, plot);
        return sendJson(res, 200, bom);
      }

      // Municipal Building Code Audit (POST /api/audit)
      if (pathname === '/api/audit' && method === 'POST') {
        const body = await parseJsonBody(req);
        const rooms = body.rooms || [];
        const plot = body.plot || { width: 35, length: 45 };
        const audit = auditCompliance(rooms, plot);
        return sendJson(res, 200, audit);
      }

      // Master Templates Catalogue (GET /api/templates)
      if (pathname === '/api/templates' && method === 'GET') {
        try {
          const templatesFile = path.join(PUBLIC_DIR, 'templates.js');
          delete require.cache[require.resolve(templatesFile)];
          const { TEMPLATES: templates } = require(templatesFile);
          return sendJson(res, 200, { success: true, count: templates.length, templates });
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

  // ===========================================================================
  // 5. STATIC FILE SERVING
  // ===========================================================================
  let filePath = pathname === '/' ? path.join(PUBLIC_DIR, 'home.html') : path.join(PUBLIC_DIR, pathname);
  serveStaticFile(filePath, res);
});

function serveStaticFile(filePath, res) {
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
        <head><title>404 Not Found — INTALL</title></head>
        <body style="font-family: sans-serif; padding: 40px; text-align: center; background: #F5F2EA; color: #0E1A2B;">
          <h2>404 — Drawing Sheet or Asset Not Found</h2>
          <p><a href="/home.html">Return to Blueprint</a> · <a href="/signin">Sign In</a></p>
        </body>
        </html>
      `);
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
}

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🏛️  INTALL ARCHITECTURAL STUDIO BACKEND ACTIVE`);
  console.log(`📡  Server URL: http://localhost:${PORT}`);
  console.log(`🏠  Landing Page: http://localhost:${PORT}/home.html`);
  console.log(`🔐  Sign-In Page: http://localhost:${PORT}/signin`);
  console.log(`📐  Studio (Protected): http://localhost:${PORT}/index.html`);
  console.log(`⚡  API Health: http://localhost:${PORT}/api/health`);
  console.log(`🔑  Google OAuth Client ID: ${GOOGLE_CLIENT_ID.slice(0, 20)}...`);
  console.log(`🔗  Google OAuth Callback: ${GOOGLE_REDIRECT_URI}`);
  console.log(`=======================================================`);
});
