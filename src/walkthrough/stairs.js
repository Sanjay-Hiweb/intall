/**
 * Walkable Stairs & Vertical Transitions
 * Smooth elevation interpolation matching step profiles with camera dip,
 * auto-climb/descend on stair entrance, and Q/Z manual step climb.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.WalkthroughStairs = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class StairsController {
    constructor() {
      this.stairs = []; // Registered staircase zones
      this.activeStair = null;
      this.currentLevel = 'ground';
      this.targetY = 0.45;
      this.currentY = 0.45;
      this.isTransitioningLevel = false;
      this.stepRiser = 0.58; // Standard architectural 7" riser in feet
      this.totalSteps = 16;
      this.onLevelChange = null; // Callback: (newLevel) => void
    }

    /**
     * Register stairs from room graph or multi-floor setup
     */
    registerFromGraph(roomGraph) {
      this.stairs = [];
      const groundStair = roomGraph.rooms.find(r => r.type === 'stairs' && (r.floor || 'ground') === 'ground');

      if (groundStair) {
        const plot = roomGraph.plot;
        const cx = (groundStair.x + groundStair.w / 2) - plot.width / 2;
        const cz = plot.length / 2 - (groundStair.y + groundStair.h / 2);

        const minX = groundStair.x - plot.width / 2;
        const maxX = (groundStair.x + groundStair.w) - plot.width / 2;
        const minZ = plot.length / 2 - (groundStair.y + groundStair.h);
        const maxZ = plot.length / 2 - groundStair.y;

        const isHoriz = groundStair.w > groundStair.h;

        this.stairs.push({
          id: groundStair.id,
          bounds: { minX, maxX, minZ, maxZ },
          center: { x: cx, y: 0.45, z: cz },
          bottomY: 0.45,
          topY: 10.25,
          isHoriz: isHoriz,
          // Bottom start zone (first 25% of staircase)
          startZone: isHoriz
            ? { minX: minX, maxX: minX + groundStair.w * 0.35, minZ: minZ, maxZ: maxZ }
            : { minX: minX, maxX: maxX, minZ: maxZ - groundStair.h * 0.35, maxZ: maxZ },
          // Top landing zone (last 25% of staircase)
          endZone: isHoriz
            ? { minX: maxX - groundStair.w * 0.35, maxX: maxX, minZ: minZ, maxZ: maxZ }
            : { minX: minX, maxX: maxX, minZ: minZ, maxZ: minZ + groundStair.h * 0.35 }
        });
      }
    }

    /**
     * Update player elevation based on staircase position
     * @param {Object} pos - Player position { x, y, z }
     * @param {number} delta - Delta time in seconds
     */
    updateElevation(pos, delta = 0.016, keys = null) {
      if (keys) {
        if (keys.climbUp) {
          this.manualStep(1, pos);
        } else if (keys.climbDown) {
          this.manualStep(-1, pos);
        }
      }
      const res = this.update(pos, delta);
      return res.elevationY + res.cameraDip;
    }

    update(pos, delta = 0.016) {
      let matchingStair = null;
      for (const s of this.stairs) {
        const b = s.bounds;
        if (pos.x >= b.minX - 0.5 && pos.x <= b.maxX + 0.5 &&
            pos.z >= b.minZ - 0.5 && pos.z <= b.maxZ + 0.5) {
          matchingStair = s;
          break;
        }
      }

      this.activeStair = matchingStair;
      let cameraDip = 0;

      if (matchingStair) {
        const s = matchingStair;
        // Calculate progress along stair ramp (0 to 1)
        let progress = 0;
        if (s.isHoriz) {
          progress = (pos.x - s.bounds.minX) / (s.bounds.maxX - s.bounds.minX);
        } else {
          progress = (s.bounds.maxZ - pos.z) / (s.bounds.maxZ - s.bounds.minZ);
        }
        progress = Math.max(0, Math.min(1, progress));

        // Stepped profile with subtle 150ms interpolation
        const rawStep = progress * this.totalSteps;
        const currentStepIndex = Math.floor(rawStep);
        const stepFraction = rawStep - currentStepIndex;

        // Subtle camera dip per step (0.04 ft dip mid-step)
        cameraDip = -Math.sin(stepFraction * Math.PI) * 0.06;

        this.targetY = s.bottomY + progress * (s.topY - s.bottomY);

        // Smooth elevation change over 150ms
        const lerpFactor = Math.min(1, delta * 12.0);
        this.currentY += (this.targetY - this.currentY) * lerpFactor;

        // Level change triggers
        if (progress > 0.85 && this.currentLevel !== 'first') {
          this.currentLevel = 'first';
          if (this.onLevelChange) this.onLevelChange('first');
        } else if (progress < 0.15 && this.currentLevel !== 'ground') {
          this.currentLevel = 'ground';
          if (this.onLevelChange) this.onLevelChange('ground');
        }
      } else {
        // Flat floor target elevation
        this.targetY = this.currentLevel === 'first' ? 10.25 : 0.45;
        const lerpFactor = Math.min(1, delta * 8.0);
        this.currentY += (this.targetY - this.currentY) * lerpFactor;
      }

      return {
        elevationY: this.currentY,
        cameraDip: cameraDip,
        currentLevel: this.currentLevel,
        isOnStair: !!matchingStair
      };
    }

    /**
     * Manual climb step (Q = up, Z = down)
     */
    manualStep(direction, playerPos) {
      if (!this.activeStair) {
        // Check if near any stair start (within 1.2m = ~4 ft)
        const nearStair = this.stairs.find(s => {
          const dx = s.center.x - playerPos.x;
          const dz = s.center.z - playerPos.z;
          return Math.hypot(dx, dz) < 4.0;
        });
        if (!nearStair) return null;
        this.activeStair = nearStair;
      }

      const s = this.activeStair;
      const stepDelta = (s.topY - s.bottomY) / this.totalSteps;

      if (direction === 'up' || direction === 1 || direction > 0) {
        this.targetY = Math.min(s.topY, this.currentY + stepDelta);
        if (this.targetY >= s.topY - 0.5 && this.currentLevel !== 'first') {
          this.currentLevel = 'first';
          if (this.onLevelChange) this.onLevelChange('first');
        }
      } else if (direction === 'down' || direction === -1 || direction < 0) {
        this.targetY = Math.max(s.bottomY, this.currentY - stepDelta);
        if (this.targetY <= s.bottomY + 0.5 && this.currentLevel !== 'ground') {
          this.currentLevel = 'ground';
          if (this.onLevelChange) this.onLevelChange('ground');
        }
      }

      return this.targetY;
    }
  }

  return {
    StairsController
  };
}));
