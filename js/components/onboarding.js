    /* ==========================================================================
       GUIDED ONBOARDING & PRE-PLANNING HELPERS
       ========================================================================== */
    function openGuideModal() {
      const modal = document.getElementById("guideModalBackdrop");
      if (modal) modal.classList.add("show");
    }

    function closeGuideModal() {
      const modal = document.getElementById("guideModalBackdrop");
      if (modal) modal.classList.remove("show");
      sessionStorage.setItem("intall_guided_seen", "true");
    }

    function quickStartArchetype(type) {
      closeGuideModal();
      if (type === "villa-3bhk") {
        setPlotShape("standard");
        applyPlotPreset(35, 45);
        setBHK(3);
        setBaths(2);
        setParking("1car");
        setArchStyle("minimalist");
      } else if (type === "townhouse-2bhk") {
        setPlotShape("narrow");
        applyPlotPreset(25, 50);
        setBHK(2);
        setBaths(2);
        setParking("none");
        setArchStyle("scandinavian");
      } else if (type === "estate-4bhk") {
        setPlotShape("wide");
        applyPlotPreset(40, 60);
        setBHK(4);
        setBaths(3);
        setParking("2car");
        setArchStyle("mediterranean");
      } else if (type === "compact-1bhk") {
        setPlotShape("standard");
        applyPlotPreset(22, 30);
        setBHK(1);
        setBaths(1);
        setParking("none");
        setArchStyle("minimalist");
      }
      setTimeout(() => {
        findCandidates();
        showToast("✨ Pre-planned archetype matched! Select a layout below.");
      }, 200);
    }

    function setPlotShape(shape, el) {
      state.plotShape = shape;
      document.querySelectorAll("#plotShapeGrid .shape-card").forEach(c => c.classList.remove("active"));
      if (el) el.classList.add("active");
      else {
        const cards = document.querySelectorAll("#plotShapeGrid .shape-card");
        const shapeMap = { standard: 0, narrow: 1, wide: 2, corner: 3, courtyard: 4, wing: 5 };
        const idx = shapeMap[shape] !== undefined ? shapeMap[shape] : 0;
        if (cards[idx]) cards[idx].classList.add("active");
      }

      if (shape === "narrow") {
        applyPlotPreset(25, 50);
      } else if (shape === "wide") {
        applyPlotPreset(50, 35);
      } else if (shape === "corner") {
        applyPlotPreset(40, 45);
      } else if (shape === "courtyard") {
        applyPlotPreset(45, 50);
      } else if (shape === "wing") {
        applyPlotPreset(55, 40);
      } else if (shape === "standard") {
        applyPlotPreset(35, 45);
      }
    }

    function applyPlotPreset(w, l) {
      if (state.plot.unit === "m") {
        state.plot.width = +(w * 0.3048).toFixed(1);
        state.plot.length = +(l * 0.3048).toFixed(1);
      } else {
        state.plot.width = w;
        state.plot.length = l;
      }
      const wIn = document.getElementById("plotWidthInput");
      const lIn = document.getElementById("plotLengthInput");
      if (wIn) wIn.value = state.plot.width;
      if (lIn) lIn.value = state.plot.length;
      onPlotInputChanged();
    }

    function setArchStyle(style, el) {
      state.requirements.archStyle = style;
      document.querySelectorAll("#archStyleGrid .style-card").forEach(c => c.classList.remove("active"));
      if (el) el.classList.add("active");
      else {
        const cards = document.querySelectorAll("#archStyleGrid .style-card");
        const map = { minimalist: 0, scandinavian: 1, craftsman: 2, mediterranean: 3, industrial: 4, japandi: 5 };
        if (cards[map[style]] !== undefined) cards[map[style]].classList.add("active");
      }
    }

    function setBaths(count) {
      state.requirements.baths = count;
      const buttons = document.querySelectorAll("#bathControl .segmented-btn");
      buttons.forEach((btn, idx) => {
        btn.classList.toggle("active", (idx + 1) === count);
      });
    }
