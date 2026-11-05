/* ==========================================================================
   2D BLUEPRINT RENDERER (DRAFTING TABLE SPEC)
   ========================================================================== */
function render2DPlan() {
  const canvas = document.getElementById("plan2DCanvas");
  if (!canvas || !state.scaledRooms) return;
  const ctx = canvas.getContext("2d");
  const container = document.getElementById("viewportContainer");
  const rect = container.getBoundingClientRect();

  canvas.width = rect.width * (window.devicePixelRatio || 1);
  canvas.height = rect.height * (window.devicePixelRatio || 1);
  ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

  const w = rect.width;
  const h = rect.height;

  ctx.clearRect(0, 0, w, h);

  // Architectural Drawing Paper Background (#FAF8F3)
  ctx.fillStyle = "#FAF8F3";
  ctx.fillRect(0, 0, w, h);

  // Subtle 24px drafting grid
  ctx.strokeStyle = "rgba(14, 26, 43, 0.05)";
  ctx.lineWidth = 1;
  const grid = 24;
  for (let x = 0; x < w; x += grid) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += grid) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  const plotFt = getPlotInFeet();
  const margin = 50;
  const scale = Math.min((w - margin * 2) / plotFt.width, (h - margin * 2) / plotFt.length);
  const drawW = plotFt.width * scale;
  const drawH = plotFt.length * scale;
  const startX = (w - drawW) / 2;
  const startY = (h - drawH) / 2;

  // Plot Perimeter Fence / Boundary
  ctx.strokeStyle = "rgba(14, 26, 43, 0.35)";
  ctx.setLineDash([6, 4]);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(startX, startY, drawW, drawH);
  ctx.setLineDash([]);

  // Filter rooms for current 2D level view
  const activeRooms = state.scaledRooms.filter(r => (r.floor || "ground") === state.activeFloor);
  const ghostRooms  = state.scaledRooms.filter(r => (r.floor || "ground") !== state.activeFloor);

  // If viewing First Floor, render faint structural ground footprint watermark
  if (state.activeFloor === "first") {
    ctx.save();
    ghostRooms.forEach(room => {
      const rx = startX + room.x * scale;
      const ry = startY + drawH - (room.y + room.h) * scale;
      const rw = room.w * scale;
      const rh = room.h * scale;

      ctx.fillStyle = "rgba(14, 26, 43, 0.03)";
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeStyle = "rgba(14, 26, 43, 0.15)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(rx, ry, rw, rh);
      ctx.setLineDash([]);

      ctx.fillStyle = "rgba(83, 98, 120, 0.65)";
      ctx.font = "italic 9px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`(GF: ${room.name})`, rx + rw / 2, ry + rh / 2);
    });
    ctx.restore();
  }

  // Draw Active Floor Rooms
  activeRooms.forEach(room => {
    const rx = startX + room.x * scale;
    const ry = startY + drawH - (room.y + room.h) * scale; // Flip Y (bottom-left origin)
    const rw = room.w * scale;
    const rh = room.h * scale;

    // Room Fill
    const isHovered = state.hoveredRoomId === room.id;
    const isSelected = state.selectedRoomId === room.id;
    ctx.fillStyle = isHovered ? "rgba(228, 87, 46, 0.12)" : (ROOM_COLORS[room.type] || "rgba(240, 234, 222, 0.85)");
    ctx.fillRect(rx, ry, rw, rh);

    // Vector furniture in Furnished Plan Mode
    if (state.view === "2d-furnished") {
      drawVectorFurniture(ctx, room, scale, rx, ry, rw, rh);
    }

    // Special linework for stairs, double-height voids, and balconies
    if (room.type === "stairs") {
      ctx.save();
      ctx.strokeStyle = "#0E1A2B";
      ctx.lineWidth = 1;
      const isHoriz = rw >= rh;
      const treads = 10;
      if (isHoriz) {
        const stepW = rw / treads;
        for (let s = 1; s < treads; s++) {
          ctx.beginPath();
          ctx.moveTo(rx + s * stepW, ry);
          ctx.lineTo(rx + s * stepW, ry + rh);
          ctx.stroke();
        }
      } else {
        const stepH = rh / treads;
        for (let s = 1; s < treads; s++) {
          ctx.beginPath();
          ctx.moveTo(rx, ry + s * stepH);
          ctx.lineTo(rx + rw, ry + s * stepH);
          ctx.stroke();
        }
      }
      const isUpper = (room.floor === "first");
      ctx.fillStyle = "#E4572E";
      ctx.font = "bold 10px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(isUpper ? "DN ▼" : "UP ▲", rx + rw / 2, ry + rh / 2 + 14);
      ctx.restore();
    } else if (room.type === "void") {
      ctx.save();
      ctx.strokeStyle = "rgba(14, 26, 43, 0.35)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(rx, ry); ctx.lineTo(rx + rw, ry + rh);
      ctx.moveTo(rx + rw, ry); ctx.lineTo(rx, ry + rh);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    } else if (room.type === "balcony") {
      ctx.save();
      ctx.strokeStyle = "rgba(14, 26, 43, 0.3)";
      ctx.lineWidth = 1;
      const slatSpacing = 8;
      for (let sx = rx + slatSpacing; sx < rx + rw; sx += slatSpacing) {
        ctx.beginPath();
        ctx.moveTo(sx, ry);
        ctx.lineTo(sx, ry + rh);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Architectural Double Walls (Deep Drafting Ink)
    ctx.strokeStyle = isHovered ? "#E4572E" : (isSelected ? "#E4572E" : "#0E1A2B");
    ctx.lineWidth = isSelected ? 5.0 : 4.0;
    ctx.strokeRect(rx, ry, rw, rh);

    // Selection Accent Box and Corner Grips if Selected
    if (isSelected) {
      ctx.save();
      ctx.strokeStyle = "#E4572E";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(rx - 3, ry - 3, rw + 6, rh + 6);
      ctx.setLineDash([]);
      ctx.fillStyle = "#E4572E";
      const gs = 5;
      [[rx - 3, ry - 3], [rx + rw + 3, ry - 3], [rx - 3, ry + rh + 3], [rx + rw + 3, ry + rh + 3]].forEach(([gx, gy]) => {
        ctx.fillRect(gx - gs / 2, gy - gs / 2, gs, gs);
      });
      ctx.restore();
    }

    // Windows (Glass double lines on outer edges)
    (room.windows || []).forEach(win => {
      ctx.strokeStyle = "#536278";
      ctx.lineWidth = 3.5;
      const winW = win.width * scale;
      const offset = win.offset * scale;

      ctx.beginPath();
      if (win.wall === "north") {
        ctx.moveTo(rx + offset, ry);
        ctx.lineTo(rx + offset + winW, ry);
      } else if (win.wall === "south") {
        ctx.moveTo(rx + offset, ry + rh);
        ctx.lineTo(rx + offset + winW, ry + rh);
      } else if (win.wall === "west") {
        ctx.moveTo(rx, ry + rh - offset);
        ctx.lineTo(rx, ry + rh - offset - winW);
      } else if (win.wall === "east") {
        ctx.moveTo(rx + rw, ry + rh - offset);
        ctx.lineTo(rx + rw, ry + rh - offset - winW);
      }
      ctx.stroke();
    });

    // Doors (Wall gap + door swing arc)
    (room.doors || []).forEach(door => {
      const doorW = door.width * scale;
      const offset = door.offset * scale;

      let dx = rx, dy = ry;
      if (door.wall === "south") {
        dx = rx + offset;
        dy = ry + rh;
        ctx.strokeStyle = ROOM_COLORS[room.type] || "#FAF8F3";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(dx, dy);
        ctx.lineTo(dx + doorW, dy);
        ctx.stroke();

        ctx.strokeStyle = "#E4572E";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(dx, dy, doorW, 0, -Math.PI / 2, true);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(dx, dy);
        ctx.lineTo(dx, dy - doorW);
        ctx.stroke();
      } else if (door.wall === "north") {
        dx = rx + offset;
        dy = ry;
        ctx.strokeStyle = ROOM_COLORS[room.type] || "#FAF8F3";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(dx, dy);
        ctx.lineTo(dx + doorW, dy);
        ctx.stroke();

        ctx.strokeStyle = "#E4572E";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(dx, dy, doorW, 0, Math.PI / 2, false);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(dx, dy);
        ctx.lineTo(dx, dy + doorW);
        ctx.stroke();
      } else if (door.wall === "west") {
        dx = rx;
        dy = ry + rh - offset;
        ctx.strokeStyle = ROOM_COLORS[room.type] || "#FAF8F3";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(dx, dy);
        ctx.lineTo(dx, dy - doorW);
        ctx.stroke();

        ctx.strokeStyle = "#E4572E";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(dx, dy, doorW, -Math.PI / 2, 0, false);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(dx, dy);
        ctx.lineTo(dx + doorW, dy);
        ctx.stroke();
      } else if (door.wall === "east") {
        dx = rx + rw;
        dy = ry + rh - offset;
        ctx.strokeStyle = ROOM_COLORS[room.type] || "#FAF8F3";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(dx, dy);
        ctx.lineTo(dx, dy - doorW);
        ctx.stroke();

        ctx.strokeStyle = "#E4572E";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(dx, dy, doorW, -Math.PI / 2, -Math.PI, true);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(dx, dy);
        ctx.lineTo(dx - doorW, dy);
        ctx.stroke();
      }
    });

    // Room Labels (High Contrast Deep Ink)
    ctx.fillStyle = "#0E1A2B";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    const fontSize = Math.max(10, Math.min(13, rw / 7));
    ctx.font = `700 ${fontSize}px 'Inter', sans-serif`;
    
    const areaSqft = Math.round(room.w * room.h);
    const areaLabel = state.plot.unit === "m" ? `${(areaSqft * 0.0929).toFixed(1)} sqm` : `${areaSqft} sqft`;
    const dimStr = state.plot.unit === "m" ? `${(room.w * 0.3048).toFixed(1)}×${(room.h * 0.3048).toFixed(1)}m` : `${room.w.toFixed(1)}' × ${room.h.toFixed(1)}'`;

    if (state.view === "2d-schematic") {
      if (rh > 40) {
        ctx.fillText(room.name.toUpperCase(), rx + rw / 2, ry + rh / 2 - fontSize * 1.1);
        ctx.font = `600 ${Math.max(9, fontSize - 2)}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = "#536278";
        ctx.fillText(dimStr, rx + rw / 2, ry + rh / 2);
        ctx.fillStyle = "#6E7C91";
        ctx.fillText(areaLabel, rx + rw / 2, ry + rh / 2 + fontSize * 1.0);
      } else {
        ctx.fillText(room.name, rx + rw / 2, ry + rh / 2 - 6);
        ctx.font = `600 ${Math.max(8, fontSize - 3)}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = "#536278";
        ctx.fillText(dimStr, rx + rw / 2, ry + rh / 2 + 8);
      }
    } else {
      if (rh > 30) {
        ctx.fillText(room.name.toUpperCase(), rx + rw / 2, ry + rh / 2 - fontSize * 0.6);
        ctx.font = `500 ${Math.max(9, fontSize - 2)}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = "#536278";
        ctx.fillText(areaLabel, rx + rw / 2, ry + rh / 2 + fontSize * 0.8);
      } else {
        ctx.fillText(room.name, rx + rw / 2, ry + rh / 2);
      }
    }
  });

  // Architectural Blueprint Level Title Block
  ctx.save();
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(startX + 6, startY + 6, 230, 44);
  ctx.strokeStyle = "#D8D2C5";
  ctx.lineWidth = 1;
  ctx.strokeRect(startX + 6, startY + 6, 230, 44);

  ctx.fillStyle = "#0E1A2B";
  ctx.font = "bold 11px 'JetBrains Mono', monospace";
  ctx.textAlign = "left";
  const levelTitle = (state.activeFloor === "first") ? "FIRST FLOOR PLAN · LVL +10'-0\"" : "GROUND FLOOR PLAN · LVL ±0'-0\"";
  ctx.fillText(levelTitle, startX + 16, startY + 23);

  ctx.fillStyle = "#E4572E";
  ctx.font = "600 9.5px 'Inter', sans-serif";
  const hasUpperFl = state.scaledRooms.some(r => r.floor === "first");
  const houseDesc = hasUpperFl ? "Architectural Duplex Villa (G+1)" : "Single-Story Residential (1F)";
  ctx.fillText(`${houseDesc} · ${state.requirements.facing} Facing`, startX + 16, startY + 38);
  ctx.restore();

  // Draw Compass Rose in corner (orientation-correct: N is always plot "north" edge)
  drawCompassRose(ctx, w - 50, 50, state.requirements.facing);

  // Dimension Callouts (Top & Left)
  ctx.fillStyle = "#0E1A2B";
  ctx.font = "600 12px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(`PLOT WIDTH: ${state.plot.width} ${state.plot.unit}`, startX + drawW / 2, startY - 10);

  ctx.save();
  ctx.translate(startX - 14, startY + drawH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(`PLOT LENGTH: ${state.plot.length} ${state.plot.unit}`, 0, 0);
  ctx.restore();

  // === SCALE RULER (bottom-left of canvas) ===
  const rulerMargin = 18;
  const rulerY      = startY + drawH + 28;
  // pick a round number of feet that gives a ruler between 50–120px
  const rulerFtOptions = [1, 2, 5, 10, 15, 20, 25, 30];
  let rulerFt = rulerFtOptions.find(f => f * scale >= 48) || 30;
  const rulerPx = rulerFt * scale;
  const rulerX  = startX;

  ctx.strokeStyle = "#0E1A2B";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(rulerX, rulerY);
  ctx.lineTo(rulerX + rulerPx, rulerY);
  ctx.stroke();
  // end ticks
  [rulerX, rulerX + rulerPx].forEach(tx => {
    ctx.beginPath(); ctx.moveTo(tx, rulerY - 4); ctx.lineTo(tx, rulerY + 4); ctx.stroke();
  });
  // midpoint fill
  ctx.fillStyle = "#E4572E";
  ctx.beginPath();
  ctx.rect(rulerX, rulerY - 2, rulerPx / 2, 4);
  ctx.fill();

  ctx.fillStyle = "#0E1A2B";
  ctx.font = "600 10px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(`0`, rulerX, rulerY + 6);
  ctx.fillText(`${rulerFt/2}`, rulerX + rulerPx / 2, rulerY + 6);
  ctx.fillText(`${rulerFt} ${state.plot.unit}`, rulerX + rulerPx, rulerY + 6);
}

function drawCompassRose(ctx, cx, cy, facing) {
  ctx.save();
  ctx.translate(cx, cy);

  // Compass circle
  ctx.strokeStyle = "rgba(14, 26, 43, 0.25)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, 24, 0, Math.PI * 2);
  ctx.stroke();

  // North needle (Pencil Red-Orange)
  ctx.fillStyle = "#E4572E";
  ctx.beginPath();
  ctx.moveTo(0, -22);
  ctx.lineTo(5, 0);
  ctx.lineTo(-5, 0);
  ctx.closePath();
  ctx.fill();

  // South needle (Muted Ink Slate)
  ctx.fillStyle = "rgba(83, 98, 120, 0.6)";
  ctx.beginPath();
  ctx.moveTo(0, 22);
  ctx.lineTo(5, 0);
  ctx.lineTo(-5, 0);
  ctx.closePath();
  ctx.fill();

  // Labels
  ctx.fillStyle = "#0E1A2B";
  ctx.font = "700 10px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("N", 0, -32);
  ctx.fillText("S", 0, 32);
  ctx.fillText("E", 32, 0);
  ctx.fillText("W", -32, 0);

  ctx.restore();
}
