// src/planStorage.js — Persistent Storage for Floor Plans & Versioned Revisions
// Uses Node 22 built-in node:sqlite with resilient JSON fallback.

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const dbPath = path.join(__dirname, '..', 'data', 'plans.db');
const jsonBackupPath = path.join(__dirname, '..', 'data', 'plans.json');

let db = null;
let useJsonStore = false;

// Initialize Storage Engine
function initStorage() {
  try {
    const { DatabaseSync } = require('node:sqlite');
    db = new DatabaseSync(dbPath);
    db.exec(`
      CREATE TABLE IF NOT EXISTS plans (
        id TEXT PRIMARY KEY,
        name TEXT,
        plot_width REAL,
        plot_length REAL,
        plot_unit TEXT,
        bhk INTEGER,
        arch_style TEXT,
        data_json TEXT,
        created_at TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS plan_revisions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plan_id TEXT,
        revision_num INTEGER,
        action TEXT,
        data_json TEXT,
        created_at TEXT
      );
    `);
    console.log('[Storage] SQLite Database initialized at:', dbPath);
  } catch (err) {
    console.warn('[Storage] Built-in SQLite unavailable, using JSON file store:', err.message);
    useJsonStore = true;
    if (!fs.existsSync(jsonBackupPath)) {
      fs.writeFileSync(jsonBackupPath, JSON.stringify({ plans: {}, revisions: [] }, null, 2));
    }
  }
}

// Generate short random slug for clean URLs e.g. "a9f3kq"
function generateShortId() {
  return crypto.randomBytes(4).toString('hex').slice(0, 7);
}

