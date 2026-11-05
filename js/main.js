    /* ==========================================================================
       INITIALIZATION
       ========================================================================== */
    window.addEventListener("DOMContentLoaded", () => {
      // Parse URL parameters from home page presets / quick estimator
      const urlParams = new URLSearchParams(window.location.search);
      let hasAllParams = false;

      if (urlParams.has("w")) {
        const w = parseFloat(urlParams.get("w"));
        if (!isNaN(w) && w >= 15 && w <= 100) {
          state.plot.width = w;
          const wInput = document.getElementById("plotWidthInput");
          if (wInput) wInput.value = w;
        }
      }
      if (urlParams.has("l")) {
        const l = parseFloat(urlParams.get("l"));
        if (!isNaN(l) && l >= 15 && l <= 100) {
          state.plot.length = l;
          const lInput = document.getElementById("plotLengthInput");
          if (lInput) lInput.value = l;
        }
      }
      if (urlParams.has("unit")) {
        const u = urlParams.get("unit");
        if (u === "m" || u === "ft") setUnit(u);
      }
      if (urlParams.has("bhk")) {
        const b = parseInt(urlParams.get("bhk"), 10);
        if (b >= 1 && b <= 5) setBHK(b);
      }
      if (urlParams.has("parking")) {
        const p = urlParams.get("parking");
        if (["none", "1car", "2car"].includes(p)) setParking(p);
      }
      if (urlParams.has("kitchen")) {
        const k = urlParams.get("kitchen");
        if (["closed", "open"].includes(k)) setKitchen(k);
      }
      if (urlParams.has("facing")) {
        const f = urlParams.get("facing").toUpperCase();
        if (["N", "S", "E", "W"].includes(f)) setFacing(f);
      }
      if (urlParams.has("shape")) {
        const sh = urlParams.get("shape").toLowerCase();
        if (["standard", "narrow", "wide", "corner"].includes(sh)) setPlotShape(sh);
      }
      if (urlParams.has("style")) {
        const st = urlParams.get("style").toLowerCase();
        if (["minimalist", "scandinavian", "craftsman", "mediterranean"].includes(st)) setArchStyle(st);
      }
      if (urlParams.has("bath")) {
        const bth = parseInt(urlParams.get("bath"), 10);
        if (bth >= 1 && bth <= 4) setBaths(bth);
      }

      // Check if loading a shared cloud plan
      if (urlParams.has("plan")) {
        onPlotInputChanged();
        initThreeScene();
        loadSharedPlan(urlParams.get("plan"));
        return;
      }

      // Direct template deep-link (e.g. ?template=t02&view=3d)
      if (urlParams.has("template")) {
        const tid = urlParams.get("template");
        const t = TEMPLATES.find(x => x.id === tid);
        if (t) {
          state.plot.width = t.referencePlot.width;
          state.plot.length = t.referencePlot.length;
          state.bhk = t.bhk;
          state.hasParking = t.hasParking;
          state.facing = t.facing;
          state.houseType = t.houseType || "normal";
          onPlotInputChanged();
          initThreeScene();
          findCandidates();
          const targetCand = state.candidates.find(c => c.template.id === tid) || state.candidates[0];
          if (targetCand) {
            selectCandidate(targetCand);
            useSelectedCandidate();
            if (urlParams.get("view") === "3d" || urlParams.has("3d")) {
              setTimeout(() => {
                switchViewMode("3d");
              }, 120);
            }
          }
          return;
        }
      }

      // Auto-advance: if URL has plot dimensions AND bhk, skip straight to candidates
      hasAllParams = urlParams.has("w") && urlParams.has("l") && urlParams.has("bhk");

      onPlotInputChanged();
      renderPlotPreview();
      initThreeScene();

      // Show guided onboarding on first visit or if explicitly requested via ?guide=1 or ?tour=1
      const forceGuide = urlParams.get("guide") === "1" || urlParams.get("tour") === "1";
      if (forceGuide || (!hasAllParams && !sessionStorage.getItem("intall_guided_seen"))) {
        setTimeout(openGuideModal, 350);
      }

      if (hasAllParams && isPlotValid()) {
        // Show a loading spinner briefly, then auto-run matcher
        setTimeout(() => {
          findCandidates();
          showToast("✨ Auto-matched layouts for your plot — pick one below!");
        }, 300);
      }
      
      // Auto resize listener
      window.addEventListener("resize", () => {
        if (state.screen === 1) renderPlotPreview();
        if (state.screen === 4) {
          render2DPlan();
          resizeThreeRenderer();
        }
      });

      // Canvas click listener for room selection
      const planCanvas = document.getElementById("plan2DCanvas");
      if (planCanvas) {
        planCanvas.addEventListener("click", handlePlanCanvasClick);
        planCanvas.addEventListener("mousemove", handlePlanCanvasMouseMove);
      }
    });
