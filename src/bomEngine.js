// src/bomEngine.js — Deterministic Bill of Materials (BOM) & Construction Cost Estimator
// Conforms to DATA-SCHEMA.md room coordinate structure.

const fs = require('node:fs');
const path = require('node:path');

const materialsDbPath = path.join(__dirname, '..', 'data', 'materials.json');
let materialsConfig = null;

function getMaterialsConfig() {
  if (!materialsConfig) {
    try {
      const raw = fs.readFileSync(materialsDbPath, 'utf8');
      materialsConfig = JSON.parse(raw);
    } catch {
      materialsConfig = {
        currency: "USD",
        currencySymbol: "$",
        rateTier: "Standard Premium",
        flooring: {},
        masonryAndWalls: {},
        openings: {},
        structuralConcreteAndSteel: {}
      };
    }
  }
  return materialsConfig;
}

/**
 * Calculates itemized Bill of Materials & Cost Takeoff from a room layout.
 * @param {Array} rooms - Array of Room objects from DATA-SCHEMA.md
 * @param {Object} plot - { width: number, length: number, unit?: string }
 * @returns {Object} Full BOM breakdown, line items, and summary totals
 */
function calculateBOM(rooms, plot) {
  const config = getMaterialsConfig();
  if (!Array.isArray(rooms) || rooms.length === 0) {
    return { error: "No rooms provided for takeoff calculation." };
  }

  const plotArea = (plot && plot.width && plot.length) ? plot.width * plot.length : 0;
  let totalBuiltUpArea = 0;
  let totalHabitableArea = 0;
  let totalGrossWallLength = 0;
  let totalDoorArea = 0;
  let totalWindowArea = 0;
  let totalDoorsCount = 0;
  let totalWindowsCount = 0;

  const roomBreakdowns = [];
  const flooringQuantities = {
    vitrified_tile: 0,
    hardwood_oak: 0,
    anti_skid_tile: 0,
    granite_slab: 0,
    paved_pavers: 0
  };

  // 1. Process each room's floor area and openings
  rooms.forEach(room => {
    const w = parseFloat(room.w) || 0;
    const h = parseFloat(room.h) || 0;
    const roomArea = +(w * h).toFixed(1);
    const perimeter = +(2 * (w + h)).toFixed(1);
    totalBuiltUpArea += roomArea;
    totalGrossWallLength += perimeter;

    const rType = (room.type || 'hall').toLowerCase();
    if (rType !== 'parking') {
      totalHabitableArea += roomArea;
    }

    // Determine flooring finish
    let floorType = 'vitrified_tile';
    if (['bedroom', 'study'].includes(rType)) floorType = 'hardwood_oak';
    else if (['bathroom', 'balcony'].includes(rType)) floorType = 'anti_skid_tile';
    else if (['kitchen', 'pooja'].includes(rType)) floorType = 'granite_slab';
    else if (rType === 'parking') floorType = 'paved_pavers';

    flooringQuantities[floorType] = (flooringQuantities[floorType] || 0) + roomArea;

    // Door openings
    let roomDoorCount = 0;
    let roomDoorArea = 0;
    if (Array.isArray(room.doors)) {
      room.doors.forEach(d => {
        const dWidth = parseFloat(d.width) || 3.0;
        const dHeight = 7.0; // standard 7ft door height
        const dArea = dWidth * dHeight;
        roomDoorCount++;
        roomDoorArea += dArea;
      });
    }
    totalDoorsCount += roomDoorCount;
    totalDoorArea += roomDoorArea;

    // Window openings
    let roomWindowCount = 0;
    let roomWindowArea = 0;
    if (Array.isArray(room.windows)) {
      room.windows.forEach(win => {
        const winWidth = parseFloat(win.width) || 3.0;
        const winHeight = 4.0; // standard 4ft window height
        const winArea = winWidth * winHeight;
        roomWindowCount++;
        roomWindowArea += winArea;
      });
    }
    totalWindowsCount += roomWindowCount;
    totalWindowArea += roomWindowArea;

    roomBreakdowns.push({
      id: room.id,
      name: room.name,
      type: rType,
      dimensions: `${w} × ${h} ft`,
      areaSqft: roomArea,
      flooringCategory: floorType,
      doorCount: roomDoorCount,
      windowCount: roomWindowCount
    });
  });

  // Since adjacent rooms share walls, net wall length is approximately 65% of sum of perimeters
  const netWallLength = +(totalGrossWallLength * 0.65).toFixed(1);
  const wallHeight = 9.5; // ft
  const grossWallSurface = +(netWallLength * wallHeight).toFixed(1);
  const netWallSurface = Math.max(0, +(grossWallSurface - (totalDoorArea + totalWindowArea)).toFixed(1));

  // Partition vs External split (roughly 40% external 9-inch, 60% internal 4.5-inch)
  const externalWallArea = +(netWallSurface * 0.40).toFixed(1);
  const internalWallArea = +(netWallSurface * 0.60).toFixed(1);

  // 2. Compute Itemized Line Items
  const lineItems = [];

  // --- Category A: Flooring Finishes ---
  Object.keys(flooringQuantities).forEach(k => {
    const sqft = flooringQuantities[k];
    if (sqft > 0) {
      const finishInfo = config.flooring[k] || {
        name: k.replace(/_/g, ' '),
        materialRate: 5.0,
        laborRate: 2.5,
        wastagePct: 8
      };
      const wastage = +(sqft * (finishInfo.wastagePct / 100)).toFixed(1);
      const billableSqft = +(sqft + wastage).toFixed(1);
      const unitRate = finishInfo.materialRate + finishInfo.laborRate;
      const subtotal = +(billableSqft * unitRate).toFixed(2);

      lineItems.push({
        category: "Flooring Finishes",
        item: finishInfo.name,
        quantity: billableSqft,
        unit: "sq.ft",
        unitRate: unitRate,
        rateDetails: `Material $${finishInfo.materialRate} + Labor $${finishInfo.laborRate} (+${finishInfo.wastagePct}% cut waste)`,
        subtotal: subtotal
      });
    }
  });

  // --- Category B: Masonry & Wall Construction ---
  const extConfig = config.masonryAndWalls.brickWall9in || { bricksPerSqft: 9, brickUnitCost: 0.65, mortarCostPerSqft: 1.20, laborCostPerSqft: 2.80 };
  const extRate = +(extConfig.bricksPerSqft * extConfig.brickUnitCost + extConfig.mortarCostPerSqft + extConfig.laborCostPerSqft).toFixed(2);
  const extTotal = +(externalWallArea * extRate).toFixed(2);
  lineItems.push({
    category: "Masonry & Framing",
    item: "9-inch Perimeter Load-Bearing Brick Masonry",
    quantity: externalWallArea,
    unit: "sq.ft",
    unitRate: extRate,
    rateDetails: `Red Clay Bricks (approx ${Math.round(externalWallArea * extConfig.bricksPerSqft)} bricks) + Cement Mortar + Masonry Labor`,
    subtotal: extTotal
  });

  const intConfig = config.masonryAndWalls.partitionWall4in || { bricksPerSqft: 4.5, brickUnitCost: 0.65, mortarCostPerSqft: 0.80, laborCostPerSqft: 2.10 };
  const intRate = +(intConfig.bricksPerSqft * intConfig.brickUnitCost + intConfig.mortarCostPerSqft + intConfig.laborCostPerSqft).toFixed(2);
  const intTotal = +(internalWallArea * intRate).toFixed(2);
  lineItems.push({
    category: "Masonry & Framing",
    item: "4.5-inch Internal Room Divider Masonry",
    quantity: internalWallArea,
    unit: "sq.ft",
    unitRate: intRate,
    rateDetails: `Partition Bricks (approx ${Math.round(internalWallArea * intConfig.bricksPerSqft)} bricks) + Mortar + Labor`,
    subtotal: intTotal
  });

  // Paint surface (both sides of wall)
  const interiorPaintArea = +(internalWallArea * 2 + externalWallArea).toFixed(1);
  const paintRate = (config.masonryAndWalls.interiorPlasterAndPaint && config.masonryAndWalls.interiorPlasterAndPaint.ratePerSqft) || 1.45;
  const paintTotal = +(interiorPaintArea * paintRate).toFixed(2);
  lineItems.push({
    category: "Plaster & Wall Treatments",
    item: "Interior Dual-Coat Plaster & Low-VOC Emulsion",
    quantity: interiorPaintArea,
    unit: "sq.ft",
    unitRate: paintRate,
    rateDetails: "Wall Putty Pre-treatment + Primer + 2 Coats Acrylic Emulsion",
    subtotal: paintTotal
  });

  // --- Category C: Openings & Fenestration ---
  // Main entry door (1 count)
  const mainDoorPrice = (config.openings.mainEntryDoor && config.openings.mainEntryDoor.unitPrice) || 650;
  lineItems.push({
    category: "Doors & Windows",
    item: "Solid Core Front Entry Door & Heavy Hardware",
    quantity: 1,
    unit: "unit",
    unitRate: mainDoorPrice,
    rateDetails: "Architectural Hardwood Entryway with Weatherstripping & Mortise Lock",
    subtotal: mainDoorPrice
  });

  // Internal doors
  const internalDoorsCount = Math.max(0, totalDoorsCount - 1);
  if (internalDoorsCount > 0) {
    const intDoorPrice = (config.openings.roomInternalDoor && config.openings.roomInternalDoor.unitPrice) || 220;
    lineItems.push({
      category: "Doors & Windows",
      item: "Engineered Internal Passage Flush Doors",
      quantity: internalDoorsCount,
      unit: "units",
      unitRate: intDoorPrice,
      rateDetails: "Flush-panel wooden doors with stainless hinges & cylindrical latch",
      subtotal: +(internalDoorsCount * intDoorPrice).toFixed(2)
    });
  }

  // Windows
  if (totalWindowArea > 0) {
    const winRate = (config.openings.casementWindow && config.openings.casementWindow.ratePerSqft) || 38.0;
    const winTotal = +(totalWindowArea * winRate).toFixed(2);
    lineItems.push({
      category: "Doors & Windows",
      item: "UPVC Double-Glazed Fenestration & Glazing",
      quantity: totalWindowArea,
      unit: "sq.ft",
      unitRate: winRate,
      rateDetails: `Thermal insulated glazing across ${totalWindowsCount} window bays`,
      subtotal: winTotal
    });
  }

  // --- Category D: Structural RCC Slab & Foundation ---
  const rccRate = (config.structuralConcreteAndSteel.rccSlabFooting && config.structuralConcreteAndSteel.rccSlabFooting.ratePerSqft) || 32.0;
  const rccTotal = +(totalBuiltUpArea * rccRate).toFixed(2);
  lineItems.push({
    category: "Structure & Concrete",
    item: "Reinforced Concrete (RCC) Foundation, Plinth & Roof Slab",
    quantity: totalBuiltUpArea,
    unit: "sq.ft",
    unitRate: rccRate,
    rateDetails: "M25 Concrete Pour, Fe500D TMT Rebar Framework & Shuttering",
    subtotal: rccTotal
  });

  // --- Category E: Electrical, Plumbing & Sanitary (MEP) ---
  const mepRate = (config.structuralConcreteAndSteel.electricalAndPlumbing && config.structuralConcreteAndSteel.electricalAndPlumbing.ratePerSqft) || 18.5;
  const mepTotal = +(totalBuiltUpArea * mepRate).toFixed(2);
  lineItems.push({
    category: "MEP Services",
    item: "Concealed Electrical Conduit, PEX Plumbing & Drainage",
    quantity: totalBuiltUpArea,
    unit: "sq.ft",
    unitRate: mepRate,
    rateDetails: "Copper distribution box, switches, CPVC lines & septic connection",
    subtotal: mepTotal
  });

  // Category Summaries
  const categoryTotals = {};
  let grandTotal = 0;
  lineItems.forEach(item => {
    categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.subtotal;
    grandTotal += item.subtotal;
  });

  grandTotal = +grandTotal.toFixed(2);
  const costPerSqft = totalBuiltUpArea > 0 ? +(grandTotal / totalBuiltUpArea).toFixed(2) : 0;

  return {
    success: true,
    currency: config.currency || "USD",
    currencySymbol: config.currencySymbol || "$",
    tier: config.rateTier || "Standard Premium",
    metrics: {
      plotAreaSqft: plotArea,
      totalBuiltUpAreaSqft: totalBuiltUpArea,
      habitableAreaSqft: totalHabitableArea,
      netWallSurfaceSqft: netWallSurface,
      doorsCount: totalDoorsCount,
      windowsCount: totalWindowsCount,
      costPerSqft: costPerSqft
    },
    grandTotal: grandTotal,
    categoryTotals: categoryTotals,
    lineItems: lineItems,
    roomBreakdowns: roomBreakdowns
  };
}

module.exports = { calculateBOM };
