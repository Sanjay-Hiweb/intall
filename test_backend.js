// test_backend.js — Verification tests for backend engines and persistence
const assert = require('node:assert');
const { calculateBOM } = require('./src/bomEngine.js');
const { auditCompliance } = require('./src/auditEngine.js');
const { savePlan, getPlan, listRecentPlans } = require('./src/planStorage.js');

console.log('--- RUNNING BACKEND VERIFICATION TESTS ---');

// Test data matching DATA-SCHEMA.md
const samplePlot = { width: 35, length: 45, unit: 'ft' };
const sampleRooms = [
  { id: 'hall1', name: 'Living Hall', type: 'hall', x: 3, y: 5, w: 18, h: 16, doors: [{ wall: 'south', width: 3.5 }], windows: [{ wall: 'east', width: 5 }] },
  { id: 'bed1', name: 'Master Bedroom', type: 'bedroom', x: 21, y: 5, w: 12, h: 14, doors: [{ wall: 'west', width: 3 }], windows: [{ wall: 'east', width: 4 }] },
  { id: 'kitchen1', name: 'Kitchen', type: 'kitchen', x: 3, y: 21, w: 12, h: 10, doors: [{ wall: 'south', width: 3 }], windows: [{ wall: 'north', width: 3 }] },
  { id: 'bath1', name: 'En-Suite Bath', type: 'bathroom', x: 21, y: 19, w: 8, h: 6, doors: [{ wall: 'south', width: 2.5 }], windows: [{ wall: 'north', width: 2 }] }
];

// Test 1: BOM Engine
console.log('1. Testing BOM Calculation Engine...');
const bom = calculateBOM(sampleRooms, samplePlot);
assert.strictEqual(bom.success, true, 'BOM calculation must succeed');
assert(bom.grandTotal > 0, 'Grand total must be positive');
assert(bom.lineItems.length >= 5, 'Must have at least 5 itemized categories');
console.log(`   ✓ BOM Generated: Built-up Area: ${bom.metrics.totalBuiltUpAreaSqft} sqft | Grand Total: $${bom.grandTotal.toLocaleString()} ($${bom.metrics.costPerSqft}/sqft)`);

// Test 2: Audit Engine
console.log('2. Testing Municipal Building Code Audit Engine...');
const audit = auditCompliance(sampleRooms, samplePlot);
assert.strictEqual(audit.success, true, 'Audit calculation must succeed');
assert(typeof audit.summary.complianceScore === 'number', 'Score must be a number');
assert(audit.checks.length >= 8, 'Must perform at least 8 individual compliance checks');
console.log(`   ✓ Audit Completed: Overall Score: ${audit.summary.complianceScore}% | Ground Coverage: ${audit.summary.groundCoveragePct}%`);

// Test 3: Plan Storage
console.log('3. Testing Plan Storage & Revision System...');
const testPlan = {
  name: 'Nordic Sunlit Villa',
  plot: samplePlot,
  bhk: 3,
  requirements: { archStyle: 'scandinavian' },
  rooms: sampleRooms,
  lastAction: 'Unit Test Creation'
};
const saveResult = savePlan(testPlan);
assert(saveResult.id && saveResult.id.length >= 5, 'Must return a generated plan ID');
console.log(`   ✓ Plan Saved with ID: ${saveResult.id} (Revision ${saveResult.revision})`);

const loadedPlan = getPlan(saveResult.id);
assert.strictEqual(loadedPlan.name, 'Nordic Sunlit Villa');
assert.strictEqual(loadedPlan.rooms.length, 4);
console.log(`   ✓ Plan Retrieved successfully matching DATA-SCHEMA.md`);

// Update plan to test revisioning
testPlan.id = saveResult.id;
testPlan.lastAction = 'Adjusted Kitchen Wall';
const updateResult = savePlan(testPlan);
assert.strictEqual(updateResult.revision, 2, 'Revision count must increment');
console.log(`   ✓ Revision recorded successfully (Rev ${updateResult.revision})`);

const recentList = listRecentPlans(5);
assert(recentList.length >= 1, 'Recent list must contain saved plan');
console.log(`   ✓ Recent plans listed: ${recentList.length} plans found`);

console.log('--- ALL BACKEND VERIFICATION TESTS PASSED ---');
