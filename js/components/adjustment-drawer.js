    /* ==========================================================================
       POST-PLANNING LIVE ADJUSTMENT ENGINE (ZERO-AI DETERMINISTIC CONTROL)
       ========================================================================== */
    function toggleAdjustmentDrawer() {
      const drawer = document.getElementById("adjustmentDrawer");
      if (!drawer) return;
      const isOpen = drawer.classList.toggle("open");
      const btn = document.getElementById("openAdjustDrawerBtn");
      if (btn) btn.classList.toggle("active", isOpen);
      if (isOpen) {
        initDrawerRooms();
        if (state.selectedRoomId) selectRoom(state.selectedRoomId);
      }
    }

    function initDrawerRooms() {
      if (!state.scaledRooms) return;
      const sel = document.getElementById("drawerRoomSelect");
      if (!sel) return;

      const hasUpper = state.scaledRooms.some(r => r.floor === "first");
      sel.innerHTML = state.scaledRooms.map(r => {
        const floorPrefix = hasUpper ? (r.floor === "first" ? "[1F] " : "[GF] ") : "";
        return `<option value="${r.id}" ${r.id === state.selectedRoomId ? 'selected' : ''}>${floorPrefix}${r.name} (${Math.round(r.w * r.h)} sqft)</option>`;
      }).join("");

      updateSwapTargetSelect();
    }

    function updateSwapTargetSelect() {
      const swapSel = document.getElementById("swapRoomTargetSelect");
      if (!swapSel || !state.scaledRooms) return;
      const otherRooms = state.scaledRooms.filter(r => r.id !== state.selectedRoomId);
      const hasUpper = state.scaledRooms.some(r => r.floor === "first");
      swapSel.innerHTML = otherRooms.map(r => {
        const floorPrefix = hasUpper ? (r.floor === "first" ? "[1F] " : "[GF] ") : "";
        return `<option value="${r.id}">${floorPrefix}${r.name} (${Math.round(r.w * r.h)} sqft)</option>`;
      }).join("");
    }

    function onDrawerSelectRoom(roomId) {
      selectRoom(roomId);
    }

    function selectRoom(roomId) {
      state.selectedRoomId = roomId;
      const room = (state.scaledRooms || []).find(r => r.id === roomId);
      if (!room) return;

      if (room.floor && room.floor !== state.activeFloor && state.activeFloor !== "both") {
        state.activeFloor = room.floor;
        updateFloorUI();
        if (state.view && state.view.startsWith("2d")) {
          render2DPlan();
        }
      }

      const badge = document.getElementById("drawerSelectedRoomBadge");
      if (badge) badge.textContent = room.name;
      const sel = document.getElementById("drawerRoomSelect");
      if (sel) sel.value = roomId;

      const areaEl = document.getElementById("drawerRoomAreaText");
      if (areaEl) areaEl.textContent = `${Math.round(room.w * room.h)} sqft (${(room.w * 0.3048).toFixed(1)}×${(room.h * 0.3048).toFixed(1)}m)`;

      if (!state.roomAdjustments[roomId]) {
        state.roomAdjustments[roomId] = { dw: 0, dh: 0 };
      }
      const adj = state.roomAdjustments[roomId];
      const sliderW = document.getElementById("adjustRoomW");
      const sliderH = document.getElementById("adjustRoomH");
      const wVal = document.getElementById("adjustRoomWVal");
      const hVal = document.getElementById("adjustRoomHVal");

      if (sliderW) sliderW.value = adj.dw || 0;
      if (sliderH) sliderH.value = adj.dh || 0;
      if (wVal) wVal.textContent = (adj.dw >= 0 ? "+" : "") + (adj.dw || 0).toFixed(1) + " ft";
      if (hVal) hVal.textContent = (adj.dh >= 0 ? "+" : "") + (adj.dh || 0).toFixed(1) + " ft";

      const currentDoor = (room.doors && room.doors[0]) ? room.doors[0].wall : "south";
      updateDoorWallButtons(currentDoor);

      updateSwapTargetSelect();
      render2DPlan();
    }

    function updateDoorWallButtons(wall) {
      ["north", "south", "west", "east"].forEach(w => {
        const btn = document.getElementById(`doorWall${w.charAt(0).toUpperCase() + w.slice(1)}`);
        if (btn) btn.classList.toggle("active", w === wall);
      });
    }

    function onRoomDimensionSlider(dim, val) {
      if (!state.selectedRoomId || !state.scaledRooms) return;
      const delta = parseFloat(val);
      if (isNaN(delta)) return;

      if (!state.roomAdjustments[state.selectedRoomId]) {
        state.roomAdjustments[state.selectedRoomId] = { dw: 0, dh: 0 };
      }
      state.roomAdjustments[state.selectedRoomId][`d${dim}`] = delta;

      const badge = document.getElementById(`adjustRoom${dim.toUpperCase()}Val`);
      if (badge) badge.textContent = (delta >= 0 ? "+" : "") + delta.toFixed(1) + " ft";

      const orig = (state.originalRooms || []).find(r => r.id === state.selectedRoomId);
      const room = state.scaledRooms.find(r => r.id === state.selectedRoomId);
      if (orig && room) {
        if (dim === "w") {
          room.w = Math.max(5, orig.w + delta);
        } else if (dim === "h") {
          room.h = Math.max(5, orig.h + delta);
        }
      }

      const plotFt = getPlotInFeet();
      state.checks = runConstraintChecks(state.scaledRooms, plotFt, state.requirements);
      const passRate = state.checks.filter(c => c.pass).length / state.checks.length;
      state.score = Math.round(passRate * 100);

      const areaEl = document.getElementById("drawerRoomAreaText");
      if (areaEl && room) areaEl.textContent = `${Math.round(room.w * room.h)} sqft (${(room.w * 0.3048).toFixed(1)}×${(room.h * 0.3048).toFixed(1)}m)`;

      const scoreNum = document.getElementById("sidebarScoreNum");
      if (scoreNum) scoreNum.textContent = state.score;

      render2DPlan();
      if (threeBuildingGroup) update3DScene();
    }

    function executeRoomSwap() {
      if (!state.selectedRoomId || !state.scaledRooms) return;
      const swapSel = document.getElementById("swapRoomTargetSelect");
      if (!swapSel || !swapSel.value) return;

      const targetId = swapSel.value;
      const roomA = state.scaledRooms.find(r => r.id === state.selectedRoomId);
      const roomB = state.scaledRooms.find(r => r.id === targetId);

      if (!roomA || !roomB) return;

      const tempX = roomA.x, tempY = roomA.y, tempW = roomA.w, tempH = roomA.h;
      roomA.x = roomB.x; roomA.y = roomB.y; roomA.w = roomB.w; roomA.h = roomB.h;
      roomB.x = tempX; roomB.y = tempY; roomB.w = tempW; roomB.h = tempH;

      const plotFt = getPlotInFeet();
      state.checks = runConstraintChecks(state.scaledRooms, plotFt, state.requirements);
      const passRate = state.checks.filter(c => c.pass).length / state.checks.length;
      state.score = Math.round(passRate * 100);

      showToast(`Swapped positions: ${roomA.name} and ${roomB.name}`);
      render2DPlan();
      if (threeBuildingGroup) update3DScene();
    }

    function setRoomDoorWall(wall) {
      if (!state.selectedRoomId || !state.scaledRooms) return;
      const room = state.scaledRooms.find(r => r.id === state.selectedRoomId);
      if (!room) return;

      const doorWidth = (room.doors && room.doors[0]) ? room.doors[0].width : 3;
      const wallLen = (wall === "north" || wall === "south") ? room.w : room.h;
      const offset = Math.max(1, (wallLen - doorWidth) / 2);

      room.doors = [{ wall, offset, width: doorWidth }];
      updateDoorWallButtons(wall);
      showToast(`Door moved to ${wall.toUpperCase()} wall for ${room.name}`);
      render2DPlan();
    }

    function autoBalanceLayout() {
      if (!state.scaledRooms) return;
      const plotFt = getPlotInFeet();
      state.scaledRooms.forEach(r => {
        if (r.x + r.w > plotFt.width) r.w = Math.max(5, plotFt.width - r.x);
        if (r.y + r.h > plotFt.length) r.h = Math.max(5, plotFt.length - r.y);
      });
      showToast("Layout auto-fitted to plot boundaries");
      render2DPlan();
      if (threeBuildingGroup) update3DScene();
    }

    function resetCurrentRoomAdjust() {
      if (!state.selectedRoomId || !state.originalRooms || !state.scaledRooms) return;
      const orig = state.originalRooms.find(r => r.id === state.selectedRoomId);
      const curr = state.scaledRooms.find(r => r.id === state.selectedRoomId);
      if (orig && curr) {
        curr.w = orig.w;
        curr.h = orig.h;
        curr.x = orig.x;
        curr.y = orig.y;
        curr.doors = JSON.parse(JSON.stringify(orig.doors || []));
      }
      state.roomAdjustments[state.selectedRoomId] = { dw: 0, dh: 0 };
      selectRoom(state.selectedRoomId);
      showToast("Room reset to original archetype");
    }

    function resetAllAdjustments() {
      if (!state.originalRooms) return;
      state.scaledRooms = JSON.parse(JSON.stringify(state.originalRooms));
      state.roomAdjustments = {};
      if (state.selectedRoomId) selectRoom(state.selectedRoomId);
      showToast("All rooms restored to original archetype");
      render2DPlan();
      if (threeBuildingGroup) update3DScene();
    }

    function handlePlanCanvasClick(e) {
      if (!state.scaledRooms || state.screen !== 4) return;
      const canvas = document.getElementById("plan2DCanvas");
      const rect = canvas.getBoundingClientRect();
      const plotFt = getPlotInFeet();
      const margin = 50;
      const scale = Math.min((rect.width - margin * 2) / plotFt.width, (rect.height - margin * 2) / plotFt.length);
      const drawW = plotFt.width * scale;
      const drawH = plotFt.length * scale;
      const startX = (rect.width - drawW) / 2;
      const startY = (rect.height - drawH) / 2;

      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const clicked = state.scaledRooms.find(r => {
        const rx = startX + r.x * scale;
        const ry = startY + drawH - (r.y + r.h) * scale;
        const rw = r.w * scale;
        const rh = r.h * scale;
        return clickX >= rx && clickX <= rx + rw && clickY >= ry && clickY <= ry + rh;
      });

      if (clicked) {
        selectRoom(clicked.id);
        const drawer = document.getElementById("adjustmentDrawer");
        if (drawer && !drawer.classList.contains("open")) {
          toggleAdjustmentDrawer();
        }
      }
    }

    function handlePlanCanvasMouseMove(e) {
      if (!state.scaledRooms || state.screen !== 4) return;
      const canvas = document.getElementById("plan2DCanvas");
      const rect = canvas.getBoundingClientRect();
      const plotFt = getPlotInFeet();
      const margin = 50;
      const scale = Math.min((rect.width - margin * 2) / plotFt.width, (rect.height - margin * 2) / plotFt.length);
      const drawW = plotFt.width * scale;
      const drawH = plotFt.length * scale;
      const startX = (rect.width - drawW) / 2;
      const startY = (rect.height - drawH) / 2;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const hovered = state.scaledRooms.find(r => {
        const rx = startX + r.x * scale;
        const ry = startY + drawH - (r.y + r.h) * scale;
        const rw = r.w * scale;
        const rh = r.h * scale;
        return mouseX >= rx && mouseX <= rx + rw && mouseY >= ry && mouseY <= ry + rh;
      });

      canvas.style.cursor = hovered ? "pointer" : "default";
      if (hovered && state.hoveredRoomId !== hovered.id) {
        state.hoveredRoomId = hovered.id;
        render2DPlan();
      } else if (!hovered && state.hoveredRoomId !== null) {
        state.hoveredRoomId = null;
        render2DPlan();
      }
    }
