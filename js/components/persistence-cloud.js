/* ==========================================================================
       SAVE / EXPORT / IMPORT IMPLEMENTATION (TRD §7 & MASTER-SPEC)
       ========================================================================== */
    function exportPlanJSON() {
      const exportData = {
        app: "3D Residential Design Generator",
        version: "1.0",
        timestamp: new Date().toISOString(),
        plot: state.plot,
        requirements: state.requirements,
        selectedCandidate: state.selectedCandidate ? {
          templateId: state.selectedCandidate.template.id,
          name: state.selectedCandidate.template.name,
          finalScore: state.selectedCandidate.finalScore
        } : null,
        scaledRooms: state.scaledRooms,
        checks: state.checks,
        score: state.score
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `residential-plan-${state.plot.width}x${state.plot.length}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast("Floor plan exported successfully as JSON.");
    }

    function exportPlanPNG() {
      // High-resolution export: render to an off-screen 3× canvas with title block
      const SCALE = 3;
      const plotFt = getPlotInFeet();
      const PW = 1200, PH = 900;  // off-screen canvas size
      const offCanvas = document.createElement("canvas");
      offCanvas.width  = PW * SCALE;
      offCanvas.height = PH * SCALE;
      const octx = offCanvas.getContext("2d");
      octx.scale(SCALE, SCALE);

      // Background
      octx.fillStyle = "#F3F5F4";
      octx.fillRect(0, 0, PW, PH);

      // Grid
      octx.strokeStyle = "rgba(0,0,0,0.03)";
      octx.lineWidth = 1;
      for (let x = 0; x < PW; x += 24) { octx.beginPath(); octx.moveTo(x,0); octx.lineTo(x,PH); octx.stroke(); }
      for (let y = 0; y < PH; y += 24) { octx.beginPath(); octx.moveTo(0,y); octx.lineTo(PW,y); octx.stroke(); }

      // Title block at top
      octx.fillStyle = "#1E293B";
      octx.font = "bold 18px " + getComputedStyle(document.body).fontFamily;
      octx.textAlign = "left";
      octx.textBaseline = "top";
      const candName = state.selectedCandidate ? state.selectedCandidate.template.name : "Floor Plan";
      octx.fillText(`INTALL — ${candName.toUpperCase()}`, 40, 22);
      octx.font = "500 12px " + getComputedStyle(document.body).fontFamily;
      octx.fillStyle = "#64748B";
      octx.fillText(`Plot: ${state.plot.width} × ${state.plot.length} ${state.plot.unit}   ·   Score: ${state.score}/100   ·   Generated: ${new Date().toLocaleDateString()}`, 40, 48);

      // Draw floor plan in remaining area
      const margin = 60;
      const drawAreaY = 72;
      const drawAreaH = PH - drawAreaY - 48;
      const scale   = Math.min((PW - margin*2) / plotFt.width, drawAreaH / plotFt.length);
      const drawW   = plotFt.width  * scale;
      const drawH   = plotFt.length * scale;
      const startX  = (PW - drawW) / 2;
      const startY  = drawAreaY + (drawAreaH - drawH) / 2;

      // Plot outline
      octx.strokeStyle = "#8A9490";
      octx.setLineDash([6,4]);
      octx.lineWidth = 1.5;
      octx.strokeRect(startX, startY, drawW, drawH);
      octx.setLineDash([]);

      // Rooms
      state.scaledRooms.forEach(room => {
        const rx = startX + room.x * scale;
        const ry = startY + drawH - (room.y + room.h) * scale;
        const rw = room.w * scale;
        const rh = room.h * scale;
        octx.fillStyle = ROOM_COLORS[room.type] || "#FFFFFF";
        octx.fillRect(rx, ry, rw, rh);
        octx.strokeStyle = "#2B3632";
        octx.lineWidth = 3.5;
        octx.strokeRect(rx, ry, rw, rh);
        // Label
        octx.fillStyle = "#1E293B";
        octx.textAlign = "center";
        octx.textBaseline = "middle";
        const fs = Math.max(9, Math.min(13, rw / 7));
        octx.font = `700 ${fs}px ` + getComputedStyle(document.body).fontFamily;
        if (rh > 24) {
          octx.fillText(room.name.toUpperCase(), rx + rw/2, ry + rh/2 - fs*0.6);
          octx.font = `500 ${Math.max(8,fs-2)}px ` + getComputedStyle(document.body).fontFamily;
          octx.fillStyle = "#64748B";
          octx.fillText(`${Math.round(room.w*room.h)} sqft`, rx + rw/2, ry + rh/2 + fs*0.8);
        }
      });

      // Dimension callouts
      octx.fillStyle = "#334155";
      octx.font = "600 11px " + getComputedStyle(document.body).fontFamily;
      octx.textAlign = "center"; octx.textBaseline = "bottom";
      octx.fillText(`WIDTH: ${state.plot.width} ${state.plot.unit}`, startX + drawW/2, startY - 8);
      octx.save();
      octx.translate(startX - 12, startY + drawH/2); octx.rotate(-Math.PI/2);
      octx.fillText(`LENGTH: ${state.plot.length} ${state.plot.unit}`, 0, 0);
      octx.restore();

      // Scale ruler
      const rulerFt = [1,2,5,10,15,20,25].find(f => f*scale >= 48) || 20;
      const rulerPx = rulerFt * scale;
      octx.strokeStyle = "#334155"; octx.lineWidth = 2;
      octx.beginPath(); octx.moveTo(startX, startY + drawH + 22); octx.lineTo(startX + rulerPx, startY + drawH + 22); octx.stroke();
      [startX, startX+rulerPx].forEach(tx => { octx.beginPath(); octx.moveTo(tx, startY+drawH+18); octx.lineTo(tx, startY+drawH+26); octx.stroke(); });
      octx.fillStyle = "#334155"; octx.textAlign="center"; octx.textBaseline="top"; octx.font="600 10px sans-serif";
      octx.fillText(`0`, startX, startY+drawH+28);
      octx.fillText(`${rulerFt} ${state.plot.unit}`, startX+rulerPx, startY+drawH+28);

      const dataUrl = offCanvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `floor-plan-${state.plot.width}x${state.plot.length}-HQ.png`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      showToast("High-resolution architectural blueprint PNG downloaded.");
    }

    function triggerImportJSON() {
      const input = document.getElementById("importFileInput");
      if (input) input.click();
    }

    function handleImportFile(event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const imported = JSON.parse(e.target.result);
          if (imported.plot && imported.requirements) {
            state.plot         = imported.plot;
            state.requirements = imported.requirements;

            // Sync inputs
            const widthInput  = document.getElementById("plotWidthInput");
            const lengthInput = document.getElementById("plotLengthInput");
            if (widthInput)  widthInput.value  = state.plot.width;
            if (lengthInput) lengthInput.value = state.plot.length;
            setBHK(state.requirements.bhk);
            setParking(state.requirements.parking);
            setKitchen(state.requirements.kitchen);
            setFacing(state.requirements.facing);

            // Re-locate template from library
            const tId      = imported.selectedCandidate ? imported.selectedCandidate.templateId : null;
            const template = TEMPLATES.find(t => t.id === tId) || TEMPLATES[0];

            // === RE-COMPUTE (not blindly restore) scaledRooms + checks ===
            const plotFt     = getPlotInFeet();
            const reScaled   = scaleTemplate(template, plotFt);
            const reChecks   = runConstraintChecks(reScaled, plotFt, state.requirements);
            const passRate   = reChecks.filter(c => c.pass).length / reChecks.length;
            const mScore     = imported.selectedCandidate ? (imported.selectedCandidate.finalScore / 100) : 0.85;
            const reScore    = Math.round((passRate * 0.6 + (mScore * 0.4)) * 100);

            state.selectedCandidate = {
              template,
              finalScore:   reScore,
              scaledRooms:  reScaled,
              checks:       reChecks,
              aspectScore:  0.8, // fallback — matcher not re-run
              facingScore:  template.facing === state.requirements.facing ? 1.0 : 0.5,
              extrasScore:  1.0
            };
            state.scaledRooms = reScaled;
            state.checks      = reChecks;
            state.score       = reScore;

            onPlotInputChanged();
            goToScreen(4);
            showToast("Plan loaded and re-validated from JSON.");
          } else {
            showToast("Invalid project JSON structure.");
          }
        } catch (err) {
          console.error("Import error:", err);
          showToast("Failed to parse plan JSON file.");
        }
      };
      reader.readAsText(file);
      event.target.value = "";
    }

    /* ==========================================================================
       ARCHITECTURAL BACKEND INTEGRATION: CLOUD PERSISTENCE, BOM & AUDIT
       ========================================================================== */
    async function loadSharedPlan(planId) {
      try {
        showToast("Loading shared design from cloud...");
        const res = await fetch(`/api/plans/${planId}`);
        if (!res.ok) throw new Error("Plan not found");
        const json = await res.json();
        if (!json.success || !json.plan) throw new Error("Invalid plan data");

        const p = json.plan;
        state.plot.width = p.plot.width;
        state.plot.length = p.plot.length;
        state.plot.unit = p.plot.unit || "ft";
        state.requirements.bhk = p.bhk;
        if (p.archStyle) state.requirements.archStyle = p.archStyle;

        state.scaledRooms = p.rooms;
        state.originalRooms = JSON.parse(JSON.stringify(p.rooms));
        state.selectedCandidate = {
          id: p.id,
          name: p.name,
          bhk: p.bhk,
          rooms: p.rooms,
          template: { name: p.name },
          referencePlot: p.plot
        };

        // Initialize and advance to screen 4
        onPlotInputChanged();
        goToScreen(4);
        render2DPlan();
        if (state.view === "3d") render3DScene();
        showToast(`Restored plan '${p.name}' from cloud database.`);
      } catch (err) {
        console.error("Failed to load shared plan:", err);
        showToast("Could not load shared plan: " + err.message);
      }
    }

    async function openShareModal() {
      if (!state.scaledRooms || state.scaledRooms.length === 0) {
        showToast("Please generate or select a floor plan first.");
        return;
      }
      const modal = document.getElementById("shareModalBackdrop");
      if (modal) modal.classList.add("show");

      const linkInput = document.getElementById("shareLinkInput");
      if (linkInput) linkInput.value = "Saving to database...";

      const summaryCard = document.getElementById("sharePlanSummaryCard");
      if (summaryCard) {
        summaryCard.innerHTML = `
          <div style="background:var(--bg-subtle); padding:10px; border-radius:var(--radius-sm); border:1px solid var(--card-border);">
            <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Plot Scale</div>
            <div style="font-size:0.92rem; font-weight:700; color:var(--text-main);">${state.plot.width} × ${state.plot.length} ${state.plot.unit}</div>
          </div>
          <div style="background:var(--bg-subtle); padding:10px; border-radius:var(--radius-sm); border:1px solid var(--card-border);">
            <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Typology</div>
            <div style="font-size:0.92rem; font-weight:700; color:var(--text-main);">${state.requirements.bhk} BHK Residence</div>
          </div>
          <div style="background:var(--bg-subtle); padding:10px; border-radius:var(--radius-sm); border:1px solid var(--card-border);">
            <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Rooms</div>
            <div style="font-size:0.92rem; font-weight:700; color:var(--text-main);">${state.scaledRooms.length} Enclosed Spaces</div>
          </div>
        `;
      }

      try {
        const payload = {
          name: (state.selectedCandidate && (state.selectedCandidate.name || (state.selectedCandidate.template && state.selectedCandidate.template.name))) || "Custom Architectural Residence",
          plot: state.plot,
          bhk: state.requirements.bhk,
          requirements: state.requirements,
          rooms: state.scaledRooms,
          lastAction: "Cloud Share"
        };
        const res = await fetch("/api/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success && data.plan) {
          const shareUrl = window.location.origin + data.plan.shareUrl;
          if (linkInput) linkInput.value = shareUrl;
          showToast("Plan saved to database. Permanent URL ready.");
        } else {
          throw new Error(data.error || "Save failed");
        }
      } catch (err) {
        console.error("Save plan error:", err);
        if (linkInput) linkInput.value = window.location.href;
      }
    }

    function closeShareModal() {
      const modal = document.getElementById("shareModalBackdrop");
      if (modal) modal.classList.remove("show");
    }

    function copyShareLink() {
      const linkInput = document.getElementById("shareLinkInput");
      if (!linkInput) return;
      linkInput.select();
      navigator.clipboard.writeText(linkInput.value).then(() => {
        const btn = document.getElementById("copyShareLinkBtn");
        if (btn) {
          const orig = btn.textContent;
          btn.textContent = "Copied!";
          setTimeout(() => { btn.textContent = orig; }, 2000);
        }
        showToast("Share link copied to clipboard.");
      });
    }

    let currentBOMData = null;

    async function openBOMModal() {
      if (!state.scaledRooms || state.scaledRooms.length === 0) {
        showToast("Please select a floor plan first.");
        return;
      }
      const modal = document.getElementById("bomModalBackdrop");
      if (modal) modal.classList.add("show");

      const body = document.getElementById("bomLineItemsBody");
      if (body) body.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:24px; color:var(--text-muted);">Calculating Bill of Materials from geometry...</td></tr>';

      try {
        const res = await fetch("/api/estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plot: state.plot, rooms: state.scaledRooms })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Failed takeoff calculation");
        currentBOMData = data;

        // Render quick metrics strip
        const metricsStrip = document.getElementById("bomMetricsStrip");
        if (metricsStrip) {
          metricsStrip.innerHTML = `
            <div style="background:var(--bg-subtle); padding:12px; border-radius:var(--radius-sm); border:1px solid var(--card-border);">
              <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Estimated Total</div>
              <div style="font-size:1.35rem; font-weight:800; color:var(--accent);">${data.currencySymbol}${data.grandTotal.toLocaleString('en-IN')}</div>
            </div>
            <div style="background:var(--bg-subtle); padding:12px; border-radius:var(--radius-sm); border:1px solid var(--card-border);">
              <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Cost / Sq.Ft</div>
              <div style="font-size:1.35rem; font-weight:800; color:var(--text-main);">${data.currencySymbol}${data.metrics.costPerSqft.toLocaleString('en-IN')}</div>
            </div>
            <div style="background:var(--bg-subtle); padding:12px; border-radius:var(--radius-sm); border:1px solid var(--card-border);">
              <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Built-Up Area</div>
              <div style="font-size:1.35rem; font-weight:800; color:var(--text-main);">${data.metrics.totalBuiltUpAreaSqft.toLocaleString('en-IN')} sqft</div>
            </div>
            <div style="background:var(--bg-subtle); padding:12px; border-radius:var(--radius-sm); border:1px solid var(--card-border);">
              <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Wall Surface</div>
              <div style="font-size:1.35rem; font-weight:800; color:var(--text-main);">${data.metrics.netWallSurfaceSqft.toLocaleString('en-IN')} sqft</div>
            </div>
          `;
        }

        // Render category summary pills
        const catTabs = document.getElementById("bomCategoryTabs");
        if (catTabs) {
          catTabs.innerHTML = Object.keys(data.categoryTotals).map(cat => `
            <div style="background:#FFF; border:1px solid var(--card-border); padding:6px 12px; border-radius:var(--radius-pill); font-size:0.78rem; display:flex; gap:6px; align-items:center;">
              <span style="font-weight:600; color:var(--text-main);">${cat}:</span>
              <span style="font-family:var(--font-mono); font-weight:700; color:var(--accent);">${data.currencySymbol}${data.categoryTotals[cat].toLocaleString('en-IN')}</span>
            </div>
          `).join("");
        }

        // Render line items
        if (body) {
          body.innerHTML = data.lineItems.map(item => `
            <tr style="border-bottom:1px solid var(--card-border);">
              <td style="padding:10px 14px;">
                <div style="font-weight:600; color:var(--text-main);">${item.item}</div>
                <div style="font-size:0.74rem; color:var(--text-muted);">${item.rateDetails}</div>
              </td>
              <td style="padding:10px 14px; font-family:var(--font-mono);">${item.quantity.toLocaleString('en-IN')} ${item.unit}</td>
              <td style="padding:10px 14px; font-family:var(--font-mono);">${data.currencySymbol}${item.unitRate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td style="padding:10px 14px; font-family:var(--font-mono); font-weight:700; text-align:right;">${data.currencySymbol}${item.subtotal.toLocaleString('en-IN')}</td>
            </tr>
          `).join("");
        }

      } catch (err) {
        console.error("BOM error:", err);
        if (body) body.innerHTML = `<tr><td colspan="4" style="color:var(--danger); padding:20px; text-align:center;">Error calculating takeoff: ${err.message}</td></tr>`;
      }
    }

    function closeBOMModal() {
      const modal = document.getElementById("bomModalBackdrop");
      if (modal) modal.classList.remove("show");
    }

    function exportBOMCSV() {
      if (!currentBOMData || !currentBOMData.lineItems) return;
      let csv = "Category,Item Description,Quantity,Unit,Unit Rate,Subtotal\n";
      currentBOMData.lineItems.forEach(i => {
        csv += `"${i.category}","${i.item.replace(/"/g, '""')}",${i.quantity},"${i.unit}",${i.unitRate},${i.subtotal}\n`;
      });
      csv += `\n"SUMMARY","TOTAL ESTIMATED TURNKEY COST",${currentBOMData.metrics.totalBuiltUpAreaSqft},"sqft",${currentBOMData.metrics.costPerSqft},${currentBOMData.grandTotal}\n`;

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `takeoff-${state.plot.width}x${state.plot.length}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Exported Bill of Materials as CSV.");
    }

    async function openAuditModal() {
      if (!state.scaledRooms || state.scaledRooms.length === 0) {
        showToast("Please select a floor plan first.");
        return;
      }
      const modal = document.getElementById("auditModalBackdrop");
      if (modal) modal.classList.add("show");

      const checklistContainer = document.getElementById("auditChecklist");
      if (checklistContainer) checklistContainer.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-muted);">Auditing bylaws compliance...</div>';

      try {
        const res = await fetch("/api/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plot: state.plot, rooms: state.scaledRooms })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Failed audit");

        // Render Score Strip
        const scoreStrip = document.getElementById("auditScoreStrip");
        if (scoreStrip) {
          const pass = data.summary.isOverallCompliant;
          scoreStrip.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:space-between; background:${pass ? '#F0FDF4' : '#FFFBEB'}; border:1px solid ${pass ? '#BBF7D0' : '#FDE68A'}; padding:16px 20px; border-radius:var(--radius-md);">
              <div>
                <div style="font-size:0.76rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:${pass ? '#15803D' : '#B45309'}; margin-bottom:2px;">
                  Bylaw Status: ${pass ? 'COMPLIANT' : 'ADVISORY NOTICES DETECTED'}
                </div>
                <div style="font-size:1.15rem; font-weight:800; color:var(--text-main);">
                  ${data.summary.passedCount} of ${data.summary.totalChecksCount} Statutory Standards Satisfied
                </div>
              </div>
              <div style="display:flex; align-items:baseline; gap:4px; font-family:var(--font-mono); font-size:2rem; font-weight:800; color:${pass ? '#15803D' : '#B45309'};">
                ${data.summary.complianceScore}<span style="font-size:1rem; color:var(--text-muted);">%</span>
              </div>
            </div>
          `;
        }

        // Render Setbacks Grid
        const setbacksGrid = document.getElementById("auditSetbacksGrid");
        if (setbacksGrid) {
          const s = data.setbacks;
          setbacksGrid.innerHTML = `
            <div style="background:#FFF; border:1px solid var(--card-border); padding:10px; border-radius:var(--radius-sm);">
              <div style="font-size:0.70rem; color:var(--text-muted); text-transform:uppercase;">Front Road Setback</div>
              <div style="font-size:1.1rem; font-weight:800; color:${s.front.passed ? 'var(--accent)' : 'var(--danger)'}; font-family:var(--font-mono);">${s.front.actual} ft</div>
              <div style="font-size:0.72rem; color:var(--text-muted);">Min: ${s.front.required} ft</div>
            </div>
            <div style="background:#FFF; border:1px solid var(--card-border); padding:10px; border-radius:var(--radius-sm);">
              <div style="font-size:0.70rem; color:var(--text-muted); text-transform:uppercase;">Rear Yard Setback</div>
              <div style="font-size:1.1rem; font-weight:800; color:${s.rear.passed ? 'var(--accent)' : 'var(--danger)'}; font-family:var(--font-mono);">${s.rear.actual} ft</div>
              <div style="font-size:0.72rem; color:var(--text-muted);">Min: ${s.rear.required} ft</div>
            </div>
            <div style="background:#FFF; border:1px solid var(--card-border); padding:10px; border-radius:var(--radius-sm);">
              <div style="font-size:0.70rem; color:var(--text-muted); text-transform:uppercase;">Left Boundary</div>
              <div style="font-size:1.1rem; font-weight:800; color:${s.left.passed ? 'var(--accent)' : 'var(--danger)'}; font-family:var(--font-mono);">${s.left.actual} ft</div>
              <div style="font-size:0.72rem; color:var(--text-muted);">Min: ${s.left.required} ft</div>
            </div>
            <div style="background:#FFF; border:1px solid var(--card-border); padding:10px; border-radius:var(--radius-sm);">
              <div style="font-size:0.70rem; color:var(--text-muted); text-transform:uppercase;">Right Boundary</div>
              <div style="font-size:1.1rem; font-weight:800; color:${s.right.passed ? 'var(--accent)' : 'var(--danger)'}; font-family:var(--font-mono);">${s.right.actual} ft</div>
              <div style="font-size:0.72rem; color:var(--text-muted);">Min: ${s.right.required} ft</div>
            </div>
          `;
        }

        // Render Checklist
        if (checklistContainer) {
          checklistContainer.innerHTML = data.checks.map(c => `
            <div style="display:flex; justify-content:space-between; align-items:flex-start; padding:8px 0; border-bottom:1px solid rgba(0,0,0,0.06);">
              <div style="display:flex; gap:10px; align-items:flex-start;">
                <span style="font-size:0.75rem; font-weight:700; padding:2px 6px; border-radius:4px; ${c.passed ? 'background:#DCFCE7; color:#166534;' : c.severity === 'critical' ? 'background:#FEE2E2; color:#991B1B;' : 'background:#FEF3C7; color:#92400E;'}">${c.passed ? 'PASS' : c.severity === 'critical' ? 'FAIL' : 'WARN'}</span>
                <div>
                  <div style="font-size:0.86rem; font-weight:600; color:var(--text-main);">${c.name}</div>
                  <div style="font-size:0.76rem; color:var(--text-muted);">${c.message}</div>
                </div>
              </div>
              <div style="text-align:right; flex-shrink:0;">
                <span style="font-size:0.76rem; font-family:var(--font-mono); font-weight:700; color:${c.passed ? '#15803D' : '#B45309'};">${c.actual}</span>
              </div>
            </div>
          `).join("");
        }

      } catch (err) {
        console.error("Audit error:", err);
        if (checklistContainer) checklistContainer.innerHTML = `<div style="color:var(--danger); padding:16px;">Error during audit: ${err.message}</div>`;
      }
    }

    function closeAuditModal() {
      const modal = document.getElementById("auditModalBackdrop");
      if (modal) modal.classList.remove("show");
    }
