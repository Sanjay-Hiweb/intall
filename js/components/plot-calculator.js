    /* ==========================================================================
       SCREEN 1: PLOT INPUT & VALIDATION
       ========================================================================== */
    function setUnit(newUnit) {
      if (state.plot.unit === newUnit) return;
      
      const widthInput = document.getElementById("plotWidthInput");
      const lengthInput = document.getElementById("plotLengthInput");
      const ftBtn = document.getElementById("unitFtBtn");
      const mBtn = document.getElementById("unitMBtn");

      if (newUnit === "m") {
        // ft to m
        state.plot.width = +(state.plot.width * 0.3048).toFixed(1);
        state.plot.length = +(state.plot.length * 0.3048).toFixed(1);
        ftBtn.classList.remove("active");
        mBtn.classList.add("active");
        document.querySelectorAll(".unit-label").forEach(el => el.textContent = "m");
      } else {
        // m to ft
        state.plot.width = +(state.plot.width / 0.3048).toFixed(0);
        state.plot.length = +(state.plot.length / 0.3048).toFixed(0);
        mBtn.classList.remove("active");
        ftBtn.classList.add("active");
        document.querySelectorAll(".unit-label").forEach(el => el.textContent = "ft");
      }

      state.plot.unit = newUnit;
      widthInput.value = state.plot.width;
      lengthInput.value = state.plot.length;
      onPlotInputChanged();
    }

    function getPlotInFeet() {
      if (state.plot.unit === "m") {
        return {
          width: state.plot.width / 0.3048,
          length: state.plot.length / 0.3048
        };
      }
      return {
        width: state.plot.width,
        length: state.plot.length
      };
    }

    function isPlotValid() {
      const plotFt = getPlotInFeet();
      return plotFt.width >= 15 && plotFt.width <= 100 && plotFt.length >= 15 && plotFt.length <= 100;
    }

    function onPlotInputChanged() {
      const widthInput = document.getElementById("plotWidthInput");
      const lengthInput = document.getElementById("plotLengthInput");
      const widthErr = document.getElementById("plotWidthError");
      const lengthErr = document.getElementById("plotLengthError");
      const nextBtn = document.getElementById("nextToReqBtn");

      state.plot.width = parseFloat(widthInput.value) || 0;
      state.plot.length = parseFloat(lengthInput.value) || 0;

      const plotFt = getPlotInFeet();
      let valid = true;

      // Validate Width
      if (plotFt.width < 15 || plotFt.width > 100) {
        widthInput.classList.add("invalid");
        widthErr.textContent = `Width must be between 15 and 100 ft (${(15*0.3048).toFixed(1)} to ${(100*0.3048).toFixed(1)} m).`;
        valid = false;
      } else {
        widthInput.classList.remove("invalid");
        widthErr.textContent = "";
      }

      // Validate Length
      if (plotFt.length < 15 || plotFt.length > 100) {
        lengthInput.classList.add("invalid");
        lengthErr.textContent = `Length must be between 15 and 100 ft (${(15*0.3048).toFixed(1)} to ${(100*0.3048).toFixed(1)} m).`;
        valid = false;
      } else {
        lengthInput.classList.remove("invalid");
        lengthErr.textContent = "";
      }

      nextBtn.disabled = !valid;

      // Area calculations
      const areaSqft = Math.round(plotFt.width * plotFt.length);
      const areaSqm = (areaSqft * 0.092903).toFixed(1);
      document.getElementById("plotAreaDisplay").innerHTML = `📐 Plot Area: <strong>${areaSqft.toLocaleString()} sqft</strong> (${areaSqm} sqm)`;

      // Extreme Aspect Ratio Warning
      const ratio = plotFt.width / plotFt.length;
      const ratioBanner = document.getElementById("plotRatioBanner");
      if (ratio > 2.4 || ratio < 0.42) {
        ratioBanner.style.display = "block";
      } else {
        ratioBanner.style.display = "none";
      }

      renderPlotPreview();
    }

    function renderPlotPreview() {
      const canvas = document.getElementById("plotOutlineCanvas");
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const rect = canvas.getBoundingClientRect();
      
      canvas.width = rect.width * window.devicePixelRatio || 500;
      canvas.height = rect.height * window.devicePixelRatio || 200;
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      // Architectural Drafting Table Paper Background
      ctx.fillStyle = "#FAF8F3";
      ctx.fillRect(0, 0, w, h);

      // Faint drafting grid pattern
      ctx.strokeStyle = "rgba(14, 26, 43, 0.05)";
      ctx.lineWidth = 1;
      const gridSize = 20;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const plotFt = getPlotInFeet();
      if (plotFt.width <= 0 || plotFt.length <= 0) return;

      const padding = 34;
      const maxDrawW = w - padding * 2;
      const maxDrawH = h - padding * 2;
      const scale = Math.min(maxDrawW / plotFt.width, maxDrawH / plotFt.length);

      const drawW = plotFt.width * scale;
      const drawH = plotFt.length * scale;
      const startX = (w - drawW) / 2;
      const startY = (h - drawH) / 2;

      // Fill & Stroke with Ink & Pencil Accent
      ctx.fillStyle = "rgba(228, 87, 46, 0.05)";
      ctx.fillRect(startX, startY, drawW, drawH);

      ctx.strokeStyle = "#0E1A2B";
      ctx.lineWidth = 2;
      ctx.strokeRect(startX, startY, drawW, drawH);

      // Dimension labels
      ctx.fillStyle = "#0E1A2B";
      ctx.font = "600 12px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";

      // Top width
      const widthText = `${state.plot.width} ${state.plot.unit}`;
      ctx.fillText(widthText, startX + drawW / 2, startY - 6);

      // Right length
      ctx.save();
      ctx.translate(startX + drawW + 18, startY + drawH / 2);
      ctx.rotate(Math.PI / 2);
      const lengthText = `${state.plot.length} ${state.plot.unit}`;
      ctx.fillText(lengthText, 0, 0);
      ctx.restore();

      // Dimension arrows
      ctx.strokeStyle = "#E4572E";
      ctx.lineWidth = 1.2;
      // top dimension line
      ctx.beginPath();
      ctx.moveTo(startX, startY - 14);
      ctx.lineTo(startX + drawW, startY - 14);
      ctx.stroke();
    }
