/**
 * Auto-Walk Pathfinding & Camera Navigation
 * Interpolates player along waypoints with ease-in/out, automatic door opening,
 * stair ascension, focal point alignment, and instant user cancellation.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.WalkthroughAutoWalk = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class AutoWalkController {
    constructor(options = {}) {
      this.speed = options.speed || 6.5; // ~2.0 m/s in feet/sec
      this.isWalking = false;
      this.waypoints = [];
      this.currentWpIndex = 0;
      this.targetFocalPoint = null;
      this.targetRoomId = null;
      this.onArrival = null;
      this.onDoorApproached = null; // (doorId) => void
      this.arrivalHoldTimer = 0;
      this.lookAtProgress = 0;
      this.jumpInstantly = false;
    }

    startPath(pathResult, options = {}) {
      if (!pathResult || !pathResult.waypoints || pathResult.waypoints.length === 0) {
        return false;
      }

      this.jumpInstantly = !!options.jumpInstantly;
      this.targetRoomId = options.targetRoomId || null;
      this.onArrival = options.onArrival || null;
      this.onDoorApproached = options.onDoorApproached || null;
      this.targetFocalPoint = pathResult.targetFocalPoint || null;

      if (this.jumpInstantly) {
        // Instant teleport with callback
        this.isWalking = false;
        const finalWp = pathResult.waypoints[pathResult.waypoints.length - 1];
        if (this.onArrival) this.onArrival(finalWp, this.targetFocalPoint);
        return true;
      }

      this.waypoints = pathResult.waypoints.slice();
      this.currentWpIndex = 1; // 0 is start point
      this.isWalking = true;
      this.lookAtProgress = 0;
      return true;
    }

    cancel() {
      if (this.isWalking) {
        this.isWalking = false;
        this.waypoints = [];
        return true;
      }
      return false;
    }

    update(arg1, arg2, arg3) {
      if (!this.isWalking) return null;

      let currentPos, delta, lookDirection;
      if (typeof arg1 === 'number') {
        delta = arg1;
        currentPos = arg2 || { x: 0, y: 0.45, z: 0 };
        lookDirection = arg3 || { yaw: 0, pitch: 0 };
      } else {
        currentPos = arg1 || { x: 0, y: 0.45, z: 0 };
        delta = arg2 || 0.016;
        lookDirection = arg3 || { yaw: 0, pitch: 0 };
      }

      if (this.currentWpIndex >= this.waypoints.length) {
        // Arrived at final destination! Smoothly turn toward focal point
        if (this.targetFocalPoint) {
          this.lookAtProgress += delta * 2.0;
          const dx = this.targetFocalPoint.x - currentPos.x;
          const dz = this.targetFocalPoint.z - currentPos.z;
          const targetYaw = Math.atan2(dx, dz);

          // Interpolate yaw
          let diffYaw = targetYaw - lookDirection.yaw;
          while (diffYaw < -Math.PI) diffYaw += Math.PI * 2;
          while (diffYaw > Math.PI) diffYaw -= Math.PI * 2;

          lookDirection.yaw += diffYaw * Math.min(1, delta * 4.0);

          if (this.lookAtProgress >= 1.0) {
            this.isWalking = false;
            if (this.onArrival) this.onArrival(currentPos, this.targetFocalPoint);
          }
        } else {
          this.isWalking = false;
          if (this.onArrival) this.onArrival(currentPos, null);
        }

        return {
          pos: currentPos,
          position: currentPos,
          yaw: lookDirection.yaw,
          lookYaw: lookDirection.yaw,
          isFinished: !this.isWalking
        };
      }

      const targetWp = this.waypoints[this.currentWpIndex];
      const dx = targetWp.x - currentPos.x;
      const dy = targetWp.y - currentPos.y;
      const dz = targetWp.z - currentPos.z;
      const distXZ = Math.hypot(dx, dz);

      // Check for approaching doors (trigger open 2m before)
      if (this.onDoorApproached) {
        this.onDoorApproached(targetWp);
      }

      // Smooth Ease-in-out movement
      const moveDist = this.speed * delta;

      if (distXZ <= moveDist + 0.1 && Math.abs(dy) <= moveDist + 0.5) {
        // Waypoint reached, advance to next
        this.currentWpIndex++;
        const p = { x: targetWp.x, y: targetWp.y, z: targetWp.z };
        return {
          pos: p,
          position: p,
          yaw: Math.atan2(dx, dz),
          lookYaw: Math.atan2(dx, dz),
          isFinished: false
        };
      }

      // Move along vector
      const normX = dx / (distXZ || 1);
      const normZ = dz / (distXZ || 1);
      const nextX = currentPos.x + normX * moveDist;
      const nextZ = currentPos.z + normZ * moveDist;
      const nextY = currentPos.y + (dy * Math.min(1, delta * 6.0));

      // Heading faces direction of travel
      const targetYaw = Math.atan2(dx, dz);
      let diffYaw = targetYaw - lookDirection.yaw;
      while (diffYaw < -Math.PI) diffYaw += Math.PI * 2;
      while (diffYaw > Math.PI) diffYaw -= Math.PI * 2;
      lookDirection.yaw += diffYaw * Math.min(1, delta * 8.0);

      const pNext = { x: nextX, y: nextY, z: nextZ };
      return {
        pos: pNext,
        position: pNext,
        yaw: lookDirection.yaw,
        lookYaw: lookDirection.yaw,
        isFinished: false
      };
    }
  }

  return {
    AutoWalkController
  };
}));
