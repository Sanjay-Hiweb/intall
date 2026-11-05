    /* ==========================================================================
       PARAMETRIC ENGINE (TRD §4.2)
       ========================================================================== */
    function scaleTemplate(template, userPlot) {
      // Maintain exact architectural fidelity of the sketch.
      // Rooms, courtyards, and corridors preserve their authentic designed proportions:
      const scale = Math.min(userPlot.width / template.referencePlot.width, userPlot.length / template.referencePlot.length);
      const footprintW = template.referencePlot.width * scale;
      const footprintH = template.referencePlot.length * scale;
      const offsetX = Math.max(0, (userPlot.width - footprintW) / 2);
      const offsetY = Math.max(0, (userPlot.length - footprintH) / 2);

      return template.rooms.map(r => ({
        ...r,
        floor: r.floor || "ground",
        x: Number((offsetX + r.x * scale).toFixed(2)),
        y: Number((offsetY + r.y * scale).toFixed(2)),
        w: Number((r.w * scale).toFixed(2)),
        h: Number((r.h * scale).toFixed(2)),
        doors: (r.doors || []).map(d => ({
          ...d,
          offset: Number((d.offset * scale).toFixed(2)),
          width: Number((d.width * scale).toFixed(2))
        })),
        windows: (r.windows || []).map(win => ({
          ...win,
          offset: Number((win.offset * scale).toFixed(2)),
          width: Number((win.width * scale).toFixed(2))
        }))
      }));
    }

    /* ==========================================================================
       CONSTRAINT ENGINE (TRD §4.4)
       ========================================================================== */
    function runConstraintChecks(rooms, plot, requirements) {
      const checks = [];

      // 1. Room Minimum Sizes
      const MIN_SIZES = {
        bedroom: 85,
        kitchen: 55,
        bathroom: 24,
        hall: 110,
        dining: 70,
        parking: 95,
        pooja: 18,
        study: 45,
        servant: 45
      };

      let undersizedRooms = [];
      rooms.forEach(r => {
        const area = r.w * r.h;
        const min = MIN_SIZES[r.type];
        if (min && area < min) {
          undersizedRooms.push(`${r.name} (${Math.round(area)} sqft)`);
        }
      });

      if (undersizedRooms.length === 0) {
        checks.push({ pass: true, message: "Room Sizes: All rooms satisfy standard residential minimum areas." });
      } else {
        checks.push({ pass: false, message: `Room Sizes: ${undersizedRooms.join(", ")} below standard comfortable area.` });
      }

      // 2. Plot Bounds
      let outOfBounds = false;
      rooms.forEach(r => {
        if (r.x + r.w > plot.width + 0.1 || r.y + r.h > plot.length + 0.1 || r.x < -0.01 || r.y < -0.01) {
          outOfBounds = true;
        }
      });
      checks.push({
        pass: !outOfBounds,
        message: !outOfBounds ? "Boundary: All rooms fit cleanly within plot boundaries." : "Boundary: One or more rooms exceed plot limits."
      });

      // 3. Room Overlap
      let overlapFound = false;
      for (let i = 0; i < rooms.length; i++) {
        for (let j = i + 1; j < rooms.length; j++) {
          const a = rooms[i];
          const b = rooms[j];
          if ((a.floor || "ground") !== (b.floor || "ground")) continue;
          const overlapX = (a.x < b.x + b.w - 0.05) && (a.x + a.w > b.x + 0.05);
          const overlapY = (a.y < b.y + b.h - 0.05) && (a.y + a.h > b.y + 0.05);
          if (overlapX && overlapY) {
            overlapFound = true;
            break;
          }
        }
      }
      checks.push({
        pass: !overlapFound,
        message: !overlapFound ? "Layout Geometry: Zero overlapping room partitions detected." : "Layout Geometry: Overlapping room areas detected."
      });

      // 4. Doors presence
      let missingDoors = rooms.filter(r => !r.doors || r.doors.length === 0);
      checks.push({
        pass: missingDoors.length === 0,
        message: missingDoors.length === 0 ? "Circulation: Every room has functional door access points." : `Circulation: ${missingDoors.map(r => r.name).join(", ")} missing door access.`
      });

      // 5. Parking present if requested
      if (requirements.parking !== "none") {
        const hasPark = rooms.some(r => r.type === "parking");
        checks.push({
          pass: hasPark,
          message: hasPark ? "Parking: Dedicated vehicle carport accommodation verified." : "Parking: Car parking requested but not present in layout."
        });
      }

      // 6. Hallway / Circulation width
      const narrowPassages = rooms.filter(r => r.type === "passage" && Math.min(r.w, r.h) < 2.8);
      checks.push({
        pass: narrowPassages.length === 0,
        message: narrowPassages.length === 0 ? "Corridors: Passages maintain accessible circulation width (≥3ft)." : "Corridors: Narrow hallway passage width detected (<3ft)."
      });

      return checks;
    }
