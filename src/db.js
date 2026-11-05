// src/db.js — Persistent SQLite Database Engine for Users, Sessions, and Analytics
// Supports Google OAuth 2.0 and Local Email/Password authentication with strict password criteria.

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'plans.db');
const USERS_BACKUP = path.join(DATA_DIR, 'users.json');

let db = null;

function getDb() {
  if (db) return db;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  db = new DatabaseSync(DB_PATH);

  // Initialize schemas
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      name TEXT,
      given_name TEXT,
      password_hash TEXT,
      password_salt TEXT,
      picture TEXT,
      auth_provider TEXT,
      role TEXT DEFAULT 'user',
      created_at TEXT,
      last_login TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      session_id TEXT PRIMARY KEY,
      user_id TEXT,
      email TEXT,
      name TEXT,
      given_name TEXT,
      picture TEXT,
      auth_provider TEXT,
      csrf_token TEXT,
      created_at TEXT,
      expires_at TEXT
    );

    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT,
      path TEXT,
      user_id TEXT,
      user_email TEXT,
      ip TEXT,
      user_agent TEXT,
      created_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at);
  `);

  // Migrate legacy users.json if present
  try {
    if (fs.existsSync(USERS_BACKUP)) {
      const data = JSON.parse(fs.readFileSync(USERS_BACKUP, 'utf8'));
      const insertStmt = db.prepare(`
        INSERT OR IGNORE INTO users (id, email, name, given_name, picture, auth_provider, created_at, last_login)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const [uid, u] of Object.entries(data)) {
        insertStmt.run(
          uid,
          (u.email || '').toLowerCase(),
          u.name || 'User',
          u.given_name || 'User',
          u.picture || '',
          'google',
          u.created_at || new Date().toISOString(),
          u.last_login || new Date().toISOString()
        );
      }
    }
  } catch (err) {
    console.warn('[Db] Note on legacy users migration:', err.message);
  }

  return db;
}

// =============================================================================
// PASSWORD STRENGTH VALIDATION & CRYPTOGRAPHIC HASHING
// =============================================================================

