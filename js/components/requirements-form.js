    /* ==========================================================================
       SCREEN 2: REQUIREMENTS FORM CONTROLS
       ========================================================================== */
    function setHouseTypology(val, el) {
      state.requirements.houseType = val;
      state.houseType = val;
      document.querySelectorAll("#houseTypologyGrid .typology-card").forEach(c => c.classList.remove("active"));
      if (el) el.classList.add("active");
      else {
        const card = document.getElementById(val === "duplex" ? "typologyCardDuplex" : "typologyCardNormal");
        if (card) card.classList.add("active");
      }
      const badge = document.getElementById("houseTypeBadge");
      if (badge) badge.textContent = val === "duplex" ? "2 Levels (G+1)" : "Single Story";
    }

    function setBHK(val) {
      state.requirements.bhk = val;
      const buttons = document.querySelectorAll("#bhkControl .segmented-btn");
      buttons.forEach((btn, index) => {
        btn.classList.toggle("active", index + 1 === val);
      });
    }

    function setParking(val) {
      state.requirements.parking = val;
      const map = { none: 0, "1car": 1, "2car": 2 };
      const buttons = document.querySelectorAll("#parkingControl .segmented-btn");
      buttons.forEach((btn, idx) => {
        btn.classList.toggle("active", idx === map[val]);
      });
    }

    function setKitchen(val) {
      state.requirements.kitchen = val;
      const map = { closed: 0, open: 1 };
      const buttons = document.querySelectorAll("#kitchenControl .segmented-btn");
      buttons.forEach((btn, idx) => {
        btn.classList.toggle("active", idx === map[val]);
      });
    }

    function toggleExtra(extraName, chipEl) {
      const idx = state.requirements.extras.indexOf(extraName);
      if (idx > -1) {
        state.requirements.extras.splice(idx, 1);
        chipEl.classList.remove("active");
      } else {
        state.requirements.extras.push(extraName);
        chipEl.classList.add("active");
      }
    }

    function setFacing(direction) {
      state.requirements.facing = direction;
      ["N", "S", "E", "W"].forEach(dir => {
        const btn = document.getElementById(`facing${dir}`);
        if (btn) btn.classList.toggle("active", dir === direction);
      });
    }
