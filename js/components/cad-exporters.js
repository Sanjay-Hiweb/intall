    /* ==========================================================================
       AUTOCAD DXF EXPORTER (STANDARD ASCII AC1009 / R12 - ZERO DEPENDENCIES)
       ========================================================================== */
    function exportPlanDXF() {
      if (!state.scaledRooms) {
        showToast("No floor plan available to export.");
        return;
      }

      const plotFt = getPlotInFeet();
      const candName = state.selectedCandidate ? state.selectedCandidate.template.name : "Residential-Plan";

      let dxf = "";
      dxf += "  0\nSECTION\n  2\nHEADER\n  9\n$ACADVER\n  1\nAC1009\n  0\nENDSEC\n";
      dxf += "  0\nSECTION\n  2\nTABLES\n  0\nTABLE\n  2\nLAYER\n 70\n     7\n";
      
      const layers = [
        { name: "0", color: 7 },
        { name: "WALLS", color: 7 },
        { name: "DOORS", color: 1 },
        { name: "WINDOWS", color: 4 },
        { name: "LABELS", color: 2 },
        { name: "DIMENSIONS", color: 3 },
        { name: "FURNITURE", color: 8 }
      ];

      layers.forEach(l => {
        dxf += `  0\nLAYER\n  2\n${l.name}\n 70\n     0\n 62\n     ${l.color}\n  6\nCONTINUOUS\n`;
      });
      dxf += "  0\nENDTAB\n  0\nENDSEC\n";
      dxf += "  0\nSECTION\n  2\nENTITIES\n";

      const addDXFLine = (x1, y1, x2, y2, layer = "WALLS") => {
        dxf += `  0\nLINE\n  8\n${layer}\n 10\n${x1.toFixed(3)}\n 20\n${y1.toFixed(3)}\n 30\n0.0\n 11\n${x2.toFixed(3)}\n 21\n${y2.toFixed(3)}\n 31\n0.0\n`;
      };

      const addDXFText = (x, y, text, height = 1.0, layer = "LABELS") => {
        dxf += `  0\nTEXT\n  8\n${layer}\n 10\n${x.toFixed(3)}\n 20\n${y.toFixed(3)}\n 30\n0.0\n 40\n${height.toFixed(3)}\n  1\n${text}\n 50\n0.0\n`;
      };

      const addDXFArc = (cx, cy, radius, startAngle, endAngle, layer = "DOORS") => {
        dxf += `  0\nARC\n  8\n${layer}\n 10\n${cx.toFixed(3)}\n 20\n${cy.toFixed(3)}\n 30\n0.0\n 40\n${radius.toFixed(3)}\n 50\n${startAngle.toFixed(1)}\n 51\n${endAngle.toFixed(1)}\n`;
      };

      // Plot Boundary Lines
      addDXFLine(0, 0, plotFt.width, 0, "DIMENSIONS");
      addDXFLine(plotFt.width, 0, plotFt.width, plotFt.length, "DIMENSIONS");
      addDXFLine(plotFt.width, plotFt.length, 0, plotFt.length, "DIMENSIONS");
      addDXFLine(0, plotFt.length, 0, 0, "DIMENSIONS");

      // Room Walls & Details
      state.scaledRooms.forEach(room => {
        const x1 = room.x;
        const y1 = room.y;
        const x2 = room.x + room.w;
        const y2 = room.y + room.h;

        addDXFLine(x1, y1, x2, y1, "WALLS");
        addDXFLine(x2, y1, x2, y2, "WALLS");
        addDXFLine(x2, y2, x1, y2, "WALLS");
        addDXFLine(x1, y2, x1, y1, "WALLS");

        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const areaSqft = Math.round(room.w * room.h);
        addDXFText(midX - 2.5, midY + 0.5, room.name.toUpperCase(), 0.9, "LABELS");
        addDXFText(midX - 2.0, midY - 0.7, `${areaSqft} SQFT (${room.w.toFixed(1)}'x${room.h.toFixed(1)}')`, 0.65, "LABELS");

        (room.windows || []).forEach(win => {
          if (win.wall === "north") addDXFLine(x1 + win.offset, y2, x1 + win.offset + win.width, y2, "WINDOWS");
          else if (win.wall === "south") addDXFLine(x1 + win.offset, y1, x1 + win.offset + win.width, y1, "WINDOWS");
          else if (win.wall === "west") addDXFLine(x1, y1 + win.offset, x1, y1 + win.offset + win.width, "WINDOWS");
          else if (win.wall === "east") addDXFLine(x2, y1 + win.offset, x2, y1 + win.offset + win.width, "WINDOWS");
        });

        (room.doors || []).forEach(door => {
          let dx = x1 + door.offset;
          let dy = y1;
          if (door.wall === "south") {
            dx = x1 + door.offset; dy = y1;
            addDXFLine(dx, dy, dx, dy + door.width, "DOORS");
            addDXFArc(dx, dy, door.width, 0, 90, "DOORS");
          } else if (door.wall === "north") {
            dx = x1 + door.offset; dy = y2;
            addDXFLine(dx, dy, dx, dy - door.width, "DOORS");
            addDXFArc(dx, dy, door.width, 270, 360, "DOORS");
          } else if (door.wall === "west") {
            dx = x1; dy = y1 + door.offset;
            addDXFLine(dx, dy, dx + door.width, dy, "DOORS");
            addDXFArc(dx, dy, door.width, 0, 90, "DOORS");
          } else if (door.wall === "east") {
            dx = x2; dy = y1 + door.offset;
            addDXFLine(dx, dy, dx - door.width, dy, "DOORS");
            addDXFArc(dx, dy, door.width, 90, 180, "DOORS");
          }
        });
      });

      dxf += "  0\nENDSEC\n  0\nEOF\n";

      const blob = new Blob([dxf], { type: "application/dxf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${candName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${state.plot.width}x${state.plot.length}.dxf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast("AutoCAD standard DXF file exported successfully.");
    }

    /* ==========================================================================
       ARCHITECTURAL DRAWING SHEET EXPORTER (A3 BLUEPRINT PROPORTION WITH TITLE BLOCK)
       ========================================================================== */
    function exportArchitecturalSheet() {
      if (!state.scaledRooms) {
        showToast("No floor plan available to export.");
        return;
      }

      const PW = 2400;
      const PH = 1600;
      const sheet = document.createElement("canvas");
      sheet.width = PW;
      sheet.height = PH;
      const ctx = sheet.getContext("2d");

      const plotFt = getPlotInFeet();
      const candName = state.selectedCandidate ? state.selectedCandidate.template.name : "Residential Floor Plan";

      // Background - Warm Linen Alabaster
      ctx.fillStyle = "#FAF8F2";
      ctx.fillRect(0, 0, PW, PH);

      // Outer Drawing Border with Dual Lines
      ctx.strokeStyle = "#1C1917";
      ctx.lineWidth = 4;
      ctx.strokeRect(30, 30, PW - 60, PH - 60);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(40, 40, PW - 80, PH - 80);

      // Corner Grid Letters & Numbers
      ctx.fillStyle = "#78716C";
      ctx.font = "700 13px 'Space Grotesk', monospace";
      ["A", "B", "C", "D", "E"].forEach((letter, i) => {
        ctx.fillText(letter, 48 + i * ((PW - 96) / 4), 32);
        ctx.fillText(letter, 48 + i * ((PW - 96) / 4), PH - 24);
      });
      ["1", "2", "3", "4"].forEach((num, i) => {
        ctx.fillText(num, 24, 52 + i * ((PH - 104) / 3));
        ctx.fillText(num, PW - 24, 52 + i * ((PH - 104) / 3));
      });

      // Top Sheet Title Banner
      ctx.fillStyle = "#1C1917";
      ctx.font = "700 28px 'DM Serif Display', Georgia, serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("INTALL ARCHITECTURAL DESIGN STUDIO", 60, 60);

      ctx.font = "600 14px 'Plus Jakarta Sans', sans-serif";
      ctx.fillStyle = "#78716C";
      ctx.fillText("RESIDENTIAL PARAMETRIC BLUEPRINT · ZERO-AI DETERMINISTIC SPATIAL ENGINE", 60, 98);

      // Drawing Plan Area
      const planAreaX = 60;
      const planAreaY = 130;
      const planAreaW = 1580;
      const planAreaH = 1400;

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(planAreaX, planAreaY, planAreaW, planAreaH);
      ctx.strokeStyle = "#E7E4DC";
      ctx.lineWidth = 1;
      ctx.strokeRect(planAreaX, planAreaY, planAreaW, planAreaH);

      const planMargin = 100;
      const scale = Math.min((planAreaW - planMargin * 2) / plotFt.width, (planAreaH - planMargin * 2) / plotFt.length);
      const drawW = plotFt.width * scale;
      const drawH = plotFt.length * scale;
      const startX = planAreaX + (planAreaW - drawW) / 2;
      const startY = planAreaY + (planAreaH - drawH) / 2;

      ctx.strokeStyle = "#8A9490";
      ctx.setLineDash([8, 6]);
      ctx.lineWidth = 2;
      ctx.strokeRect(startX, startY, drawW, drawH);
      ctx.setLineDash([]);

      state.scaledRooms.forEach(room => {
        const rx = startX + room.x * scale;
        const ry = startY + drawH - (room.y + room.h) * scale;
        const rw = room.w * scale;
        const rh = room.h * scale;

        ctx.fillStyle = ROOM_COLORS[room.type] || "#FFFFFF";
        ctx.fillRect(rx, ry, rw, rh);

        drawVectorFurniture(ctx, room, scale, rx, ry, rw, rh);

        ctx.strokeStyle = "#1C1917";
        ctx.lineWidth = 5;
        ctx.strokeRect(rx, ry, rw, rh);

        (room.windows || []).forEach(win => {
          ctx.strokeStyle = "#0284C7";
          ctx.lineWidth = 4.5;
          const winW = win.width * scale;
          const offset = win.offset * scale;
          ctx.beginPath();
          if (win.wall === "north") { ctx.moveTo(rx + offset, ry); ctx.lineTo(rx + offset + winW, ry); }
          else if (win.wall === "south") { ctx.moveTo(rx + offset, ry + rh); ctx.lineTo(rx + offset + winW, ry + rh); }
          else if (win.wall === "west") { ctx.moveTo(rx, ry + rh - offset); ctx.lineTo(rx, ry + rh - offset - winW); }
          else if (win.wall === "east") { ctx.moveTo(rx + rw, ry + rh - offset); ctx.lineTo(rx + rw, ry + rh - offset - winW); }
          ctx.stroke();
        });

        (room.doors || []).forEach(door => {
          const doorW = door.width * scale;
          const offset = door.offset * scale;
          let dx = rx, dy = ry;
          if (door.wall === "south") {
            dx = rx + offset; dy = ry + rh;
            ctx.strokeStyle = ROOM_COLORS[room.type] || "#FFF";
            ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx + doorW, dy); ctx.stroke();
            ctx.strokeStyle = "#C2410C"; ctx.lineWidth = 1.8;
            ctx.beginPath(); ctx.arc(dx, dy, doorW, 0, -Math.PI / 2, true); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx, dy - doorW); ctx.stroke();
          } else if (door.wall === "north") {
            dx = rx + offset; dy = ry;
            ctx.strokeStyle = ROOM_COLORS[room.type] || "#FFF";
            ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx + doorW, dy); ctx.stroke();
            ctx.strokeStyle = "#C2410C"; ctx.lineWidth = 1.8;
            ctx.beginPath(); ctx.arc(dx, dy, doorW, 0, Math.PI / 2, false); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx, dy + doorW); ctx.stroke();
          } else if (door.wall === "west") {
            dx = rx; dy = ry + rh - offset;
            ctx.strokeStyle = ROOM_COLORS[room.type] || "#FFF";
            ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx + doorW, dy); ctx.stroke();
            ctx.strokeStyle = "#C2410C"; ctx.lineWidth = 1.8;
            ctx.beginPath(); ctx.arc(dx, dy, doorW, -Math.PI / 2, 0, false); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx, dy); ctx.stroke();
          } else if (door.wall === "east") {
            dx = rx + rw; dy = ry + rh - offset;
            ctx.strokeStyle = ROOM_COLORS[room.type] || "#FFF";
            ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx + doorW, dy); ctx.stroke();
            ctx.strokeStyle = "#C2410C"; ctx.lineWidth = 1.8;
            ctx.beginPath(); ctx.arc(dx, dy, doorW, -Math.PI / 2, -Math.PI, true); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx - doorW, dy); ctx.stroke();
          }
        });

        ctx.fillStyle = "#1C1917";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const fs = Math.max(12, Math.min(18, rw / 6));
        ctx.font = `700 ${fs}px 'Plus Jakarta Sans', sans-serif`;
        const areaSqft = Math.round(room.w * room.h);
        const areaLabel = `${areaSqft} sqft (${(areaSqft * 0.0929).toFixed(1)} m²)`;

        if (rh > 36) {
          ctx.fillText(room.name.toUpperCase(), rx + rw / 2, ry + rh / 2 - fs * 0.6);
          ctx.font = `600 ${Math.max(10, fs - 3)}px 'Space Grotesk', monospace`;
          ctx.fillStyle = "#78716C";
          ctx.fillText(areaLabel, rx + rw / 2, ry + rh / 2 + fs * 0.8);
        } else {
          ctx.fillText(room.name, rx + rw / 2, ry + rh / 2);
        }
      });

      ctx.fillStyle = "#1C1917";
      ctx.font = "700 16px 'Space Grotesk', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(`PLOT WIDTH: ${state.plot.width} ${state.plot.unit.toUpperCase()}`, startX + drawW / 2, startY - 14);

      ctx.save();
      ctx.translate(startX - 18, startY + drawH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(`PLOT LENGTH: ${state.plot.length} ${state.plot.unit.toUpperCase()}`, 0, 0);
      ctx.restore();

      drawCompassRose(ctx, planAreaX + planAreaW - 60, planAreaY + 60, state.requirements.facing);

      // RIGHT SIDE PANEL: Tabulated Room Schedule & Professional Title Block
      const panelX = 1670;
      const panelY = 130;
      const panelW = 670;
      const panelH = 1400;

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(panelX, panelY, panelW, panelH);
      ctx.strokeStyle = "#DDD8CC";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(panelX, panelY, panelW, panelH);

      ctx.fillStyle = "#1C1917";
      ctx.font = "700 16px 'Plus Jakarta Sans', sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("ARCHITECTURAL ROOM SCHEDULE", panelX + 24, panelY + 24);

      const thY = panelY + 56;
      ctx.fillStyle = "#F4F2EC";
      ctx.fillRect(panelX + 20, thY, panelW - 40, 30);
      ctx.fillStyle = "#1C1917";
      ctx.font = "700 11px 'Space Grotesk', monospace";
      ctx.fillText("#", panelX + 30, thY + 8);
      ctx.fillText("SPACE NAME", panelX + 60, thY + 8);
      ctx.fillText("DIMENSIONS", panelX + 240, thY + 8);
      ctx.fillText("AREA", panelX + 370, thY + 8);
      ctx.fillText("SPECIFICATION", panelX + 470, thY + 8);

      let totalArea = 0;
      let rowY = thY + 34;
      const specMap = {
        hall: "Oak Hardwood Planks",
        bedroom: "Natural Oak Flooring",
        kitchen: "Polished Granite / Tile",
        bathroom: "Honed Porcelain Tile",
        dining: "Natural Oak Parquet",
        parking: "Reinforced Slate Paver",
        study: "Oak Plank & Millwork",
        pooja: "Marble Altar Platform",
        balcony: "Teak Decking & Glass Rail"
      };

      state.scaledRooms.forEach((r, idx) => {
        const area = Math.round(r.w * r.h);
        totalArea += area;
        if (idx % 2 === 1) {
          ctx.fillStyle = "#FAF8F2";
          ctx.fillRect(panelX + 20, rowY - 4, panelW - 40, 24);
        }
        ctx.fillStyle = "#1C1917";
        ctx.font = "600 12px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText(String(idx + 1).padStart(2, "0"), panelX + 30, rowY);
        ctx.fillText(r.name, panelX + 60, rowY);

        ctx.font = "500 11px 'Space Grotesk', monospace";
        ctx.fillText(`${r.w.toFixed(1)}' × ${r.h.toFixed(1)}'`, panelX + 240, rowY);
        ctx.fillText(`${area} sqft`, panelX + 370, rowY);

        ctx.font = "500 10px 'Plus Jakarta Sans', sans-serif";
        ctx.fillStyle = "#78716C";
        ctx.fillText(specMap[r.type] || "Standard Interior", panelX + 470, rowY);

        rowY += 26;
      });

      ctx.strokeStyle = "#1C1917";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(panelX + 20, rowY + 6);
      ctx.lineTo(panelX + panelW - 20, rowY + 6);
      ctx.stroke();

      rowY += 14;
      ctx.fillStyle = "#1C1917";
      ctx.font = "700 13px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText("TOTAL BUILT-UP AREA:", panelX + 60, rowY);
      ctx.font = "700 13px 'Space Grotesk', monospace";
      ctx.fillText(`${totalArea.toLocaleString()} SQFT (${(totalArea * 0.0929).toFixed(1)} M²)`, panelX + 370, rowY);

      // Section 2: Compliance Metrics
      const compY = rowY + 50;
      ctx.fillStyle = "#1C1917";
      ctx.font = "700 14px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText("COMPLIANCE & VASTU VERIFICATION", panelX + 24, compY);

      let chkY = compY + 28;
      state.checks.slice(0, 5).forEach(chk => {
        ctx.fillStyle = chk.pass ? "#15803D" : "#B45309";
        ctx.font = "700 12px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText(chk.pass ? "✓ PASS" : "⚠ NOTE", panelX + 24, chkY);
        ctx.fillStyle = "#44403C";
        ctx.font = "500 11px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText(chk.message.slice(0, 65) + (chk.message.length > 65 ? "..." : ""), panelX + 85, chkY);
        chkY += 22;
      });

      // Section 3: PROFESSIONAL ARCHITECTURAL TITLE BLOCK
      const tbY = panelY + panelH - 340;
      const tbH = 320;
      ctx.fillStyle = "#FAF8F2";
      ctx.fillRect(panelX + 20, tbY, panelW - 40, tbH);
      ctx.strokeStyle = "#1C1917";
      ctx.lineWidth = 2;
      ctx.strokeRect(panelX + 20, tbY, panelW - 40, tbH);

      ctx.lineWidth = 1;
      [tbY + 70, tbY + 140, tbY + 220].forEach(lineY => {
        ctx.beginPath();
        ctx.moveTo(panelX + 20, lineY);
        ctx.lineTo(panelX + panelW - 20, lineY);
        ctx.stroke();
      });

      ctx.fillStyle = "#78716C";
      ctx.font = "700 10px 'Space Grotesk', monospace";
      ctx.fillText("PROJECT & ARCHETYPE", panelX + 34, tbY + 12);
      ctx.fillStyle = "#1C1917";
      ctx.font = "700 20px 'DM Serif Display', Georgia, serif";
      ctx.fillText(candName.toUpperCase(), panelX + 34, tbY + 30);

      ctx.fillStyle = "#78716C";
      ctx.font = "700 10px 'Space Grotesk', monospace";
      ctx.fillText("STUDIO & LEAD ARCHITECT", panelX + 34, tbY + 82);
      ctx.fillStyle = "#1C1917";
      ctx.font = "600 14px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText("INTALL RESIDENTIAL PARAMETRIC STUDIO", panelX + 34, tbY + 102);

      ctx.fillStyle = "#78716C";
      ctx.font = "700 10px 'Space Grotesk', monospace";
      ctx.fillText("PLOT SIZE", panelX + 34, tbY + 152);
      ctx.fillText("SCALE", panelX + 220, tbY + 152);
      ctx.fillText("ORIENTATION", panelX + 380, tbY + 152);

      ctx.fillStyle = "#1C1917";
      ctx.font = "700 14px 'Space Grotesk', monospace";
      ctx.fillText(`${state.plot.width} × ${state.plot.length} ${state.plot.unit.toUpperCase()}`, panelX + 34, tbY + 174);
      ctx.fillText('1/4" = 1\'-0" (1:50)', panelX + 220, tbY + 174);
      ctx.fillText(`${state.requirements.facing}-FACING`, panelX + 380, tbY + 174);

      ctx.fillStyle = "#78716C";
      ctx.font = "700 10px 'Space Grotesk', monospace";
      ctx.fillText("DRAWING TITLE", panelX + 34, tbY + 232);
      ctx.fillText("DATE", panelX + 280, tbY + 232);
      ctx.fillText("SHEET NO.", panelX + 440, tbY + 232);

      ctx.fillStyle = "#1C1917";
      ctx.font = "600 13px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText("GROUND FLOOR PLAN", panelX + 34, tbY + 254);
      ctx.font = "600 13px 'Space Grotesk', monospace";
      ctx.fillText(new Date().toLocaleDateString(), panelX + 280, tbY + 254);
      ctx.font = "800 22px 'Space Grotesk', monospace";
      ctx.fillText("A-101", panelX + 440, tbY + 250);

      const dataUrl = sheet.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${candName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-Architectural-Drawing-A101.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      showToast("Professional A3 architectural drawing sheet exported.");
    }
