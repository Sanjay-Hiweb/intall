// src/auditEngine.js — Deterministic Municipal Building Code & Zoning Compliance Validator
// Validates floor plan geometry against municipal setback rules, FAR, and ventilation norms.

const fs = require('node:fs');
const path = require('node:path');

const codesDbPath = path.join(__dirname, '..', 'data', 'building-codes.json');
let buildingCodesConfig = null;

function getCodesConfig() {
  if (!buildingCodesConfig) {
    try {
      const raw = fs.readFileSync(codesDbPath, 'utf8');
      buildingCodesConfig = JSON.parse(raw);
    } catch {
      buildingCodesConfig = { standard_residential: {} };
    }
  }
  return buildingCodesConfig.standard_residential || {};
}

/**
 * Runs a deterministic compliance audit against municipal bylaws.
 * @param {Array} rooms - Array of Room objects from DATA-SCHEMA.md
 * @param {Object} plot - { width: number, length: number }
 * @returns {Object} Comprehensive pass/fail audit report
 */
function auditCompliance(rooms, plot) {
  const code = getCodesConfig();
  if (!Array.isArray(rooms) || rooms.length === 0 || !plot || !plot.width || !plot.length) {
    return { error: "Missing rooms or plot geometry for compliance audit." };
  }

  const pW = parseFloat(plot.width) || 0;
  const pL = parseFloat(plot.length) || 0;
  const plotArea = +(pW * pL).toFixed(1);

  const checks = [];
  let totalBuiltUpArea = 0;

  // Compute building footprint bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  rooms.forEach(room => {
    const rx = parseFloat(room.x) || 0;
    const ry = parseFloat(room.y) || 0;
    const rw = parseFloat(room.w) || 0;
    const rh = parseFloat(room.h) || 0;
    const area = +(rw * rh).toFixed(1);
    totalBuiltUpArea += area;

    if (rx < minX) minX = rx;
    if (ry < minY) minY = ry;
    if (rx + rw > maxX) maxX = rx + rw;
    if (ry + rh > maxY) maxY = ry + rh;

    // Room type checks
    const rType = (room.type || 'hall').toLowerCase();
    const minAreaRequired = (code.dimensions && code.dimensions.min_room_areas_sqft && code.dimensions.min_room_areas_sqft[rType]) || 30.0;
    const minWidthRequired = (code.dimensions && code.dimensions.min_room_widths_ft && code.dimensions.min_room_widths_ft[rType]) || 4.0;

    const passArea = area >= minAreaRequired;
    checks.push({
      id: `room_area_${room.id}`,
      name: `${room.name} Area`,
      category: "Room Dimensions",
      passed: passArea,
      actual: `${area} sq.ft`,
      threshold: `>= ${minAreaRequired} sq.ft`,
      severity: passArea ? "info" : "warning",
      message: passArea
        ? `Compliant: ${room.name} provides ${area} sq.ft (bylaw min ${minAreaRequired} sq.ft).`
        : `Deficit: ${room.name} is ${area} sq.ft, below minimum standard of ${minAreaRequired} sq.ft.`
    });

    const roomMinSpan = Math.min(rw, rh);
    const passWidth = roomMinSpan >= minWidthRequired;
    checks.push({
      id: `room_width_${room.id}`,
      name: `${room.name} Clear Width`,
      category: "Room Dimensions",
      passed: passWidth,
      actual: `${roomMinSpan} ft`,
      threshold: `>= ${minWidthRequired} ft`,
      severity: passWidth ? "info" : "warning",
      message: passWidth
        ? `Compliant: Room narrowest dimension is ${roomMinSpan} ft.`
        : `Tight clearance: Narrowest dimension is ${roomMinSpan} ft (recommended >= ${minWidthRequired} ft).`
    });

    // Window light & ventilation ratio check for habitable rooms
    if (['bedroom', 'living', 'hall', 'study'].includes(rType)) {
      let winArea = 0;
      if (Array.isArray(room.windows)) {
        room.windows.forEach(w => {
          winArea += (parseFloat(w.width) || 3) * 4.0;
        });
      }
      const ventRatio = area > 0 ? +(winArea / area).toFixed(3) : 0;
      const minRatio = (code.lightAndVentilation && code.lightAndVentilation.min_habitable_window_ratio) || 0.10;
      const passVent = ventRatio >= minRatio;

      checks.push({
        id: `vent_${room.id}`,
        name: `${room.name} Natural Light & Air`,
        category: "Habitability & Egress",
        passed: passVent,
        actual: `${(ventRatio * 100).toFixed(1)}% glazed ratio`,
        threshold: `>= ${(minRatio * 100).toFixed(0)}%`,
        severity: passVent ? "info" : "advisory",
        message: passVent
          ? `Compliant: Window glazed opening is ${(ventRatio * 100).toFixed(1)}% of floor area.`
          : `Ventilation Notice: Glazed area is ${(ventRatio * 100).toFixed(1)}% (bylaw target >= ${(minRatio * 100).toFixed(0)}%). Consider enlarging windows.`
      });
    }
  });

  // Calculate actual setbacks
  const actualLeftSetback = +(minX).toFixed(1);
  const actualRightSetback = +(pW - maxX).toFixed(1);
  const actualFrontSetback = +(minY).toFixed(1); // origin is south/front
  const actualRearSetback = +(pL - maxY).toFixed(1);

  const reqFront = (code.setbacks && code.setbacks.front_min_ft) || 5.0;
  const reqRear = (code.setbacks && code.setbacks.rear_min_ft) || 3.0;
  const reqSide = (code.setbacks && code.setbacks.left_min_ft) || 3.0;

  // Setback checks
  const passFront = actualFrontSetback >= reqFront;
  checks.unshift({
    id: "setback_front",
    name: "Front Road Setback",
    category: "Site Zoning",
    passed: passFront,
    actual: `${actualFrontSetback} ft`,
    threshold: `>= ${reqFront} ft`,
    severity: passFront ? "info" : "critical",
    message: passFront
      ? `Compliant: Front setback is ${actualFrontSetback} ft (min ${reqFront} ft).`
      : `Encroachment: Front setback is only ${actualFrontSetback} ft (municipal min ${reqFront} ft).`
  });

  const passRear = actualRearSetback >= reqRear;
  checks.unshift({
    id: "setback_rear",
    name: "Rear Yard Setback",
    category: "Site Zoning",
    passed: passRear,
    actual: `${actualRearSetback} ft`,
    threshold: `>= ${reqRear} ft`,
    severity: passRear ? "info" : "critical",
    message: passRear
      ? `Compliant: Rear setback is ${actualRearSetback} ft (min ${reqRear} ft).`
      : `Encroachment: Rear boundary buffer is ${actualRearSetback} ft (min ${reqRear} ft).`
  });

  const passSides = actualLeftSetback >= reqSide && actualRightSetback >= reqSide;
  checks.unshift({
    id: "setback_sides",
    name: "Lateral Side Setbacks",
    category: "Site Zoning",
    passed: passSides,
    actual: `L: ${actualLeftSetback} ft / R: ${actualRightSetback} ft`,
    threshold: `>= ${reqSide} ft each`,
    severity: passSides ? "info" : "warning",
    message: passSides
      ? `Compliant: Lateral fire separation buffers are maintained.`
      : `Notice: Lateral side setback is less than ${reqSide} ft standard.`
  });

  // Ground Coverage %
  const groundCoveragePct = plotArea > 0 ? +((totalBuiltUpArea / plotArea) * 100).toFixed(1) : 0;
  const maxCoverage = (code.coverage && code.coverage.max_ground_coverage_pct) || 70.0;
  const passCoverage = groundCoveragePct <= maxCoverage;
  checks.unshift({
    id: "ground_coverage",
    name: "Maximum Ground Coverage",
    category: "Zoning & Density",
    passed: passCoverage,
    actual: `${groundCoveragePct}%`,
    threshold: `<= ${maxCoverage}%`,
    severity: passCoverage ? "info" : "warning",
    message: passCoverage
      ? `Compliant: Building footprint covers ${groundCoveragePct}% of parcel (cap ${maxCoverage}%).`
      : `Density Warning: Footprint covers ${groundCoveragePct}%, exceeding ${maxCoverage}% coverage ceiling.`
  });

  // Calculate Overall Compliance Score
  const totalChecks = checks.length;
  const passedChecks = checks.filter(c => c.passed).length;
  const complianceScore = Math.round((passedChecks / totalChecks) * 100);
  const isOverallCompliant = checks.filter(c => c.severity === "critical" && !c.passed).length === 0;

  return {
    success: true,
    jurisdictionName: code.name || "Unified Model Residential Building Code",
    summary: {
      plotAreaSqft: plotArea,
      builtUpAreaSqft: totalBuiltUpArea,
      groundCoveragePct: groundCoveragePct,
      complianceScore: complianceScore,
      isOverallCompliant: isOverallCompliant,
      passedCount: passedChecks,
      totalChecksCount: totalChecks
    },
    setbacks: {
      front: { actual: actualFrontSetback, required: reqFront, passed: passFront },
      rear: { actual: actualRearSetback, required: reqRear, passed: passRear },
      left: { actual: actualLeftSetback, required: reqSide, passed: actualLeftSetback >= reqSide },
      right: { actual: actualRightSetback, required: reqSide, passed: actualRightSetback >= reqSide }
    },
    checks: checks
  };
}

module.exports = { auditCompliance };
