            /* ==========================================================================
       PHOTOREALISTIC 3D ARCHITECTURAL VISUALIZER (THREE.JS + PROCEDURAL ASSETS)
       ========================================================================== */
    let threeScene, threeCamera, threeRenderer, threeControls;
    let threeBuildingGroup = null;
    let threeRoofGroup = null;
    let threeLabelsGroup = null;
    let threeWallsGroup = null;
    let threeFurnitureGroup = null;
    let threeSlabsGroup = null;
    let threeSiteGroup = null;
    let threeInteriorLights = [];
    let threeSunLight = null;
    let threeHemiLight = null;
    let threeAmbientLight = null;
    let threePorchLight = null;

    const THREE_MODULE_KEYS = ["walls", "furniture", "slabs", "labels", "site", "roof"];

    const threeMode = {
      mold: "dollhouse", // "dollhouse" | "roof" | "clay" | "blueprint" | "obsidian" | "xray"
      moulding: "shadowline", // "shadowline" | "crown" | "slat" | "craftsman" | "coffered"
      view: "dollhouse", // "dollhouse" | "roof"
      cutWalls: false,   // false = 9ft, true = 5.8ft
      lighting: "day",   // "day" | "sunset" | "night"
      showLabels: false, // Clean by default: prevents text from covering the 3D house
      autoRotate: false,
      layers: {
        walls: true,
        furniture: true,
        slabs: true,
        labels: false,   // Clean by default
        site: true,
        roof: false
      }
    };

    // --- PROCEDURAL TEXTURE GENERATOR & CACHE ---
    const TEX_CACHE = {};

    function getProcTexture(key, drawFn, repX = 1, repY = 1) {
      if (TEX_CACHE[key]) {
        const tex = TEX_CACHE[key].clone();
        tex.repeat.set(repX, repY);
        tex.needsUpdate = true;
        return tex;
      }
      const c = document.createElement("canvas");
      c.width = 512;
      c.height = 512;
      const ctx = c.getContext("2d");
      drawFn(ctx, 512, 512);
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(repX, repY);
      TEX_CACHE[key] = tex;
      return tex;
    }

    // 1. Lush Emerald Lawn Grass
    function drawGrass(ctx, w, h) {
      ctx.fillStyle = "#3F7A33";
      ctx.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 48) {
        ctx.fillStyle = (Math.floor(y / 48) % 2 === 0) ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
        ctx.fillRect(0, y, w, 48);
      }
      for (let i = 0; i < 45000; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const col = ["#4C8C3C", "#34662B", "#5AA047", "#2D5824"][Math.floor(Math.random() * 4)];
        ctx.fillStyle = col;
        ctx.fillRect(x, y, 1.8, 3.2);
      }
    }

    // 2. Warm Honey Oak Hardwood Planks
    function drawWoodFloor(ctx, w, h) {
      ctx.fillStyle = "#BA8F5C";
      ctx.fillRect(0, 0, w, h);
      const plankH = 32;
      const tones = ["#C89B67", "#BA8F5C", "#CF9F6A", "#B18451", "#D3A975"];
      for (let y = 0; y < h; y += plankH) {
        let x = 0;
        while (x < w) {
          const plankW = 90 + Math.random() * 70;
          ctx.fillStyle = tones[Math.floor(Math.random() * tones.length)];
          ctx.fillRect(x, y, plankW, plankH);
          ctx.strokeStyle = "rgba(100, 60, 20, 0.12)";
          ctx.lineWidth = 1;
          for (let g = 0; g < 4; g++) {
            const gy = y + 4 + Math.random() * (plankH - 8);
            ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + plankW, gy + (Math.random() * 3 - 1.5)); ctx.stroke();
          }
          ctx.fillStyle = "#5A3816";
          ctx.fillRect(x + plankW - 1, y, 1.5, plankH);
          x += plankW;
        }
        ctx.fillStyle = "#4E3012";
        ctx.fillRect(0, y + plankH - 1.5, w, 1.5);
      }
    }

    // 3. Polished Carrara Porcelain Tile
    function drawTileFloor(ctx, w, h) {
      ctx.fillStyle = "#F8FAFC";
      ctx.fillRect(0, 0, w, h);
      const tileSize = 128;
      for (let y = 0; y < h; y += tileSize) {
        for (let x = 0; x < w; x += tileSize) {
          ctx.fillStyle = "#FAFAF9";
          ctx.fillRect(x + 1.5, y + 1.5, tileSize - 3, tileSize - 3);
          ctx.strokeStyle = "rgba(203, 213, 225, 0.4)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(x + 10, y + 20);
          ctx.bezierCurveTo(x + 50, y + 40, x + 70, y + 80, x + tileSize - 10, y + tileSize - 20);
          ctx.stroke();
        }
      }
      ctx.strokeStyle = "#CBD5E1";
      ctx.lineWidth = 2.5;
      for (let x = 0; x <= w; x += tileSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y <= h; y += tileSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    }

    // 4. Modern Slate / Blue-Grey Bathroom Tile
    function drawBathTile(ctx, w, h) {
      ctx.fillStyle = "#E2E8F0";
      ctx.fillRect(0, 0, w, h);
      const ts = 64;
      for (let y = 0; y < h; y += ts) {
        for (let x = 0; x < w; x += ts) {
          ctx.fillStyle = (Math.floor(x/ts + y/ts) % 2 === 0) ? "#E5E9F0" : "#DDE3EC";
          ctx.fillRect(x + 1, y + 1, ts - 2, ts - 2);
        }
      }
      ctx.strokeStyle = "#94A3B8";
      ctx.lineWidth = 1.5;
      for (let x = 0; x <= w; x += ts) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y <= h; y += ts) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    }

    // 5. Outdoor Stone Pavers / Driveway Cobblestone
    function drawPavers(ctx, w, h) {
      ctx.fillStyle = "#334155";
      ctx.fillRect(0, 0, w, h);
      const pw = 48, ph = 28;
      let row = 0;
      for (let y = 0; y < h; y += ph) {
        const offset = (row % 2 === 0) ? 0 : pw / 2;
        for (let x = -pw; x < w + pw; x += pw) {
          const tones = ["#8B95A5", "#778292", "#97A1AF", "#6E7989"];
          ctx.fillStyle = tones[Math.floor(Math.random() * tones.length)];
          ctx.fillRect(x + offset + 1.5, y + 1.5, pw - 3, ph - 3);
        }
        row++;
      }
    }

    // 6. Scandinavian Minimalist Designer Area Rug
    function drawRug(ctx, w, h) {
      ctx.fillStyle = "#EAE6DE";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 12;
      ctx.strokeRect(18, 18, w - 36, h - 36);
      ctx.strokeStyle = "#C4B5A5";
      ctx.lineWidth = 4;
      ctx.strokeRect(32, 32, w - 64, h - 64);
      ctx.strokeStyle = "rgba(100, 116, 139, 0.25)";
      ctx.lineWidth = 2;
      for (let i = 50; i < w - 50; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 40); ctx.lineTo(w - i, h - 40); ctx.stroke();
      }
    }

    // 7. Architectural Off-White Stucco Plaster
    function drawStucco(ctx, w, h) {
      ctx.fillStyle = "#FAF8F5";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 20000; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        ctx.fillStyle = Math.random() > 0.5 ? "rgba(0,0,0,0.025)" : "rgba(255,255,255,0.06)";
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    }

    // 8. Dark Standing-Seam Slate Roof
    function drawRoof(ctx, w, h) {
      ctx.fillStyle = "#262C33";
      ctx.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 28) {
        ctx.fillStyle = (Math.floor(y / 28) % 2 === 0) ? "#293037" : "#22272D";
        ctx.fillRect(0, y, w, 28);
        ctx.fillStyle = "#15191D";
        ctx.fillRect(0, y + 26.5, w, 1.5);
      }
      for (let x = 0; x < w; x += 44) {
        ctx.fillStyle = "#414C57";
        ctx.fillRect(x, 0, 1.5, h);
        ctx.fillStyle = "#12161A";
        ctx.fillRect(x + 1.5, 0, 1.5, h);
      }
    }

    // 9. Modern Split-Face Ashlar Stone Cladding (Architectural Feature Wall)
    function drawStoneCladding(ctx, w, h) {
      ctx.fillStyle = "#A8A296";
      ctx.fillRect(0, 0, w, h);
      const tones = ["#B8B2A6", "#9E988D", "#8C867B", "#ABA499", "#C4BEB3", "#7D776D"];
      const rowH = 26;
      for (let y = 0; y < h; y += rowH) {
        let x = 0;
        while (x < w) {
          const bW = 55 + Math.random() * 75;
          ctx.fillStyle = tones[Math.floor(Math.random() * tones.length)];
          ctx.fillRect(x + 1, y + 1, bW - 2, rowH - 2);
          // Subtle horizontal cleft lines
          ctx.fillStyle = "rgba(0,0,0,0.09)";
          ctx.fillRect(x + 1, y + rowH * 0.48, bW - 2, 1);
          ctx.fillStyle = "rgba(255,255,255,0.08)";
          ctx.fillRect(x + 1, y + 1, bW - 2, 1);
          x += bW;
        }
        ctx.fillStyle = "#4A453D";
        ctx.fillRect(0, y + rowH - 1.5, w, 1.5);
      }
    }

    // 10. Warm Teak Wood Architectural Soffit Ceiling
    function drawWoodSoffit(ctx, w, h) {
      ctx.fillStyle = "#8D592C";
      ctx.fillRect(0, 0, w, h);
      const plankW = 20;
      const tones = ["#9B6334", "#8D592C", "#7C4C23", "#A86E3C", "#71431C"];
      for (let x = 0; x < w; x += plankW) {
        ctx.fillStyle = tones[Math.floor(Math.random() * tones.length)];
        ctx.fillRect(x, 0, plankW, h);
        // Wood grain
        ctx.strokeStyle = "rgba(50, 25, 8, 0.12)";
        ctx.lineWidth = 1;
        for (let g = 0; g < 3; g++) {
          const gx = x + 3 + Math.random() * (plankW - 6);
          ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx + (Math.random() * 2 - 1), h); ctx.stroke();
        }
        // Shadow reveal gap between teak battens
        ctx.fillStyle = "#361D09";
        ctx.fillRect(x + plankW - 2, 0, 2, h);
      }
    }

    // 11. Architectural Vertical Dark Charcoal Timber Slats
    function drawWoodSlats(ctx, w, h) {
      ctx.fillStyle = "#1E2226";
      ctx.fillRect(0, 0, w, h);
      const slatW = 16;
      for (let x = 0; x < w; x += slatW) {
        ctx.fillStyle = "#2D343A";
        ctx.fillRect(x + 1, 0, slatW - 3, h);
        ctx.fillStyle = "#111417";
        ctx.fillRect(x + slatW - 2, 0, 2, h);
      }
    }

    // Dynamic Architectural Sky Gradient Texture Builder
    function createSkyTexture(zenith, horizon, ground) {
      const c = document.createElement("canvas");
      c.width = 512;
      c.height = 512;
      const ctx = c.getContext("2d");
      const grad = ctx.createLinearGradient(0, 0, 0, 512);
      grad.addColorStop(0.0, zenith);
      grad.addColorStop(0.55, horizon);
      grad.addColorStop(0.72, ground);
      grad.addColorStop(1.0, ground);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);
      const tex = new THREE.CanvasTexture(c);
      return tex;
    }

    // --- THREE.JS INITIALIZATION ---
    function initThreeScene() {
      const container = document.getElementById("webgl3DContainer");
      if (!container || typeof THREE === "undefined") return;

      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }

      threeScene = new THREE.Scene();
      threeScene.background = createSkyTexture("#A0CBE8", "#EDF3F8", "#DFE6EB");
      threeScene.fog = new THREE.FogExp2(0xEDF3F8, 0.0032);

      threeCamera = new THREE.PerspectiveCamera(40, 1, 1, 1200);
      threeCamera.position.set(50, 60, 60);

      threeRenderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance"
      });
      threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      threeRenderer.shadowMap.enabled = true;
      threeRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
      if (threeRenderer.outputEncoding !== undefined) {
        threeRenderer.outputEncoding = THREE.sRGBEncoding;
      }
      threeRenderer.toneMapping = THREE.ACESFilmicToneMapping;
      threeRenderer.toneMappingExposure = 1.15;
      container.appendChild(threeRenderer.domElement);

      if (typeof THREE.OrbitControls !== "undefined") {
        threeControls = new THREE.OrbitControls(threeCamera, threeRenderer.domElement);
        threeControls.enableDamping = true;
        threeControls.dampingFactor = 0.06;
        threeControls.maxPolarAngle = Math.PI / 2 - 0.04;
        threeControls.minDistance = 8;
        threeControls.maxDistance = 350;

        // Auto-fade instruction hint on first user interaction
        threeControls.addEventListener("start", () => {
          const hint = document.getElementById("viewportHint");
          if (hint && hint.style.display !== "none") {
            hint.style.transition = "opacity 0.4s ease";
            hint.style.opacity = "0";
            setTimeout(() => { hint.style.display = "none"; }, 420);
          }
        });
      }

      // Lights Setup
      threeAmbientLight = new THREE.AmbientLight(0xFFFAF2, 0.42);
      threeScene.add(threeAmbientLight);

      threeHemiLight = new THREE.HemisphereLight(0x9BD4F5, 0x6E8566, 0.72);
      threeHemiLight.position.set(0, 100, 0);
      threeScene.add(threeHemiLight);

      threeSunLight = new THREE.DirectionalLight(0xFFF7EC, 1.55);
      threeSunLight.position.set(65, 95, 50);
      threeSunLight.castShadow = true;
      threeSunLight.shadow.mapSize.width = 2048;
      threeSunLight.shadow.mapSize.height = 2048;
      threeSunLight.shadow.bias = -0.00015;
      threeSunLight.shadow.normalBias = 0.02;
      threeSunLight.shadow.radius = 2.5;
      threeSunLight.shadow.camera.near = 10;
      threeSunLight.shadow.camera.far = 400;
      const d = 90;
      threeSunLight.shadow.camera.left = -d;
      threeSunLight.shadow.camera.right = d;
      threeSunLight.shadow.camera.top = d;
      threeSunLight.shadow.camera.bottom = -d;
      threeScene.add(threeSunLight);

      function animate() {
        requestAnimationFrame(animate);
        if (threeControls) threeControls.update();
        if (threeRenderer && threeScene && threeCamera) {
          threeRenderer.render(threeScene, threeCamera);
        }
      }
      animate();

      apply3DAtmosphere("day");

      // Auto fade viewport hint after 3.5s so it never clutters the screen
      setTimeout(() => {
        const hint = document.getElementById("viewportHint");
        if (hint) {
          hint.style.transition = "opacity 0.5s ease";
          hint.style.opacity = "0";
          setTimeout(() => { hint.style.display = "none"; }, 520);
        }
      }, 3500);
    }

    function resizeThreeRenderer() {
      const container = document.getElementById("viewportContainer");
      if (!threeRenderer || !threeCamera || !container) return;
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      threeCamera.aspect = rect.width / rect.height;
      threeCamera.updateProjectionMatrix();
      threeRenderer.setSize(rect.width, rect.height);
    }

    // --- TIME OF DAY / LIGHTING CONTROLLER ---
    function set3DLighting(mode) {
      threeMode.lighting = mode;
      ["btnLightDay", "btnLightSunset", "btnLightNight"].forEach(id => {
        const b = document.getElementById(id);
        if (b) b.classList.remove("active");
      });
      const activeBtnId = mode === "day" ? "btnLightDay" : mode === "sunset" ? "btnLightSunset" : "btnLightNight";
      const ab = document.getElementById(activeBtnId);
      if (ab) ab.classList.add("active");

      apply3DAtmosphere(mode);
    }

    function apply3DAtmosphere(mode) {
      if (!threeScene || !threeSunLight) return;

      // Special mold atmospheres
      if (threeMode.mold === "clay") {
        threeScene.background = new THREE.Color(0xEDEAE2);
        threeAmbientLight.intensity = 0.88;
        threeAmbientLight.color.setHex(0xFFFFFF);
        threeHemiLight.intensity = 0.65;
        threeHemiLight.color.setHex(0xFFFFFF);
        threeHemiLight.groundColor.setHex(0xDFDCD5);

        threeSunLight.intensity = 1.15;
        threeSunLight.color.setHex(0xFFFAF0);
        threeSunLight.position.set(55, 85, 45);

        threeInteriorLights.forEach(pl => { pl.intensity = 0.0; });
        if (threePorchLight) threePorchLight.intensity = 0.0;
        return;
      } else if (threeMode.mold === "blueprint") {
        threeScene.background = new THREE.Color(0x06111F);
        threeAmbientLight.intensity = 0.45;
        threeAmbientLight.color.setHex(0x112B4C);
        threeHemiLight.intensity = 0.40;
        threeHemiLight.color.setHex(0x00F0FF);
        threeHemiLight.groundColor.setHex(0x06111F);

        threeSunLight.intensity = 0.75;
        threeSunLight.color.setHex(0x48CAE4);
        threeSunLight.position.set(40, 70, 40);

        threeInteriorLights.forEach(pl => { pl.intensity = 1.2; pl.color.setHex(0x00F0FF); });
        if (threePorchLight) { threePorchLight.intensity = 1.5; threePorchLight.color.setHex(0x00F0FF); }
        return;
      } else if (threeMode.mold === "obsidian") {
        threeScene.background = new THREE.Color(0x0E1116);
        threeAmbientLight.intensity = 0.55;
        threeAmbientLight.color.setHex(0x383025);
        threeHemiLight.intensity = 0.45;
        threeHemiLight.color.setHex(0xD4AF37);
        threeHemiLight.groundColor.setHex(0x15181D);

        threeSunLight.intensity = 1.35;
        threeSunLight.color.setHex(0xFFDF9E);
        threeSunLight.position.set(65, 85, 50);

        threeInteriorLights.forEach(pl => { pl.intensity = 1.1; pl.color.setHex(0xFFD899); });
        if (threePorchLight) { threePorchLight.intensity = 1.4; threePorchLight.color.setHex(0xFFD899); }
        return;
      }

      // Standard Lighting (Day / Sunset / Night) with Realistic Atmospheric Scattering
      if (mode === "day") {
        threeScene.background = createSkyTexture("#9EC8E6", "#EDF3F8", "#DFE6EC");
        threeScene.fog = new THREE.FogExp2(0xEDF3F8, 0.0030);
        threeAmbientLight.intensity = 0.42;
        threeAmbientLight.color.setHex(0xFFFAF2);
        threeHemiLight.intensity = 0.72;
        threeHemiLight.color.setHex(0x9BD4F5);
        threeHemiLight.groundColor.setHex(0x6E8566);

        threeSunLight.intensity = 1.55;
        threeSunLight.color.setHex(0xFFF7EC);
        threeSunLight.position.set(65, 95, 50);

        // Warm cozy interior lights glowing through windows (like real architectural photo)
        threeInteriorLights.forEach(pl => { pl.intensity = 0.45; pl.color.setHex(0xFFE2AA); });
        if (threePorchLight) { threePorchLight.intensity = 0.65; threePorchLight.color.setHex(0xFFD180); }
      } else if (mode === "sunset") {
        threeScene.background = createSkyTexture("#382D4F", "#E66F4E", "#F5A760");
        threeScene.fog = new THREE.FogExp2(0xEB855B, 0.0036);
        threeAmbientLight.intensity = 0.42;
        threeAmbientLight.color.setHex(0xFFAA77);
        threeHemiLight.intensity = 0.55;
        threeHemiLight.color.setHex(0xFF9E7A);
        threeHemiLight.groundColor.setHex(0x4A3528);

        threeSunLight.intensity = 1.65;
        threeSunLight.color.setHex(0xFF8830);
        threeSunLight.position.set(85, 26, 55);

        threeInteriorLights.forEach(pl => { pl.intensity = 0.95; pl.color.setHex(0xFFD180); });
        if (threePorchLight) { threePorchLight.intensity = 1.3; threePorchLight.color.setHex(0xFFD180); }
      } else if (mode === "night") {
        threeScene.background = createSkyTexture("#060C14", "#0D1826", "#142234");
        threeScene.fog = new THREE.FogExp2(0x0D1826, 0.0048);
        threeAmbientLight.intensity = 0.22;
        threeAmbientLight.color.setHex(0x22334A);
        threeHemiLight.intensity = 0.25;
        threeHemiLight.color.setHex(0x1A2536);
        threeHemiLight.groundColor.setHex(0x0C131D);

        threeSunLight.intensity = 0.28;
        threeSunLight.color.setHex(0x466585);
        threeSunLight.position.set(-45, 60, -45);

        threeInteriorLights.forEach(pl => { pl.intensity = 1.5; pl.color.setHex(0xFFB84D); });
        if (threePorchLight) { threePorchLight.intensity = 1.8; threePorchLight.color.setHex(0xFFB84D); }
      }
    }

    // --- CAMERA PRESET ACTIONS ---
    function set3DCameraPreset(preset) {
      if (!threeCamera || !threeControls) return;
      ["btnCamIso", "btnCamFront", "btnCamTop", "btnCamLiving"].forEach(id => {
        const b = document.getElementById(id);
        if (b) b.classList.remove("active");
      });
      const activeId = preset === "iso" ? "btnCamIso" : preset === "front" ? "btnCamFront" : preset === "top" ? "btnCamTop" : "btnCamLiving";
      const ab = document.getElementById(activeId);
      if (ab) ab.classList.add("active");

      const plotFt = getPlotInFeet();
      const maxDim = Math.max(plotFt.width, plotFt.length);

      if (preset === "iso") {
        threeCamera.up.set(0, 1, 0);
        threeCamera.position.set(maxDim * 0.58, maxDim * 0.45, maxDim * 0.82);
        threeControls.target.set(0, 3.2, 0);
      } else if (preset === "front") {
        threeCamera.up.set(0, 1, 0);
        threeCamera.position.set(maxDim * 0.04, 4.2, maxDim * 0.90);
        threeControls.target.set(0, 4.0, 0);
      } else if (preset === "top") {
        // Aligns 1:1 with 2D Blueprint orientation: North (-Z) at top, South (+Z) at bottom, West (-X) left, East (+X) right
        threeCamera.up.set(0, 0, -1);
        threeCamera.position.set(0, maxDim * 1.35, 0.001);
        threeControls.target.set(0, 0, 0);
      } else if (preset === "interior") {
        threeCamera.up.set(0, 1, 0);
        startWalkthroughMode();
        return;
      }
      threeControls.update();
    }

    function startWalkthroughMode() {
      if (window.walkthroughController && window.walkthroughController.isActive) {
        return;
      }
      const plotFt = getPlotInFeet();
      const rooms = (state.scaledRooms && state.scaledRooms.length > 0) ? state.scaledRooms : (state.rooms || []);
      const facing = (state.requirements && state.requirements.facing) || 'S';

      let allRooms = rooms.slice();
      if (state.firstFloorRooms && state.firstFloorRooms.length > 0) {
        const ffRooms = state.firstFloorRooms.map(r => Object.assign({}, r, { floor: 'first' }));
        allRooms = allRooms.concat(ffRooms);
      }

      if (!window.walkthroughController && window.WalkthroughController) {
        const container = document.getElementById('webgl3DContainer') || document.body;
        window.walkthroughController = new window.WalkthroughController.WalkthroughController({
          scene: threeScene,
          camera: threeCamera,
          renderer: threeRenderer,
          orbitControls: threeControls,
          container: container
        });
      }

      if (window.walkthroughController) {
        window.walkthroughController.enter(allRooms, plotFt, facing);
      }
    }
    window.startWalkthroughMode = startWalkthroughMode;

    // --- 3D ARCHITECTURAL MODEL MOLDS (6 DISTINCT TYPES) ---
    function set3DMold(mold) {
      threeMode.mold = mold;
      threeMode.view = (mold === "roof") ? "roof" : "dollhouse";
      if (threeMode.layers) {
        threeMode.layers.roof = (mold === "roof");
      }

      // Sync select dropdown in 3D toolbar
      const tbarSelect = document.getElementById("select3DMold");
      if (tbarSelect) tbarSelect.value = mold;

      // Sync drawer buttons
      const drawerBtns = [
        { id: "btnDrawerMoldDollhouse", val: "dollhouse" },
        { id: "btnDrawerMoldRoof", val: "roof" },
        { id: "btnDrawerMoldClay", val: "clay" },
        { id: "btnDrawerMoldBlueprint", val: "blueprint" },
        { id: "btnDrawerMoldObsidian", val: "obsidian" },
        { id: "btnDrawerMoldXray", val: "xray" }
      ];
      drawerBtns.forEach(item => {
        document.getElementById(item.id)?.classList.toggle("active", item.val === mold);
      });

      const moldNames = {
        dollhouse: "Furnished Luxury",
        roof: "Roof Enclosure",
        clay: "White Clay Maquette",
        blueprint: "CAD Wireframe Blueprint",
        obsidian: "Stealth Obsidian",
        xray: "Glass X-Ray Skeleton"
      };

      const drawerBadge = document.getElementById("drawerMoldBadge");
      if (drawerBadge) drawerBadge.textContent = moldNames[mold] || mold;

      update3DScene();
      showToast(`Presentation style: ${moldNames[mold] || mold}`);
    }

    // --- ARCHITECTURAL MOULDINGS & TRIMS (5 TYPES) ---
    function set3DMoulding(moulding) {
      threeMode.moulding = moulding;

      const mSelect = document.getElementById("drawerMouldingSelect");
      if (mSelect) mSelect.value = moulding;

      const mouldingNames = {
        shadowline: "Shadowline Reveal",
        crown: "Classical Crown Cornice",
        slat: "Fluted Acoustic Slat",
        craftsman: "Craftsman Picture Rail",
        coffered: "Stepped Coffered Ceiling"
      };

      const mBadge = document.getElementById("drawerMouldingBadge");
      if (mBadge) mBadge.textContent = mouldingNames[moulding] || moulding;

      update3DScene();
      showToast(`Moulding profile: ${mouldingNames[moulding] || moulding}`);
    }

    function set3DViewMode(mode) {
      set3DMold(mode);
    }

    // --- WALL HEIGHT CUTAWAY TOGGLE ---
    function toggle3DWallHeight() {
      threeMode.cutWalls = !threeMode.cutWalls;
      const btn = document.getElementById("btnWallCutaway");
      if (btn) {
        btn.classList.toggle("active", threeMode.cutWalls);
        btn.textContent = threeMode.cutWalls ? "Full Height" : "Section Cut";
      }
      update3DScene();
    }

    // --- 3D LABELS TOGGLE ---
    function toggle3DLabels() {
      threeMode.showLabels = !threeMode.showLabels;
      if (threeMode.layers) {
        threeMode.layers.labels = threeMode.showLabels;
        update3DLayerChecklistUI();
      }
      if (threeLabelsGroup) {
        threeLabelsGroup.visible = threeMode.showLabels && (threeMode.view === "dollhouse");
      }
    }

    // --- TURNTABLE AUTO-ROTATE ---
    function toggle3DAutoRotate() {
      threeMode.autoRotate = !threeMode.autoRotate;
      const btn = document.getElementById("btnAutoRotate");
      if (btn) btn.classList.toggle("active", threeMode.autoRotate);
      if (threeControls) {
        threeControls.autoRotate = threeMode.autoRotate;
        threeControls.autoRotateSpeed = 1.5;
      }
    }

    // --- HIGH-RES 3D CAPTURE ---
    function capture3DScreenshot() {
      if (!threeRenderer || !threeScene || !threeCamera) return;
      threeRenderer.render(threeScene, threeCamera);
      const dataUrl = threeRenderer.domElement.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `3D-House-Render-${state.plot.width}x${state.plot.length}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast("3D perspective render exported (PNG)");
    }

    // --- 3D DISPLAY MODULES CHECKLIST CONTROLLER (BASE-UI CHECKBOX15 ARCHITECTURE) ---
    function update3DLayerChecklistUI() {
      if (!threeMode.layers) return;
      const selectedCount = THREE_MODULE_KEYS.filter(k => threeMode.layers[k]).length;
      const allSelected = selectedCount === THREE_MODULE_KEYS.length;
      const isIndeterminate = selectedCount > 0 && selectedCount < THREE_MODULE_KEYS.length;

      const parentBox = document.getElementById("cbModuleParent");
      if (parentBox) {
        parentBox.classList.toggle("is-checked", allSelected);
        parentBox.classList.toggle("is-indeterminate", isIndeterminate);
        parentBox.setAttribute("aria-checked", allSelected ? "true" : isIndeterminate ? "mixed" : "false");
      }

      THREE_MODULE_KEYS.forEach(key => {
        const box = document.getElementById(`cbModule_${key}`);
        const isChecked = !!threeMode.layers[key];
        if (box) {
          box.classList.toggle("is-checked", isChecked);
          box.setAttribute("aria-checked", isChecked ? "true" : "false");
        }
      });

      const countBadge = document.getElementById("modulesCountBadge");
      if (countBadge) {
        countBadge.textContent = `${selectedCount}/${THREE_MODULE_KEYS.length}`;
      }
    }

    function apply3DLayerVisibilities() {
      if (threeWallsGroup)     threeWallsGroup.visible     = !!threeMode.layers.walls;
      if (threeFurnitureGroup) threeFurnitureGroup.visible = !!threeMode.layers.furniture;
      if (threeSlabsGroup)     threeSlabsGroup.visible     = !!threeMode.layers.slabs;
      if (threeLabelsGroup)    threeLabelsGroup.visible    = !!threeMode.layers.labels;
      if (threeSiteGroup)      threeSiteGroup.visible      = !!threeMode.layers.site;
      if (threeRoofGroup)      threeRoofGroup.visible      = !!threeMode.layers.roof;
    }

    function toggleParentModuleCheckbox() {
      if (!threeMode.layers) return;
      const selectedCount = THREE_MODULE_KEYS.filter(k => threeMode.layers[k]).length;
      const allSelected = selectedCount === THREE_MODULE_KEYS.length;
      const targetState = !allSelected;

      THREE_MODULE_KEYS.forEach(k => {
        threeMode.layers[k] = targetState;
      });

      threeMode.view = threeMode.layers.roof ? "roof" : "dollhouse";
      const selMold = document.getElementById("select3DMold");
      if (selMold) {
        selMold.value = threeMode.layers.roof ? "roof" : (threeMode.mold === "roof" ? "dollhouse" : threeMode.mold);
      }

      apply3DLayerVisibilities();
      update3DLayerChecklistUI();
    }

    function toggleChildModuleCheckbox(key) {
      if (!threeMode.layers || typeof threeMode.layers[key] === "undefined") return;
      threeMode.layers[key] = !threeMode.layers[key];

      if (key === "roof") {
        threeMode.view = threeMode.layers.roof ? "roof" : "dollhouse";
        const selMold = document.getElementById("select3DMold");
        if (selMold) {
          selMold.value = threeMode.layers.roof ? "roof" : (threeMode.mold === "roof" ? "dollhouse" : threeMode.mold);
        }
      }

      apply3DLayerVisibilities();
      update3DLayerChecklistUI();
    }

    // --- 3D VIEWPORT CLEAN VIEW CONTROLLER (HIDE ALL TEXTS & FLOATING DOCKS) ---
    window.toggle3DCleanView = function() {
      const container = document.getElementById("viewportContainer");
      const restoreBtn = document.getElementById("btnRestoreHUD");
      const toolbar = document.getElementById("viewport3DToolbar");
      const hint = document.getElementById("viewportHint");

      if (!container) return;
      const isClean = container.classList.toggle("clean-view-active");
      if (isClean) {
        if (toolbar) toolbar.style.display = "none";
        if (hint) hint.style.display = "none";
        if (restoreBtn) restoreBtn.style.display = "inline-flex";
        if (threeLabelsGroup) threeLabelsGroup.visible = false;
        showToast("👁️ Clean View: screen cleared. Press 'C' or click Controls to restore.");
      } else {
        if (toolbar) toolbar.style.display = "flex";
        if (restoreBtn) restoreBtn.style.display = "none";
        if (threeLabelsGroup) threeLabelsGroup.visible = !!(threeMode && threeMode.layers && threeMode.layers.labels);
      }
    };

    // Keyboard shortcut: Press 'C' or 'Escape' to toggle Clean View
    window.addEventListener("keydown", (e) => {
      if (state.screen === 4 && state.view === "3d") {
        if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT")) return;
        if (e.key === "c" || e.key === "C" || e.key === "Escape") {
          window.toggle3DCleanView();
        }
      }
    });

    window.toggleModulesDockCollapse = function() {
      const dock = document.getElementById("viewportModulesDock");
      const chev = document.getElementById("modulesCollapseChevron");
      if (!dock) return;
      const isCollapsed = dock.classList.toggle("collapsed");
      if (chev) {
        chev.textContent = isCollapsed ? "▲" : "▼";
      }
    };

    // --- 3D ROOM LABEL SPRITE BUILDER ---
    function makeRoomLabelSprite(roomName, areaStr) {
      const c = document.createElement("canvas");
      c.width = 256;
      c.height = 96;
      const ctx = c.getContext("2d");

      // Translucent sleek subtle pill badge
      ctx.fillStyle = "rgba(14, 26, 43, 0.75)";
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(8, 8, 240, 80, 16);
      } else {
        ctx.rect(8, 8, 240, 80);
      }
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Room Title
      ctx.fillStyle = "#F5F2EA";
      ctx.font = "bold 20px 'JetBrains Mono', -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(roomName.toUpperCase(), 128, 38);

      // Area Subtitle
      ctx.fillStyle = "#E4572E";
      ctx.font = "600 16px 'JetBrains Mono', monospace";
      ctx.fillText(areaStr, 128, 66);

      const tex = new THREE.CanvasTexture(c);
      // ENABLE depthTest so labels are occluded by walls and roofs instead of floating in front of everything
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: true, depthWrite: false });
      const sprite = new THREE.Sprite(mat);
      // Compact, elegant scale: 2.8ft x 1.1ft instead of 7.5ft x 3.2ft!
      sprite.scale.set(2.8, 1.1, 1);
      // Strictly invisible by default so room text never covers the 3D house
      sprite.visible = !!(threeMode && threeMode.layers && threeMode.layers.labels);
      return sprite;
    }

    // --- MAIN 3D SCENE BUILDER ---
    function update3DScene() {
      if (!threeScene || !state.scaledRooms) return;

      if (threeBuildingGroup) threeScene.remove(threeBuildingGroup);
      threeBuildingGroup  = new THREE.Group();
      threeRoofGroup       = new THREE.Group();
      threeLabelsGroup     = new THREE.Group();
      threeWallsGroup      = new THREE.Group();
      threeFurnitureGroup  = new THREE.Group();
      threeSlabsGroup      = new THREE.Group();
      threeSiteGroup       = new THREE.Group();
      threeInteriorLights  = [];

      threeBuildingGroup.add(threeSiteGroup);
      threeBuildingGroup.add(threeSlabsGroup);
      threeBuildingGroup.add(threeWallsGroup);
      threeBuildingGroup.add(threeFurnitureGroup);
      threeBuildingGroup.add(threeRoofGroup);
      threeBuildingGroup.add(threeLabelsGroup);

      const plotFt = getPlotInFeet();
      const wallH  = threeMode.cutWalls ? 5.8 : 9.0;
      const wallT  = 0.58; // exterior wall thickness
      const partT  = 0.36; // interior partition thickness
      const doorH  = Math.min(7.0, wallH - 0.2);
      const sillH  = 2.6;
      const winTop = Math.min(6.8, wallH - 0.2);
      const EPS    = 0.22;

      // ── 1. REALISTIC LANDSCAPE & SITE ──────────────────────────────────────────
      // Lush Lawn (extended past plot)
      const lawnW = plotFt.width + 32;
      const lawnL = plotFt.length + 32;
      const lawnTex = getProcTexture("grass", drawGrass, lawnW / 6, lawnL / 6);
      const lawnMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(lawnW, lawnL),
        new THREE.MeshStandardMaterial({
          map: lawnTex,
          roughness: 0.88,
          metalness: 0.02
        })
      );
      lawnMesh.rotation.x = -Math.PI / 2;
      lawnMesh.position.set(0, -0.05, 0);
      lawnMesh.receiveShadow = true;
      threeSiteGroup.add(lawnMesh);

      // Raised House Foundation Plinth (0.5ft stone plinth)
      const plinthMesh = new THREE.Mesh(
        new THREE.BoxGeometry(plotFt.width + 1.4, 0.5, plotFt.length + 1.4),
        new THREE.MeshStandardMaterial({
          color: 0xE8E6E0,
          roughness: 0.8
        })
      );
      plinthMesh.position.set(0, 0.2, 0);
      plinthMesh.receiveShadow = true;
      threeSiteGroup.add(plinthMesh);

      // Front Walkway & Driveway Apron with Pavers
      const paverTex = getProcTexture("pavers", drawPavers, 3, 8);
      const groundRoomsForSite = (state.scaledRooms || []).filter(r => (r.floor || "ground") === "ground");
      const parkRoomForSite = groundRoomsForSite.find(r => r.type === "parking");

      // Paved Driveway Apron for Vehicle Access
      if (parkRoomForSite) {
        const pcx = (parkRoomForSite.x + parkRoomForSite.w / 2) - plotFt.width / 2;
        const driveW = Math.max(9.0, parkRoomForSite.w - 0.5);
        const driveL = 13.0;
        const driveMesh = new THREE.Mesh(
          new THREE.BoxGeometry(driveW, 0.16, driveL),
          new THREE.MeshStandardMaterial({
            map: paverTex,
            roughness: 0.72,
            metalness: 0.05
          })
        );
        driveMesh.position.set(pcx, 0.08, plotFt.length / 2 + driveL / 2 + 0.35);
        driveMesh.receiveShadow = true;
        threeSiteGroup.add(driveMesh);
      }

      // Pedestrian Welcome Walkway leading to Main Entrance
      const walkW = 5.2;
      const walkL = 12.0;
      const walkMesh = new THREE.Mesh(
        new THREE.BoxGeometry(walkW, 0.15, walkL),
        new THREE.MeshStandardMaterial({
          map: paverTex,
          roughness: 0.75
        })
      );
      walkMesh.position.set(0, 0.1, plotFt.length / 2 + walkL / 2 + 0.4);
      walkMesh.receiveShadow = true;
      threeSiteGroup.add(walkMesh);

      // Architectural Pathway Landscape Bollards with Warm Glowing Tops
      [-2.8, 2.8].forEach(bx => {
        [plotFt.length / 2 + 3.0, plotFt.length / 2 + 8.5].forEach(bz => {
          const bollardPost = new THREE.Mesh(
            new THREE.BoxGeometry(0.35, 1.4, 0.35),
            new THREE.MeshStandardMaterial({ color: 0x1E242B, roughness: 0.35, metalness: 0.8 })
          );
          bollardPost.position.set(bx, 0.7, bz);
          bollardPost.castShadow = true;
          const bollardLight = new THREE.Mesh(
            new THREE.BoxGeometry(0.36, 0.18, 0.36),
            new THREE.MeshStandardMaterial({ color: 0xF59E0B, emissive: 0xF59E0B, emissiveIntensity: 0.9 })
          );
          bollardLight.position.set(bx, 1.25, bz);
          threeSiteGroup.add(bollardPost);
          threeSiteGroup.add(bollardLight);
        });
      });

      // Front Architectural 3-Tier Floating Entrance Steps with Warm LED Under-Glow (Villa Elevation)
      const stepMat = new THREE.MeshStandardMaterial({ color: 0xF2EFEB, roughness: 0.38, metalness: 0.04 });
      const stepLedMat = new THREE.MeshStandardMaterial({ color: 0xFFB84D, emissive: 0xFFB84D, emissiveIntensity: 1.25 });
      const stepTiers = [
        { w: 7.6, d: 4.2, h: 0.16, y: 0.10, zOff: 2.1 }, // Bottom Tier
        { w: 6.8, d: 3.2, h: 0.16, y: 0.26, zOff: 1.6 }, // Middle Tier
        { w: 6.0, d: 2.2, h: 0.16, y: 0.42, zOff: 1.1 }  // Top Landing Tier
      ];
      stepTiers.forEach(st => {
        const tread = new THREE.Mesh(new THREE.BoxGeometry(st.w, st.h, st.d), stepMat);
        tread.position.set(0, st.y, plotFt.length / 2 + st.zOff);
        tread.receiveShadow = true;
        tread.castShadow = true;
        threeSiteGroup.add(tread);

        // LED Strip tucked under front lip
        const ledStrip = new THREE.Mesh(new THREE.BoxGeometry(st.w - 0.2, 0.03, 0.06), stepLedMat);
        ledStrip.position.set(0, st.y - st.h / 2 + 0.02, plotFt.length / 2 + st.zOff + st.d / 2);
        threeSiteGroup.add(ledStrip);
      });

      // Front Porch Welcome Mat
      const matMesh = new THREE.Mesh(
        new THREE.BoxGeometry(3.6, 0.05, 2.2),
        new THREE.MeshStandardMaterial({ color: 0x784A28, roughness: 0.95 })
      );
      matMesh.position.set(0, 0.45, plotFt.length / 2 + 1.3);
      matMesh.receiveShadow = true;
      threeSiteGroup.add(matMesh);

      // Architectural Entrance Address Monument Totem
      const totemPost = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 3.2, 0.65),
        new THREE.MeshStandardMaterial({ color: 0x181F28, roughness: 0.35, metalness: 0.85 })
      );
      totemPost.position.set(3.8, 1.6, plotFt.length / 2 + 3.8);
      totemPost.castShadow = true;
      const totemPlaque = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.45, 0.06),
        new THREE.MeshStandardMaterial({ color: 0xD4AF37, roughness: 0.2, metalness: 0.9 })
      );
      totemPlaque.position.set(3.8, 2.4, plotFt.length / 2 + 4.14);
      const totemLed = new THREE.Mesh(
        new THREE.BoxGeometry(0.66, 0.05, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x38BDF8, emissive: 0x38BDF8, emissiveIntensity: 0.9 })
      );
      totemLed.position.set(3.8, 2.7, plotFt.length / 2 + 4.14);
      threeSiteGroup.add(totemPost);
      threeSiteGroup.add(totemPlaque);
      threeSiteGroup.add(totemLed);

      // Symmetrical Manicured Spherical Boxwood Shrubs Flanking Entry
      [-3.6, 3.6].forEach(sx => {
        const shrubPot = new THREE.Mesh(
          new THREE.CylinderGeometry(0.65, 0.5, 0.8, 16),
          new THREE.MeshStandardMaterial({ color: 0x1E242B, roughness: 0.4 })
        );
        shrubPot.position.set(sx, 0.4, plotFt.length / 2 + 1.8);
        shrubPot.castShadow = true;
        const shrubBush = new THREE.Mesh(
          new THREE.SphereGeometry(0.75, 12, 12),
          new THREE.MeshStandardMaterial({ color: 0x2A6B24, roughness: 0.85 })
        );
        shrubBush.position.set(sx, 1.1, plotFt.length / 2 + 1.8);
        shrubBush.castShadow = true;
        threeSiteGroup.add(shrubPot);
        threeSiteGroup.add(shrubBush);
      });

      // Porch Sconce Light
      const porchSconce = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.8, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.3 })
      );
      porchSconce.position.set(3.0, 5.5, plotFt.length / 2 + 0.2);
      threeSiteGroup.add(porchSconce);

      threePorchLight = new THREE.PointLight(0xFFA726, 0.0, 18, 1.4);
      threePorchLight.position.set(3.0, 5.2, plotFt.length / 2 + 0.6);
      threeSiteGroup.add(threePorchLight);

      // Perimeter Low Garden Wall / Hedge
      const hedgeMat = new THREE.MeshStandardMaterial({ color: 0x245420, roughness: 0.9 });
      function addHedge(w, l, px, pz) {
        const h = new THREE.Mesh(new THREE.BoxGeometry(w, 1.6, l), hedgeMat);
        h.position.set(px, 0.8, pz);
        h.castShadow = true;
        h.receiveShadow = true;
        threeSiteGroup.add(h);
      }
      addHedge(plotFt.width + 12, 1.2, 0, -(plotFt.length / 2 + 6)); // North hedge
      addHedge(1.2, plotFt.length + 12, -(plotFt.width / 2 + 6), 0); // West hedge
      addHedge(1.2, plotFt.length + 12, plotFt.width / 2 + 6, 0);   // East hedge

      // Architectural 3D Trees in Garden
      function addTree(px, pz, scale = 1.0) {
        const treeG = new THREE.Group();
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35 * scale, 0.5 * scale, 4.5 * scale, 8),
          new THREE.MeshStandardMaterial({ color: 0x5C4033, roughness: 0.9 })
        );
        trunk.position.y = 2.25 * scale;
        trunk.castShadow = true;
        treeG.add(trunk);
        const folMat1 = new THREE.MeshStandardMaterial({ color: 0x367A2D, roughness: 0.85 });
        const folMat2 = new THREE.MeshStandardMaterial({ color: 0x438A38, roughness: 0.85 });
        const sphere1 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.4 * scale, 1), folMat1);
        sphere1.position.y = 4.8 * scale;
        sphere1.castShadow = true;
        treeG.add(sphere1);
        const sphere2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.8 * scale, 1), folMat2);
        sphere2.position.set(0.6 * scale, 6.0 * scale, 0.4 * scale);
        sphere2.castShadow = true;
        treeG.add(sphere2);
        treeG.position.set(px, 0, pz);
        threeSiteGroup.add(treeG);
      }

      addTree(-(plotFt.width / 2 + 8), -(plotFt.length / 2 + 2), 1.15);
      addTree(plotFt.width / 2 + 8, -(plotFt.length / 2 + 3), 1.0);
      addTree(-(plotFt.width / 2 + 8), plotFt.length / 2 - 4, 0.9);
      addTree(plotFt.width / 2 + 8, plotFt.length / 2 - 2, 1.1);

      // ── CONTEMPORARY VILLA ARCHITECTURAL ELEMENTS ──────────────────────────
      // 1. Raised Geometric Front Planter Bed with Tropical Foliage & Warm Ground Uplights
      const planterW = Math.min(15.0, Math.max(8.0, plotFt.width * 0.42));
      const planterX = -plotFt.width * 0.22;
      const planterZ = plotFt.length / 2 + 1.25;
      const planterBox = new THREE.Mesh(
        new THREE.BoxGeometry(planterW, 1.1, 2.2),
        new THREE.MeshStandardMaterial({ color: 0xFDFBF7, roughness: 0.65 })
      );
      planterBox.position.set(planterX, 0.55, planterZ);
      planterBox.castShadow = true;
      planterBox.receiveShadow = true;
      threeSiteGroup.add(planterBox);

      const planterSoil = new THREE.Mesh(
        new THREE.BoxGeometry(planterW - 0.35, 0.1, 1.85),
        new THREE.MeshStandardMaterial({ color: 0x241C15, roughness: 0.95 })
      );
      planterSoil.position.set(planterX, 1.05, planterZ);
      threeSiteGroup.add(planterSoil);

      const plantFol1 = new THREE.MeshStandardMaterial({ color: 0x2A6321, roughness: 0.78 });
      const plantFol2 = new THREE.MeshStandardMaterial({ color: 0x397A2C, roughness: 0.82 });
      for (let pi = 0; pi < 6; pi++) {
        const px = planterX - (planterW - 2.4) / 2 + pi * ((planterW - 2.4) / 5);
        const bush = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.85 + (pi % 3) * 0.18, 1),
          pi % 2 === 0 ? plantFol1 : plantFol2
        );
        bush.position.set(px, 1.75 + (pi % 2) * 0.22, planterZ + (Math.sin(pi * 1.6) * 0.28));
        bush.castShadow = true;
        threeSiteGroup.add(bush);
      }

      // Warm LED Ground Uplights Shining Up on Facade
      [-planterW * 0.28, planterW * 0.28].forEach(ux => {
        const upFixt = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.24, 0.28, 12),
          new THREE.MeshStandardMaterial({ color: 0x1E242B, roughness: 0.35, metalness: 0.8 })
        );
        upFixt.position.set(planterX + ux, 1.25, planterZ + 0.65);
        const upLed = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.18, 0.05, 12),
          new THREE.MeshStandardMaterial({ color: 0xFFD180, emissive: 0xFFD180, emissiveIntensity: 1.1 })
        );
        upLed.position.set(planterX + ux, 1.4, planterZ + 0.65);
        threeSiteGroup.add(upFixt);
        threeSiteGroup.add(upLed);

        const upLight = new THREE.PointLight(0xFFB84D, 0.55, 14, 1.8);
        upLight.position.set(planterX + ux, 1.65, planterZ + 0.5);
        threeSiteGroup.add(upLight);
      });

      // 2. Vertical Architectural Dark Timber Slat Feature Screen Flanking Entrance
      const slatGroup = new THREE.Group();
      const slatCount = 8;
      const slatSpacing = 0.38;
      const slatH = wallH + 0.6;
      const slatMat = new THREE.MeshStandardMaterial({ color: 0x1E2228, roughness: 0.35, metalness: 0.7 });
      for (let si = 0; si < slatCount; si++) {
        const slat = new THREE.Mesh(new THREE.BoxGeometry(0.18, slatH, 0.24), slatMat);
        slat.position.set(si * slatSpacing, slatH / 2 + 0.2, 0);
        slat.castShadow = true;
        slatGroup.add(slat);
      }
      slatGroup.position.set(-2.2, 0, plotFt.length / 2 + 0.45);
      threeSiteGroup.add(slatGroup);

      // Slender Architectural Feature Tree in Concrete Box Planter (Villa Elevation Feature)
      const treePlanterX = -1.8;
      const treePlanterZ = plotFt.length / 2 + 1.8;
      const treePot = new THREE.Mesh(
        new THREE.BoxGeometry(2.3, 1.35, 2.3),
        new THREE.MeshStandardMaterial({ color: 0xD6D2C8, roughness: 0.75 })
      );
      treePot.position.set(treePlanterX, 0.68, treePlanterZ);
      treePot.castShadow = true;
      treePot.receiveShadow = true;
      threeSiteGroup.add(treePot);

      const treeSoil = new THREE.Mesh(
        new THREE.BoxGeometry(2.0, 0.08, 2.0),
        new THREE.MeshStandardMaterial({ color: 0x241C15, roughness: 0.95 })
      );
      treeSoil.position.set(treePlanterX, 1.32, treePlanterZ);
      threeSiteGroup.add(treeSoil);

      const treeFeatureG = new THREE.Group();
      const stemMat = new THREE.MeshStandardMaterial({ color: 0x5C4D3E, roughness: 0.8 });
      const leafMat1 = new THREE.MeshStandardMaterial({ color: 0x487A28, roughness: 0.7 });
      const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x5D9436, roughness: 0.65 });

      const mainStem = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 5.2, 8), stemMat);
      mainStem.position.set(0, 2.6, 0);
      mainStem.rotation.z = -0.06;
      mainStem.castShadow = true;
      treeFeatureG.add(mainStem);

      const branch1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 2.6, 6), stemMat);
      branch1.position.set(0.65, 4.0, 0.2);
      branch1.rotation.z = -0.55;
      branch1.rotation.y = 0.4;
      branch1.castShadow = true;
      treeFeatureG.add(branch1);

      const branch2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.2, 6), stemMat);
      branch2.position.set(-0.55, 3.6, -0.2);
      branch2.rotation.z = 0.52;
      branch2.rotation.y = -0.3;
      branch2.castShadow = true;
      treeFeatureG.add(branch2);

      const padCoords = [
        [0.1, 5.4, 0, 1.15],
        [1.2, 4.8, 0.3, 0.95],
        [-1.0, 4.4, -0.2, 0.88],
        [0.4, 5.8, -0.3, 0.85]
      ];
      padCoords.forEach(([px, py, pz, pScale], idx) => {
        const pad = new THREE.Mesh(new THREE.DodecahedronGeometry(pScale, 1), idx % 2 === 0 ? leafMat1 : leafMat2);
        pad.scale.set(1.2, 0.65, 1.1);
        pad.position.set(px, py, pz);
        pad.castShadow = true;
        treeFeatureG.add(pad);
      });

      treeFeatureG.position.set(treePlanterX, 1.35, treePlanterZ);
      threeSiteGroup.add(treeFeatureG);

      // Smooth Dark Asphalt Street in Foreground (Matching Cinematic Road View)
      const streetL = 16.0;
      const streetW = plotFt.width + 36;
      const streetMesh = new THREE.Mesh(
        new THREE.BoxGeometry(streetW, 0.12, streetL),
        new THREE.MeshStandardMaterial({ color: 0x22262B, roughness: 0.82, metalness: 0.05 })
      );
      streetMesh.position.set(0, 0.02, plotFt.length / 2 + 13.0 + streetL / 2);
      streetMesh.receiveShadow = true;
      threeSiteGroup.add(streetMesh);

      // Curbside Bevel / Paver Border
      const curbMesh = new THREE.Mesh(
        new THREE.BoxGeometry(streetW, 0.18, 0.8),
        new THREE.MeshStandardMaterial({ color: 0xB0ABB3, roughness: 0.6 })
      );
      curbMesh.position.set(0, 0.08, plotFt.length / 2 + 13.0);
      curbMesh.receiveShadow = true;
      threeSiteGroup.add(curbMesh);

      // 3. Cantilevered Modern Porch / Carport Canopy with Warm Teak Soffit & Recessed Downlights
      const canopyW = parkRoomForSite ? Math.max(13.0, parkRoomForSite.w + 2.5) : 13.0;
      const canopyL = 13.5;
      const canopyH = 0.55;
      const canopyY = wallH + 0.35;
      const canopyX = parkRoomForSite ? ((parkRoomForSite.x + parkRoomForSite.w / 2) - plotFt.width / 2) : 2.0;
      const canopyZ = plotFt.length / 2 + canopyL / 2 - 1.8;

      const canopyGroup = new THREE.Group();
      const fasciaCanopy = new THREE.Mesh(
        new THREE.BoxGeometry(canopyW, canopyH, canopyL),
        new THREE.MeshStandardMaterial({ color: 0x22272E, roughness: 0.35, metalness: 0.35 })
      );
      fasciaCanopy.position.set(0, 0, 0);
      fasciaCanopy.castShadow = true;
      canopyGroup.add(fasciaCanopy);

      const teakSoffitTex = getProcTexture("teakSoffit", drawWoodSoffit, canopyW / 4, canopyL / 4);
      const soffitMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(canopyW - 0.4, canopyL - 0.4),
        new THREE.MeshStandardMaterial({ map: teakSoffitTex, roughness: 0.42, metalness: 0.05 })
      );
      soffitMesh.rotation.x = Math.PI / 2;
      soffitMesh.position.set(0, -canopyH / 2 - 0.02, 0);
      canopyGroup.add(soffitMesh);

      const downlightCoords = [
        [-canopyW * 0.28, -canopyL * 0.25],
        [canopyW * 0.28, -canopyL * 0.25],
        [-canopyW * 0.28, canopyL * 0.2],
        [canopyW * 0.28, canopyL * 0.2]
      ];
      downlightCoords.forEach(([dx, dz]) => {
        const spotRing = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.35, 0.06, 16),
          new THREE.MeshStandardMaterial({ color: 0x1A1D20, roughness: 0.3, metalness: 0.8 })
        );
        spotRing.position.set(dx, -canopyH / 2 - 0.03, dz);
        const spotLed = new THREE.Mesh(
          new THREE.CylinderGeometry(0.28, 0.28, 0.04, 16),
          new THREE.MeshStandardMaterial({ color: 0xFFE082, emissive: 0xFFE082, emissiveIntensity: 1.1 })
        );
        spotLed.position.set(dx, -canopyH / 2 - 0.05, dz);
        canopyGroup.add(spotRing);
        canopyGroup.add(spotLed);

        const downSpot = new THREE.PointLight(0xFFD180, 0.45, 14, 1.8);
        downSpot.position.set(dx, -canopyH / 2 - 0.4, dz);
        canopyGroup.add(downSpot);
      });

      const ledStripMesh = new THREE.Mesh(
        new THREE.BoxGeometry(canopyW - 0.6, 0.05, 0.08),
        new THREE.MeshStandardMaterial({ color: 0xFFE082, emissive: 0xFFE082, emissiveIntensity: 1.0 })
      );
      ledStripMesh.position.set(0, -canopyH / 2 - 0.02, canopyL / 2 - 0.2);
      canopyGroup.add(ledStripMesh);

      const pillarH = wallH + 0.15;
      const pillarMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, pillarH, 1.4),
        new THREE.MeshStandardMaterial({ color: 0xFDFBF7, roughness: 0.65 })
      );
      pillarMesh.position.set(canopyW / 2 - 1.0, -pillarH / 2 + canopyH / 2, canopyL / 2 - 1.2);
      pillarMesh.castShadow = true;
      pillarMesh.receiveShadow = true;
      canopyGroup.add(pillarMesh);

      canopyGroup.position.set(canopyX, canopyY, canopyZ);
      threeSiteGroup.add(canopyGroup);

      // 4. Sleek Modern Vehicle in Carport
      if (parkRoomForSite) {
        const carG = new THREE.Group();
        const carPaintMat = new THREE.MeshStandardMaterial({ color: 0x1E242B, roughness: 0.18, metalness: 0.85 });
        const carGlassMat = new THREE.MeshStandardMaterial({ color: 0x0F141C, roughness: 0.05, metalness: 0.9, transparent: true, opacity: 0.88 });
        const carWheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
        const carRimMat = new THREE.MeshStandardMaterial({ color: 0xCBD5E1, roughness: 0.25, metalness: 0.9 });
        const carHeadlightMat = new THREE.MeshStandardMaterial({ color: 0xE0F2FE, emissive: 0xE0F2FE, emissiveIntensity: 0.9 });
        const carTaillightMat = new THREE.MeshStandardMaterial({ color: 0xEF4444, emissive: 0xEF4444, emissiveIntensity: 0.85 });

        const carBody = new THREE.Mesh(new THREE.BoxGeometry(6.2, 1.3, 13.5), carPaintMat);
        carBody.position.set(0, 1.1, 0);
        carBody.castShadow = true;
        carG.add(carBody);

        const carCabin = new THREE.Mesh(new THREE.BoxGeometry(5.6, 1.25, 7.8), carGlassMat);
        carCabin.position.set(0, 2.3, -0.6);
        carCabin.castShadow = true;
        carG.add(carCabin);

        const carRoof = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.1, 7.2), carPaintMat);
        carRoof.position.set(0, 2.95, -0.6);
        carG.add(carRoof);

        [[-3.1, 3.8], [3.1, 3.8], [-3.1, -3.8], [3.1, -3.8]].forEach(([wx, wz]) => {
          const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.65, 16), carWheelMat);
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(wx, 0.9, wz);
          wheel.castShadow = true;
          const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.68, 16), carRimMat);
          rim.rotation.z = Math.PI / 2;
          rim.position.set(wx, 0.9, wz);
          carG.add(wheel);
          carG.add(rim);
        });

        [-2.2, 2.2].forEach(hx => {
          const hl = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.25, 0.1), carHeadlightMat);
          hl.position.set(hx, 1.3, 6.75);
          const tl = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.22, 0.1), carTaillightMat);
          tl.position.set(hx, 1.35, -6.75);
          carG.add(hl);
          carG.add(tl);
        });

        const carX = (parkRoomForSite.x + parkRoomForSite.w / 2) - plotFt.width / 2;
        const carZ = plotFt.length / 2 + 5.5;
        carG.position.set(carX, 0, carZ);
        threeSiteGroup.add(carG);
      }

      // 5. Architectural Twin-Beam Up-Down Facade Sconces
      const sconceX = -plotFt.width * 0.36;
      const sconceZ = plotFt.length / 2 + 0.35;
      const sconceMat = new THREE.MeshStandardMaterial({ color: 0x1A1E24, roughness: 0.3, metalness: 0.85 });
      const sconceBody = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.9, 0.3), sconceMat);
      sconceBody.position.set(sconceX, 4.5, sconceZ);
      threeSiteGroup.add(sconceBody);

      const lensMat = new THREE.MeshStandardMaterial({ color: 0xFFD180, emissive: 0xFFD180, emissiveIntensity: 1.2 });
      const lensTop = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.06, 0.24), lensMat);
      lensTop.position.set(sconceX, 4.95, sconceZ);
      const lensBottom = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.06, 0.24), lensMat);
      lensBottom.position.set(sconceX, 4.05, sconceZ);
      threeSiteGroup.add(lensTop);
      threeSiteGroup.add(lensBottom);

      const sconceLight = new THREE.PointLight(0xF59E0B, 0.55, 12, 1.6);
      sconceLight.position.set(sconceX, 4.5, sconceZ + 0.3);
      threeSiteGroup.add(sconceLight);

      // ── 2. ARCHITECTURAL MATERIAL PALETTE (DYNAMIC 3D MOLD MATRIX) ──────────
      const isClay = (threeMode.mold === "clay");
      const isBlueprint = (threeMode.mold === "blueprint");
      const isObsidian = (threeMode.mold === "obsidian");
      const isXray = (threeMode.mold === "xray");

      const stuccoTex = getProcTexture("stucco", drawStucco, 4, 4);
      const stoneCladdingTex = getProcTexture("stoneCladding", drawStoneCladding, 3, 3);

      const extWallMat = isClay ? new THREE.MeshStandardMaterial({ color: 0xF5F3EC, roughness: 0.95, metalness: 0 })
                       : isBlueprint ? new THREE.MeshStandardMaterial({ color: 0x0C2340, roughness: 0.25, metalness: 0.3, transparent: true, opacity: 0.85 })
                       : isObsidian ? new THREE.MeshStandardMaterial({ color: 0x1A1D22, roughness: 0.42, metalness: 0.15 })
                       : isXray ? new THREE.MeshStandardMaterial({ color: 0xD7E9F7, roughness: 0.12, metalness: 0.08, transparent: true, opacity: 0.32 })
                       : new THREE.MeshStandardMaterial({ map: stuccoTex, color: 0xFDFBF7, roughness: 0.65, metalness: 0.02 });

      const stoneWallMat = isClay ? new THREE.MeshStandardMaterial({ color: 0xF5F3EC, roughness: 0.95 })
                         : isBlueprint ? new THREE.MeshStandardMaterial({ color: 0x0C2340, roughness: 0.25, metalness: 0.3, transparent: true, opacity: 0.85 })
                         : isObsidian ? new THREE.MeshStandardMaterial({ color: 0x1A1D22, roughness: 0.42 })
                         : isXray ? new THREE.MeshStandardMaterial({ color: 0xD7E9F7, roughness: 0.12, transparent: true, opacity: 0.32 })
                         : new THREE.MeshStandardMaterial({ map: stoneCladdingTex, roughness: 0.76, metalness: 0.04 });

      const intWallMat = isClay ? new THREE.MeshStandardMaterial({ color: 0xF0EEE6, roughness: 0.92, metalness: 0 })
                       : isBlueprint ? new THREE.MeshStandardMaterial({ color: 0x13315C, roughness: 0.25, transparent: true, opacity: 0.75 })
                       : isObsidian ? new THREE.MeshStandardMaterial({ color: 0x22262C, roughness: 0.38, metalness: 0.1 })
                       : isXray ? new THREE.MeshStandardMaterial({ color: 0xE8F3FB, roughness: 0.15, metalness: 0.05, transparent: true, opacity: 0.52 })
                       : new THREE.MeshStandardMaterial({ color: 0xF8F7F4, roughness: 0.55, metalness: 0.02 });

      const woodAccentMat = isClay ? new THREE.MeshStandardMaterial({ color: 0xEAE7DF, roughness: 0.95 })
                          : isBlueprint ? new THREE.MeshStandardMaterial({ color: 0x0A192F, roughness: 0.4 })
                          : isObsidian ? new THREE.MeshStandardMaterial({ color: 0x121417, roughness: 0.45 })
                          : isXray ? new THREE.MeshStandardMaterial({ color: 0x3B82F6, roughness: 0.3 })
                          : new THREE.MeshStandardMaterial({ color: 0x5C3D28, roughness: 0.38, metalness: 0.05 });

      const garagePortalMat = isClay ? new THREE.MeshStandardMaterial({ color: 0xDFDCD4, roughness: 0.9 })
                            : isBlueprint ? new THREE.MeshStandardMaterial({ color: 0x00F0FF, emissive: 0x00F0FF, emissiveIntensity: 0.7 })
                            : isObsidian ? new THREE.MeshStandardMaterial({ color: 0x101215, roughness: 0.35, metalness: 0.85 })
                            : new THREE.MeshStandardMaterial({ color: 0x1E242B, roughness: 0.32, metalness: 0.82 });

      const steelMat = isClay ? new THREE.MeshStandardMaterial({ color: 0xDDD9CF, roughness: 0.85 })
                     : isBlueprint ? new THREE.MeshStandardMaterial({ color: 0x00F0FF, emissive: 0x00F0FF, emissiveIntensity: 0.8 })
                     : isObsidian ? new THREE.MeshStandardMaterial({ color: 0xD4AF37, roughness: 0.2, metalness: 0.95 })
                     : new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.28, metalness: 0.88 });

      const doorWoodMat = isClay ? new THREE.MeshStandardMaterial({ color: 0xE6E3DB, roughness: 0.9 })
                        : isBlueprint ? new THREE.MeshStandardMaterial({ color: 0x07111E, roughness: 0.5 })
                        : isObsidian ? new THREE.MeshStandardMaterial({ color: 0x14171A, roughness: 0.4 })
                        : new THREE.MeshStandardMaterial({ color: 0x483222, roughness: 0.38 });

      const doorGrooveMat = isClay ? new THREE.MeshStandardMaterial({ color: 0xD8D4CB, roughness: 0.9 })
                          : new THREE.MeshStandardMaterial({ color: 0x241810, roughness: 0.5 });

      const handleMat = isClay ? new THREE.MeshStandardMaterial({ color: 0xD0CCC2, roughness: 0.7 })
                      : isBlueprint ? new THREE.MeshStandardMaterial({ color: 0x00F0FF, emissive: 0x00F0FF, emissiveIntensity: 0.9 })
                      : new THREE.MeshStandardMaterial({ color: 0xD4AF37, roughness: 0.22, metalness: 0.88 });

      const winFrameMat = isClay ? new THREE.MeshStandardMaterial({ color: 0xDDD9CF, roughness: 0.85 })
                        : isBlueprint ? new THREE.MeshStandardMaterial({ color: 0x00F0FF, emissive: 0x00F0FF, emissiveIntensity: 0.6 })
                        : isObsidian ? new THREE.MeshStandardMaterial({ color: 0x141619, roughness: 0.3 })
                        : new THREE.MeshStandardMaterial({ color: 0x181F28, roughness: 0.32, metalness: 0.65 });

      const glassMat = isClay ? new THREE.MeshStandardMaterial({ color: 0xF5F3EC, roughness: 0.3, transparent: true, opacity: 0.55 })
                     : isBlueprint ? new THREE.MeshStandardMaterial({ color: 0x00F0FF, opacity: 0.22, transparent: true, roughness: 0.05 })
                     : isObsidian ? new THREE.MeshStandardMaterial({ color: 0x2B241E, opacity: 0.52, transparent: true, roughness: 0.08 })
                     : isXray ? new THREE.MeshStandardMaterial({ color: 0xC0E2F5, opacity: 0.18, transparent: true })
                     : new THREE.MeshStandardMaterial({ color: 0xD0ECF8, roughness: 0.04, metalness: 0.15, transparent: true, opacity: 0.32 });

      const frostedGlassMat = isClay ? new THREE.MeshStandardMaterial({ color: 0xEAE7DF, opacity: 0.65, transparent: true })
                            : isBlueprint ? new THREE.MeshStandardMaterial({ color: 0x00F0FF, opacity: 0.45, transparent: true })
                            : new THREE.MeshStandardMaterial({ color: 0xE2F1F8, roughness: 0.45, metalness: 0.05, transparent: true, opacity: 0.75 });

      const baseboardMat = isClay ? new THREE.MeshStandardMaterial({ color: 0xE0DDD5, roughness: 0.9 })
                         : isObsidian ? new THREE.MeshStandardMaterial({ color: 0xD4AF37, roughness: 0.2, metalness: 0.85 })
                         : new THREE.MeshStandardMaterial({ color: 0x3A2A1E, roughness: 0.45 });

      const stairLedMat = isClay ? new THREE.MeshStandardMaterial({ color: 0xE8E5DC, roughness: 0.9 })
                        : isBlueprint ? new THREE.MeshStandardMaterial({ color: 0x00F0FF, emissive: 0x00F0FF, emissiveIntensity: 1.0 })
                        : new THREE.MeshStandardMaterial({ color: 0xF59E0B, emissive: 0xF59E0B, emissiveIntensity: 0.85 });

      // ── 3. ARCHITECTURAL WALLS WITH REAL OPENINGS ───────────────────────────
      function renderWallWithOpenings(group, wallLen, isShared, isHoriz, fixedCoord, startCoord, openings, wallBaseY, wallContext) {
        const isFrontAccent = !isShared && wallContext && wallContext.wallSide === "south" && (wallContext.room && (wallContext.room.type === "bedroom" || wallContext.room.type === "study"));
        const mat = isShared ? intWallMat : isFrontAccent ? stoneWallMat : extWallMat;
        const thick = isShared ? partT : wallT;

        const sorted = (openings || []).slice().sort((a, b) => a.start - b.start);

        let curr = 0;
        sorted.forEach(op => {
          if (op.start > curr + 0.05) {
            const segLen = op.start - curr;
            const midPos = curr + segLen / 2;
            const px = isHoriz ? (startCoord + midPos) : fixedCoord;
            const pz = isHoriz ? fixedCoord : (startCoord + midPos);
            const wx = isHoriz ? segLen : thick;
            const wz = isHoriz ? thick : segLen;

            const segMesh = new THREE.Mesh(new THREE.BoxGeometry(wx, wallH, wz), mat);
            segMesh.position.set(px, wallBaseY + wallH / 2, pz);
            segMesh.castShadow = true;
            segMesh.receiveShadow = true;
            group.add(segMesh);
          }

          const opLen = op.width;
          const midPos = op.start + opLen / 2;
          const opX = isHoriz ? (startCoord + midPos) : fixedCoord;
          const opZ = isHoriz ? fixedCoord : (startCoord + midPos);

          const isParkingWall = !!(wallContext && (wallContext.isParking || (wallContext.room && wallContext.room.type === "parking")));
          const isAdjoiningParking = !!(wallContext && (wallContext.adjacentIsParking || wallContext.isParking));
          const isGarageOpening = (op.type === "door") && (opLen >= 5.5 || (isParkingWall && opLen >= 4.5 && (wallContext.wallSide === "south" || wallContext.wallSide === "north" || !isShared)));

          if (op.type === "door") {
            if (isGarageOpening) {
              // ── ARCHITECTURAL MOTORIZED OVERHEAD SECTIONAL GARAGE PORTAL ──
              // 1. Structural Lintel
              const gDoorH = Math.min(7.5, wallH - 0.2);
              if (wallH > gDoorH + 0.05) {
                const lintelH = wallH - gDoorH;
                const wx = isHoriz ? opLen : thick;
                const wz = isHoriz ? thick : opLen;
                const lintelMesh = new THREE.Mesh(new THREE.BoxGeometry(wx, lintelH, wz), mat);
                lintelMesh.position.set(opX, wallBaseY + gDoorH + lintelH / 2, opZ);
                lintelMesh.castShadow = true;
                group.add(lintelMesh);
              }

              // 2. Heavy-Gauge Architectural Portal Surround
              const frameT = 0.18;
              const jw = isHoriz ? frameT : thick + 0.06;
              const jz = isHoriz ? thick + 0.06 : frameT;
              const jambL = new THREE.Mesh(new THREE.BoxGeometry(jw, gDoorH, jz), garagePortalMat);
              const jambR = jambL.clone();
              if (isHoriz) {
                jambL.position.set(opX - opLen / 2 + frameT / 2, wallBaseY + gDoorH / 2, opZ);
                jambR.position.set(opX + opLen / 2 - frameT / 2, wallBaseY + gDoorH / 2, opZ);
              } else {
                jambL.position.set(opX, wallBaseY + gDoorH / 2, opZ - opLen / 2 + frameT / 2);
                jambR.position.set(opX, wallBaseY + gDoorH / 2, opZ + opLen / 2 - frameT / 2);
              }
              group.add(jambL);
              group.add(jambR);

              // 3. Overhead Horizontal Motorized Ceiling Guide Tracks
              const trackLen = 8.5;
              const trackY = wallBaseY + wallH - 0.22;
              const trackT = 0.08;
              const inSign = (wallContext && wallContext.wallSide === "south") ? -1 : (wallContext && wallContext.wallSide === "north") ? 1 : -1;

              if (isHoriz) {
                [-opLen / 2 + 0.35, opLen / 2 - 0.35].forEach(tx => {
                  const rail = new THREE.Mesh(new THREE.BoxGeometry(trackT, trackT, trackLen), steelMat);
                  rail.position.set(opX + tx, trackY, opZ + inSign * (trackLen / 2));
                  group.add(rail);

                  // Ceiling drop hanger brackets
                  const hanger = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.45, 0.04), steelMat);
                  hanger.position.set(opX + tx, trackY + 0.22, opZ + inSign * (trackLen * 0.75));
                  group.add(hanger);
                });

                // 4. Overhead Retracted Sectional Slats (Cleanly tucked overhead on ceiling rails)
                const slatW = opLen - frameT * 2 - 0.2;
                const slatGroup = new THREE.Group();
                for (let si = 0; si < 4; si++) {
                  const slatZ = inSign * (1.2 + si * 1.6);
                  const slat = new THREE.Mesh(new THREE.BoxGeometry(slatW, 0.06, 1.45), garagePortalMat);
                  slat.position.set(0, 0, slatZ);
                  slatGroup.add(slat);

                  // Frosted vision glass slit
                  const slit = new THREE.Mesh(new THREE.BoxGeometry(slatW * 0.7, 0.08, 0.25), frostedGlassMat);
                  slit.position.set(0, 0, slatZ);
                  slatGroup.add(slit);
                }
                slatGroup.position.set(opX, trackY - 0.04, opZ);
                group.add(slatGroup);
              } else {
                [-opLen / 2 + 0.35, opLen / 2 - 0.35].forEach(tz => {
                  const rail = new THREE.Mesh(new THREE.BoxGeometry(trackLen, trackT, trackT), steelMat);
                  rail.position.set(opX + inSign * (trackLen / 2), trackY, opZ + tz);
                  group.add(rail);
                });
              }

              // 5. Exterior Electronic Access Keypad / Intercom on Jamb
              const keypad = new THREE.Mesh(
                new THREE.BoxGeometry(isHoriz ? 0.16 : 0.08, 0.65, isHoriz ? 0.08 : 0.16),
                new THREE.MeshStandardMaterial({ color: 0x0F172A, roughness: 0.2, metalness: 0.9 })
              );
              const keyLed = new THREE.Mesh(
                new THREE.BoxGeometry(isHoriz ? 0.1 : 0.05, 0.1, isHoriz ? 0.05 : 0.1),
                new THREE.MeshStandardMaterial({ color: 0x38BDF8, emissive: 0x38BDF8, emissiveIntensity: 0.85 })
              );
              if (isHoriz) {
                keypad.position.set(opX + opLen / 2 + 0.35, wallBaseY + 4.2, opZ + 0.1);
                keyLed.position.set(opX + opLen / 2 + 0.35, wallBaseY + 4.4, opZ + 0.16);
              } else {
                keypad.position.set(opX + 0.1, wallBaseY + 4.2, opZ + opLen / 2 + 0.35);
                keyLed.position.set(opX + 0.16, wallBaseY + 4.4, opZ + opLen / 2 + 0.35);
              }
              group.add(keypad);
              group.add(keyLed);

              // Ground level is 100% open and unobstructed! No swinging wooden door slab!

            } else if (opLen >= 4.0) {
              // ── DOUBLE FRENCH / PATIO DOORS ──
              if (wallH > doorH + 0.05) {
                const lintelH = wallH - doorH;
                const wx = isHoriz ? opLen : thick;
                const wz = isHoriz ? thick : opLen;
                const lintelMesh = new THREE.Mesh(new THREE.BoxGeometry(wx, lintelH, wz), mat);
                lintelMesh.position.set(opX, wallBaseY + doorH + lintelH / 2, opZ);
                lintelMesh.castShadow = true;
                group.add(lintelMesh);
              }

              const frameT = 0.12;
              const jw = isHoriz ? frameT : thick + 0.04;
              const jz = isHoriz ? thick + 0.04 : frameT;
              const jambL = new THREE.Mesh(new THREE.BoxGeometry(jw, doorH, jz), winFrameMat);
              const jambR = jambL.clone();
              if (isHoriz) {
                jambL.position.set(opX - opLen / 2 + frameT / 2, wallBaseY + doorH / 2, opZ);
                jambR.position.set(opX + opLen / 2 - frameT / 2, wallBaseY + doorH / 2, opZ);
              } else {
                jambL.position.set(opX, wallBaseY + doorH / 2, opZ - opLen / 2 + frameT / 2);
                jambR.position.set(opX, wallBaseY + doorH / 2, opZ + opLen / 2 - frameT / 2);
              }
              group.add(jambL);
              group.add(jambR);

              const leafW = (opLen - frameT * 2 - 0.04) / 2;
              // Left leaf
              const leafG1 = new THREE.Group();
              const slab1 = new THREE.Mesh(new THREE.BoxGeometry(leafW, doorH - 0.08, 0.1), doorWoodMat);
              slab1.position.set(leafW / 2, (doorH - 0.08) / 2, 0);
              leafG1.add(slab1);
              const glass1 = new THREE.Mesh(new THREE.BoxGeometry(leafW * 0.65, doorH * 0.65, 0.06), glassMat);
              glass1.position.set(leafW / 2, doorH * 0.5, 0);
              leafG1.add(glass1);
              const h1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.14), handleMat);
              h1.position.set(leafW - 0.2, 3.2, 0.06);
              leafG1.add(h1);

              // Right leaf
              const leafG2 = new THREE.Group();
              const slab2 = new THREE.Mesh(new THREE.BoxGeometry(leafW, doorH - 0.08, 0.1), doorWoodMat);
              slab2.position.set(-leafW / 2, (doorH - 0.08) / 2, 0);
              leafG2.add(slab2);
              const glass2 = new THREE.Mesh(new THREE.BoxGeometry(leafW * 0.65, doorH * 0.65, 0.06), glassMat);
              glass2.position.set(-leafW / 2, doorH * 0.5, 0);
              leafG2.add(glass2);
              const h2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.14), handleMat);
              h2.position.set(-leafW + 0.2, 3.2, 0.06);
              leafG2.add(h2);

              if (isHoriz) {
                leafG1.position.set(opX - opLen / 2 + frameT, wallBaseY, opZ);
                leafG1.rotation.y = Math.PI / 7;
                leafG2.position.set(opX + opLen / 2 - frameT, wallBaseY, opZ);
                leafG2.rotation.y = -Math.PI / 7;
              } else {
                leafG1.position.set(opX, wallBaseY, opZ - opLen / 2 + frameT);
                leafG1.rotation.y = Math.PI / 2 + Math.PI / 7;
                leafG2.position.set(opX, wallBaseY, opZ + opLen / 2 - frameT);
                leafG2.rotation.y = Math.PI / 2 - Math.PI / 7;
              }
              group.add(leafG1);
              group.add(leafG2);

            } else {
              // ── SINGLE ARCHITECTURAL DOOR ──
              if (wallH > doorH + 0.05) {
                const lintelH = wallH - doorH;
                const wx = isHoriz ? opLen : thick;
                const wz = isHoriz ? thick : opLen;
                const lintelMesh = new THREE.Mesh(new THREE.BoxGeometry(wx, lintelH, wz), mat);
                lintelMesh.position.set(opX, wallBaseY + doorH + lintelH / 2, opZ);
                lintelMesh.castShadow = true;
                group.add(lintelMesh);
              }

              const frameT = 0.12;
              const jw = isHoriz ? frameT : thick + 0.04;
              const jz = isHoriz ? thick + 0.04 : frameT;
              const jambL = new THREE.Mesh(new THREE.BoxGeometry(jw, doorH, jz), doorWoodMat);
              const jambR = jambL.clone();
              if (isHoriz) {
                jambL.position.set(opX - opLen / 2 + frameT / 2, wallBaseY + doorH / 2, opZ);
                jambR.position.set(opX + opLen / 2 - frameT / 2, wallBaseY + doorH / 2, opZ);
              } else {
                jambL.position.set(opX, wallBaseY + doorH / 2, opZ - opLen / 2 + frameT / 2);
                jambR.position.set(opX, wallBaseY + doorH / 2, opZ + opLen / 2 - frameT / 2);
              }
              group.add(jambL);
              group.add(jambR);

              const doorLeafW = opLen - frameT * 2;
              const doorGroup = new THREE.Group();

              // Solid Walnut Architectural Door Slab with Shadow Lines
              const slab = new THREE.Mesh(new THREE.BoxGeometry(doorLeafW, doorH - 0.08, 0.12), doorWoodMat);
              slab.position.set(doorLeafW / 2, (doorH - 0.08) / 2, 0);
              slab.castShadow = true;
              doorGroup.add(slab);

              // Horizontal Architectural Reveal Grooves
              for (let gi = 1; gi <= 3; gi++) {
                const groove = new THREE.Mesh(new THREE.BoxGeometry(doorLeafW - 0.2, 0.03, 0.13), doorGrooveMat);
                groove.position.set(doorLeafW / 2, (doorH - 0.08) * (gi / 4), 0);
                doorGroup.add(groove);
              }

              // Brushed Brass Lever Handle on BOTH Sides
              [-0.08, 0.08].forEach(sideZ => {
                const rosette = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 12), handleMat);
                rosette.rotation.x = Math.PI / 2;
                rosette.position.set(doorLeafW - 0.35, 3.2, sideZ);
                const lever = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.07, 0.06), handleMat);
                lever.position.set(doorLeafW - 0.35 + 0.16, 3.2, sideZ + (sideZ > 0 ? 0.04 : -0.04));
                doorGroup.add(rosette);
                doorGroup.add(lever);
              });

              // CRITICAL: Swing direction check
              // If adjoining parking, swing AWAY from parking into living space!
              let swingAngle = Math.PI / 5; // 36 degrees gentle swing
              if (isAdjoiningParking) {
                swingAngle = isParkingWall ? -Math.PI / 7 : Math.PI / 6;
              }

              if (isHoriz) {
                doorGroup.position.set(opX - opLen / 2 + frameT, wallBaseY, opZ);
                doorGroup.rotation.y = swingAngle;
              } else {
                doorGroup.position.set(opX, wallBaseY, opZ - opLen / 2 + frameT);
                doorGroup.rotation.y = Math.PI / 2 + swingAngle;
              }

              const doorMeshId = (op.id) || ('door_' + Math.round(opX) + '_' + Math.round(opZ));
              doorGroup.userData = {
                isDoor: true,
                id: doorMeshId,
                isHoriz: isHoriz,
                swingAngle: swingAngle,
                baseAngle: isHoriz ? 0 : Math.PI / 2,
                currentAngle: swingAngle,
                isOpen: true,
                pos: { x: opX, y: wallBaseY, z: opZ }
              };
              if (!window.threeDoorMeshes) window.threeDoorMeshes = new Map();
              window.threeDoorMeshes.set(doorMeshId, doorGroup);

              group.add(doorGroup);
            }

          } else if (op.type === "window") {
            // ── ARCHITECTURAL HIGH-PERFORMANCE WINDOW ──
            const wx = isHoriz ? opLen : thick;
            const wz = isHoriz ? thick : opLen;
            const sillWall = new THREE.Mesh(new THREE.BoxGeometry(wx, sillH, wz), mat);
            sillWall.position.set(opX, wallBaseY + sillH / 2, opZ);
            sillWall.castShadow = true;
            sillWall.receiveShadow = true;
            group.add(sillWall);

            if (wallH > winTop + 0.05) {
              const lintelH = wallH - winTop;
              const lintelMesh = new THREE.Mesh(new THREE.BoxGeometry(wx, lintelH, wz), mat);
              lintelMesh.position.set(opX, wallBaseY + winTop + lintelH / 2, opZ);
              lintelMesh.castShadow = true;
              group.add(lintelMesh);
            }

            const winH = winTop - sillH;
            const fw = isHoriz ? opLen : thick + 0.06;
            const fz = isHoriz ? thick + 0.06 : opLen;
            const frameOuter = new THREE.Mesh(new THREE.BoxGeometry(fw, winH, fz), winFrameMat);
            frameOuter.position.set(opX, wallBaseY + sillH + winH / 2, opZ);
            group.add(frameOuter);

            const gw = isHoriz ? opLen - 0.2 : 0.08;
            const gz = isHoriz ? 0.08 : opLen - 0.2;
            const glass = new THREE.Mesh(new THREE.BoxGeometry(gw, winH - 0.2, gz), glassMat);
            glass.position.set(opX, wallBaseY + sillH + winH / 2, opZ);
            group.add(glass);

            // Architectural Divided Mullions & Transoms
            if (opLen >= 4.0) {
              const mw = isHoriz ? 0.08 : thick + 0.07;
              const mz = isHoriz ? thick + 0.07 : 0.08;
              const mullion = new THREE.Mesh(new THREE.BoxGeometry(mw, winH - 0.1, mz), winFrameMat);
              mullion.position.set(opX, wallBaseY + sillH + winH / 2, opZ);
              group.add(mullion);
            }
            if (winH >= 3.8) {
              const tw = isHoriz ? opLen - 0.1 : thick + 0.07;
              const tz = isHoriz ? thick + 0.07 : opLen - 0.1;
              const transom = new THREE.Mesh(new THREE.BoxGeometry(tw, 0.08, tz), winFrameMat);
              transom.position.set(opX, wallBaseY + sillH + winH * 0.67, opZ);
              group.add(transom);
            }

            // Exterior Cantilevered Sill Plate with Drip Bevel
            const sw = isHoriz ? opLen + 0.45 : thick + 0.4;
            const sz = isHoriz ? thick + 0.4 : opLen + 0.45;
            const extSill = new THREE.Mesh(
              new THREE.BoxGeometry(sw, 0.18, sz),
              new THREE.MeshStandardMaterial({ color: 0xE2E0DC, roughness: 0.55 })
            );
            extSill.position.set(opX, wallBaseY + sillH - 0.04, opZ);
            group.add(extSill);
          }

          curr = op.start + op.width;
        });

        if (wallLen > curr + 0.05) {
          const segLen = wallLen - curr;
          const midPos = curr + segLen / 2;
          const px = isHoriz ? (startCoord + midPos) : fixedCoord;
          const pz = isHoriz ? fixedCoord : (startCoord + midPos);
          const wx = isHoriz ? segLen : thick;
          const wz = isHoriz ? thick : segLen;

          const segMesh = new THREE.Mesh(new THREE.BoxGeometry(wx, wallH, wz), mat);
          segMesh.position.set(px, wallBaseY + wallH / 2, pz);
          segMesh.castShadow = true;
          segMesh.receiveShadow = true;
          group.add(segMesh);
        }

        // ── ARCHITECTURAL MOULDING & TRIM EXTRUSIONS ───────────────────────
        if (threeMode.moulding && threeMode.moulding !== "shadowline") {
          const mType = threeMode.moulding;
          const mouldMat = isClay ? new THREE.MeshStandardMaterial({ color: 0xF5F3EC, roughness: 0.9 })
                         : isBlueprint ? new THREE.MeshStandardMaterial({ color: 0x00F0FF, emissive: 0x00F0FF, emissiveIntensity: 0.5 })
                         : isObsidian ? new THREE.MeshStandardMaterial({ color: 0xD4AF37, roughness: 0.2, metalness: 0.85 })
                         : new THREE.MeshStandardMaterial({ color: 0xF2EFEB, roughness: 0.4 });

          const midCoord = startCoord + wallLen / 2;
          if (mType === "crown") {
            const corniceH = 0.32;
            const corniceD = thick + 0.22;
            const cGeo = isHoriz ? new THREE.BoxGeometry(wallLen, corniceH, corniceD) : new THREE.BoxGeometry(corniceD, corniceH, wallLen);
            const cMesh = new THREE.Mesh(cGeo, mouldMat);
            if (isHoriz) cMesh.position.set(midCoord, wallBaseY + wallH - corniceH / 2, fixedCoord);
            else cMesh.position.set(fixedCoord, wallBaseY + wallH - corniceH / 2, midCoord);
            group.add(cMesh);
          } else if (mType === "slat" && isShared) {
            const slatMat = isClay ? new THREE.MeshStandardMaterial({ color: 0xEDEAE2, roughness: 0.9 })
                          : isObsidian ? new THREE.MeshStandardMaterial({ color: 0x1E2228, roughness: 0.4 })
                          : new THREE.MeshStandardMaterial({ color: 0xBA8C5A, roughness: 0.45 });
            const slatCount = Math.floor(wallLen / 0.85);
            for (let si = 1; si < slatCount; si++) {
              const sp = startCoord + si * 0.85;
              const sMesh = new THREE.Mesh(
                isHoriz ? new THREE.BoxGeometry(0.12, wallH * 0.85, thick + 0.08) : new THREE.BoxGeometry(thick + 0.08, wallH * 0.85, 0.12),
                slatMat
              );
              if (isHoriz) sMesh.position.set(sp, wallBaseY + (wallH * 0.85) / 2, fixedCoord);
              else sMesh.position.set(fixedCoord, wallBaseY + (wallH * 0.85) / 2, sp);
              group.add(sMesh);
            }
          } else if (mType === "craftsman") {
            const railH = 0.18;
            const railD = thick + 0.14;
            const rGeo = isHoriz ? new THREE.BoxGeometry(wallLen, railH, railD) : new THREE.BoxGeometry(railD, railH, wallLen);
            const rMesh = new THREE.Mesh(rGeo, mouldMat);
            if (isHoriz) rMesh.position.set(midCoord, wallBaseY + wallH * 0.75, fixedCoord);
            else rMesh.position.set(fixedCoord, wallBaseY + wallH * 0.75, midCoord);
            group.add(rMesh);
          } else if (mType === "coffered") {
            const boxH = 0.42;
            const boxD = thick + 0.35;
            const bGeo = isHoriz ? new THREE.BoxGeometry(wallLen, boxH, boxD) : new THREE.BoxGeometry(boxD, boxH, wallLen);
            const bMesh = new THREE.Mesh(bGeo, mouldMat);
            if (isHoriz) bMesh.position.set(midCoord, wallBaseY + wallH - boxH / 2, fixedCoord);
            else bMesh.position.set(fixedCoord, wallBaseY + wallH - boxH / 2, midCoord);
            group.add(bMesh);
          }
        }
      }

      // ── 4. MULTI-FLOOR CLUSTER BUILDER ──────────────────────────────────────
      function buildFloor3DCluster(targetGroup, roomList, baseY) {
        const yOffset = baseY - 0.45;

        roomList.forEach(room => {
          const cx = (room.x + room.w / 2) - plotFt.width / 2;
          const cz = plotFt.length / 2 - (room.y + room.h / 2);

          // Floor Texture Selection
          let floorTex;
          let floorRoughness = 0.45;
          if (room.type === "bedroom" || room.type === "hall") {
            floorTex = getProcTexture("woodFloor", drawWoodFloor, Math.max(1, room.w / 5), Math.max(1, room.h / 5));
            floorRoughness = 0.4;
          } else if (room.type === "kitchen" || room.type === "dining") {
            floorTex = getProcTexture("tileFloor", drawTileFloor, Math.max(1, room.w / 4), Math.max(1, room.h / 4));
            floorRoughness = 0.25;
          } else if (room.type === "bathroom" || room.type === "utility") {
            floorTex = getProcTexture("bathTile", drawBathTile, Math.max(1, room.w / 3), Math.max(1, room.h / 3));
            floorRoughness = 0.35;
          } else if (room.type === "parking" || room.type === "balcony") {
            floorTex = getProcTexture("pavers", drawPavers, Math.max(1, room.w / 4), Math.max(1, room.h / 4));
            floorRoughness = 0.8;
          } else {
            floorTex = getProcTexture("woodFloor", drawWoodFloor, 2, 2);
          }

          let roomFloorMat;
          if (isClay) {
            roomFloorMat = new THREE.MeshStandardMaterial({ color: 0xF0EEE7, roughness: 0.95 });
          } else if (isBlueprint) {
            roomFloorMat = new THREE.MeshStandardMaterial({ color: 0x091D33, roughness: 0.35, metalness: 0.3 });
          } else if (isObsidian) {
            roomFloorMat = new THREE.MeshStandardMaterial({ color: 0x16181B, roughness: 0.25, metalness: 0.2 });
          } else {
            roomFloorMat = new THREE.MeshStandardMaterial({
              map: floorTex,
              roughness: floorRoughness,
              metalness: 0.03
            });
          }

          const roomFloorMesh = new THREE.Mesh(
            new THREE.BoxGeometry(room.w - 0.1, 0.1, room.h - 0.1),
            roomFloorMat
          );
          roomFloorMesh.position.set(cx, baseY, cz);
          roomFloorMesh.receiveShadow = true;
          threeSlabsGroup.add(roomFloorMesh);

          // Baseboards inside room
          const bH = 0.35, bT = 0.06;
          function addBaseboard(bw, bh, bx, bz) {
            const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bH, bh), baseboardMat);
            m.position.set(bx, baseY + bH / 2, bz);
            threeSlabsGroup.add(m);
          }
          addBaseboard(room.w - 0.6, bT, cx, cz - room.h / 2 + bT / 2 + 0.15);
          addBaseboard(room.w - 0.6, bT, cx, cz + room.h / 2 - bT / 2 - 0.15);
          addBaseboard(bT, room.h - 0.6, cx - room.w / 2 + bT / 2 + 0.15, cz);
          addBaseboard(bT, room.h - 0.6, cx + room.w / 2 - bT / 2 - 0.15, cz);

          // Dedicated Room Area Sprite Label (Subtle, floor-anchored so it never blocks the 3D view)
          const areaSqft = Math.round(room.w * room.h);
          const areaStr  = state.plot.unit === "m" ? `${(areaSqft * 0.0929).toFixed(1)} sqm` : `${areaSqft} sqft`;
          const sprite   = makeRoomLabelSprite(room.name, areaStr);
          sprite.position.set(cx, baseY + 0.35, cz);
          threeLabelsGroup.add(sprite);

          // Ambient Architectural Ceiling Downlight Fixture
          const dLightFixture = new THREE.Mesh(
            new THREE.CylinderGeometry(0.35, 0.35, 0.04, 16),
            new THREE.MeshStandardMaterial({ color: 0xFFFBEB, emissive: 0xFFFBEB, emissiveIntensity: 0.6 })
          );
          dLightFixture.position.set(cx, baseY + wallH - 0.05, cz);
          threeFurnitureGroup.add(dLightFixture);

          const roomPl = new THREE.PointLight(0xFFECC4, 0.35, Math.max(room.w, room.h) * 1.8, 1.8);
          roomPl.position.set(cx, baseY + wallH - 0.4, cz);
          threeFurnitureGroup.add(roomPl);
          threeInteriorLights.push(roomPl);

          // Contemporary Spherical Statement Pendant Light in Living Hall (Visible through panoramic window)
          if (room.type === "hall" || room.type === "living") {
            const cord = new THREE.Mesh(
              new THREE.CylinderGeometry(0.02, 0.02, 2.2, 8),
              new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.8 })
            );
            cord.position.set(cx, baseY + wallH - 1.1, cz);
            const globe = new THREE.Mesh(
              new THREE.SphereGeometry(0.8, 16, 16),
              new THREE.MeshStandardMaterial({ color: 0xFFFDF5, emissive: 0xFFE2A8, emissiveIntensity: 1.2, roughness: 0.2 })
            );
            globe.position.set(cx, baseY + wallH - 2.2, cz);
            threeFurnitureGroup.add(cord);
            threeFurnitureGroup.add(globe);
          }

          // Dedicated 3D Floating Cantilever Staircase Model
          if (room.type === "stairs") {
            const stairG = new THREE.Group();
            const isHoriz = room.w >= room.h;
            const steps = 15;
            const riseH = wallH + 0.8;
            const stepRise = riseH / steps;
            const stepW = isHoriz ? (room.w - 1.0) / steps : (room.w - 0.8);
            const stepL = isHoriz ? (room.h - 0.8) : (room.h - 1.0) / steps;
            const treadMat = new THREE.MeshStandardMaterial({ color: 0x3E2B1E, roughness: 0.32 });
            const steelMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.25, metalness: 0.88 });
            const glassRailMat = new THREE.MeshStandardMaterial({ color: 0xCFE8F3, roughness: 0.05, transparent: true, opacity: 0.35 });

            for (let s = 0; s < steps; s++) {
              const sy = baseY + s * stepRise;
              const sx = isHoriz ? (cx - (room.w - 1.0) / 2 + (s + 0.5) * stepW) : cx;
              const sz = isHoriz ? cz : (cz - (room.h - 1.0) / 2 + (s + 0.5) * stepL);

              // Floating Cantilever Solid Oak Tread
              const treadMesh = new THREE.Mesh(new THREE.BoxGeometry(stepW, 0.28, stepL), treadMat);
              treadMesh.position.set(sx, sy + 0.14, sz);
              treadMesh.castShadow = true;
              stairG.add(treadMesh);

              // Concealed Under-Tread Warm Golden LED Illumination
              const ledStrip = new THREE.Mesh(
                new THREE.BoxGeometry(isHoriz ? stepW * 0.92 : stepW - 0.2, 0.03, isHoriz ? stepL - 0.2 : stepL * 0.92),
                stairLedMat
              );
              ledStrip.position.set(sx, sy + 0.02, sz);
              stairG.add(ledStrip);
            }

            // Frameless Tempered Glass Structural Balustrade
            const railLen = Math.max(room.w, room.h) - 1.0;
            const glassBalustrade = new THREE.Mesh(
              new THREE.BoxGeometry(isHoriz ? railLen : 0.08, 3.4, isHoriz ? 0.08 : railLen),
              glassRailMat
            );
            glassBalustrade.position.set(
              cx + (isHoriz ? 0 : (room.w / 2 - 0.45)),
              baseY + riseH / 2 + 1.7,
              cz + (isHoriz ? (room.h / 2 - 0.45) : 0)
            );
            stairG.add(glassBalustrade);

            // Modern Minimalist Gunmetal Handrail
            const handrail = new THREE.Mesh(
              new THREE.BoxGeometry(isHoriz ? railLen : 0.12, 0.12, isHoriz ? 0.12 : railLen),
              steelMat
            );
            handrail.position.set(
              cx + (isHoriz ? 0 : (room.w / 2 - 0.45)),
              baseY + riseH / 2 + 3.4,
              cz + (isHoriz ? (room.h / 2 - 0.45) : 0)
            );
            stairG.add(handrail);

            threeFurnitureGroup.add(stairG);

          } else if (room.type === "balcony") {
            // Modern Frameless Glass Balcony Balustrade
            const glassRailMat = new THREE.MeshStandardMaterial({ color: 0xBAE6FD, roughness: 0.08, transparent: true, opacity: 0.38 });
            const capSteelMat = new THREE.MeshStandardMaterial({ color: 0x0F172A, roughness: 0.2, metalness: 0.92 });
            const railH = 3.4;
            const bRail = new THREE.Mesh(new THREE.BoxGeometry(room.w - 0.2, railH, 0.12), glassRailMat);
            bRail.position.set(cx, baseY + railH / 2 + 0.1, cz + room.h / 2 - 0.1);
            threeWallsGroup.add(bRail);
            const bCap = new THREE.Mesh(new THREE.BoxGeometry(room.w - 0.2, 0.12, 0.2), capSteelMat);
            bCap.position.set(cx, baseY + railH + 0.1, cz + room.h / 2 - 0.1);
            threeWallsGroup.add(bCap);

          } else {
            // Procedural Furniture inside container group with yOffset
            const interiorGroup = new THREE.Group();
            interiorGroup.position.y = yOffset;
            addRoomInterior(interiorGroup, room, cx, cz, plotFt);
            threeFurnitureGroup.add(interiorGroup);
          }
        });

        // Architectural Walls with Openings for this floor
        // Deduplicate shared walls so they render ONCE with merged openings and zero z-fighting!
        roomList.forEach(room => {
          const cx = (room.x + room.w / 2) - plotFt.width / 2;
          const cz = plotFt.length / 2 - (room.y + room.h / 2);

          const northAdj = roomList.find(o => o !== room &&
            Math.abs(o.y - (room.y + room.h)) < EPS &&
            o.x < room.x + room.w - EPS && o.x + o.w > room.x + EPS);
          const southAdj = roomList.find(o => o !== room &&
            Math.abs((o.y + o.h) - room.y) < EPS &&
            o.x < room.x + room.w - EPS && o.x + o.w > room.x + EPS);
          const eastAdj  = roomList.find(o => o !== room &&
            Math.abs(o.x - (room.x + room.w)) < EPS &&
            o.y < room.y + room.h - EPS && o.y + o.h > room.y + EPS);
          const westAdj  = roomList.find(o => o !== room &&
            Math.abs((o.x + o.w) - room.x) < EPS &&
            o.y < room.y + room.h - EPS && o.y + o.h > room.y + EPS);

          const northShared = !!northAdj;
          const southShared = !!southAdj;
          const eastShared  = !!eastAdj;
          const westShared  = !!westAdj;

          const nOpen = [], sOpen = [], wOpen = [], eOpen = [];
          (room.doors || []).forEach(d => {
            const item = { type: "door", start: d.offset, width: d.width || 3.2 };
            if (d.wall === "north") nOpen.push(item);
            if (d.wall === "south") sOpen.push(item);
            if (d.wall === "west")  wOpen.push(item);
            if (d.wall === "east")  eOpen.push(item);
          });
          (room.windows || []).forEach(w => {
            const item = { type: "window", start: w.offset, width: w.width || 4.0 };
            if (w.wall === "north") nOpen.push(item);
            if (w.wall === "south") sOpen.push(item);
            if (w.wall === "west")  wOpen.push(item);
            if (w.wall === "east")  eOpen.push(item);
          });

          // 1. West Wall: Skip if shared (west room renders East wall). Otherwise exterior!
          if (!westShared) {
            renderWallWithOpenings(threeWallsGroup, room.h, false, false, cx - room.w / 2, cz - room.h / 2, wOpen, baseY, {
              room, wallSide: "west", isParking: room.type === "parking", adjacentIsParking: false
            });
          }

          // 2. East Wall: Renders if shared or exterior! If shared, collect openings from eastAdj's west wall
          if (eastShared && eastAdj) {
            (eastAdj.doors || []).filter(d => d.wall === "west").forEach(d => {
              if (!eOpen.some(item => Math.abs(item.start - d.offset) < 0.5)) {
                eOpen.push({ type: "door", start: d.offset, width: d.width || 3.2 });
              }
            });
          }
          renderWallWithOpenings(threeWallsGroup, room.h, eastShared, false, cx + room.w / 2, cz - room.h / 2, eOpen, baseY, {
            room, wallSide: "east", isParking: room.type === "parking", adjacentIsParking: !!(eastAdj && eastAdj.type === "parking")
          });

          // 3. North Wall (facing -Z): Renders if shared or exterior! If shared, collect openings from northAdj's south wall
          if (northShared && northAdj) {
            (northAdj.doors || []).filter(d => d.wall === "south").forEach(d => {
              if (!nOpen.some(item => Math.abs(item.start - d.offset) < 0.5)) {
                nOpen.push({ type: "door", start: d.offset, width: d.width || 3.2 });
              }
            });
          }
          renderWallWithOpenings(threeWallsGroup, room.w, northShared, true, cz - room.h / 2, cx - room.w / 2, nOpen, baseY, {
            room, wallSide: "north", isParking: room.type === "parking", adjacentIsParking: !!(northAdj && northAdj.type === "parking")
          });

          // 4. South Wall (facing +Z, Front): Skip if shared (south room renders North wall). Otherwise exterior!
          if (!southShared) {
            renderWallWithOpenings(threeWallsGroup, room.w, false, true, cz + room.h / 2, cx - room.w / 2, sOpen, baseY, {
              room, wallSide: "south", isParking: room.type === "parking", adjacentIsParking: false
            });
          }
        });
      }

      const allRooms = state.scaledRooms;
      const groundRooms = allRooms.filter(r => (r.floor || "ground") === "ground");
      const firstRooms  = allRooms.filter(r => r.floor === "first");
      const hasFirstFloor = firstRooms.length > 0;

      const renderGround = (state.view3DFloor === "both" || state.view3DFloor === "ground" || !hasFirstFloor);
      const renderFirst  = hasFirstFloor && (state.view3DFloor === "both" || state.view3DFloor === "first");

      // 1. Render Ground Floor
      if (renderGround) {
        buildFloor3DCluster(threeBuildingGroup, groundRooms, 0.45);
      }

      // 2. Intermediate Floor Slab (when stacked duplex)
      const slabThick = 0.8;
      const ffBaseY = (renderGround && renderFirst)
        ? (0.45 + wallH + slabThick + (state.exploded3D ? 14.0 : 0.0))
        : 0.45;

      if (renderGround && renderFirst) {
        const slabY = 0.45 + wallH;
        const slabMat = new THREE.MeshStandardMaterial({
          color: 0xDDDCD7,
          roughness: 0.72,
          metalness: 0.05
        });

        // Intermediate concrete ceiling/floor slab covering ground footprint
        // Leaving opening for staircase well
        groundRooms.forEach(gr => {
          if (gr.type === "stairs" || gr.type === "void") return; // Open void for stairwell!
          const gcx = (gr.x + gr.w / 2) - plotFt.width / 2;
          const gcz = plotFt.length / 2 - (gr.y + gr.h / 2);
          const slab = new THREE.Mesh(new THREE.BoxGeometry(gr.w + 0.2, slabThick, gr.h + 0.2), slabMat);
          slab.position.set(gcx, slabY + slabThick / 2, gcz);
          slab.castShadow = true;
          slab.receiveShadow = true;
          threeSlabsGroup.add(slab);
        });

        // Exploded View Alignment Guide Pillars
        if (state.exploded3D) {
          const guideMat = new THREE.MeshStandardMaterial({
            color: 0xC28B38,
            roughness: 0.2,
            metalness: 0.85,
            transparent: true,
            opacity: 0.55
          });
          const guideH = 14.0;
          const guideGeo = new THREE.CylinderGeometry(0.12, 0.12, guideH, 8);
          const corners = [
            [-(plotFt.width / 2), -(plotFt.length / 2)],
            [(plotFt.width / 2), -(plotFt.length / 2)],
            [-(plotFt.width / 2), (plotFt.length / 2)],
            [(plotFt.width / 2), (plotFt.length / 2)]
          ];
          corners.forEach(([kX, kZ]) => {
            const pole = new THREE.Mesh(guideGeo, guideMat);
            pole.position.set(kX, 0.45 + wallH + slabThick + guideH / 2, kZ);
            threeSlabsGroup.add(pole);
          });
        }
      }

      // 3. Render First Floor
      if (renderFirst) {
        buildFloor3DCluster(threeBuildingGroup, firstRooms, ffBaseY);
      }

      // ── 5. MODERN ARCHITECTURAL ROOF (TOGGLEABLE) ──────────────────────────
      const roofTex = getProcTexture("roof", drawRoof, plotFt.width / 5, plotFt.length / 5);
      const roofMat = isClay ? new THREE.MeshStandardMaterial({ color: 0xF5F3EC, roughness: 0.95 })
                    : isBlueprint ? new THREE.MeshStandardMaterial({ color: 0x0C2340, roughness: 0.3, transparent: true, opacity: 0.85 })
                    : isObsidian ? new THREE.MeshStandardMaterial({ color: 0x14171A, roughness: 0.35, metalness: 0.25 })
                    : new THREE.MeshStandardMaterial({ map: roofTex, roughness: 0.5, metalness: 0.15 });

      const fasciaMat = isClay ? new THREE.MeshStandardMaterial({ color: 0xE8E5DE, roughness: 0.95 })
                      : isBlueprint ? new THREE.MeshStandardMaterial({ color: 0x00F0FF, emissive: 0x00F0FF, emissiveIntensity: 0.6 })
                      : isObsidian ? new THREE.MeshStandardMaterial({ color: 0xD4AF37, roughness: 0.2, metalness: 0.85 })
                      : new THREE.MeshStandardMaterial({ color: 0x1E242B, roughness: 0.4 });

      // ── 5. CONTEMPORARY VILLA FLAT PARAPET ROOF SYSTEM (MATCHING VILLA ELEVATION) ─
      const overhang = 1.2;
      const roofW = plotFt.width + overhang * 2;
      const roofL = plotFt.length + overhang * 2;
      const roofBaseY = (renderFirst && state.view3DFloor === "both")
        ? (ffBaseY + wallH)
        : (0.45 + wallH);

      const parapetH = 1.35;
      const parapetT = 0.45;
      const roofSlabT = 0.5;

      // 1. Structural Roof Slab
      const roofSlab = new THREE.Mesh(
        new THREE.BoxGeometry(roofW, roofSlabT, roofL),
        isClay ? new THREE.MeshStandardMaterial({ color: 0xF5F3EC, roughness: 0.95 })
               : isBlueprint ? new THREE.MeshStandardMaterial({ color: 0x0C2340, roughness: 0.3 })
               : new THREE.MeshStandardMaterial({ color: 0xFDFBF7, roughness: 0.65 })
      );
      roofSlab.position.set(0, roofBaseY + roofSlabT / 2, 0);
      roofSlab.castShadow = true;
      roofSlab.receiveShadow = true;
      threeRoofGroup.add(roofSlab);

      // 2. Charcoal / Anthracite Architectural Edge Fascia Band
      const fasciaBand = new THREE.Mesh(
        new THREE.BoxGeometry(roofW + 0.15, 0.45, roofL + 0.15),
        fasciaMat
      );
      fasciaBand.position.set(0, roofBaseY + roofSlabT / 2, 0);
      fasciaBand.castShadow = true;
      threeRoofGroup.add(fasciaBand);

      // 3. Perimeter Parapet Walls with Architectural Coping Stones
      const parapetMat = isClay ? extWallMat : new THREE.MeshStandardMaterial({ color: 0xFDFBF7, roughness: 0.65 });
      const copingMat = isClay ? fasciaMat : new THREE.MeshStandardMaterial({ color: 0x22272E, roughness: 0.35, metalness: 0.5 });

      // North Parapet
      const pNorth = new THREE.Mesh(new THREE.BoxGeometry(roofW, parapetH, parapetT), parapetMat);
      pNorth.position.set(0, roofBaseY + roofSlabT + parapetH / 2, -roofL / 2 + parapetT / 2);
      pNorth.castShadow = true;
      threeRoofGroup.add(pNorth);
      const cNorth = new THREE.Mesh(new THREE.BoxGeometry(roofW + 0.2, 0.14, parapetT + 0.2), copingMat);
      cNorth.position.set(0, roofBaseY + roofSlabT + parapetH + 0.07, -roofL / 2 + parapetT / 2);
      threeRoofGroup.add(cNorth);

      // South Parapet
      const pSouth = new THREE.Mesh(new THREE.BoxGeometry(roofW, parapetH, parapetT), parapetMat);
      pSouth.position.set(0, roofBaseY + roofSlabT + parapetH / 2, roofL / 2 - parapetT / 2);
      pSouth.castShadow = true;
      threeRoofGroup.add(pSouth);
      const cSouth = new THREE.Mesh(new THREE.BoxGeometry(roofW + 0.2, 0.14, parapetT + 0.2), copingMat);
      cSouth.position.set(0, roofBaseY + roofSlabT + parapetH + 0.07, roofL / 2 - parapetT / 2);
      threeRoofGroup.add(cSouth);

      // West Parapet
      const pWest = new THREE.Mesh(new THREE.BoxGeometry(parapetT, parapetH, roofL - parapetT * 2), parapetMat);
      pWest.position.set(-roofW / 2 + parapetT / 2, roofBaseY + roofSlabT + parapetH / 2, 0);
      pWest.castShadow = true;
      threeRoofGroup.add(pWest);
      const cWest = new THREE.Mesh(new THREE.BoxGeometry(parapetT + 0.2, 0.14, roofL + 0.2), copingMat);
      cWest.position.set(-roofW / 2 + parapetT / 2, roofBaseY + roofSlabT + parapetH + 0.07, 0);
      threeRoofGroup.add(cWest);

      // East Parapet
      const pEast = new THREE.Mesh(new THREE.BoxGeometry(parapetT, parapetH, roofL - parapetT * 2), parapetMat);
      pEast.position.set(roofW / 2 - parapetT / 2, roofBaseY + roofSlabT + parapetH / 2, 0);
      pEast.castShadow = true;
      threeRoofGroup.add(pEast);
      const cEast = new THREE.Mesh(new THREE.BoxGeometry(parapetT + 0.2, 0.14, roofL + 0.2), copingMat);
      cEast.position.set(roofW / 2 - parapetT / 2, roofBaseY + roofSlabT + parapetH + 0.07, 0);
      threeRoofGroup.add(cEast);

      // 4. Recessed Flat Roof Gravel Deck / Terrace
      const deckMesh = new THREE.Mesh(
        new THREE.BoxGeometry(roofW - parapetT * 2 - 0.2, 0.05, roofL - parapetT * 2 - 0.2),
        new THREE.MeshStandardMaterial({ color: 0xD3CFC7, roughness: 0.9 })
      );
      deckMesh.position.set(0, roofBaseY + roofSlabT + 0.05, 0);
      threeRoofGroup.add(deckMesh);

      // 5. Modern Frameless Architectural Roof Skylights
      const skyFrame = new THREE.Mesh(
        new THREE.BoxGeometry(5.2, 0.35, 4.2),
        new THREE.MeshStandardMaterial({ color: 0x1E242B, roughness: 0.3, metalness: 0.85 })
      );
      skyFrame.position.set(-roofW * 0.15, roofBaseY + roofSlabT + 0.2, -roofL * 0.1);
      const skyGlass = new THREE.Mesh(
        new THREE.BoxGeometry(4.8, 0.38, 3.8),
        new THREE.MeshStandardMaterial({ color: 0x2563EB, roughness: 0.05, metalness: 0.9, transparent: true, opacity: 0.75 })
      );
      skyGlass.position.set(-roofW * 0.15, roofBaseY + roofSlabT + 0.22, -roofL * 0.1);
      threeRoofGroup.add(skyFrame);
      threeRoofGroup.add(skyGlass);

      // 6. Flush Architectural Solar PV Panels
      const pvMat = new THREE.MeshStandardMaterial({ color: 0x0A1628, metalness: 0.94, roughness: 0.12 });
      const pvFrameMat = new THREE.MeshStandardMaterial({ color: 0x1E242B, roughness: 0.35, metalness: 0.85 });
      const pvGridMat = new THREE.MeshStandardMaterial({ color: 0x38BDF8, roughness: 0.2, metalness: 0.9 });
      const pvArrayG = new THREE.Group();
      const pvPanelW = 3.4;
      const pvPanelL = 5.2;
      const cols = Math.max(1, Math.min(5, Math.floor((roofW * 0.6) / (pvPanelW + 0.4))));
      for (let ci = 0; ci < cols; ci++) {
        const px = -(cols - 1) * (pvPanelW + 0.4) / 2 + ci * (pvPanelW + 0.4);
        const panelFrame = new THREE.Mesh(new THREE.BoxGeometry(pvPanelW, 0.1, pvPanelL), pvFrameMat);
        const panelGlass = new THREE.Mesh(new THREE.BoxGeometry(pvPanelW - 0.2, 0.12, pvPanelL - 0.2), pvMat);
        panelFrame.add(panelGlass);
        for (let bi = -1; bi <= 1; bi++) {
          const busbar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.13, pvPanelL - 0.2), pvGridMat);
          busbar.position.x = bi * (pvPanelW * 0.26);
          panelFrame.add(busbar);
        }
        panelFrame.position.set(px, 0, 0);
        pvArrayG.add(panelFrame);
      }
      pvArrayG.position.set(roofW * 0.18, roofBaseY + roofSlabT + 0.12, roofL * 0.12);
      threeRoofGroup.add(pvArrayG);

      threeScene.add(threeBuildingGroup);

      // Framed perspective: tuned for optimal villa visual impact
      const maxDim = Math.max(plotFt.width, plotFt.length);
      threeCamera.up.set(0, 1, 0);
      threeCamera.position.set(maxDim * 0.58, maxDim * 0.45, maxDim * 0.82);
      threeCamera.lookAt(0, 3.2, 0);
      if (threeControls) {
        threeControls.target.set(0, 3.2, 0);
        threeControls.update();
      }

      apply3DAtmosphere(threeMode.lighting);
      apply3DLayerVisibilities();
      update3DLayerChecklistUI();
    }

    // ── PROCEDURAL 3D FURNITURE BUILDER ─────────────────────────────────────────
    function addRoomInterior(group, room, cx, cz, plotFt) {
      const rw = room.w;
      const rh = room.h;
      const rType = room.type.toLowerCase();
      const rName = room.name.toLowerCase();

      // Luxury Architectural Materials Matrix (with 3D Mold Adaptation)
      const isClay = (threeMode.mold === "clay");
      const isBlueprint = (threeMode.mold === "blueprint");
      const isObsidian = (threeMode.mold === "obsidian");

      const walnutMat       = isClay ? new THREE.MeshStandardMaterial({ color: 0xF2EFEB, roughness: 0.95 })
                            : isBlueprint ? new THREE.MeshStandardMaterial({ color: 0x0A192F, roughness: 0.35 })
                            : isObsidian ? new THREE.MeshStandardMaterial({ color: 0x1A1D20, roughness: 0.45 })
                            : new THREE.MeshStandardMaterial({ color: 0x3E2C20, roughness: 0.38, metalness: 0.05 });

      const oakMat          = isClay ? new THREE.MeshStandardMaterial({ color: 0xEDEAE2, roughness: 0.95 })
                            : isBlueprint ? new THREE.MeshStandardMaterial({ color: 0x0F253E, roughness: 0.35 })
                            : isObsidian ? new THREE.MeshStandardMaterial({ color: 0x24282E, roughness: 0.45 })
                            : new THREE.MeshStandardMaterial({ color: 0xC8A27A, roughness: 0.42 });

      const whiteMat        = isClay ? new THREE.MeshStandardMaterial({ color: 0xFAF9F5, roughness: 0.95 })
                            : isBlueprint ? new THREE.MeshStandardMaterial({ color: 0x00F0FF, emissive: 0x00F0FF, emissiveIntensity: 0.35 })
                            : isObsidian ? new THREE.MeshStandardMaterial({ color: 0x16181C, roughness: 0.3 })
                            : new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.2 });

      const marbleMat       = isClay ? new THREE.MeshStandardMaterial({ color: 0xFAF8F2, roughness: 0.95 })
                            : isBlueprint ? new THREE.MeshStandardMaterial({ color: 0x162A45, roughness: 0.25 })
                            : isObsidian ? new THREE.MeshStandardMaterial({ color: 0x121417, roughness: 0.15, metalness: 0.2 })
                            : new THREE.MeshStandardMaterial({ color: 0xFDFBF7, roughness: 0.12, metalness: 0.12 });

      const graniteMat      = isClay ? new THREE.MeshStandardMaterial({ color: 0xE2DFD8, roughness: 0.95 })
                            : isBlueprint ? new THREE.MeshStandardMaterial({ color: 0x06111F, roughness: 0.3 })
                            : new THREE.MeshStandardMaterial({ color: 0x181B20, roughness: 0.22, metalness: 0.3 });

      const boucleMat       = isClay ? new THREE.MeshStandardMaterial({ color: 0xF5F3EC, roughness: 0.95 })
                            : isBlueprint ? new THREE.MeshStandardMaterial({ color: 0x142B47, roughness: 0.75 })
                            : isObsidian ? new THREE.MeshStandardMaterial({ color: 0x2A2E36, roughness: 0.85 })
                            : new THREE.MeshStandardMaterial({ color: 0xEEE9DF, roughness: 0.88 });

      const darkFabMat      = isClay ? new THREE.MeshStandardMaterial({ color: 0xEAE7E0, roughness: 0.95 })
                            : isBlueprint ? new THREE.MeshStandardMaterial({ color: 0x0A192F, roughness: 0.8 })
                            : isObsidian ? new THREE.MeshStandardMaterial({ color: 0x181B20, roughness: 0.85 })
                            : new THREE.MeshStandardMaterial({ color: 0x272B33, roughness: 0.82 });

      const cognacLeather   = isClay ? new THREE.MeshStandardMaterial({ color: 0xEDEAE2, roughness: 0.92 })
                            : isBlueprint ? new THREE.MeshStandardMaterial({ color: 0x00B4D8, roughness: 0.45 })
                            : isObsidian ? new THREE.MeshStandardMaterial({ color: 0x2E251E, roughness: 0.55 })
                            : new THREE.MeshStandardMaterial({ color: 0x8C4A28, roughness: 0.52 });

      const velvetMustard   = isClay ? new THREE.MeshStandardMaterial({ color: 0xF0EEE6, roughness: 0.9 })
                            : isBlueprint ? new THREE.MeshStandardMaterial({ color: 0x0077B6, roughness: 0.5 })
                            : new THREE.MeshStandardMaterial({ color: 0xD97706, roughness: 0.62 });

      const velvetTerracotta= isClay ? new THREE.MeshStandardMaterial({ color: 0xEDEAE2, roughness: 0.9 })
                            : isBlueprint ? new THREE.MeshStandardMaterial({ color: 0x023E8A, roughness: 0.5 })
                            : new THREE.MeshStandardMaterial({ color: 0xC85A32, roughness: 0.68 });

      const brassMat        = isClay ? new THREE.MeshStandardMaterial({ color: 0xE4E0D6, roughness: 0.85 })
                            : isBlueprint ? new THREE.MeshStandardMaterial({ color: 0x00F0FF, emissive: 0x00F0FF, emissiveIntensity: 0.7 })
                            : new THREE.MeshStandardMaterial({ color: 0xD4AF37, roughness: 0.24, metalness: 0.88 });

      const chromeMat       = isClay ? new THREE.MeshStandardMaterial({ color: 0xDDD9CF, roughness: 0.85 })
                            : isBlueprint ? new THREE.MeshStandardMaterial({ color: 0x00F0FF, emissive: 0x00F0FF, emissiveIntensity: 0.6 })
                            : isObsidian ? new THREE.MeshStandardMaterial({ color: 0xD4AF37, roughness: 0.2, metalness: 0.92 })
                            : new THREE.MeshStandardMaterial({ color: 0xE2E8F0, roughness: 0.12, metalness: 0.94 });

      const matteObsidian   = isClay ? new THREE.MeshStandardMaterial({ color: 0xEAE7E0, roughness: 0.95 })
                            : new THREE.MeshStandardMaterial({ color: 0x14181F, roughness: 0.36, metalness: 0.75 });

      const glassMat        = isClay ? new THREE.MeshStandardMaterial({ color: 0xF5F3EC, opacity: 0.5, transparent: true })
                            : isBlueprint ? new THREE.MeshStandardMaterial({ color: 0x00F0FF, opacity: 0.25, transparent: true })
                            : isObsidian ? new THREE.MeshStandardMaterial({ color: 0x22262B, opacity: 0.55, transparent: true })
                            : new THREE.MeshStandardMaterial({ color: 0xEDF7FC, roughness: 0.03, metalness: 0.15, transparent: true, opacity: 0.38 });

      const smokedGlassMat  = isClay ? new THREE.MeshStandardMaterial({ color: 0xE5E2DA, opacity: 0.5, transparent: true })
                            : isBlueprint ? new THREE.MeshStandardMaterial({ color: 0x00F0FF, opacity: 0.35, transparent: true })
                            : new THREE.MeshStandardMaterial({ color: 0x22262B, roughness: 0.08, metalness: 0.6, transparent: true, opacity: 0.68 });

      const warmLedMat      = isClay ? new THREE.MeshStandardMaterial({ color: 0xF5F3EC, emissive: 0xF5F3EC, emissiveIntensity: 0.2 })
                            : isBlueprint ? new THREE.MeshStandardMaterial({ color: 0x00F0FF, emissive: 0x00F0FF, emissiveIntensity: 1.0 })
                            : new THREE.MeshStandardMaterial({ color: 0xFFF1D6, emissive: 0xFFD899, emissiveIntensity: 0.88 });

      const plantMat        = isClay ? new THREE.MeshStandardMaterial({ color: 0xE5E2DA, roughness: 0.95 })
                            : isBlueprint ? new THREE.MeshStandardMaterial({ color: 0x00F0FF, opacity: 0.6, transparent: true })
                            : new THREE.MeshStandardMaterial({ color: 0x275924, roughness: 0.82 });

      const flutedCeramic   = isClay ? new THREE.MeshStandardMaterial({ color: 0xFAF9F5, roughness: 0.9 })
                            : isBlueprint ? new THREE.MeshStandardMaterial({ color: 0x112240, roughness: 0.4 })
                            : isObsidian ? new THREE.MeshStandardMaterial({ color: 0x181B20, roughness: 0.4 })
                            : new THREE.MeshStandardMaterial({ color: 0xF5F3EE, roughness: 0.4 });

      // ── BEDROOM ─────────────────────────────────────────────────────────────
      if (rType === "bedroom" || rName.includes("bed") || rName.includes("master")) {
        const bedG = new THREE.Group();
        const bW = Math.min(6.6, rw - 2.2);
        const bL = Math.min(7.2, rh - 2.4);

        // 1. Cantilevered Floating Platform Base with Warm Plinth LED Glow
        const base = new THREE.Mesh(new THREE.BoxGeometry(bW, 0.45, bL), walnutMat);
        base.position.y = 0.45 + 0.225;
        base.castShadow = true;
        bedG.add(base);

        const plinthLed = new THREE.Mesh(new THREE.BoxGeometry(bW - 0.4, 0.06, bL - 0.4), warmLedMat);
        plinthLed.position.y = 0.45 + 0.04;
        bedG.add(plinthLed);

        // 2. High-Resilience Architectural Mattress in Alabaster Bouclé
        const mattress = new THREE.Mesh(new THREE.BoxGeometry(bW - 0.25, 0.72, bL - 0.25), boucleMat);
        mattress.position.y = 0.45 + 0.45 + 0.36;
        mattress.castShadow = true;
        bedG.add(mattress);

        // 3. Channel-Tufted Wingback Headboard & Flanking Acoustic Timber Slat Panels
        const headH = 4.0;
        const headboard = new THREE.Mesh(new THREE.BoxGeometry(bW + 0.5, headH, 0.32), darkFabMat);
        headboard.position.set(0, 0.45 + headH / 2, -(bL / 2 - 0.16));
        headboard.castShadow = true;
        bedG.add(headboard);

        // Tufted Vertical Channels on Headboard
        for (let ci = -3; ci <= 3; ci++) {
          const seam = new THREE.Mesh(new THREE.BoxGeometry(0.04, headH - 0.2, 0.34), matteObsidian);
          seam.position.set(ci * (bW / 7), 0.45 + headH / 2, -(bL / 2 - 0.16));
          bedG.add(seam);
        }

        // Flanking Acoustic Timber Slat Panels behind nightstands
        [-1, 1].forEach(dir => {
          const panelX = dir * (bW / 2 + 1.15);
          const slatPanel = new THREE.Mesh(new THREE.BoxGeometry(1.6, headH + 0.5, 0.14), oakMat);
          slatPanel.position.set(panelX, 0.45 + (headH + 0.5) / 2, -(bL / 2 - 0.07));
          bedG.add(slatPanel);

          for (let si = -2; si <= 2; si++) {
            const slatStripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, headH + 0.5, 0.18), walnutMat);
            slatStripe.position.set(panelX + si * 0.28, 0.45 + (headH + 0.5) / 2, -(bL / 2 - 0.07));
            bedG.add(slatStripe);
          }
        });

        // 4. Layered Luxury Bedding & Designer Throw Runner
        const duvet = new THREE.Mesh(new THREE.BoxGeometry(bW - 0.2, 0.28, bL * 0.65), darkFabMat);
        duvet.position.set(0, 0.45 + 1.25, bL * 0.14);
        duvet.castShadow = true;
        bedG.add(duvet);

        const throwRunner = new THREE.Mesh(new THREE.BoxGeometry(bW - 0.15, 0.08, 1.4), velvetTerracotta);
        throwRunner.position.set(0, 0.45 + 1.41, bL / 2 - 0.9);
        throwRunner.castShadow = true;
        bedG.add(throwRunner);

        // 4 Layered Pillows: 2 Sleeping (white) + 2 Accent (ochre & cognac)
        const pilW = (bW - 1.2) / 2;
        [-pilW / 2 - 0.15, pilW / 2 + 0.15].forEach((px, idx) => {
          const sleepPil = new THREE.Mesh(new THREE.BoxGeometry(pilW, 0.35, 1.3), whiteMat);
          sleepPil.position.set(px, 0.45 + 1.45, -(bL / 2 - 1.1));
          sleepPil.rotation.x = 0.22;
          bedG.add(sleepPil);

          const accentPil = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.28, 0.85), idx === 0 ? velvetMustard : cognacLeather);
          accentPil.position.set(px, 0.45 + 1.6, -(bL / 2 - 1.65));
          accentPil.rotation.x = 0.3;
          bedG.add(accentPil);
        });

        // 5. Floating Cantilever Nightstands with Calacatta Marble Tops
        [-1, 1].forEach(dir => {
          const nsX = dir * (bW / 2 + 1.15);
          const nsZ = -(bL / 2 - 0.85);

          const nsBody = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 1.3), walnutMat);
          nsBody.position.set(nsX, 0.45 + 1.2, nsZ);
          nsBody.castShadow = true;
          bedG.add(nsBody);

          const marbleTop = new THREE.Mesh(new THREE.BoxGeometry(1.54, 0.06, 1.34), marbleMat);
          marbleTop.position.set(nsX, 0.45 + 1.58, nsZ);
          bedG.add(marbleTop);

          const brassPull = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.05, 0.06), brassMat);
          brassPull.position.set(nsX, 0.45 + 1.2, nsZ + 0.68);
          bedG.add(brassPull);

          // Ceiling Drop Pendant Light with Glowing Frosted Orb
          const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 3.8, 8), matteObsidian);
          cord.position.set(nsX, 0.45 + 5.2, nsZ);
          const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.35, 12), brassMat);
          socket.position.set(nsX, 0.45 + 3.25, nsZ);
          const orb = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16), warmLedMat);
          orb.position.set(nsX, 0.45 + 2.85, nsZ);
          bedG.add(cord);
          bedG.add(socket);
          bedG.add(orb);
        });

        // 6. Framed Abstract Architectural Art Canvas
        const artFrame = new THREE.Mesh(new THREE.BoxGeometry(Math.min(4.5, bW * 0.75), 2.2, 0.08), brassMat);
        artFrame.position.set(0, 0.45 + headH + 1.3, -(bL / 2 - 0.1));
        const artCanvas = new THREE.Mesh(new THREE.BoxGeometry(Math.min(4.3, bW * 0.72), 2.0, 0.09), boucleMat);
        artCanvas.position.set(0, 0.45 + headH + 1.3, -(bL / 2 - 0.1));
        bedG.add(artFrame);
        bedG.add(artCanvas);

        // 7. Full-Height Minimalist Wardrobe with Recessed Vertical LED Strip
        if (rw > 8.5 && rh > 8.5) {
          const wardW = Math.min(7.2, rw * 0.65);
          const wardG = new THREE.Group();
          const carcass = new THREE.Mesh(new THREE.BoxGeometry(wardW, 7.4, 1.8), oakMat);
          carcass.position.set(0, 0.45 + 3.7, 0);
          carcass.castShadow = true;
          wardG.add(carcass);

          const niche = new THREE.Mesh(new THREE.BoxGeometry(wardW * 0.4, 7.1, 0.1), smokedGlassMat);
          niche.position.set(wardW * 0.22, 0.45 + 3.7, 0.91);
          wardG.add(niche);

          const vertLed = new THREE.Mesh(new THREE.BoxGeometry(0.04, 7.1, 0.04), warmLedMat);
          vertLed.position.set(wardW * 0.02, 0.45 + 3.7, 0.92);
          wardG.add(vertLed);

          wardG.position.set(0, 0, rh / 2 - 1.1);
          bedG.add(wardG);
        }

        bedG.position.set(cx, 0, cz);
        group.add(bedG);

      // ── LIVING ROOM / HALL ──────────────────────────────────────────────────
      } else if (rType === "hall" || rName.includes("living") || rName.includes("drawing")) {
        const hallG = new THREE.Group();

        // 1. Large Scandinavian Geometric Designer Area Rug
        const rugW = Math.min(11.5, rw * 0.76);
        const rugL = Math.min(8.0, rh * 0.68);
        const rugTex = getProcTexture("rug", drawRug, 1, 1);
        const rug = new THREE.Mesh(
          new THREE.PlaneGeometry(rugW, rugL),
          new THREE.MeshStandardMaterial({ map: rugTex, roughness: 0.85 })
        );
        rug.rotation.x = -Math.PI / 2;
        rug.position.set(0, 0.51, 0);
        rug.receiveShadow = true;
        hallG.add(rug);

        // 2. Sculpted Italian Modular L-Sectional Sofa
        const sofaW = Math.min(9.0, rw * 0.68);
        const sofaBaseDepth = 3.2;
        const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(sofaW, 1.35, sofaBaseDepth), darkFabMat);
        sofaBase.position.set(0, 0.45 + 0.68, -(rugL / 2 - sofaBaseDepth / 2 - 0.2));
        sofaBase.castShadow = true;
        hallG.add(sofaBase);

        const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(sofaW, 1.7, 0.78), darkFabMat);
        sofaBack.position.set(0, 0.45 + 1.35 + 0.85, -(rugL / 2 - 0.42));
        sofaBack.castShadow = true;
        hallG.add(sofaBack);

        // Left Chaise Lounge Extension (Forms Luxurious L-Shape)
        const chaiseW = 2.8;
        const chaiseL = 3.0;
        const chaiseBase = new THREE.Mesh(new THREE.BoxGeometry(chaiseW, 1.35, chaiseL), darkFabMat);
        chaiseBase.position.set(-(sofaW / 2 - chaiseW / 2), 0.45 + 0.68, -(rugL / 2 - sofaBaseDepth - chaiseL / 2 - 0.2));
        chaiseBase.castShadow = true;
        hallG.add(chaiseBase);

        // Designer Accent Throw Pillows
        const pil1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 0.42), velvetMustard);
        pil1.position.set(-(sofaW / 2 - 1.1), 0.45 + 1.8, -(rugL / 2 - 0.85));
        pil1.rotation.y = 0.3;
        const pil2 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 0.4), velvetTerracotta);
        pil2.position.set(sofaW / 2 - 1.1, 0.45 + 1.8, -(rugL / 2 - 0.85));
        pil2.rotation.y = -0.28;
        const pil3 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 0.38), boucleMat);
        pil3.position.set(sofaW / 2 - 2.1, 0.45 + 1.75, -(rugL / 2 - 0.8));
        pil3.rotation.y = -0.15;
        hallG.add(pil1);
        hallG.add(pil2);
        hallG.add(pil3);

        // 3. Multi-Tier Nesting Coffee Tables (Calacatta Gold Marble + Smoked Glass)
        const ct1Geo = new THREE.CylinderGeometry(1.7, 1.7, 0.16, 24);
        const ct1 = new THREE.Mesh(ct1Geo, marbleMat);
        ct1.position.set(-0.5, 0.45 + 1.25, 0.3);
        ct1.castShadow = true;
        const ct1Rim = new THREE.Mesh(new THREE.CylinderGeometry(1.72, 1.72, 0.14, 24), brassMat);
        ct1Rim.position.set(-0.5, 0.45 + 1.25, 0.3);
        const ct1Leg = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 1.2, 16), brassMat);
        ct1Leg.position.set(-0.5, 0.45 + 0.6, 0.3);
        hallG.add(ct1);
        hallG.add(ct1Rim);
        hallG.add(ct1Leg);

        const ct2 = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.12, 20), smokedGlassMat);
        ct2.position.set(1.3, 0.45 + 1.48, -0.2);
        ct2.castShadow = true;
        const ct2Leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.45, 8), matteObsidian);
        ct2Leg.position.set(1.3, 0.45 + 0.73, -0.2);
        hallG.add(ct2);
        hallG.add(ct2Leg);

        // Books & Ceramic Bowl
        const book1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.6), darkFabMat);
        book1.position.set(-0.4, 0.45 + 1.38, 0.2);
        book1.rotation.y = 0.2;
        const book2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 0.5), velvetTerracotta);
        book2.position.set(-0.4, 0.45 + 1.44, 0.2);
        book2.rotation.y = -0.1;
        const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), flutedCeramic);
        bowl.position.set(1.2, 0.45 + 1.55, -0.2);
        hallG.add(book1);
        hallG.add(book2);
        hallG.add(bowl);

        // 4. Iconic Nordic / Bauhaus Lounge Armchair in Cognac Saddle Leather
        const chairG = new THREE.Group();
        const chSeat = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.35, 2.0), cognacLeather);
        chSeat.position.y = 0.45 + 1.2;
        const chBack = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.7, 0.35), cognacLeather);
        chBack.position.set(0, 0.45 + 2.0, -0.9);
        chBack.rotation.x = -0.15;
        const chFrame = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.1, 2.1), matteObsidian);
        chFrame.position.y = 0.45 + 1.0;
        chairG.add(chSeat);
        chairG.add(chBack);
        chairG.add(chFrame);
        chairG.position.set(sofaW / 2 + 0.6, 0, 0.8);
        chairG.rotation.y = -Math.PI / 3;
        hallG.add(chairG);

        // 5. Floor-to-Ceiling Acoustic Slat Media Feature Wall & Flush 85" OLED TV
        const mediaWallW = Math.min(8.5, rw * 0.62);
        const mediaWallZ = rugL / 2 + 1.5;

        const slatPanel = new THREE.Mesh(new THREE.BoxGeometry(mediaWallW, 8.0, 0.14), walnutMat);
        slatPanel.position.set(0, 0.45 + 4.0, mediaWallZ);
        slatPanel.castShadow = true;
        hallG.add(slatPanel);

        const haloLed = new THREE.Mesh(new THREE.BoxGeometry(mediaWallW + 0.3, 8.2, 0.04), warmLedMat);
        haloLed.position.set(0, 0.45 + 4.0, mediaWallZ - 0.06);
        hallG.add(haloLed);

        for (let si = -Math.floor(mediaWallW); si <= Math.floor(mediaWallW); si++) {
          const slatFin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 8.0, 0.18), oakMat);
          slatFin.position.set(si * 0.45, 0.45 + 4.0, mediaWallZ - 0.05);
          hallG.add(slatFin);
        }

        const tvScreen = new THREE.Mesh(
          new THREE.BoxGeometry(5.8, 3.3, 0.08),
          new THREE.MeshStandardMaterial({ color: 0x05070A, roughness: 0.06, metalness: 0.95 })
        );
        tvScreen.position.set(0, 0.45 + 4.3, mediaWallZ - 0.18);
        hallG.add(tvScreen);

        const credenza = new THREE.Mesh(new THREE.BoxGeometry(mediaWallW * 0.88, 1.2, 1.4), walnutMat);
        credenza.position.set(0, 0.45 + 0.9, mediaWallZ - 0.8);
        credenza.castShadow = true;
        const marbleConsoleTop = new THREE.Mesh(new THREE.BoxGeometry(mediaWallW * 0.89, 0.06, 1.42), marbleMat);
        marbleConsoleTop.position.set(0, 0.45 + 1.53, mediaWallZ - 0.8);
        const soundbar = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.22, 0.35), darkFabMat);
        soundbar.position.set(0, 0.45 + 1.67, mediaWallZ - 0.8);
        hallG.add(credenza);
        hallG.add(marbleConsoleTop);
        hallG.add(soundbar);

        // 6. Modern Arched Brass Floor Lamp
        const lampG = new THREE.Group();
        const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.15, 16), marbleMat);
        lampBase.position.y = 0.45 + 0.08;
        lampG.add(lampBase);
        const lampArch = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.04, 8, 24, Math.PI * 0.65), brassMat);
        lampArch.position.set(0, 0.45 + 3.8, 0);
        lampArch.rotation.z = Math.PI * 0.25;
        lampG.add(lampArch);
        const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.4, 16), brassMat);
        lampShade.position.set(1.8, 0.45 + 5.2, 0);
        lampShade.rotation.x = Math.PI;
        const lampBulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), warmLedMat);
        lampBulb.position.set(1.8, 0.45 + 5.0, 0);
        lampG.add(lampShade);
        lampG.add(lampBulb);
        lampG.position.set(-(sofaW / 2 + 1.2), 0, -(rugL / 2 - 0.6));
        hallG.add(lampG);

        // 7. Architectural Fluted Planter with Multi-Tiered Fiddle-Leaf Fig Tree
        const plantG = new THREE.Group();
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.7, 1.8, 16), flutedCeramic);
        pot.position.y = 0.45 + 0.9;
        pot.castShadow = true;
        plantG.add(pot);
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 3.2, 8), walnutMat);
        trunk.position.y = 0.45 + 2.6;
        plantG.add(trunk);
        const f1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.3, 1), plantMat);
        f1.position.set(0, 0.45 + 3.4, 0);
        f1.castShadow = true;
        const f2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.0, 1), plantMat);
        f2.position.set(0.35, 0.45 + 4.5, 0.25);
        f2.castShadow = true;
        const f3 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8, 1), plantMat);
        f3.position.set(-0.3, 0.45 + 5.3, -0.2);
        plantG.add(f1);
        plantG.add(f2);
        plantG.add(f3);
        plantG.position.set(sofaW / 2 + 1.2, 0, -(rugL / 2 - 0.8));
        hallG.add(plantG);

        hallG.position.set(cx, 0, cz);
        group.add(hallG);

      // ── KITCHEN ─────────────────────────────────────────────────────────────
      } else if (rType === "kitchen") {
        const kitchG = new THREE.Group();
        const counterDepth = 2.3;
        const counterH = 3.1;
        const counterW = Math.min(rw - 1.2, 10.0);
        const backZ = -(rh / 2 - counterDepth / 2 - 0.15);

        // 1. Base Cabinetry Run in Matte Graphite
        const baseCab = new THREE.Mesh(new THREE.BoxGeometry(counterW, counterH, counterDepth), matteObsidian);
        baseCab.position.set(0, 0.45 + counterH / 2, backZ);
        baseCab.castShadow = true;
        kitchG.add(baseCab);

        // 2. Continuous Calacatta Gold Marble Countertop with Waterfall Edge Panel
        const topThick = 0.22;
        const counterTop = new THREE.Mesh(new THREE.BoxGeometry(counterW + 0.2, topThick, counterDepth + 0.2), marbleMat);
        counterTop.position.set(0, 0.45 + counterH + topThick / 2, backZ);
        counterTop.castShadow = true;
        kitchG.add(counterTop);

        const waterfall = new THREE.Mesh(new THREE.BoxGeometry(topThick, counterH + topThick, counterDepth + 0.2), marbleMat);
        waterfall.position.set(-counterW / 2 - 0.1 + topThick / 2, 0.45 + (counterH + topThick) / 2, backZ);
        waterfall.castShadow = true;
        kitchG.add(waterfall);

        // Full-Height Marble Backsplash Wall Slab
        const splashH = 2.4;
        const backsplash = new THREE.Mesh(new THREE.BoxGeometry(counterW, splashH, 0.08), marbleMat);
        backsplash.position.set(0, 0.45 + counterH + splashH / 2, backZ - counterDepth / 2 + 0.04);
        kitchG.add(backsplash);

        // 3. Floating Upper Wall Cabinets in Warm White Oak with Concealed LED Task Light
        const upperH = 2.4;
        const upperD = 1.3;
        const upperY = 0.45 + counterH + splashH + upperH / 2;
        const upperCab = new THREE.Mesh(new THREE.BoxGeometry(counterW - 2.8, upperH, upperD), oakMat);
        upperCab.position.set(-1.4, upperY, backZ - counterDepth / 2 + upperD / 2);
        upperCab.castShadow = true;
        kitchG.add(upperCab);

        const taskLed = new THREE.Mesh(new THREE.BoxGeometry(counterW - 3.0, 0.04, 0.06), warmLedMat);
        taskLed.position.set(-1.4, 0.45 + counterH + splashH - 0.02, backZ - counterDepth / 2 + upperD / 2);
        kitchG.add(taskLed);

        // 4. Undermount Deep Rectangular Stainless Sink & Matte Black Gooseneck Faucet
        const sinkX = -counterW * 0.22;
        const sink = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.06, 1.6), chromeMat);
        sink.position.set(sinkX, 0.45 + counterH + topThick + 0.01, backZ);
        kitchG.add(sink);

        const faucetStem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 12), matteObsidian);
        faucetStem.position.set(sinkX, 0.45 + counterH + topThick + 0.48, backZ - 0.65);
        const faucetArc = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.05, 8, 16, Math.PI), matteObsidian);
        faucetArc.position.set(sinkX, 0.45 + counterH + topThick + 0.95, backZ - 0.65);
        faucetArc.rotation.z = Math.PI;
        kitchG.add(faucetStem);
        kitchG.add(faucetArc);

        // 5. Ceramic Induction Cooktop with Illuminated Amber Cooking Zones
        const cookX = counterW * 0.22;
        const cooktop = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.04, 1.8), matteObsidian);
        cooktop.position.set(cookX, 0.45 + counterH + topThick + 0.01, backZ);
        kitchG.add(cooktop);

        [-0.6, 0.6].forEach(ringX => {
          const zone = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.02, 16), warmLedMat);
          zone.position.set(cookX + ringX, 0.45 + counterH + topThick + 0.03, backZ);
          kitchG.add(zone);
        });

        // 6. Minimalist Architectural Range Hood in Matte Obsidian
        const hood = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.4, 1.6), matteObsidian);
        hood.position.set(cookX, 0.45 + 6.6, backZ);
        hood.castShadow = true;
        kitchG.add(hood);

        // 7. Built-in Double Convection Wall Oven / Microwave Unit
        const ovenTower = new THREE.Mesh(new THREE.BoxGeometry(2.6, 7.4, counterDepth), oakMat);
        ovenTower.position.set(counterW / 2 - 1.3, 0.45 + 3.7, backZ);
        ovenTower.castShadow = true;
        kitchG.add(ovenTower);

        [0.45 + 3.0, 0.45 + 5.0].forEach(ovenY => {
          const ovenDoor = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.6, 0.08), smokedGlassMat);
          ovenDoor.position.set(counterW / 2 - 1.3, ovenY, backZ + counterDepth / 2 + 0.02);
          const ovenHandle = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.08), chromeMat);
          ovenHandle.position.set(counterW / 2 - 1.3, ovenY + 0.6, backZ + counterDepth / 2 + 0.08);
          kitchG.add(ovenDoor);
          kitchG.add(ovenHandle);
        });

        // 8. French-Door Smart Refrigerator in Brushed Stainless Steel
        const fridgeW = 3.2;
        const fridgeH = 6.8;
        const fridgeD = 2.6;
        const fridge = new THREE.Mesh(new THREE.BoxGeometry(fridgeW, fridgeH, fridgeD), chromeMat);
        fridge.position.set(-rw / 2 + fridgeW / 2 + 0.3, 0.45 + fridgeH / 2, rh / 2 - fridgeD / 2 - 0.4);
        fridge.castShadow = true;
        kitchG.add(fridge);

        const dispPanel = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.04), matteObsidian);
        dispPanel.position.set(-rw / 2 + fridgeW / 2 - 0.4, 0.45 + 4.2, rh / 2 - 0.4 + 0.02);
        kitchG.add(dispPanel);

        // 9. Waterfall Kitchen Island & Minimalist Bar Stools
        if (rw >= 10.0 && rh >= 11.0) {
          const islW = Math.min(6.5, rw * 0.55);
          const islD = 2.6;
          const islH = 3.1;
          const islZ = backZ + counterDepth + 2.8;

          const islBase = new THREE.Mesh(new THREE.BoxGeometry(islW, islH, islD), oakMat);
          islBase.position.set(0, 0.45 + islH / 2, islZ);
          islBase.castShadow = true;
          const islTop = new THREE.Mesh(new THREE.BoxGeometry(islW + 0.2, topThick, islD + 0.4), marbleMat);
          islTop.position.set(0, 0.45 + islH + topThick / 2, islZ);
          islTop.castShadow = true;
          kitchG.add(islBase);
          kitchG.add(islTop);

          [-islW / 2 - 0.1 + topThick / 2, islW / 2 + 0.1 - topThick / 2].forEach(wx => {
            const sideDrop = new THREE.Mesh(new THREE.BoxGeometry(topThick, islH + topThick, islD + 0.4), marbleMat);
            sideDrop.position.set(wx, 0.45 + (islH + topThick) / 2, islZ);
            sideDrop.castShadow = true;
            kitchG.add(sideDrop);
          });

          [-1.3, 1.3].forEach(sx => {
            const stoolSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.12, 16), cognacLeather);
            stoolSeat.position.set(sx, 0.45 + 2.3, islZ + islD / 2 + 0.9);
            const stoolLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.3, 8), matteObsidian);
            stoolLeg.position.set(sx, 0.45 + 1.15, islZ + islD / 2 + 0.9);
            kitchG.add(stoolSeat);
            kitchG.add(stoolLeg);
          });
        }

        kitchG.position.set(cx, 0, cz);
        group.add(kitchG);

      // ── DINING ROOM ─────────────────────────────────────────────────────────
      } else if (rType === "dining") {
        const dinG = new THREE.Group();
        const tabW = Math.min(6.2, rw * 0.68);
        const tabL = Math.min(3.8, rh * 0.58);

        // 1. Live-Edge Solid Walnut Dining Table Slab
        const tableTop = new THREE.Mesh(new THREE.BoxGeometry(tabW, 0.24, tabL), walnutMat);
        tableTop.position.set(0, 0.45 + 2.65, 0);
        tableTop.castShadow = true;
        dinG.add(tableTop);

        const chamfer = new THREE.Mesh(new THREE.BoxGeometry(tabW + 0.1, 0.08, tabL + 0.1), brassMat);
        chamfer.position.set(0, 0.45 + 2.65, 0);
        dinG.add(chamfer);

        // Geometric Spider-Trestle Steel Legs
        const trestleMat = matteObsidian;
        [-tabW * 0.32, tabW * 0.32].forEach(tx => {
          const vLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.65, 0.35), trestleMat);
          vLeg.position.set(tx, 0.45 + 1.32, 0);
          const crossBar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.15, tabL * 0.7), trestleMat);
          crossBar.position.set(tx, 0.45 + 0.1, 0);
          dinG.add(vLeg);
          dinG.add(crossBar);
        });

        // 2. Ergonomic Designer Dining Chairs
        function addDesignerChair(chX, chZ, rotY, isCognac) {
          const chG = new THREE.Group();
          const seatMat = isCognac ? cognacLeather : darkFabMat;

          const seat = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.18, 1.45), seatMat);
          seat.position.y = 0.45 + 1.65;
          chG.add(seat);

          const back = new THREE.Mesh(new THREE.BoxGeometry(1.45, 1.4, 0.16), seatMat);
          back.position.set(0, 0.45 + 2.35, -0.65);
          chG.add(back);

          [-0.6, 0.6].forEach(lx => {
            [-0.6, 0.6].forEach(lz => {
              const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 1.65, 8), matteObsidian);
              leg.position.set(lx, 0.45 + 0.82, lz);
              const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.25, 8), brassMat);
              ferrule.position.set(lx, 0.45 + 0.15, lz);
              chG.add(leg);
              chG.add(ferrule);
            });
          });

          chG.position.set(chX, 0, chZ);
          chG.rotation.y = rotY;
          dinG.add(chG);
        }

        addDesignerChair(-tabW * 0.28, -tabL / 2 - 0.9, 0, false);
        addDesignerChair(tabW * 0.28, -tabL / 2 - 0.9, 0, false);
        addDesignerChair(-tabW * 0.28, tabL / 2 + 0.9, Math.PI, false);
        addDesignerChair(tabW * 0.28, tabL / 2 + 0.9, Math.PI, false);

        if (tabW >= 5.5) {
          addDesignerChair(-tabW / 2 - 0.9, 0, Math.PI / 2, true);
          addDesignerChair(tabW / 2 + 0.9, 0, -Math.PI / 2, true);
        }

        // 3. Modern Branching Multi-Globe Glass Pendant Chandelier
        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 3.2, 8), brassMat);
        rod.position.set(0, 0.45 + 5.8, 0);
        dinG.add(rod);

        const branchBar = new THREE.Mesh(new THREE.BoxGeometry(tabW * 0.65, 0.08, 0.08), brassMat);
        branchBar.position.set(0, 0.45 + 4.2, 0);
        dinG.add(branchBar);

        [-tabW * 0.26, -tabW * 0.09, tabW * 0.09, tabW * 0.26].forEach((ox, i) => {
          const dropStem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, (i % 2 === 0 ? 0.6 : 0.9), 8), brassMat);
          dropStem.position.set(ox, 0.45 + 4.2 - (i % 2 === 0 ? 0.3 : 0.45), 0);
          const orb = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16), warmLedMat);
          orb.position.set(ox, 0.45 + 4.2 - (i % 2 === 0 ? 0.6 : 0.9), 0);
          dinG.add(dropStem);
          dinG.add(orb);
        });

        // 4. Centerpiece: Fluted Ceramic Vase with Pampas Grass & Crystal Wine Decanter
        const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.35, 0.95, 16), flutedCeramic);
        vase.position.set(-0.5, 0.45 + 2.77 + 0.47, 0);
        const pampas = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 1), boucleMat);
        pampas.position.set(-0.5, 0.45 + 2.77 + 1.15, 0);
        const decanter = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.32, 0.8, 12), glassMat);
        decanter.position.set(0.6, 0.45 + 2.77 + 0.4, 0);
        dinG.add(vase);
        dinG.add(pampas);
        dinG.add(decanter);

        dinG.position.set(cx, 0, cz);
        group.add(dinG);

      // ── BATHROOM ────────────────────────────────────────────────────────────
      } else if (rType === "bathroom" || rName.includes("bath") || rName.includes("toilet")) {
        const bathG = new THREE.Group();

        // 1. Floating Double Vanity with Seamless Calacatta Quartz Countertop
        const vanW = Math.min(3.8, rw * 0.6);
        const vanD = 1.8;
        const vanH = 1.6;
        const vanX = rw / 2 - vanW / 2 - 0.3;
        const vanZ = rh / 2 - vanD / 2 - 0.3;

        const vanity = new THREE.Mesh(new THREE.BoxGeometry(vanW, vanH, vanD), walnutMat);
        vanity.position.set(vanX, 0.45 + 1.8, vanZ);
        vanity.castShadow = true;
        bathG.add(vanity);

        const vanCounter = new THREE.Mesh(new THREE.BoxGeometry(vanW + 0.08, 0.12, vanD + 0.08), marbleMat);
        vanCounter.position.set(vanX, 0.45 + 2.66, vanZ);
        bathG.add(vanCounter);

        const basin = new THREE.Mesh(new THREE.BoxGeometry(Math.min(2.0, vanW - 0.4), 0.35, 1.2), whiteMat);
        basin.position.set(vanX, 0.45 + 2.9, vanZ);
        basin.castShadow = true;
        bathG.add(basin);

        const bathFaucet = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.55), matteObsidian);
        bathFaucet.position.set(vanX, 0.45 + 3.4, vanZ + vanD / 2 + 0.05);
        bathG.add(bathFaucet);

        // 2. Backlit Floating Panoramic LED Vanity Mirror
        const mirW = Math.min(3.6, vanW);
        const mirH = 3.2;
        const mirrorHalo = new THREE.Mesh(new THREE.BoxGeometry(mirW + 0.2, mirH + 0.2, 0.04), warmLedMat);
        mirrorHalo.position.set(vanX, 0.45 + 5.1, vanZ + vanD / 2 + 0.1);
        const mirrorGlass = new THREE.Mesh(
          new THREE.BoxGeometry(mirW, mirH, 0.06),
          new THREE.MeshStandardMaterial({ color: 0xDDF4FF, roughness: 0.02, metalness: 0.98 })
        );
        mirrorGlass.position.set(vanX, 0.45 + 5.1, vanZ + vanD / 2 + 0.14);
        bathG.add(mirrorHalo);
        bathG.add(mirrorGlass);

        // 3. Wall-Hung Rimless Ceramic Toilet with In-Wall Cistern & Flush Plate
        const wcX = -(rw / 2 - 1.2);
        const wcZ = rh / 2 - 1.6;
        const toiletBowl = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.3, 1.8), whiteMat);
        toiletBowl.position.set(wcX, 0.45 + 0.8, wcZ);
        toiletBowl.castShadow = true;
        bathG.add(toiletBowl);

        const flushPlate = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.05), chromeMat);
        flushPlate.position.set(wcX, 0.45 + 3.4, wcZ + 0.92);
        bathG.add(flushPlate);

        // 4. Frameless Wet-Room Walk-In Shower Enclosure
        const showerScreenL = Math.min(4.8, rh * 0.65);
        const showerGlass = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 6.8, showerScreenL),
          glassMat
        );
        showerGlass.position.set(0.2, 0.45 + 3.4, -(rh / 2 - showerScreenL / 2 - 0.2));
        bathG.add(showerGlass);

        [-showerScreenL * 0.35, showerScreenL * 0.35].forEach(sz => {
          const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 0.15), matteObsidian);
          bracket.position.set(0.2, 0.45 + 5.5, -(rh / 2 - showerScreenL / 2 - 0.2) + sz);
          bathG.add(bracket);
        });

        const showerHeadArm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8), matteObsidian);
        showerHeadArm.position.set(-1.2, 0.45 + 6.6, -(rh / 2 - 1.8));
        const rainHead = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.8), matteObsidian);
        rainHead.position.set(-1.2, 0.45 + 6.2, -(rh / 2 - 1.8));
        bathG.add(showerHeadArm);
        bathG.add(rainHead);

        // 5. Wall-Mounted Heated Ladder Towel Radiator
        const towelRailG = new THREE.Group();
        [-0.45, 0.45].forEach(rx => {
          const vTube = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 3.2, 8), matteObsidian);
          vTube.position.set(rx, 0, 0);
          towelRailG.add(vTube);
        });
        for (let ri = -3; ri <= 3; ri++) {
          const rBar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.9, 8), matteObsidian);
          rBar.rotation.z = Math.PI / 2;
          rBar.position.set(0, ri * 0.45, 0);
          towelRailG.add(rBar);
        }
        const foldedTowel = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.12), whiteMat);
        foldedTowel.position.set(0, 0.2, 0.08);
        towelRailG.add(foldedTowel);
        towelRailG.position.set(-(rw / 2 - 0.15), 0.45 + 3.4, 0);
        towelRailG.rotation.y = Math.PI / 2;
        bathG.add(towelRailG);

        // 6. Luxury Freestanding Soaking Tub
        if (rw >= 7.8 && rh >= 7.5) {
          const tubG = new THREE.Group();
          const tubOuter = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.4, 2.0, 24), whiteMat);
          tubOuter.scale.set(1.4, 1.0, 0.85);
          tubOuter.position.y = 0.45 + 1.0;
          tubOuter.castShadow = true;
          tubG.add(tubOuter);

          const tubFiller = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.8, 8), matteObsidian);
          tubFiller.position.set(1.9, 0.45 + 1.4, 0);
          const tubArc = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.04, 8, 16, Math.PI), matteObsidian);
          tubArc.position.set(1.65, 0.45 + 2.8, 0);
          tubArc.rotation.z = Math.PI;
          tubG.add(tubFiller);
          tubG.add(tubArc);

          tubG.position.set(-1.2, 0, -(rh / 2 - 2.8));
          bathG.add(tubG);
        }

        bathG.position.set(cx, 0, cz);
        group.add(bathG);

      // ── BALCONY ─────────────────────────────────────────────────────────────
      } else if (rType === "balcony") {
        const balcG = new THREE.Group();

        // 1. Frameless Architectural Tempered Glass Balustrade with Stainless Spigots
        const railH = 3.6;
        const glassRail = new THREE.Mesh(
          new THREE.BoxGeometry(rw - 0.4, railH, 0.08),
          glassMat
        );
        glassRail.position.set(0, 0.45 + railH / 2, -(rh / 2 - 0.15));
        balcG.add(glassRail);

        const topRail = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.12, 0.22), matteObsidian);
        topRail.position.set(0, 0.45 + railH + 0.06, -(rh / 2 - 0.15));
        balcG.add(topRail);

        [-rw / 3, 0, rw / 3].forEach(sx => {
          const spigot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.2), chromeMat);
          spigot.position.set(sx, 0.45 + 0.22, -(rh / 2 - 0.15));
          balcG.add(spigot);
        });

        // 2. Outdoor All-Weather Rope-Woven Lounge Armchairs & Round Terrazzo Table
        const bTable = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.14, 20), marbleMat);
        bTable.position.set(0, 0.45 + 1.8, 0);
        bTable.castShadow = true;
        const bLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.8, 8), matteObsidian);
        bLeg.position.set(0, 0.45 + 0.9, 0);
        balcG.add(bTable);
        balcG.add(bLeg);

        [-1.8, 1.8].forEach((lx, idx) => {
          const lChairG = new THREE.Group();
          const lSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.18, 16), boucleMat);
          lSeat.position.y = 0.45 + 1.2;
          const lBack = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 1.2, 16, 1, true, 0, Math.PI), matteObsidian);
          lBack.position.set(0, 0.45 + 1.8, 0);
          lChairG.add(lSeat);
          lChairG.add(lBack);
          lChairG.position.set(lx, 0, 0);
          lChairG.rotation.y = idx === 0 ? Math.PI / 2 : -Math.PI / 2;
          balcG.add(lChairG);
        });

        // 3. Dual Architectural Trough Planters with Manicured Evergreen Topiary
        [-rw / 2 + 1.3, rw / 2 - 1.3].forEach(px => {
          const planter = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 0.9), flutedCeramic);
          planter.position.set(px, 0.45 + 0.6, -(rh / 2 - 0.7));
          planter.castShadow = true;
          const hedge = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.6, 0.8), plantMat);
          hedge.position.set(px, 0.45 + 1.9, -(rh / 2 - 0.7));
          hedge.castShadow = true;
          balcG.add(planter);
          balcG.add(hedge);
        });

        balcG.position.set(cx, 0, cz);
        group.add(balcG);

      // ── PARKING ─────────────────────────────────────────────────────────────
      } else if (rType === "parking") {
        const parkG = new THREE.Group();

        // 1. Showroom High-Gloss Polished Dark Epoxy Flooring
        const epoxyMat = new THREE.MeshStandardMaterial({
          color: 0x1E242B,
          roughness: 0.16,
          metalness: 0.28
        });
        const epoxyFloor = new THREE.Mesh(new THREE.BoxGeometry(rw - 0.2, 0.12, rh - 0.2), epoxyMat);
        epoxyFloor.position.set(0, 0.45 + 0.06, 0);
        epoxyFloor.receiveShadow = true;
        parkG.add(epoxyFloor);

        // 2. High-Fidelity Luxury Performance EV Vehicle Generator
        function buildSculptedVehicle(vLen, vWidth, paintColor, rimColor, isSUV) {
          const vG = new THREE.Group();
          const carMat = new THREE.MeshStandardMaterial({
            color: paintColor,
            metalness: 0.92,
            roughness: 0.16
          });
          const carbonMat = new THREE.MeshStandardMaterial({
            color: 0x0A0F18,
            roughness: 0.35,
            metalness: 0.7
          });
          const glassCarMat = new THREE.MeshStandardMaterial({
            color: 0x070E1A,
            roughness: 0.04,
            metalness: 0.96,
            transparent: true,
            opacity: 0.88
          });
          const interiorLeather = new THREE.MeshStandardMaterial({
            color: 0x78350F,
            roughness: 0.65
          });
          const tireRubber = new THREE.MeshStandardMaterial({
            color: 0x18181B,
            roughness: 0.92
          });
          const alloyRim = new THREE.MeshStandardMaterial({
            color: rimColor || 0xE2E8F0,
            roughness: 0.12,
            metalness: 0.96
          });
          const brakeRotor = new THREE.MeshStandardMaterial({
            color: 0xCBD5E1,
            roughness: 0.22,
            metalness: 0.94
          });
          const caliperMat = new THREE.MeshStandardMaterial({
            color: 0xDC2626,
            roughness: 0.28,
            metalness: 0.6
          });
          const drlMat = new THREE.MeshStandardMaterial({
            color: 0xF0F9FF,
            emissive: 0x38BDF8,
            emissiveIntensity: 0.88
          });
          const tailBarMat = new THREE.MeshStandardMaterial({
            color: 0xFF1E1E,
            emissive: 0xEF4444,
            emissiveIntensity: 0.95
          });

          const bodyH = isSUV ? 1.45 : 1.15;
          const cabinH = isSUV ? 1.6 : 1.35;
          const groundY = 0.45;

          // Underbody Aero Tray & Diffuser
          const underbody = new THREE.Mesh(new THREE.BoxGeometry(vWidth * 0.95, 0.28, vLen - 0.4), carbonMat);
          underbody.position.y = groundY + 0.55;
          vG.add(underbody);

          // Front Chin Splitter
          const splitter = new THREE.Mesh(new THREE.BoxGeometry(vWidth * 0.92, 0.08, 0.6), carbonMat);
          splitter.position.set(0, groundY + 0.35, vLen / 2 - 0.2);
          vG.add(splitter);

          // Rear Aerodynamic Diffuser Fins
          [-vWidth * 0.28, 0, vWidth * 0.28].forEach(fx => {
            const fin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 0.7), carbonMat);
            fin.position.set(fx, groundY + 0.48, -(vLen / 2 - 0.35));
            vG.add(fin);
          });

          // Main Sculpted Body Shell
          const carBody = new THREE.Mesh(new THREE.BoxGeometry(vWidth, bodyH, vLen - 0.6), carMat);
          carBody.position.y = groundY + 0.55 + bodyH / 2;
          carBody.castShadow = true;
          vG.add(carBody);

          // Sloped Aerodynamic Hood with Character Creases
          const hoodLen = vLen * 0.32;
          const hood = new THREE.Mesh(new THREE.BoxGeometry(vWidth * 0.94, 0.35, hoodLen), carMat);
          hood.position.set(0, groundY + 0.55 + bodyH * 0.8, vLen * 0.22);
          hood.rotation.x = -0.08;
          hood.castShadow = true;
          vG.add(hood);

          // Panoramic Glasshouse / Canopy (Windshield, Roof, Rear Screen)
          const cabinW = vWidth * 0.86;
          const cabinL = vLen * (isSUV ? 0.65 : 0.56);
          const cabin = new THREE.Mesh(new THREE.BoxGeometry(cabinW, cabinH, cabinL), glassCarMat);
          cabin.position.set(0, groundY + 0.55 + bodyH + cabinH / 2 - 0.15, isSUV ? 0 : -vLen * 0.05);
          cabin.castShadow = true;
          vG.add(cabin);

          // Interior Sports Bucket Seats & Cockpit (Visible through glass)
          [-vWidth * 0.22, vWidth * 0.22].forEach(sx => {
            const seat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 1.2), interiorLeather);
            seat.position.set(sx, groundY + 0.55 + bodyH * 0.6, vLen * 0.04);
            const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.5, 0.3), interiorLeather);
            headrest.position.set(sx, groundY + 0.55 + bodyH * 0.6 + 0.95, vLen * 0.04);
            vG.add(seat);
            vG.add(headrest);
          });
          const steerWheel = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.05, 8, 16), carbonMat);
          steerWheel.position.set(-vWidth * 0.22, groundY + 0.55 + bodyH * 0.85, vLen * 0.18);
          steerWheel.rotation.x = -Math.PI / 4;
          vG.add(steerWheel);

          // Digital Curved HUD Cockpit Display
          const hudDisplay = new THREE.Mesh(
            new THREE.BoxGeometry(1.8, 0.25, 0.05),
            new THREE.MeshStandardMaterial({ color: 0x38BDF8, emissive: 0x0284C7, emissiveIntensity: 0.9 })
          );
          hudDisplay.position.set(0, groundY + 0.55 + bodyH * 0.88, vLen * 0.24);
          vG.add(hudDisplay);

          // Bespoke Alloy Turbine Wheels with Calipers & Cross-Drilled Rotors
          const wheelBase = vLen * 0.58;
          const trackW = vWidth * 0.94;
          const tireRadius = isSUV ? 0.95 : 0.85;
          const wheelY = groundY + tireRadius;

          [-trackW / 2, trackW / 2].forEach(wx => {
            [-wheelBase / 2, wheelBase / 2].forEach(wz => {
              // Rubber Tire
              const tire = new THREE.Mesh(new THREE.CylinderGeometry(tireRadius, tireRadius, 0.62, 24), tireRubber);
              tire.rotation.z = Math.PI / 2;
              tire.position.set(wx, wheelY, wz);
              tire.castShadow = true;
              vG.add(tire);

              // Machined Multi-Spoke Alloy Rim
              const rim = new THREE.Mesh(new THREE.CylinderGeometry(tireRadius * 0.62, tireRadius * 0.62, 0.64, 16), alloyRim);
              rim.rotation.z = Math.PI / 2;
              rim.position.set(wx, wheelY, wz);
              vG.add(rim);

              // Inner Wheel Cap Hub
              const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.66, 12), alloyRim);
              hub.rotation.z = Math.PI / 2;
              hub.position.set(wx, wheelY, wz);
              vG.add(hub);

              // Cross-Drilled Brake Rotor & Red Racing Caliper
              const rotor = new THREE.Mesh(new THREE.CylinderGeometry(tireRadius * 0.48, tireRadius * 0.48, 0.1, 16), brakeRotor);
              rotor.rotation.z = Math.PI / 2;
              rotor.position.set(wx > 0 ? wx - 0.15 : wx + 0.15, wheelY, wz);
              vG.add(rotor);

              const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.38, 0.32), caliperMat);
              caliper.position.set(wx > 0 ? wx - 0.15 : wx + 0.15, wheelY + tireRadius * 0.22, wz);
              vG.add(caliper);
            });
          });

          // Dual 4-Point Matrix LED Projector Headlights with Ice-Blue DRLs
          [-vWidth * 0.32, vWidth * 0.32].forEach(hx => {
            const headlight = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.28, 0.22), drlMat);
            headlight.position.set(hx, groundY + 0.55 + bodyH * 0.52, vLen / 2 - 0.15);
            vG.add(headlight);

            // Aerodynamic Side Wing Mirrors
            const mirrorArm = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.08), carbonMat);
            mirrorArm.position.set(hx > 0 ? vWidth / 2 + 0.15 : -vWidth / 2 - 0.15, groundY + 0.55 + bodyH * 0.88, vLen * 0.15);
            const mirrorCap = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.2), carMat);
            mirrorCap.position.set(hx > 0 ? vWidth / 2 + 0.32 : -vWidth / 2 - 0.32, groundY + 0.55 + bodyH * 0.88, vLen * 0.15);
            vG.add(mirrorArm);
            vG.add(mirrorCap);
          });

          // Ultra-Sleek Full-Width Continuous Crimson Rear LED Light Bar
          const rearBar = new THREE.Mesh(new THREE.BoxGeometry(vWidth * 0.88, 0.14, 0.18), tailBarMat);
          rearBar.position.set(0, groundY + 0.55 + bodyH * 0.58, -(vLen / 2 - 0.18));
          vG.add(rearBar);

          // Flush Satin Silver Pop-Out Door Handles
          [-vWidth / 2 - 0.02, vWidth / 2 + 0.02].forEach(dx => {
            [-vLen * 0.08, vLen * 0.18].forEach(dz => {
              const handle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.42), alloyRim);
              handle.position.set(dx, groundY + 0.55 + bodyH * 0.65, dz);
              vG.add(handle);
            });
          });

          // Embossed Architectural Vanity License Plates ("INTALL-01")
          const plateGeo = new THREE.BoxGeometry(1.6, 0.45, 0.05);
          const frontPlate = new THREE.Mesh(plateGeo, new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.3 }));
          frontPlate.position.set(0, groundY + 0.55 + bodyH * 0.22, vLen / 2 - 0.08);
          vG.add(frontPlate);
          const rearPlate = frontPlate.clone();
          rearPlate.position.set(0, groundY + 0.55 + bodyH * 0.25, -(vLen / 2 - 0.08));
          vG.add(rearPlate);

          return vG;
        }

        // Determine if Double-Bay or Single-Bay Parking
        const isDoubleBay = rw >= 17.0;
        const carLen = Math.min(12.8, Math.max(10.5, rh - 2.8));
        const carWidth = Math.min(5.4, isDoubleBay ? (rw * 0.38) : (rw - 2.8) * 0.85);

        // 3. Painted Architectural Parking Stall Lines on Floor
        const stallMat = new THREE.MeshStandardMaterial({ color: 0xFEF08A, roughness: 0.4 });
        function addStallLines(stallCenterX, stallW, stallL) {
          const lT = 0.15;
          // Left Stripe
          const lStripe = new THREE.Mesh(new THREE.BoxGeometry(lT, 0.02, stallL), stallMat);
          lStripe.position.set(stallCenterX - stallW / 2, 0.45 + 0.125, 0);
          parkG.add(lStripe);
          // Right Stripe
          const rStripe = new THREE.Mesh(new THREE.BoxGeometry(lT, 0.02, stallL), stallMat);
          rStripe.position.set(stallCenterX + stallW / 2, 0.45 + 0.125, 0);
          parkG.add(rStripe);
          // Heavy-Duty Extruded Rubber Wheel Stop / Parking Curb
          const curb = new THREE.Mesh(
            new THREE.BoxGeometry(stallW * 0.72, 0.35, 0.55),
            new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.85 })
          );
          curb.position.set(stallCenterX, 0.45 + 0.18, -(rh / 2 - 1.8));
          parkG.add(curb);
          // Yellow Reflective Curb Markings
          [-stallW * 0.24, 0, stallW * 0.24].forEach(kx => {
            const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.36, 0.56), stallMat);
            stripe.position.set(stallCenterX + kx, 0.45 + 0.18, -(rh / 2 - 1.8));
            parkG.add(stripe);
          });
        }

        // 4. Wall-Mounted Luxury EV Fast Charger
        const chargerG = new THREE.Group();
        const chargerBody = new THREE.Mesh(
          new THREE.BoxGeometry(0.25, 1.8, 1.1),
          new THREE.MeshStandardMaterial({ color: 0x0A0F18, roughness: 0.15, metalness: 0.85 })
        );
        chargerG.add(chargerBody);
        const chargerRing = new THREE.Mesh(
          new THREE.CylinderGeometry(0.28, 0.28, 0.05, 16),
          new THREE.MeshStandardMaterial({ color: 0x06B6D4, emissive: 0x06B6D4, emissiveIntensity: 0.9 })
        );
        chargerRing.rotation.x = Math.PI / 2;
        chargerRing.position.set(0.14, 0.2, 0);
        chargerG.add(chargerRing);
        const cable = new THREE.Mesh(
          new THREE.TorusGeometry(0.32, 0.06, 8, 16),
          new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8 })
        );
        cable.position.set(0.12, -0.45, 0);
        chargerG.add(cable);
        chargerG.position.set(-(rw / 2 - 0.25), 0.45 + 3.8, 0.5);
        parkG.add(chargerG);

        // 5. Overhead Recessed Linear Architectural Downlight
        const ceilingDownlight = new THREE.Mesh(
          new THREE.BoxGeometry(0.35, 0.08, rh * 0.65),
          new THREE.MeshStandardMaterial({ color: 0xFFFBEB, emissive: 0xFFFBEB, emissiveIntensity: 0.75 })
        );
        ceilingDownlight.position.set(0, 0.45 + 8.6, 0);
        parkG.add(ceilingDownlight);

        // 6. Assemble Vehicles with Guaranteed Clearance
        if (isDoubleBay) {
          // Bay 1: Luxury Sports EV Sedan (Metallic Deep Imperial Blue)
          const bay1X = -rw * 0.24;
          addStallLines(bay1X, carWidth + 1.2, carLen);
          const car1 = buildSculptedVehicle(carLen, carWidth, 0x162A45, 0xE2E8F0, false);
          car1.position.set(bay1X, 0, 0.4);
          parkG.add(car1);

          // Bay 2: Executive Modern Crossover SUV (Pearl Mineral White)
          const bay2X = rw * 0.24;
          addStallLines(bay2X, carWidth + 1.2, carLen);
          const car2 = buildSculptedVehicle(carLen, carWidth, 0xF8FAFC, 0x94A3B8, true);
          car2.position.set(bay2X, 0, 0.4);
          parkG.add(car2);
        } else {
          // Single Bay: Executive Sports EV Sedan centered with generous clearance
          addStallLines(0, carWidth + 1.2, carLen);
          const car = buildSculptedVehicle(carLen, carWidth, 0x162A45, 0xE2E8F0, false);
          car.position.set(0, 0, 0.4);
          parkG.add(car);
        }

        parkG.position.set(cx, 0, cz);
        group.add(parkG);

      // ── EXECUTIVE STUDY / HOME OFFICE ─────────────────────────────────────────
      } else if (rType === "study" || rType === "office" || rName.includes("study") || rName.includes("office")) {
        const studyG = new THREE.Group();
        const deskW = Math.min(6.0, rw * 0.65);
        const deskTop = new THREE.Mesh(new THREE.BoxGeometry(deskW, 0.18, 2.6), walnutMat);
        deskTop.position.set(0, 0.45 + 2.5, 0);
        deskTop.castShadow = true;
        studyG.add(deskTop);

        [-deskW / 2 + 0.25, deskW / 2 - 0.25].forEach(dx => {
          const dLeg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.5, 2.4), brassMat);
          dLeg.position.set(dx, 0.45 + 1.25, 0);
          studyG.add(dLeg);
        });

        // Ergonomic Swivel Chair
        const chSeat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 1.6), darkFabMat);
        chSeat.position.set(0, 0.45 + 1.6, -1.4);
        const chBack = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 0.15), darkFabMat);
        chBack.position.set(0, 0.45 + 2.5, -2.15);
        studyG.add(chSeat);
        studyG.add(chBack);

        // Modern Minimalist Bookshelf
        const shelfW = Math.min(6.5, rw * 0.7);
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(shelfW, 6.8, 1.2), oakMat);
        shelf.position.set(0, 0.45 + 3.4, rh / 2 - 0.8);
        shelf.castShadow = true;
        studyG.add(shelf);

        studyG.position.set(cx, 0, cz);
        group.add(studyG);

      // ── POOJA ROOM ──────────────────────────────────────────────────────────
      } else if (rType === "pooja") {
        const poojaG = new THREE.Group();
        const mandir = new THREE.Mesh(new THREE.BoxGeometry(2.8, 4.4, 1.8), walnutMat);
        mandir.position.set(0, 0.45 + 2.2, -(rh / 2 - 1.1));
        mandir.castShadow = true;
        const gopuram = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.6, 4), brassMat);
        gopuram.position.set(0, 0.45 + 4.4 + 0.8, -(rh / 2 - 1.1));
        gopuram.rotation.y = Math.PI / 4;
        poojaG.add(mandir);
        poojaG.add(gopuram);

        const diya = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 0.3, 12), brassMat);
        diya.position.set(0, 0.45 + 2.4, -(rh / 2 - 1.1));
        const diyaFlame = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), warmLedMat);
        diyaFlame.position.set(0, 0.45 + 2.7, -(rh / 2 - 1.1));
        poojaG.add(diya);
        poojaG.add(diyaFlame);

        poojaG.position.set(cx, 0, cz);
        group.add(poojaG);

      // ── UTILITY / LAUNDRY ───────────────────────────────────────────────────
      } else if (rType === "utility" || rName.includes("laundry")) {
        const utilG = new THREE.Group();
        const stackUnit = new THREE.Mesh(new THREE.BoxGeometry(2.4, 6.2, 2.4), matteObsidian);
        stackUnit.position.set(0, 0.45 + 3.1, -(rh / 2 - 1.4));
        stackUnit.castShadow = true;
        utilG.add(stackUnit);

        [0.45 + 1.8, 0.45 + 4.6].forEach(py => {
          const doorRing = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.08, 8, 24), chromeMat);
          doorRing.position.set(0, py, -(rh / 2 - 1.4) + 1.22);
          const doorGlass = new THREE.Mesh(new THREE.CircleGeometry(0.65, 20), smokedGlassMat);
          doorGlass.position.set(0, py, -(rh / 2 - 1.4) + 1.23);
          utilG.add(doorRing);
          utilG.add(doorGlass);
        });

        utilG.position.set(cx, 0, cz);
        group.add(utilG);
      }
    }
