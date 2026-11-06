    /* ==========================================================================
       MATCHING & SCORING ENGINES (TRD §4.1, §4.5)
       ========================================================================== */
    function findCandidates() {
      const plotFt = getPlotInFeet();
      const userRatio = plotFt.width / plotFt.length;
      const req = state.requirements;
      const targetType = req.houseType || "normal";

      // Step 1: Filter by typology + BHK + parking
      let pool = TEMPLATES.filter(t => {
        const isDuplex = t.houseType === "duplex";
        const typeMatch = (targetType === "duplex") ? isDuplex : (!isDuplex);
        const bhkMatch = t.bhk === req.bhk;
        const parkingMatch = req.parking === "none" ? true : t.hasParking === true;
        return typeMatch && bhkMatch && parkingMatch;
      });

      let noExactMatch = false;

      // Fallback 1: Relax parking within same houseType
      if (pool.length === 0) {
        pool = TEMPLATES.filter(t => {
          const isDuplex = t.houseType === "duplex";
          const typeMatch = (targetType === "duplex") ? isDuplex : (!isDuplex);
          return typeMatch && t.bhk === req.bhk;
        });
      }

      // Fallback 2: Relax BHK ±1 within same houseType
      if (pool.length === 0) {
        pool = TEMPLATES.filter(t => {
          const isDuplex = t.houseType === "duplex";
          const typeMatch = (targetType === "duplex") ? isDuplex : (!isDuplex);
          return typeMatch && Math.abs(t.bhk - req.bhk) <= 1;
        });
        if (pool.length > 0) noExactMatch = true;
      }

      // Fallback 3: Relax houseType if still empty
      if (pool.length === 0) {
        pool = TEMPLATES.filter(t => t.bhk === req.bhk);
        noExactMatch = true;
      }

      // Fallback 4: All templates
      if (pool.length === 0) {
        pool = TEMPLATES;
        noExactMatch = true;
      }

      document.getElementById("noExactMatchBanner").style.display = noExactMatch ? "block" : "none";

      // Step 2: Soft Scoring
      const scoredCandidates = pool.map(template => {
        const templateRatio = template.referencePlot.width / template.referencePlot.length;
        
        // Aspect score
        const maxRatio = Math.max(userRatio, templateRatio);
        const aspectScore = Math.max(0, 1 - Math.abs(userRatio - templateRatio) / maxRatio);

        // Facing score
        let facingScore = 0;
        if (template.facing === req.facing) {
          facingScore = 1.0;
        } else if (
          (template.facing === "N" && (req.facing === "E" || req.facing === "W")) ||
          (template.facing === "S" && (req.facing === "E" || req.facing === "W")) ||
          (template.facing === "E" && (req.facing === "N" || req.facing === "S")) ||
          (template.facing === "W" && (req.facing === "N" || req.facing === "S"))
        ) {
          facingScore = 0.5;
        } else {
          facingScore = 0.1;
        }

        // Extras score
        let extrasScore = 1.0;
        if (req.extras.length > 0) {
          let matched = 0;
          req.extras.forEach(extra => {
            if (template.rooms.some(r => r.type === extra)) matched++;
          });
          extrasScore = matched / req.extras.length;
        }

        // Typology alignment score
        const isDuplex = template.houseType === "duplex";
        const isTargetDuplex = targetType === "duplex";
        const typologyScore = (isDuplex === isTargetDuplex) ? 1.0 : 0.65;

        const matcherScore = aspectScore * 0.4 + facingScore * 0.25 + extrasScore * 0.15 + typologyScore * 0.2;

        // Parametric scale for pre-constraint check
        const scaledRooms = scaleTemplate(template, plotFt);
        const checks = runConstraintChecks(scaledRooms, plotFt, req);
        const passCount = checks.filter(c => c.pass).length;
        const passRate = passCount / Math.max(checks.length, 1);

        // Final combined score (0 to 100)
        const finalScore = Math.round((passRate * 0.6 + matcherScore * 0.4) * 100);

        return {
          template,
          aspectScore,
          facingScore,
          extrasScore,
          typologyScore,
          matcherScore,
          scaledRooms,
          checks,
          finalScore
        };
      });

      // Sort descending by finalScore
      scoredCandidates.sort((a, b) => b.finalScore - a.finalScore);

      // Return top candidates (at least 6 or pool size)
      state.candidates = scoredCandidates.slice(0, 8);

      renderCandidateCards();
      goToScreen(3);
    }

    function filterCandidateList(filter, btn) {
      state.candidateFilter = filter;
      document.querySelectorAll(".candidate-filter-btn").forEach(b => b.classList.remove("active"));
      if (btn) btn.classList.add("active");
      renderCandidateCards();
    }

    function renderCandidateCards() {
      const grid = document.getElementById("candidatesGrid");
      if (!grid) return;
      grid.innerHTML = "";

      // Update count tags
      const totalCount = state.candidates.length;
      const normalCount = state.candidates.filter(c => c.template.houseType !== "duplex").length;
      const duplexCount = state.candidates.filter(c => c.template.houseType === "duplex").length;

      const cAll = document.getElementById("candCountAll");
      const cNorm = document.getElementById("candCountNormal");
      const cDup = document.getElementById("candCountDuplex");
      if (cAll) cAll.textContent = totalCount;
      if (cNorm) cNorm.textContent = normalCount;
      if (cDup) cDup.textContent = duplexCount;

      let displayCandidates = state.candidates;
      if (state.candidateFilter === "normal") {
        displayCandidates = state.candidates.filter(c => c.template.houseType !== "duplex");
      } else if (state.candidateFilter === "duplex") {
        displayCandidates = state.candidates.filter(c => c.template.houseType === "duplex");
      }

      if (displayCandidates.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 36px; text-align: center; background: #FFFFFF; border-radius: var(--radius-md); border: 1px dashed var(--card-border);">
            <div style="font-size: 2rem; margin-bottom: 8px;">🏛️</div>
            <div style="font-weight: 700; color: var(--text-main); margin-bottom: 4px;">No ${state.candidateFilter === 'duplex' ? 'Duplex' : 'Normal'} matches in current shortlist</div>
            <div style="font-size: 0.84rem; color: var(--text-muted); margin-bottom: 16px;">Click 'All Archetypes' to explore all available configurations.</div>
            <button class="btn btn-secondary" onclick="filterCandidateList('all', document.getElementById('candFilterAll'))">View All Archetypes</button>
          </div>
        `;
        return;
      }

      displayCandidates.forEach((cand, idx) => {
        const t = cand.template;
        const isSelected = state.selectedCandidate && state.selectedCandidate.template.id === t.id;
        const isDuplex = t.houseType === "duplex";

        const card = document.createElement("div");
        card.className = `candidate-card ${isSelected ? "selected" : ""}`;
        card.onclick = () => selectCandidate(cand);

        // Quality score class
        let scoreClass = "high";
        if (cand.finalScore < 50) scoreClass = "low";
        else if (cand.finalScore < 80) scoreClass = "mid";

        const groundCount = t.rooms.filter(r => (r.floor || "ground") === "ground").length;
        const firstCount = t.rooms.filter(r => r.floor === "first").length;
        const floorInfo = isDuplex ? `G+1 Duplex (${groundCount}G + ${firstCount} 1F)` : `Single Level (${t.rooms.length} rms)`;
        const candImgSrc = (t && t.image) ? t.image : "assets/blueprint-elevation.jpg";

        card.innerHTML = `
          <div class="candidate-thumb-box" style="position: relative; overflow: hidden;">
            <img src="${candImgSrc}" alt="${t.name || 'Architectural Blueprint'}" id="candImg_${t.id}" class="candidate-thumb-img" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
            <canvas id="candThumb_${t.id}" class="candidate-thumb-canvas" style="display: none;"></canvas>
            <div class="thumb-elevation-tag" style="position: absolute; top: 8px; left: 8px; background: rgba(14, 26, 43, 0.88); color: #F5F2EA; font-family: var(--font-mono); font-size: 0.65rem; font-weight: 700; padding: 2px 7px; border-radius: 3px; z-index: 2; border: 1px solid rgba(228,87,46,0.5); letter-spacing: 0.5px;">★ ELEVATION</div>
            <button type="button" class="thumb-toggle-btn" onclick="event.stopPropagation(); window.toggleCandidateThumb('${t.id}')" title="Switch between 3D Elevation and 2D CAD Blueprint" style="position: absolute; top: 8px; right: 8px; background: rgba(14, 26, 43, 0.88); color: #F5F2EA; font-family: var(--font-mono); font-size: 0.62rem; padding: 3px 8px; border-radius: 3px; border: 1px solid rgba(255,255,255,0.25); cursor: pointer; z-index: 3;">📐 CAD / 3D</button>
            <div class="thumb-popover">🔍 ${t.bhk}BHK · ${t.referencePlot.width}×${t.referencePlot.length}ft · ${t.facing} Facing · ${isDuplex ? 'G+1 Duplex' : 'Ground Only'}</div>
          </div>
          <div class="candidate-body">
            <div class="candidate-header-row">
              <div class="candidate-title">${t.name}</div>
              <div class="score-badge ${scoreClass}" aria-label="Match score: ${Math.round(cand.finalScore)}%">★ ${Math.round(cand.finalScore)}%</div>
            </div>
            <div class="candidate-tags">
              ${isDuplex ? '<span class="tag-pill" style="background:#FEF3C7; color:#92400E; font-weight:700;">🏛️ Duplex (G+1)</span>' : '<span class="tag-pill">🏡 Normal (1F)</span>'}
              <span class="tag-pill">${t.bhk} BHK</span>
              <span class="tag-pill">${t.hasParking ? "🚗 Parking" : "No Parking"}</span>
              <span class="tag-pill">${t.facing} Facing</span>
              ${t.rooms.some(r => r.type === "pooja")   ? '<span class="tag-pill">Pooja</span>'   : ""}
              ${t.rooms.some(r => r.type === "study")   ? '<span class="tag-pill">Study</span>'   : ""}
              ${t.rooms.some(r => r.type === "servant") ? '<span class="tag-pill">Servant</span>' : ""}
            </div>
            <div class="candidate-footer">
              <span>Ref: ${t.referencePlot.width}×${t.referencePlot.length} ft · ${floorInfo}</span>
              <div class="selected-indicator">✓ Selected</div>
            </div>
          </div>
        `;

        grid.appendChild(card);

        // Render floor plan thumbnail
        setTimeout(() => {
          renderCandidateThumbnail(cand, 'candThumb_' + t.id);
        }, 20);
      });

      // Enable/disable Use button
      const useBtn = document.getElementById("useLayoutBtn");
      if (useBtn) useBtn.disabled = !state.selectedCandidate;
    }

    window.toggleCandidateThumb = function(tid) {
      const img = document.getElementById('candImg_' + tid);
      const canvas = document.getElementById('candThumb_' + tid);
      if (!img || !canvas) return;
      if (img.style.display === 'none') {
        img.style.display = 'block';
        canvas.style.display = 'none';
      } else {
        img.style.display = 'none';
        canvas.style.display = 'block';
      }
    };

    function renderCandidateThumbnail(cand, canvasId) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const rect = canvas.getBoundingClientRect();

      const w = rect.width > 0 ? rect.width : (canvas.clientWidth || 320);
      const h = rect.height > 0 ? rect.height : (canvas.clientHeight || 190);
      const dpr = Math.max(window.devicePixelRatio || 1, 1.5);

      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      if (ctx.resetTransform) ctx.resetTransform();
      else ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      // Drafting Paper Base
      ctx.fillStyle = "#FAF8F3";
      ctx.fillRect(0, 0, w, h);

      const plotFt = cand.template.referencePlot || (typeof getPlotInFeet === 'function' ? getPlotInFeet() : { width: 35, length: 45 });
      const padding = 14;
      const scale = Math.min((w - padding * 2) / plotFt.width, (h - padding * 2) / plotFt.length);
      const drawW = plotFt.width * scale;
      const drawH = plotFt.length * scale;
      const startX = (w - drawW) / 2;
      const startY = (h - drawH) / 2;

      // Draw plot boundary
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(startX, startY, drawW, drawH);
      ctx.strokeStyle = "#B0B5B3";
      ctx.lineWidth = 1;
      ctx.strokeRect(startX, startY, drawW, drawH);

      // Draw ground floor rooms
      const rooms = (cand.template.rooms || []).filter(r => (r.floor || "ground") === "ground");
      rooms.forEach(room => {
        const rx = startX + room.x * scale;
        // Flip Y for canvas origin (bottom-left)
        const ry = startY + drawH - (room.y + room.h) * scale;
        const rw = room.w * scale;
        const rh = room.h * scale;

        ctx.fillStyle = (typeof ROOM_COLORS !== 'undefined' && ROOM_COLORS[room.type]) ? ROOM_COLORS[room.type] : "#FFFFFF";
        ctx.fillRect(rx, ry, rw, rh);

        ctx.strokeStyle = "#4B5563";
        ctx.lineWidth = 1.2;
        ctx.strokeRect(rx, ry, rw, rh);
      });
    }

    function selectCandidate(cand) {
      state.selectedCandidate = cand;
      state.scaledRooms = cand.scaledRooms;
      state.checks = cand.checks;
      state.score = cand.finalScore;
      state.houseType = cand.template.houseType || "normal";
      state.activeFloor = "ground";
      state.view3DFloor = state.houseType === "duplex" ? "both" : "ground";

      // Update card styles
      document.querySelectorAll(".candidate-card").forEach(el => el.classList.remove("selected"));
      renderCandidateCards();
    }

    function autoPickBestCandidate() {
      if (state.candidates.length > 0) {
        selectCandidate(state.candidates[0]);
        useSelectedCandidate();
      }
    }

    function useSelectedCandidate() {
      if (!state.selectedCandidate) return;
      const t = state.selectedCandidate.template;
      // Adopt archetype's authentic specifications so 2D sketch and 3D model match 1:1
      state.plot.width = t.referencePlot.width;
      state.plot.length = t.referencePlot.length;
      const plotFt = getPlotInFeet();
      state.scaledRooms = scaleTemplate(t, plotFt);
      state.originalRooms = JSON.parse(JSON.stringify(state.scaledRooms));
      state.roomAdjustments = {};
      state.houseType = t.houseType || "normal";
      state.activeFloor = "ground";
      state.view3DFloor = state.houseType === "duplex" ? "both" : "ground";
      state.exploded3D = false;
      const firstActiveRoom = state.scaledRooms.find(r => (r.floor || "ground") === state.activeFloor);
      state.selectedRoomId = firstActiveRoom ? firstActiveRoom.id : (state.scaledRooms[0] ? state.scaledRooms[0].id : null);

      // Keep plot inputs synchronized
      const pW = document.getElementById("plotWidthInput");
      const pL = document.getElementById("plotLengthInput");
      if (pW) pW.value = t.referencePlot.width;
      if (pL) pL.value = t.referencePlot.length;
      if (typeof updatePlotDisplay === "function") updatePlotDisplay();

      updateFloorUI();
      initDrawerRooms();
      goToScreen(4);
    }
