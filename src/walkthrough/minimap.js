/**
 * Interactive Architectural Floor Plan Minimap
 * 200px crisp 2D vector HUD canvas showing current level, room boundaries,
 * player heading arrow, room labels, stair markers, and click-to-autowalk navigation.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.WalkthroughMinimap = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class MinimapHUD {
    constructor(container, options = {}) {
      this.container = container;
      this.size = options.size || 210;
      this.canvas = null;
      this.ctx = null;
      this.graph = null;
      this.currentLevel = 'ground';
      this.playerPos = { x: 0, z: 0 };
      this.playerYaw = 0;
      this.currentRoomId = null;
      this.visible = true;
      this.onRoomClick = null; // (roomId) => void

      this.initDOM();
    }

    initDOM() {
      const wrap = document.createElement('div');
      wrap.id = 'walkthroughMinimapWrap';
      wrap.style.cssText = `
        position: absolute;
        bottom: 24px;
        right: 24px;
        width: ${this.size}px;
        height: ${this.size}px;
        background: #FAF8F3;
        border: 1px solid #D8D2C5;
        border-radius: 4px;
        box-shadow: 0 4px 16px rgba(14, 26, 43, 0.18);
        z-index: 1000;
        overflow: hidden;
        font-family: 'JetBrains Mono', monospace;
        display: flex;
        flex-direction: column;
        user-select: none;
      `;

      // Header Tag
      const header = document.createElement('div');
      header.id = 'minimapHeader';
      header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 5px 8px;
        background: #F5F2EA;
        border-bottom: 1px solid #D8D2C5;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        color: #0E1A2B;
      `;
      header.innerHTML = `
        <span id="minimapLevelTag">GROUND PLAN</span>
        <span style="color: #E4572E; font-size: 9px;">[M] MAP</span>
      `;
      wrap.appendChild(header);

      this.canvas = document.createElement('canvas');
      this.canvas.width = this.size * 2; // Hi-DPI
      this.canvas.height = (this.size - 24) * 2;
      this.canvas.style.cssText = `
        width: 100%;
        height: ${this.size - 24}px;
        cursor: pointer;
        display: block;
      `;
      wrap.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');

      // Click to auto-walk
      this.canvas.addEventListener('click', (e) => {
        if (!this.graph || !this.onRoomClick) return;
        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const worldPt = this.canvasToWorld(clickX, clickY, rect.width, rect.height);
        const clickedRoom = this.graph.getRoomAtPoint(worldPt.x, worldPt.z, this.currentLevel);
        if (clickedRoom) {
          this.onRoomClick(clickedRoom.id);
        }
      });

      this.domElement = wrap;
      this.container.appendChild(wrap);
    }

    setGraph(graph) {
      this.graph = graph;
      this.render();
    }

    setLevel(level) {
      if (this.currentLevel !== level) {
        this.currentLevel = level;
        const tag = document.getElementById('minimapLevelTag');
        if (tag) tag.textContent = level === 'first' ? 'FIRST FLOOR PLAN' : 'GROUND PLAN';
        this.render();
      }
    }

    setCurrentRoom(roomId) {
      this.currentRoomId = roomId;
      this.render();
    }

    updatePlayer(arg1, arg2, arg3) {
      if (typeof arg1 === 'number') {
        this.playerPos = { x: arg1, z: arg2 };
        this.playerYaw = arg3 || 0;
      } else {
        this.playerPos = arg1 || { x: 0, z: 0 };
        this.playerYaw = arg2 || 0;
        if (arg3) this.currentRoomId = arg3;
      }
      this.render();
    }

    show() {
      this.visible = true;
      if (this.domElement) this.domElement.style.display = 'flex';
      this.render();
    }

    hide() {
      this.visible = false;
      if (this.domElement) this.domElement.style.display = 'none';
    }

    toggle() {
      this.visible = !this.visible;
      if (this.domElement) this.domElement.style.display = this.visible ? 'flex' : 'none';
      if (this.visible) this.render();
      return this.visible;
    }

    canvasToWorld(cx, cy, w, h) {
      if (!this.graph) return { x: 0, z: 0 };
      const plot = this.graph.plot;
      const margin = 4.0;
      const boundW = plot.width + margin * 2;
      const boundL = plot.length + margin * 2;

      const scale = Math.min(w / boundW, h / boundL);
      const offsetX = (w - boundW * scale) / 2;
      const offsetY = (h - boundL * scale) / 2;

      const worldX = (cx - offsetX) / scale - (plot.width / 2 + margin) + margin;
      const worldZ = (cy - offsetY) / scale - (plot.length / 2 + margin) + margin;

      return { x: worldX, z: worldZ };
    }

    render() {
      if (!this.ctx || !this.graph || !this.visible) return;
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;
      ctx.clearRect(0, 0, w, h);

      const plot = this.graph.plot;
      const margin = 4.0;
      const boundW = plot.width + margin * 2;
      const boundL = plot.length + margin * 2;

      const scale = Math.min(w / boundW, h / boundL);
      const offsetX = (w - boundW * scale) / 2;
      const offsetY = (h - boundL * scale) / 2;

      function toScreen(worldX, worldZ) {
        const sx = offsetX + (worldX + plot.width / 2 + margin) * scale;
        const sy = offsetY + (worldZ + plot.length / 2 + margin) * scale;
        return { x: sx, y: sy };
      }

      // Draw background grid lines
      ctx.strokeStyle = '#EBE7DE';
      ctx.lineWidth = 1;
      for (let x = -plot.width / 2; x <= plot.width / 2; x += 10) {
        const p1 = toScreen(x, -plot.length / 2);
        const p2 = toScreen(x, plot.length / 2);
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      }
      for (let z = -plot.length / 2; z <= plot.length / 2; z += 10) {
        const p1 = toScreen(-plot.width / 2, z);
        const p2 = toScreen(plot.width / 2, z);
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      }

      // Draw Rooms for current level
      this.graph.nodes.forEach(node => {
        if (node.floor !== this.currentLevel) return;

        const b = node.bounds;
        const p1 = toScreen(b.minX, b.minZ);
        const p2 = toScreen(b.maxX, b.maxZ);
        const rw = p2.x - p1.x;
        const rh = p2.y - p1.y;

        const isCurrent = node.id === this.currentRoomId;

        // Fill
        if (isCurrent) {
          ctx.fillStyle = 'rgba(228, 87, 46, 0.16)'; // Pencil Accent soft
        } else if (node.type === 'stairs') {
          ctx.fillStyle = '#E8E4DA';
        } else {
          ctx.fillStyle = '#FFFFFF';
        }
        ctx.fillRect(p1.x, p1.y, rw, rh);

        // Wall Outline
        ctx.strokeStyle = isCurrent ? '#E4572E' : '#0E1A2B';
        ctx.lineWidth = isCurrent ? 3 : 2;
        ctx.strokeRect(p1.x, p1.y, rw, rh);

        // Label in small caps
        ctx.fillStyle = isCurrent ? '#E4572E' : '#536278';
        ctx.font = '600 16px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const label = node.name.length > 10 ? node.name.slice(0, 8) + '..' : node.name;
        ctx.fillText(label.toUpperCase(), (p1.x + p2.x) / 2, (p1.y + p2.y) / 2);

        // Stair Marker
        if (node.type === 'stairs') {
          ctx.fillStyle = '#E4572E';
          ctx.font = '700 14px "JetBrains Mono", monospace';
          const tag = this.currentLevel === 'ground' ? '▲ UP' : '▼ DN';
          ctx.fillText(tag, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2 + 18);
        }
      });

      // Draw Doors
      this.graph.doors.forEach(door => {
        if (door.floor !== this.currentLevel) return;
        const sp = toScreen(door.center.x, door.center.z);
        ctx.fillStyle = '#22C55E'; // Green opening
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Player Heading Arrow
      const playerSc = toScreen(this.playerPos.x, this.playerPos.z);
      ctx.save();
      ctx.translate(playerSc.x, playerSc.y);
      // Invert yaw to match Three.js world space to 2D top-down canvas
      ctx.rotate(-this.playerYaw + Math.PI);

      // Distinct red-orange architectural directional arrow
      ctx.fillStyle = '#E4572E';
      ctx.beginPath();
      ctx.moveTo(0, -12); // Tip
      ctx.lineTo(8, 8);
      ctx.lineTo(0, 4);   // Notch
      ctx.lineTo(-8, 8);
      ctx.closePath();
      ctx.fill();

      // Center pivot dot
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    destroy() {
      if (this.domElement && this.domElement.parentNode) {
        this.domElement.parentNode.removeChild(this.domElement);
      }
    }
  }

  return {
    MinimapHUD,
    WalkthroughMinimap: MinimapHUD
  };
}));