/**
 * Validates password meets strict requirements:
 * - At least 8 characters
 * - At least one capital letter (A-Z)
 * - At least one small letter (a-z)
 * - At least two numbers (0-9)
 * - At least one special character (!@#$%^&* etc.)
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Password is required.'] };
  }

  const errors = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one capital letter (A-Z).');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one small letter (a-z).');
  }
  const digitCount = (password.match(/\d/g) || []).length;
  if (digitCount < 2) {
    errors.push('Password must contain at least two numbers (0-9).');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
    errors.push('Password must contain at least one special character (e.g. !@#$%^&*).');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password, storedHash, salt) {
  try {
    const computedHash = hashPassword(password, salt);
    const bufA = Buffer.from(computedHash, 'hex');
    const bufB = Buffer.from(storedHash, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

// =============================================================================
// USER OPERATIONS
// =============================================================================

function getUserById(id) {
  const database = getDb();
  const stmt = database.prepare('SELECT id, email, name, given_name, picture, auth_provider, role, created_at, last_login FROM users WHERE id = ?');
  return stmt.get(id);
}

function getUserByEmail(email) {
  if (!email) return null;
  const database = getDb();
  const stmt = database.prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email.toLowerCase().trim());
}

function upsertGoogleUser({ id, email, name, given_name, picture }) {
  const database = getDb();
  const normalizedEmail = (email || '').toLowerCase().trim();
  const now = new Date().toISOString();

  // Check if exists by id or email
  let existing = database.prepare('SELECT * FROM users WHERE id = ? OR email = ?').get(id, normalizedEmail);

  if (existing) {
    const updateStmt = database.prepare(`
      UPDATE users SET
        name = COALESCE(?, name),
        given_name = COALESCE(?, given_name),
        picture = COALESCE(?, picture),
        last_login = ?
      WHERE id = ?
    `);
    updateStmt.run(name || null, given_name || null, picture || null, now, existing.id);
    return getUserById(existing.id);
  }

  const insertStmt = database.prepare(`
    INSERT INTO users (id, email, name, given_name, picture, auth_provider, role, created_at, last_login)
    VALUES (?, ?, ?, ?, ?, 'google', 'user', ?, ?)
  `);
  insertStmt.run(
    id,
    normalizedEmail,
    name || normalizedEmail.split('@')[0],
    given_name || 'Architect',
    picture || '',
    now,
    now
  );
  return getUserById(id);
}

function registerLocalUser({ email, password, name }) {
  const database = getDb();
  const normalizedEmail = (email || '').toLowerCase().trim();

  // Email validation (accepts valid emails, including gmail.com)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    throw new Error('Please enter a valid email address (e.g. architect@gmail.com).');
  }

  const validation = validatePassword(password);
  if (!validation.valid) {
    throw new Error(validation.errors.join(' '));
  }

  const existing = getUserByEmail(normalizedEmail);
  if (existing) {
    throw new Error('An account with this email already exists. Please sign in instead.');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const id = 'usr_' + crypto.randomBytes(8).toString('hex');
  const now = new Date().toISOString();
  const displayName = name && name.trim() ? name.trim() : normalizedEmail.split('@')[0];
  const givenName = displayName.split(' ')[0];

  const insertStmt = database.prepare(`
    INSERT INTO users (id, email, name, given_name, password_hash, password_salt, picture, auth_provider, role, created_at, last_login)
    VALUES (?, ?, ?, ?, ?, ?, '', 'local', 'user', ?, ?)
  `);
  insertStmt.run(id, normalizedEmail, displayName, givenName, passwordHash, salt, now, now);

  return getUserById(id);
}

function verifyLocalUser(email, password) {
  const normalizedEmail = (email || '').toLowerCase().trim();
  const user = getUserByEmail(normalizedEmail);
  if (!user) {
    return { success: false, error: 'No account found with this email. Please sign up.' };
  }
  if (!user.password_hash || !user.password_salt) {
    return { success: false, error: 'This account was created via Google Sign-In. Please sign in with Google.' };
  }

  const ok = verifyPassword(password, user.password_hash, user.password_salt);
  if (!ok) {
    return { success: false, error: 'Invalid password. Please check your credentials.' };
  }

  // Update last login
  const now = new Date().toISOString();
  getDb().prepare('UPDATE users SET last_login = ? WHERE id = ?').run(now, user.id);

  return {
    success: true,
    user: getUserById(user.id)
  };
}

// =============================================================================
// SESSION MANAGEMENT (Stored in SQLite)
// =============================================================================

function createSession(user) {
  const database = getDb();
  const sessionId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(32).toString('hex');
  const csrfToken = crypto.randomBytes(16).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const insertStmt = database.prepare(`
    INSERT INTO sessions (session_id, user_id, email, name, given_name, picture, auth_provider, csrf_token, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertStmt.run(
    sessionId,
    user.id,
    user.email,
    user.name,
    user.given_name,
    user.picture || '',
    user.auth_provider || 'local',
    csrfToken,
    now.toISOString(),
    expiresAt.toISOString()
  );

  return {
    sessionId,
    csrfToken,
    expiresAt: expiresAt.toISOString()
  };
}

function getSession(sessionId) {
  if (!sessionId) return null;
  const database = getDb();
  const stmt = database.prepare('SELECT * FROM sessions WHERE session_id = ?');
  const sess = stmt.get(sessionId);
  if (!sess) return null;

  if (new Date(sess.expires_at) < new Date()) {
    deleteSession(sessionId);
    return null;
  }
  return sess;
}

function deleteSession(sessionId) {
  if (!sessionId) return;
  getDb().prepare('DELETE FROM sessions WHERE session_id = ?').run(sessionId);
}

function purgeExpiredSessions() {
  const now = new Date().toISOString();
  getDb().prepare('DELETE FROM sessions WHERE expires_at < ?').run(now);
}

function getActiveSessions() {
  purgeExpiredSessions();
  const database = getDb();
  const stmt = database.prepare(`
    SELECT 
      s.session_id,
      s.user_id,
      s.email,
      s.name,
      s.picture,
      s.auth_provider,
      s.created_at as session_start,
      s.expires_at,
      u.last_login
    FROM sessions s
    LEFT JOIN users u ON s.user_id = u.id
    ORDER BY s.created_at DESC
  `);
  return stmt.all();
}

// =============================================================================
// ANALYTICS & TELEMETRY ENGINE
// =============================================================================

function logEvent({ event_type, path, user_id, user_email, ip, user_agent }) {
  try {
    const database = getDb();
    const now = new Date().toISOString();
    const stmt = database.prepare(`
      INSERT INTO analytics_events (event_type, path, user_id, user_email, ip, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      event_type || 'view',
      path || '/',
      user_id || null,
      user_email || null,
      ip || '127.0.0.1',
      (user_agent || '').slice(0, 255),
      now
    );
  } catch (err) {
    console.warn('[Analytics] Log event failed:', err.message);
  }
}

function getAnalyticsSummary() {
  const database = getDb();
  purgeExpiredSessions();

  // Total views
  const totalViewsStmt = database.prepare("SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'view'");
  const totalViews = totalViewsStmt.get().count;

  // Views breakdown by top paths
  const viewsByPathStmt = database.prepare(`
    SELECT path, COUNT(*) as count 
    FROM analytics_events 
    WHERE event_type = 'view' 
    GROUP BY path 
    ORDER BY count DESC 
    LIMIT 10
  `);
  const viewsByPath = viewsByPathStmt.all();

  // Total visits (distinct sessions / visitor IPs)
  const totalVisitsStmt = database.prepare("SELECT COUNT(DISTINCT COALESCE(user_id, ip)) as count FROM analytics_events WHERE event_type IN ('visit', 'view')");
  const totalVisits = totalVisitsStmt.get().count;

  // Total logins
  const totalLoginsStmt = database.prepare("SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'login'");
  const totalLogins = totalLoginsStmt.get().count;

  // Total signups
  const totalSignupsStmt = database.prepare("SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'signup'");
  const totalSignups = totalSignupsStmt.get().count;

  // Total registered users
  const totalUsersStmt = database.prepare("SELECT COUNT(*) as count FROM users");
  const totalUsers = totalUsersStmt.get().count;

  // Active sessions / who is logged in
  const activeSessions = getActiveSessions();

  // Recent activity stream (last 40 events)
  const recentEventsStmt = database.prepare(`
    SELECT id, event_type, path, user_email, ip, user_agent, created_at 
    FROM analytics_events 
    ORDER BY id DESC 
    LIMIT 40
  `);
  const recentEvents = recentEventsStmt.all();

  return {
    totalViews,
    viewsByPath,
    totalVisits: Math.max(totalVisits, 1),
    totalLogins,
    totalSignups,
    totalUsers,
    activeSessionsCount: activeSessions.length,
    activeSessions,
    recentEvents
  };
}

module.exports = {
  getDb,
  validatePassword,
  hashPassword,
  verifyPassword,
  getUserById,
  getUserByEmail,
  upsertGoogleUser,
  registerLocalUser,
  verifyLocalUser,
  createSession,
  getSession,
  deleteSession,
  purgeExpiredSessions,
  getActiveSessions,
  logEvent,
  getAnalyticsSummary
};

