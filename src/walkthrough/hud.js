/**
 * Walkthrough Heads-Up Display (HUD) System
 * Minimal architectural overlay: Room Banners, Room List Drawer, Bottom Control Dock,
 * Interaction Prompts ("E Open Door"), First-Time Controls Modal, and Settings Popover.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.WalkthroughHUD = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class WalkthroughHUDManager {
    constructor(container, options = {}) {
      this.container = container;
      this.graph = options.graph || null;
      this.unit = options.unit || 'ft'; // 'ft' | 'm'
      this.visible = true;
      this.lastRoomId = null;
      this.bannerTimer = null;
      this.dockHideTimer = null;
      this.callbacks = {}; // Event handlers

      this.initDOM();
    }

    on(event, handler) {
      this.callbacks[event] = handler;
    }

    emit(event, ...args) {
      if (this.callbacks[event]) {
        this.callbacks[event](...args);
      }
    }

    setUnit(unit) {
      this.unit = unit;
      this.refreshRoomList();
    }

    setGraph(graph) {
      this.graph = graph;
      this.refreshRoomList();
    }

    formatDimension(feetVal) {
      if (this.unit === 'm') {
        const meters = (feetVal * 0.3048).toFixed(1);
        return `${meters}m`;
      }
      const totalInches = Math.round(feetVal * 12);
      const ft = Math.floor(totalInches / 12);
      const inc = totalInches % 12;
      return `${ft}'-${inc}"`;
    }

    initDOM() {
      // 1. Root Overlay
      const hudRoot = document.createElement('div');
      hudRoot.id = 'walkthroughHUDRoot';
      hudRoot.style.cssText = `
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 1000;
        font-family: 'Inter', sans-serif;
        color: #0E1A2B;
        overflow: hidden;
      `;
      this.hudRoot = hudRoot;
      this.container.appendChild(hudRoot);

      // 2. Top-Left Status Badge
      const statusPill = document.createElement('div');
      statusPill.id = 'walkthroughStatusPill';
      statusPill.style.cssText = `
        position: absolute;
        top: 20px;
        left: 20px;
        background: rgba(250, 248, 243, 0.92);
        backdrop-filter: blur(8px);
        border: 1px solid #D8D2C5;
        border-radius: 4px;
        padding: 8px 14px;
        font-family: 'JetBrains Mono', monospace;
        box-shadow: 0 4px 14px rgba(14, 26, 43, 0.12);
        display: flex;
        align-items: center;
        gap: 12px;
        pointer-events: auto;
      `;
      statusPill.innerHTML = `
        <div style="display: flex; flex-direction: column;">
          <span id="hudLevelName" style="font-size: 10px; color: #E4572E; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;">Ground Floor</span>
          <span id="hudRoomName" style="font-size: 13px; color: #0E1A2B; font-weight: 700;">Living Room</span>
        </div>
        <div style="border-left: 1px solid #D8D2C5; height: 24px;"></div>
        <div style="font-size: 11px; color: #536278;" id="hudPlotDimText">1.6m Eye Height</div>
      `;
      hudRoot.appendChild(statusPill);

      // 3. Center Crosshair Dot
      const crosshair = document.createElement('div');
      crosshair.id = 'walkthroughCrosshair';
      crosshair.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        width: 6px;
        height: 6px;
        background: rgba(228, 87, 46, 0.85);
        border: 1.5px solid #FFFFFF;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        transition: transform 0.15s ease;
      `;
      hudRoot.appendChild(crosshair);

      // 4. Door Interaction Prompt
      const doorPrompt = document.createElement('div');
      doorPrompt.id = 'walkthroughDoorPrompt';
      doorPrompt.style.cssText = `
        position: absolute;
        top: calc(50% + 24px);
        left: 50%;
        transform: translateX(-50%);
        background: #0E1A2B;
        color: #F5F2EA;
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        padding: 5px 12px;
        border-radius: 3px;
        border: 1px solid #E4572E;
        box-shadow: 0 4px 12px rgba(14, 26, 43, 0.25);
        display: none;
        align-items: center;
        gap: 8px;
        pointer-events: none;
      `;
      doorPrompt.innerHTML = `<span style="background: #E4572E; color: #FFFFFF; padding: 1px 5px; border-radius: 2px;">E</span> <span id="doorPromptAction">Open door</span>`;
      hudRoot.appendChild(doorPrompt);

      // 5. Bottom-Center Room Banner (Smooth 250ms Fade, holds 2s)
      const banner = document.createElement('div');
      banner.id = 'walkthroughRoomBanner';
      banner.style.cssText = `
        position: absolute;
        bottom: 84px;
        left: 50%;
        transform: translateX(-50%) translateY(10px);
        background: rgba(14, 26, 43, 0.92);
        color: #F5F2EA;
        border: 1px solid #D8D2C5;
        border-radius: 4px;
        padding: 10px 22px;
        font-family: 'JetBrains Mono', monospace;
        box-shadow: 0 6px 20px rgba(14, 26, 43, 0.25);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.25s ease, transform 0.25s ease;
      `;
      banner.innerHTML = `
        <span id="bannerRoomName" style="font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #FAF8F3;">Living Room</span>
        <span id="bannerRoomSize" style="font-size: 12px; color: #E4572E; font-weight: 600;">14'-0" × 16'-0" · 224 SQFT</span>
      `;
      hudRoot.appendChild(banner);
      this.bannerElem = banner;

      // 6. Level Change Toast
      const levelToast = document.createElement('div');
      levelToast.id = 'walkthroughLevelToast';
      levelToast.style.cssText = `
        position: absolute;
        top: 80px;
        left: 50%;
        transform: translateX(-50%) translateY(-10px);
        background: #0E1A2B;
        color: #FAF8F3;
        border: 1px solid #E4572E;
        padding: 6px 16px;
        border-radius: 3px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        opacity: 0;
        pointer-events: none;
        transition: all 0.25s ease;
      `;
      hudRoot.appendChild(levelToast);
      this.levelToast = levelToast;

      // 7. Tour Progress Strip (Appears when Tour is running)
      const tourStrip = document.createElement('div');
      tourStrip.id = 'walkthroughTourStrip';
      tourStrip.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(250, 248, 243, 0.95);
        border: 1px solid #D8D2C5;
        border-radius: 4px;
        padding: 8px 14px;
        font-family: 'JetBrains Mono', monospace;
        display: none;
        align-items: center;
        gap: 12px;
        pointer-events: auto;
        box-shadow: 0 4px 14px rgba(14, 26, 43, 0.15);
      `;
      tourStrip.innerHTML = `
        <div style="display: flex; flex-direction: column;">
          <div style="font-size: 9px; color: #E4572E; font-weight: 700;">§ GUIDED TOUR</div>
          <div style="font-size: 12px; font-weight: 700; color: #0E1A2B;" id="tourProgressText">Stop 1 of 6</div>
        </div>
        <div style="display: flex; gap: 6px;">
          <button type="button" id="btnTourPrev" class="hud-mini-btn" title="Previous Room ([)">◄</button>
          <button type="button" id="btnTourPause" class="hud-mini-btn" title="Pause / Resume">❚❚</button>
          <button type="button" id="btnTourNext" class="hud-mini-btn" title="Next Room (])">►</button>
          <button type="button" id="btnTourStop" class="hud-mini-btn" title="Stop Tour (T)" style="color: #C53030;">■</button>
        </div>
      `;
      hudRoot.appendChild(tourStrip);
      this.tourStrip = tourStrip;

      // 8. Bottom Control Bar (Center)
      const bottomBar = document.createElement('div');
      bottomBar.id = 'walkthroughBottomBar';
      bottomBar.style.cssText = `
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(250, 248, 243, 0.95);
        border: 1px solid #D8D2C5;
        border-radius: 4px;
        padding: 6px 12px;
        box-shadow: 0 6px 20px rgba(14, 26, 43, 0.18);
        display: flex;
        align-items: center;
        gap: 8px;
        pointer-events: auto;
        font-family: 'JetBrains Mono', monospace;
        transition: opacity 0.3s ease, transform 0.3s ease;
      `;
      bottomBar.innerHTML = `
        <button type="button" class="hud-btn" id="btnHudRoomList" title="Room List (L)">
          <span>Rooms</span>
        </button>
        <button type="button" class="hud-btn active" id="btnHudMinimap" title="Toggle Minimap (M)">
          <span>Minimap</span>
        </button>
        <button type="button" class="hud-btn" id="btnHudTour" title="Start Guided Tour (T)">
          <span>Tour</span>
        </button>
        <button type="button" class="hud-btn" id="btnHudDayNight" title="Toggle Day / Night Light">
          <span>Day/Night</span>
        </button>
        <div style="border-left: 1px solid #D8D2C5; height: 18px; margin: 0 2px;"></div>
        <button type="button" class="hud-btn" id="btnHudSettings" title="Settings & Sensitivity">
          <span>Settings</span>
        </button>
        <button type="button" class="hud-btn" id="btnHudHelp" title="Controls Help (?)">
          <span>?</span>
        </button>
        <button type="button" class="hud-btn exit-btn" id="btnHudExit" title="Exit Walkthrough (P / Esc)">
          <span>Exit Walk</span>
        </button>
      `;
      hudRoot.appendChild(bottomBar);
      this.bottomBar = bottomBar;

      // Auto-hide bottom bar on movement, show on mousemove
      this.container.addEventListener('mousemove', () => {
        this.showBottomBar();
      });

      // 9. Left Drawer Room List
      const roomDrawer = document.createElement('div');
      roomDrawer.id = 'walkthroughRoomDrawer';
      roomDrawer.style.cssText = `
        position: absolute;
        top: 70px;
        left: 20px;
        bottom: 80px;
        width: 280px;
        background: #FAF8F3;
        border: 1px solid #D8D2C5;
        border-radius: 4px;
        box-shadow: 0 8px 24px rgba(14, 26, 43, 0.2);
        display: none;
        flex-direction: column;
        pointer-events: auto;
        z-index: 1010;
        font-family: 'JetBrains Mono', monospace;
        overflow: hidden;
      `;
      roomDrawer.innerHTML = `
        <div style="padding: 10px 14px; background: #F5F2EA; border-bottom: 1px solid #D8D2C5; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #0E1A2B;">§ HOUSE ROOM LIST</span>
          <button type="button" id="btnCloseRoomDrawer" style="background: none; border: none; font-size: 16px; cursor: pointer; color: #536278;">×</button>
        </div>
        <div id="roomDrawerScrollList" style="flex: 1; overflow-y: auto; padding: 8px;">
          <!-- Populated dynamically -->
        </div>
        <div style="padding: 8px 12px; background: #F5F2EA; border-top: 1px solid #D8D2C5; font-size: 10px; color: #536278;">
          Click any room to start automatic walk.
        </div>
      `;
      hudRoot.appendChild(roomDrawer);
      this.roomDrawer = roomDrawer;

      // 10. Settings Popover
      const settingsModal = document.createElement('div');
      settingsModal.id = 'walkthroughSettingsModal';
      settingsModal.style.cssText = `
        position: absolute;
        bottom: 74px;
        left: 50%;
        transform: translateX(-50%);
        width: 320px;
        background: #FAF8F3;
        border: 1px solid #D8D2C5;
        border-radius: 4px;
        box-shadow: 0 8px 24px rgba(14, 26, 43, 0.25);
        display: none;
        flex-direction: column;
        pointer-events: auto;
        z-index: 1015;
        font-family: 'JetBrains Mono', monospace;
        padding: 16px;
      `;
      settingsModal.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #D8D2C5;">
          <span style="font-size: 11px; font-weight: 700; text-transform: uppercase;">WALKTHROUGH SETTINGS</span>
          <button type="button" id="btnCloseSettings" style="background: none; border: none; font-size: 14px; cursor: pointer;">×</button>
        </div>
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
            <span>Mouse Sensitivity</span>
            <span id="txtSensVal">1.0x</span>
          </div>
          <input type="range" id="rngSens" min="0.5" max="2.5" step="0.1" value="1.0" style="width: 100%;">
        </div>
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
            <span>Field of View (FOV)</span>
            <span id="txtFovVal">70°</span>
          </div>
          <input type="range" id="rngFov" min="60" max="90" step="1" value="70" style="width: 100%;">
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 11px;">
          <span>Invert Mouse Y</span>
          <input type="checkbox" id="chkInvertY">
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 11px;">
          <span>Instant Room Teleport</span>
          <input type="checkbox" id="chkInstantJump">
        </div>
        <div style="margin-top: 4px; padding-top: 8px; border-top: 1px dashed #D8D2C5; font-size: 10px; color: #536278;">
          Unit System: <strong id="lblActiveUnit">FEET (FT)</strong>
        </div>
      `;
      hudRoot.appendChild(settingsModal);
      this.settingsModal = settingsModal;

      // 11. First-Time / Help Overlay Card
      const helpCard = document.createElement('div');
      helpCard.id = 'walkthroughHelpCard';
      helpCard.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 380px;
        background: #FAF8F3;
        border: 2px solid #0E1A2B;
        border-radius: 4px;
        padding: 20px;
        box-shadow: 0 12px 36px rgba(14, 26, 43, 0.35);
        font-family: 'JetBrains Mono', monospace;
        display: none;
        flex-direction: column;
        pointer-events: auto;
        z-index: 1020;
      `;
      helpCard.innerHTML = `
        <div style="font-size: 10px; color: #E4572E; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">
          § 01 / CONTROLS &amp; NAVIGATION
        </div>
        <h3 style="font-family: 'Fraunces', serif; font-size: 18px; margin-bottom: 12px; color: #0E1A2B;">
          First-Person Architectural Walk
        </h3>
        <ul style="list-style: none; padding: 0; margin: 0 0 16px 0; font-size: 11px; line-height: 1.8; color: #0E1A2B;">
          <li>├── <strong>W A S D / Arrows</strong> : Walk forward, left, back, right</li>
          <li>├── <strong>Mouse Look</strong> : Click screen for Pointer Lock (Esc releases)</li>
          <li>├── <strong>Shift</strong> : Sprint walk (1.8× speed)</li>
          <li>├── <strong>E</strong> : Open / Close facing door</li>
          <li>├── <strong>Q / Z</strong> : Step climb / descend stairs</li>
          <li>├── <strong>[ / ]</strong> : Previous / Next room shortcut</li>
          <li>├── <strong>L / M / T</strong> : Toggle Room List / Minimap / Guided Tour</li>
          <li>└── <strong>P / Esc</strong> : Exit walkthrough back to CAD</li>
        </ul>
        <button type="button" id="btnDismissHelp" style="
          width: 100%;
          padding: 8px 12px;
          background: #0E1A2B;
          color: #F5F2EA;
          border: none;
          border-radius: 2px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          cursor: pointer;
        ">
          Enter Drawing Board (Got it)
        </button>
      `;
      hudRoot.appendChild(helpCard);
      this.helpCard = helpCard;

      // 12. Screen Fade Transition Canvas (for instant jump & enter)
      const fadeOverlay = document.createElement('div');
      fadeOverlay.id = 'walkthroughFadeOverlay';
      fadeOverlay.style.cssText = `
        position: absolute;
        inset: 0;
        background: #0E1A2B;
        opacity: 0;
        pointer-events: none;
        z-index: 2000;
        transition: opacity 0.15s ease-in-out;
      `;
      hudRoot.appendChild(fadeOverlay);
      this.fadeOverlay = fadeOverlay;

      this.injectStyles();
      this.bindEvents();
    }

    injectStyles() {
      const style = document.createElement('style');
      style.textContent = `
        .hud-btn {
          background: #FAF8F3;
          border: 1px solid #D8D2C5;
          border-radius: 2px;
          padding: 5px 10px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          color: #0E1A2B;
          cursor: pointer;
          transition: all 0.12s ease;
        }
        .hud-btn:hover {
          border-color: #0E1A2B;
          background: #F5F2EA;
        }
        .hud-btn.active {
          background: #0E1A2B;
          color: #F5F2EA;
          border-color: #0E1A2B;
        }
        .hud-btn.exit-btn {
          background: #C53030;
          color: #FFFFFF;
          border-color: #C53030;
        }
        .hud-mini-btn {
          background: #FAF8F3;
          border: 1px solid #D8D2C5;
          padding: 3px 8px;
          font-size: 10px;
          cursor: pointer;
          border-radius: 2px;
        }
        .room-item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 7px 10px;
          border-radius: 3px;
          cursor: pointer;
          border: 1px solid transparent;
          margin-bottom: 4px;
          transition: all 0.1s ease;
        }
        .room-item-row:hover {
          background: #F5F2EA;
          border-color: #D8D2C5;
        }
        .room-item-row.active {
          background: rgba(228, 87, 46, 0.12);
          border-color: #E4572E;
        }
      `;
      document.head.appendChild(style);
    }

    bindEvents() {
      // Bottom Dock buttons
      const btnList = document.getElementById('btnHudRoomList');
      const btnMap = document.getElementById('btnHudMinimap');
      const btnTour = document.getElementById('btnHudTour');
      const btnDayNight = document.getElementById('btnHudDayNight');
      const btnSettings = document.getElementById('btnHudSettings');
      const btnHelp = document.getElementById('btnHudHelp');
      const btnExit = document.getElementById('btnHudExit');

      if (btnList) btnList.onclick = () => this.toggleRoomDrawer();
      if (btnMap) btnMap.onclick = () => {
        const active = this.emit('toggleMinimap');
        btnMap.classList.toggle('active', active);
      };
      if (btnTour) btnTour.onclick = () => this.emit('toggleTour');
      if (btnDayNight) btnDayNight.onclick = () => this.emit('toggleDayNight');
      if (btnSettings) btnSettings.onclick = () => this.toggleSettings();
      if (btnHelp) btnHelp.onclick = () => this.showHelpCard(true);
      if (btnExit) btnExit.onclick = () => this.emit('exitWalkthrough');

      // Room Drawer Close
      const btnCloseDrawer = document.getElementById('btnCloseRoomDrawer');
      if (btnCloseDrawer) btnCloseDrawer.onclick = () => this.toggleRoomDrawer(false);

      // Settings Close
      const btnCloseSettings = document.getElementById('btnCloseSettings');
      if (btnCloseSettings) btnCloseSettings.onclick = () => this.toggleSettings(false);

      // Help Dismiss
      const btnDismiss = document.getElementById('btnDismissHelp');
      if (btnDismiss) btnDismiss.onclick = () => this.showHelpCard(false);

      // Tour Controls
      const bPrev = document.getElementById('btnTourPrev');
      const bPause = document.getElementById('btnTourPause');
      const bNext = document.getElementById('btnTourNext');
      const bStop = document.getElementById('btnTourStop');
      if (bPrev) bPrev.onclick = () => this.emit('tourPrev');
      if (bPause) bPause.onclick = () => this.emit('tourPause');
      if (bNext) bNext.onclick = () => this.emit('tourNext');
      if (bStop) bStop.onclick = () => this.emit('tourStop');
    }

    show() {
      this.visible = true;
      if (this.hudRoot) this.hudRoot.style.display = 'block';
    }

    hide() {
      this.visible = false;
      if (this.hudRoot) this.hudRoot.style.display = 'none';
    }

    toggleVisibility() {
      if (this.visible) this.hide();
      else this.show();
    }

    showBottomBar() {
      if (!this.bottomBar) return;
      this.bottomBar.style.opacity = '1';
      this.bottomBar.style.transform = 'translateX(-50%) translateY(0)';
      clearTimeout(this.dockHideTimer);
      this.dockHideTimer = setTimeout(() => {
        if (this.visible && !this.roomDrawer.style.display.includes('flex') && !this.settingsModal.style.display.includes('flex')) {
          this.bottomBar.style.opacity = '0.35';
        }
      }, 3500);
    }

    updateCurrentRoom(floor, roomName) {
      const hudLvl = document.getElementById('hudLevelName');
      const hudRoom = document.getElementById('hudRoomName');
      if (hudLvl) hudLvl.textContent = (floor === 'first' ? 'FIRST FLOOR' : 'GROUND FLOOR');
      if (hudRoom) hudRoom.textContent = roomName || '';
    }

    showRoomBanner(roomNode) {
      return this.triggerRoomBanner(roomNode);
    }

    showToast(message) {
      return this.showLevelToast(message);
    }

    triggerRoomBanner(roomNode) {
      if (!roomNode) return;
      this.lastRoomId = roomNode.id;

      // Update Top Status
      const hudLvl = document.getElementById('hudLevelName');
      const hudRoom = document.getElementById('hudRoomName');
      if (hudLvl) hudLvl.textContent = roomNode.floor === 'first' ? 'FIRST FLOOR' : 'GROUND FLOOR';
      if (hudRoom) hudRoom.textContent = roomNode.name;

      // Update Banner content
      const bName = document.getElementById('bannerRoomName');
      const bSize = document.getElementById('bannerRoomSize');
      if (bName) bName.textContent = roomNode.name;
      if (bSize) {
        const wStr = this.formatDimension(roomNode.width);
        const lStr = this.formatDimension(roomNode.length);
        const areaStr = this.unit === 'm'
          ? `${(roomNode.areaSqft * 0.092903).toFixed(1)} SQM`
          : `${roomNode.areaSqft} SQFT`;
        bSize.textContent = `${wStr} × ${lStr} · ${areaStr}`;
      }

      // Animate Banner
      clearTimeout(this.bannerTimer);
      this.bannerElem.style.opacity = '1';
      this.bannerElem.style.transform = 'translateX(-50%) translateY(0)';

      this.bannerTimer = setTimeout(() => {
        this.bannerElem.style.opacity = '0';
        this.bannerElem.style.transform = 'translateX(-50%) translateY(10px)';
      }, 2500);
    }

    showLevelToast(levelName) {
      if (!this.levelToast) return;
      this.levelToast.textContent = levelName;
      this.levelToast.style.opacity = '1';
      this.levelToast.style.transform = 'translateX(-50%) translateY(0)';
      setTimeout(() => {
        this.levelToast.style.opacity = '0';
        this.levelToast.style.transform = 'translateX(-50%) translateY(-10px)';
      }, 2200);
    }

    showDoorPrompt(visible, actionText = 'Open door') {
      return this.setDoorPrompt(visible, actionText);
    }

    setDoorPrompt(visible, actionText = 'Open door') {
      const p = document.getElementById('walkthroughDoorPrompt');
      const act = document.getElementById('doorPromptAction');
      if (!p) return;
      if (visible) {
        if (act) act.textContent = actionText;
        p.style.display = 'inline-flex';
      } else {
        p.style.display = 'none';
      }
    }

    toggleRoomDrawer(force) {
      const show = force !== undefined ? force : this.roomDrawer.style.display === 'none';
      this.roomDrawer.style.display = show ? 'flex' : 'none';
      const btn = document.getElementById('btnHudRoomList');
      if (btn) btn.classList.toggle('active', show);
      if (show) this.refreshRoomList();
    }

    renderRoomList() {
      this.refreshRoomList();
    }

    refreshRoomList() {
      const listContainer = document.getElementById('roomDrawerScrollList');
      if (!listContainer || !this.graph) return;
      listContainer.innerHTML = '';

      const groundRooms = Array.from(this.graph.nodes.values()).filter(n => n.floor === 'ground');
      const firstRooms = Array.from(this.graph.nodes.values()).filter(n => n.floor === 'first');

      const appendSection = (title, rooms) => {
        if (rooms.length === 0) return;
        const h = document.createElement('div');
        h.style.cssText = `font-size: 9px; font-weight: 700; color: #E4572E; text-transform: uppercase; margin: 8px 4px 4px 4px; letter-spacing: 0.08em;`;
        h.textContent = title;
        listContainer.appendChild(h);

        rooms.forEach(room => {
          const row = document.createElement('div');
          row.className = `room-item-row ${room.id === this.lastRoomId ? 'active' : ''}`;
          const wStr = this.formatDimension(room.width);
          const lStr = this.formatDimension(room.length);

          row.innerHTML = `
            <div>
              <div style="font-size: 11px; font-weight: 600; color: #0E1A2B;">${room.name}</div>
              <div style="font-size: 10px; color: #536278;">${wStr} × ${lStr}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              ${!room.isReachable ? `
                <span style="color: #C53030; font-size: 12px;" title="No door connects this room">⚠️</span>
              ` : `
                <span style="font-size: 10px; color: #E4572E;">Walk →</span>
              `}
            </div>
          `;

          row.onclick = () => {
            this.toggleRoomDrawer(false);
            this.emit('selectRoom', room.id);
          };
          listContainer.appendChild(row);
        });
      };

      appendSection('GROUND FLOOR', groundRooms);
      appendSection('FIRST FLOOR', firstRooms);
    }

    toggleSettings(force) {
      const show = force !== undefined ? force : this.settingsModal.style.display === 'none';
      this.settingsModal.style.display = show ? 'flex' : 'none';
      const btn = document.getElementById('btnHudSettings');
      if (btn) btn.classList.toggle('active', show);
    }

    showHelpCard(show) {
      if (!this.helpCard) return;
      this.helpCard.style.display = show ? 'flex' : 'none';
      if (!show) {
        localStorage.setItem('intall_walk_help_dismissed', 'true');
      }
    }

    updateTourStatus(isActive, currentStopIndex, totalStops, stopName, isPaused) {
      if (!this.tourStrip) return;
      if (isActive) {
        this.tourStrip.style.display = 'flex';
        const txt = document.getElementById('tourProgressText');
        const bPause = document.getElementById('btnTourPause');
        if (txt) txt.textContent = `Stop ${currentStopIndex + 1} of ${totalStops}: ${stopName}`;
        if (bPause) bPause.textContent = isPaused ? '▶' : '❚❚';
      } else {
        this.tourStrip.style.display = 'none';
      }
    }

    fadeTransition(durationMs = 150) {
      return new Promise(resolve => {
        this.fadeOverlay.style.opacity = '1';
        setTimeout(() => {
          this.fadeOverlay.style.opacity = '0';
          resolve();
        }, durationMs);
      });
    }

    destroy() {
      if (this.hudRoot && this.hudRoot.parentNode) {
        this.hudRoot.parentNode.removeChild(this.hudRoot);
      }
    }
  }

  return {
    WalkthroughHUDManager
  };
}));
