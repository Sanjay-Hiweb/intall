    /* ==========================================================================
       MULTI-FLOOR & DUPLEX CONTROLLER
       ========================================================================== */
    function updateFloorUI() {
      if (!state.scaledRooms) return;
      const groundRooms = state.scaledRooms.filter(r => (r.floor || "ground") === "ground");
      const firstRooms  = state.scaledRooms.filter(r => r.floor === "first");
      const hasFirstFloor = firstRooms.length > 0;

      // Update room counts on tabs
      const subG = document.getElementById("subtagGroundRooms");
      const subF = document.getElementById("subtagFirstRooms");
      if (subG) subG.textContent = `${groundRooms.length} rms`;
      if (subF) subF.textContent = hasFirstFloor ? `${firstRooms.length} rms` : "None";

      // Update tab active states
      const pillG = document.getElementById("pillFloorGround");
      const pillF = document.getElementById("pillFloorFirst");
      const pillS = document.getElementById("pillFloorStacked");

      if (pillG) pillG.classList.toggle("active", state.activeFloor === "ground");
      if (pillF) {
        pillF.classList.toggle("active", state.activeFloor === "first");
        pillF.style.opacity = hasFirstFloor ? "1" : "0.55";
        pillF.title = hasFirstFloor ? "Switch to First Floor View" : "No First Floor added yet — click '+ Add First Floor' to create one";
      }
      if (pillS) {
        pillS.classList.toggle("active", state.activeFloor === "both");
        pillS.style.display = hasFirstFloor ? "inline-flex" : "none";
      }

      // Typology badge
      const typoBadge = document.getElementById("resultTypologyBadge");
      const typoIcon = document.getElementById("resultTypologyIcon");
      const typoText = document.getElementById("resultTypologyText");
      if (hasFirstFloor) {
        if (typoBadge) {
          typoBadge.style.background = "#FEF3C7";
          typoBadge.style.color = "#92400E";
          typoBadge.style.borderColor = "#FCD34D";
        }
        if (typoIcon) typoIcon.textContent = "";
        if (typoText) typoText.textContent = "Duplex Villa (G+1)";
      } else {
        if (typoBadge) {
          typoBadge.style.background = "var(--bg-warm)";
          typoBadge.style.color = "var(--text-main)";
          typoBadge.style.borderColor = "var(--card-border)";
        }
        if (typoIcon) typoIcon.textContent = "";
        if (typoText) typoText.textContent = "Normal House (1F)";
      }

      // Action button
      const actBtn = document.getElementById("btnToggleFloorAction");
      if (actBtn) {
        if (hasFirstFloor) {
          actBtn.innerHTML = `<span>Revert to 1F</span>`;
          actBtn.className = "btn btn-secondary btn-floor-toggle-action";
          actBtn.style.padding = "5px 12px";
          actBtn.style.fontSize = "0.78rem";
        } else {
          actBtn.innerHTML = `<span>+ Add First Floor</span>`;
          actBtn.className = "btn btn-obsidian btn-floor-toggle-action";
          actBtn.style.padding = "5px 12px";
          actBtn.style.fontSize = "0.78rem";
        }
      }

      // 3D Toolbar multi-floor buttons & container
      const groupFloor3D = document.getElementById("tbarFloor3DGroup");
      if (groupFloor3D) {
        groupFloor3D.style.display = hasFirstFloor ? "flex" : "none";
      }
      const btnBoth    = document.getElementById("btn3DFloorBoth");
      const btnG       = document.getElementById("btn3DFloorGround");
      const btnF       = document.getElementById("btn3DFloorFirst");
      const btnExplode = document.getElementById("btn3DExploded");

      if (btnBoth) {
        btnBoth.style.display = hasFirstFloor ? "inline-flex" : "none";
        btnBoth.classList.toggle("active", state.view3DFloor === "both");
      }
      if (btnF) {
        btnF.style.display = hasFirstFloor ? "inline-flex" : "none";
        btnF.classList.toggle("active", state.view3DFloor === "first");
      }
      if (btnG) {
        btnG.classList.toggle("active", state.view3DFloor === "ground");
      }
      if (btnExplode) {
        btnExplode.style.display = hasFirstFloor ? "inline-flex" : "none";
        btnExplode.classList.toggle("active", !!state.exploded3D);
      }
    }

    function switchFloor(floor) {
      if (floor === "first") {
        const hasFirstFloor = state.scaledRooms && state.scaledRooms.some(r => r.floor === "first");
        if (!hasFirstFloor) {
          showToast("First Floor not present yet. Synthesizing First Floor on top...");
          toggleFirstFloorAction();
          return;
        }
      }

      state.activeFloor = floor;
      if (floor === "both") {
        state.view3DFloor = "both";
        if (state.view !== "3d") {
          switchViewMode("3d");
        } else {
          update3DScene();
        }
      } else {
        if (state.view === "3d") {
          state.view3DFloor = floor;
          update3DScene();
        } else {
          render2DPlan();
        }
      }
      updateFloorUI();
      initDrawerRooms();
      renderResultScreen();
      showToast(floor === "both" ? "Viewing Stacked G+1 Duplex" : (floor === "first" ? "Switched to First Floor (+1 Level)" : "Switched to Ground Floor (Level 0)"));
    }

    function set3DFloorView(mode) {
      state.view3DFloor = mode;
      if (mode === "ground") state.activeFloor = "ground";
      else if (mode === "first") state.activeFloor = "first";
      else state.activeFloor = "ground";
      updateFloorUI();
      update3DScene();
    }

    function toggle3DExploded() {
      state.exploded3D = !state.exploded3D;
      updateFloorUI();
      update3DScene();
      showToast(state.exploded3D ? "Exploded 3D View: Upper floor elevated +14ft with corner guides" : "Assembled 3D View: Stacked in place");
    }

    function generateFirstFloorRooms(existingGroundRooms, plotFt) {
      const ground = JSON.parse(JSON.stringify(existingGroundRooms)).map(r => ({
        ...r,
        floor: "ground"
      }));

      let stairsRoom = ground.find(r => r.type === "stairs");
      if (!stairsRoom) {
        const hall = ground.find(r => r.type === "hall" || r.type === "living") || ground[0];
        const sx = hall.x;
        const sy = hall.y;
        const sw = Math.max(7.0, Math.min(8.0, hall.w * 0.45));
        const sh = Math.max(10.0, Math.min(13.0, hall.h * 0.65));

        stairsRoom = {
          id: "dynamic_stairs_gf",
          name: "Internal Staircase",
          type: "stairs",
          floor: "ground",
          x: sx,
          y: sy,
          w: sw,
          h: sh,
          doors: [{ wall: "east", offset: 2, width: 3.0 }],
          windows: [{ wall: "west", offset: 2, width: 3.0 }]
        };
        ground.push(stairsRoom);
      }

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      ground.forEach(r => {
        if (r.x < minX) minX = r.x;
        if (r.y < minY) minY = r.y;
        if (r.x + r.w > maxX) maxX = r.x + r.w;
        if (r.y + r.h > maxY) maxY = r.y + r.h;
      });

      const totalW = maxX - minX;
      const totalH = maxY - minY;

      const stX = stairsRoom.x;
      const stY = stairsRoom.y;
      const stW = stairsRoom.w;
      const stH = stairsRoom.h;

      const firstFloorRooms = [];

      firstFloorRooms.push({
        id: "dynamic_stairs_ff",
        name: "Stair Landing & Void",
        type: "stairs",
        floor: "first",
        x: stX,
        y: stY,
        w: stW,
        h: stH,
        doors: [{ wall: "east", offset: 2, width: 3.0 }],
        windows: [{ wall: "west", offset: 2, width: 3.0 }]
      });

      const mBedW = Math.max(12, Math.min(18, (totalW - stW) * 0.65));
      const mBedH = Math.max(12, Math.min(18, totalH * 0.55));
      const mBedX = (stX + stW + mBedW <= maxX + 0.1) ? (stX + stW) : minX;
      const mBedY = stY;

      firstFloorRooms.push({
        id: "ff_master_bed",
        name: "Upper Master Suite",
        type: "bedroom",
        floor: "first",
        x: mBedX,
        y: mBedY,
        w: mBedW,
        h: mBedH,
        doors: [{ wall: "west", offset: 2, width: 3.2 }],
        windows: [{ wall: "north", offset: 3, width: 4.5 }, { wall: "east", offset: 3, width: 4.0 }]
      });

      const bW = Math.max(6.0, Math.min(8.0, mBedW * 0.45));
      const bH = Math.max(6.0, Math.min(8.0, mBedH * 0.45));
      firstFloorRooms.push({
        id: "ff_ensuite_bath",
        name: "Ensuite Master Bath",
        type: "bathroom",
        floor: "first",
        x: mBedX + mBedW - bW,
        y: mBedY + mBedH - bH,
        w: bW,
        h: bH,
        doors: [{ wall: "west", offset: 1.5, width: 2.6 }],
        windows: [{ wall: "east", offset: 1.5, width: 2.4 }]
      });

      const lW = Math.max(10, totalW - mBedW);
      const lH = Math.max(10, Math.min(14, totalH - mBedH));
      const lX = minX;
      const lY = (mBedY + mBedH <= maxY) ? (mBedY + mBedH) : Math.max(minY, mBedY - lH);

      firstFloorRooms.push({
        id: "ff_family_lounge",
        name: "Upper Family Lounge",
        type: "hall",
        floor: "first",
        x: lX,
        y: Math.max(minY, lY),
        w: Math.min(lW, totalW),
        h: Math.min(lH, totalH),
        doors: [{ wall: "south", offset: 3, width: 3.2 }],
        windows: [{ wall: "north", offset: 3, width: 5.0 }]
      });

      const remW = Math.max(8, totalW - lW);
      const remH = Math.max(8, lH);
      firstFloorRooms.push({
        id: "ff_sky_terrace",
        name: "Open Sky Terrace",
        type: "balcony",
        floor: "first",
        x: Math.min(maxX - remW, lX + lW),
        y: Math.max(minY, lY),
        w: Math.max(7.5, remW),
        h: Math.max(7.5, remH),
        doors: [{ wall: "west", offset: 2, width: 3.5 }],
        windows: []
      });

      return [...ground, ...firstFloorRooms];
    }

    function toggleFirstFloorAction() {
      if (!state.scaledRooms) return;
      const hasFirstFloor = state.scaledRooms.some(r => r.floor === "first");
      const plotFt = getPlotInFeet();

      if (hasFirstFloor) {
        state.scaledRooms = state.scaledRooms.filter(r => (r.floor || "ground") === "ground");
        state.scaledRooms = state.scaledRooms.filter(r => r.id !== "dynamic_stairs_gf");
        state.houseType = "normal";
        state.activeFloor = "ground";
        state.view3DFloor = "ground";
        state.exploded3D = false;
        state.checks = runConstraintChecks(state.scaledRooms, plotFt, state.requirements);
        updateFloorUI();
        initDrawerRooms();
        renderResultScreen();
        showToast("First floor removed. Reverted to Single-Story Normal House.");
      } else {
        const newRooms = generateFirstFloorRooms(state.scaledRooms, plotFt);
        state.scaledRooms = newRooms;
        state.houseType = "duplex";
        state.activeFloor = "first";
        state.view3DFloor = "both";
        state.exploded3D = false;
        state.checks = runConstraintChecks(state.scaledRooms, plotFt, state.requirements);
        updateFloorUI();
        initDrawerRooms();
        renderResultScreen();
        showToast("First floor added on top. Duplex Villa layout configured.");
      }
    }