function readJsonStore() {
  try {
    const raw = fs.readFileSync(jsonBackupPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { plans: {}, revisions: [] };
  }
}

function writeJsonStore(data) {
  try {
    fs.writeFileSync(jsonBackupPath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Failed writing to plans.json:', e);
  }
}

/**
 * Saves a new plan or updates an existing plan with revision snapshot.
 * @param {Object} planData - Floor plan object
 * @returns {Object} Saved plan metadata and shareable ID
 */
function savePlan(planData) {
  if (!db && !useJsonStore) initStorage();

  const id = planData.id && typeof planData.id === 'string' && planData.id.length >= 5
    ? planData.id
    : generateShortId();

  const now = new Date().toISOString();
  const name = planData.name || 'Untitled Custom Residence';
  const plot = planData.plot || { width: 35, length: 45, unit: 'ft' };
  const pWidth = parseFloat(plot.width) || 35;
  const pLength = parseFloat(plot.length) || 45;
  const pUnit = plot.unit || 'ft';
  const bhk = parseInt(planData.bhk, 10) || 3;
  const archStyle = (planData.requirements && planData.requirements.archStyle) || 'minimalist';
  const dataJson = JSON.stringify(planData);

  if (!useJsonStore && db) {
    try {
      // Check if plan exists
      const checkStmt = db.prepare('SELECT id FROM plans WHERE id = ?');
      const existing = checkStmt.get(id);

      if (existing) {
        const updateStmt = db.prepare(`
          UPDATE plans SET
            name = ?, plot_width = ?, plot_length = ?, plot_unit = ?,
            bhk = ?, arch_style = ?, data_json = ?, updated_at = ?
          WHERE id = ?
        `);
        updateStmt.run(name, pWidth, pLength, pUnit, bhk, archStyle, dataJson, now, id);
      } else {
        const insertStmt = db.prepare(`
          INSERT INTO plans (id, name, plot_width, plot_length, plot_unit, bhk, arch_style, data_json, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        insertStmt.run(id, name, pWidth, pLength, pUnit, bhk, archStyle, dataJson, now, now);
      }

      // Record revision
      const revCountStmt = db.prepare('SELECT COUNT(*) as count FROM plan_revisions WHERE plan_id = ?');
      const revCount = (revCountStmt.get(id)?.count || 0) + 1;

      const revStmt = db.prepare(`
        INSERT INTO plan_revisions (plan_id, revision_num, action, data_json, created_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      revStmt.run(id, revCount, planData.lastAction || 'Adjusted Layout', dataJson, now);

      return {
        id: id,
        name: name,
        revision: revCount,
        shareUrl: `/index.html?plan=${id}`,
        updatedAt: now
      };
    } catch (dbErr) {
      console.warn('SQLite error, falling back to JSON:', dbErr);
    }
  }

  // JSON store fallback
  const store = readJsonStore();
  const isUpdate = !!store.plans[id];
  store.plans[id] = {
    id, name, plot_width: pWidth, plot_length: pLength, plot_unit: pUnit,
    bhk, arch_style: archStyle, data_json: dataJson,
    created_at: isUpdate ? store.plans[id].created_at : now,
    updated_at: now
  };

  const revCount = (store.revisions.filter(r => r.plan_id === id).length) + 1;
  store.revisions.push({
    plan_id: id,
    revision_num: revCount,
    action: planData.lastAction || 'Adjusted Layout',
    data_json: dataJson,
    created_at: now
  });
  writeJsonStore(store);

  return {
    id: id,
    name: name,
    revision: revCount,
    shareUrl: `/index.html?plan=${id}`,
    updatedAt: now
  };
}

/**
 * Retrieves a plan by its unique ID.
 * @param {string} id
 * @returns {Object|null}
 */
function getPlan(id) {
  if (!db && !useJsonStore) initStorage();

  if (!useJsonStore && db) {
    try {
      const stmt = db.prepare('SELECT * FROM plans WHERE id = ?');
      const row = stmt.get(id);
      if (row) {
        const parsed = JSON.parse(row.data_json);
        return {
          id: row.id,
          name: row.name,
          plot: { width: row.plot_width, length: row.plot_length, unit: row.plot_unit },
          bhk: row.bhk,
          archStyle: row.arch_style,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          rooms: parsed.rooms || [],
          data: parsed
        };
      }
    } catch (e) {
      console.warn('SQLite get error:', e);
    }
  }

  const store = readJsonStore();
  const row = store.plans[id];
  if (row) {
    const parsed = JSON.parse(row.data_json);
    return {
      id: row.id,
      name: row.name,
      plot: { width: row.plot_width, length: row.plot_length, unit: row.plot_unit },
      bhk: row.bhk,
      archStyle: row.arch_style,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      rooms: parsed.rooms || [],
      data: parsed
    };
  }
  return null;
}

/**
 * Lists the most recently saved plans.
 * @param {number} limit
 * @returns {Array}
 */
function listRecentPlans(limit = 10) {
  if (!db && !useJsonStore) initStorage();

  if (!useJsonStore && db) {
    try {
      const stmt = db.prepare('SELECT id, name, plot_width, plot_length, bhk, arch_style, updated_at FROM plans ORDER BY updated_at DESC LIMIT ?');
      return stmt.all(limit).map(r => ({
        id: r.id,
        name: r.name,
        plot: `${r.plot_width} × ${r.plot_length} ft`,
        bhk: `${r.bhk} BHK`,
        style: r.arch_style,
        updatedAt: r.updated_at,
        url: `/index.html?plan=${r.id}`
      }));
    } catch (e) {
      console.warn('SQLite list error:', e);
    }
  }

  const store = readJsonStore();
  const list = Object.values(store.plans);
  list.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  return list.slice(0, limit).map(r => ({
    id: r.id,
    name: r.name,
    plot: `${r.plot_width} × ${r.plot_length} ft`,
    bhk: `${r.bhk} BHK`,
    style: r.arch_style,
    updatedAt: r.updated_at,
    url: `/index.html?plan=${r.id}`
  }));
}

initStorage();

module.exports = {
  savePlan,
  getPlan,
  listRecentPlans
};
