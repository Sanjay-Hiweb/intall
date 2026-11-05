/**
 * Walkthrough Collision System
 * Capsule-to-Box / Capsule-to-Segment collision detection with smooth sliding response,
 * sub-stepping to prevent tunneling, and door state integration.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.WalkthroughCollision = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class CollisionSystem {
    constructor(options = {}) {
      // 0.25m radius = ~0.82 ft
      this.radius = options.radius || 0.82;
      this.height = options.height || 5.58;
      this.stepHeight = options.stepHeight || 0.6; // Can step over low thresholds/steps
      this.colliders = []; // Array of AABB / OBB box colliders
      this.plotBounds = null;
    }

    setPlotBounds(width, length) {
      // Keep player inside plot + modest yard margin
      const margin = 10.0;
      this.plotBounds = {
        minX: -(width / 2 + margin),
        maxX: width / 2 + margin,
        minZ: -(length / 2 + margin),
        maxZ: length / 2 + margin
      };
    }

    clearColliders() {
      this.colliders = [];
    }

    addBoxCollider(minX, maxX, minZ, maxZ, minY, maxY, type = 'wall', id = null) {
      this.colliders.push({
        minX, maxX, minZ, maxZ,
        minY: minY !== undefined ? minY : -100,
        maxY: maxY !== undefined ? maxY : 100,
        type,
        id
      });
    }

    /**
     * Build colliders from the active floor plan, rooms, walls, doors, and furniture
     */
    buildFromScene(roomGraph, furnitureMeshes = [], activeFloor = 'ground') {
      this.clearColliders();
      const plot = roomGraph.plot;
      this.setPlotBounds(plot.width, plot.length);

      const EPS = 0.05;
      const wallH = 9.0;
      const wallT = 0.58;
      const partT = 0.36;

      // 1. Plot Perimeter Fences / Hedges
      const pw = plot.width / 2 + 6.0;
      const pl = plot.length / 2 + 6.0;
      this.addBoxCollider(-pw - 1.0, -pw, -pl, pl, 0, 10, 'fence'); // West fence
      this.addBoxCollider(pw, pw + 1.0, -pl, pl, 0, 10, 'fence');   // East fence
      this.addBoxCollider(-pw, pw, -pl - 1.0, -pl, 0, 10, 'fence'); // North fence
      this.addBoxCollider(-pw, pw, pl, pl + 1.0, 0, 10, 'fence');   // South fence

      // 2. Room Walls with Openings Subtracted
      const rooms = roomGraph.rooms;
      rooms.forEach(room => {
        const floor = room.floor || 'ground';
        const floorY = floor === 'first' ? 10.25 : 0.45;
        const cx = (room.x + room.w / 2) - plot.width / 2;
        const cz = plot.length / 2 - (room.y + room.h / 2);

        const rMinX = room.x - plot.width / 2;
        const rMaxX = (room.x + room.w) - plot.width / 2;
        const rMinZ = plot.length / 2 - (room.y + room.h);
        const rMaxZ = plot.length / 2 - room.y;

        // Collect openings on each wall
        const walls = {
          north: { p1: { x: rMinX, z: rMinZ }, p2: { x: rMaxX, z: rMinZ }, openings: [], thick: partT },
          south: { p1: { x: rMinX, z: rMaxZ }, p2: { x: rMaxX, z: rMaxZ }, openings: [], thick: partT },
          west:  { p1: { x: rMinX, z: rMinZ }, p2: { x: rMinX, z: rMaxZ }, openings: [], thick: partT },
          east:  { p1: { x: rMaxX, z: rMinZ }, p2: { x: rMaxX, z: rMaxZ }, openings: [], thick: partT }
        };

        // Populate doors & windows
        (room.doors || []).forEach((d, dIdx) => {
          const wName = d.wall;
          if (!walls[wName]) return;
          const doorId = `${room.id}_d_${wName}_${dIdx}`;
          const doorRecord = roomGraph.doors.get(doorId);
          const isClosed = doorRecord ? !doorRecord.isOpen : true;

          walls[wName].openings.push({
            start: d.offset,
            width: d.width || 3.2,
            type: 'door',
            isClosed: isClosed,
            doorId: doorId
          });
        });

        (room.windows || []).forEach(w => {
          const wName = w.wall;
          if (!walls[wName]) return;
          // Windows always block physical player movement
          walls[wName].openings.push({
            start: w.offset,
            width: w.width || 4.0,
            type: 'window',
            isClosed: true
          });
        });

        // Generate wall segments between openings
        ['north', 'south'].forEach(side => {
          const wInfo = walls[side];
          const z = wInfo.p1.z;
          const sorted = wInfo.openings.slice().sort((a, b) => a.start - b.start);
          let curr = 0;

          sorted.forEach(op => {
            if (op.start > curr + 0.1) {
              // Solid wall segment
              const x1 = rMinX + curr;
              const x2 = rMinX + op.start;
              this.addBoxCollider(x1, x2, z - wInfo.thick / 2, z + wInfo.thick / 2, floorY, floorY + wallH, 'wall');
            }

            // If door is closed or it's a window, add obstacle collider for the opening
            if (op.isClosed) {
              const x1 = rMinX + op.start;
              const x2 = rMinX + op.start + op.width;
              this.addBoxCollider(x1, x2, z - 0.2, z + 0.2, floorY, floorY + wallH, op.type === 'door' ? 'door' : 'window', op.doorId);
            }

            curr = op.start + op.width;
          });

          if (curr < room.w - 0.1) {
            this.addBoxCollider(rMinX + curr, rMaxX, z - wInfo.thick / 2, z + wInfo.thick / 2, floorY, floorY + wallH, 'wall');
          }
        });

        ['west', 'east'].forEach(side => {
          const wInfo = walls[side];
          const x = wInfo.p1.x;
          const sorted = wInfo.openings.slice().sort((a, b) => a.start - b.start);
          let curr = 0;

          sorted.forEach(op => {
            if (op.start > curr + 0.1) {
              const z1 = rMinZ + curr;
              const z2 = rMinZ + op.start;
              this.addBoxCollider(x - wInfo.thick / 2, x + wInfo.thick / 2, z1, z2, floorY, floorY + wallH, 'wall');
            }

            if (op.isClosed) {
              const z1 = rMinZ + op.start;
              const z2 = rMinZ + op.start + op.width;
              this.addBoxCollider(x - 0.2, x + 0.2, z1, z2, floorY, floorY + wallH, op.type === 'door' ? 'door' : 'window', op.doorId);
            }

            curr = op.start + op.width;
          });

          if (curr < room.h - 0.1) {
            this.addBoxCollider(x - wInfo.thick / 2, x + wInfo.thick / 2, rMinZ + curr, rMaxZ, floorY, floorY + wallH, 'wall');
          }
        });

        // 3. Simplified Furniture Bounding Boxes per Room
        // Add solid furniture colliders for realistic walking navigation
        if (room.type === 'hall' || room.type === 'living') {
          // Living room sofa
          this.addBoxCollider(cx - 3.5, cx + 3.5, cz - 2.5, cz - 0.5, floorY, floorY + 2.8, 'furniture');
          // Coffee table
          this.addBoxCollider(cx - 1.8, cx + 1.8, cz + 0.2, cz + 1.6, floorY, floorY + 1.5, 'furniture');
          // TV unit against wall
          this.addBoxCollider(cx - 3.2, cx + 3.2, rMaxZ - 1.2, rMaxZ - 0.1, floorY, floorY + 2.2, 'furniture');
        } else if (room.type === 'bedroom') {
          // King/Queen bed
          this.addBoxCollider(cx - 3.2, cx + 3.2, cz - 3.5, cz + 2.5, floorY, floorY + 3.0, 'furniture');
          // Wardrobe
          this.addBoxCollider(rMinX + 0.2, rMinX + 2.0, cz - 3.0, cz + 3.0, floorY, floorY + 7.5, 'furniture');
        } else if (room.type === 'dining') {
          // Dining table & chairs
          this.addBoxCollider(cx - 2.6, cx + 2.6, cz - 1.8, cz + 1.8, floorY, floorY + 2.6, 'furniture');
        } else if (room.type === 'kitchen') {
          // Countertop L-shape
          this.addBoxCollider(rMinX + 0.2, rMaxX - 0.2, rMinZ + 0.2, rMinZ + 2.2, floorY, floorY + 3.0, 'furniture');
          this.addBoxCollider(rMaxX - 2.2, rMaxX - 0.2, rMinZ + 0.2, rMaxZ - 0.2, floorY, floorY + 3.0, 'furniture');
        } else if (room.type === 'parking') {
          // Vehicle parked
          this.addBoxCollider(cx - 3.2, cx + 3.2, cz - 7.0, cz + 7.0, floorY, floorY + 4.5, 'vehicle');
        }
      });
    }

    /**
     * Resolve player movement with multiple sub-steps and sliding response
     * @param {Object} currentPos - { x, y, z }
     * @param {Object} deltaMove - { x, y, z }
     * @param {number} subSteps - e.g. 3
     * @returns {Object} newPos - { x, y, z }
     */
    resolveMovement(currentPos, deltaMove, subSteps = 3) {
      let posX = currentPos.x;
      let posY = currentPos.y;
      let posZ = currentPos.z;

      const stepX = deltaMove.x / subSteps;
      const stepY = deltaMove.y / subSteps;
      const stepZ = deltaMove.z / subSteps;

      for (let s = 0; s < subSteps; s++) {
        // Tentative move
        let nextX = posX + stepX;
        let nextY = posY + stepY;
        let nextZ = posZ + stepZ;

        // Apply plot boundary clamp
        if (this.plotBounds) {
          nextX = Math.max(this.plotBounds.minX, Math.min(this.plotBounds.maxX, nextX));
          nextZ = Math.max(this.plotBounds.minZ, Math.min(this.plotBounds.maxZ, nextZ));
        }

        // Test collisions against all colliders
        for (const col of this.colliders) {
          // Check Y overlap
          if (nextY + this.height < col.minY || nextY > col.maxY) continue;

          // Closest point on AABB to player center
          const closestX = Math.max(col.minX, Math.min(col.maxX, nextX));
          const closestZ = Math.max(col.minZ, Math.min(col.maxZ, nextZ));

          const diffX = nextX - closestX;
          const diffZ = nextZ - closestZ;
          const distSq = diffX * diffX + diffZ * diffZ;

          const rad = this.radius;
          if (distSq < rad * rad) {
            // Collision detected! Slide response: push out along normal
            const dist = Math.sqrt(distSq);
            if (dist > 0.0001) {
              const normalX = diffX / dist;
              const normalZ = diffZ / dist;
              const penetration = rad - dist;

              nextX += normalX * penetration;
              nextZ += normalZ * penetration;
            } else {
              // Inside collider volume: push back toward incoming side
              if (posX >= col.maxX - 0.01) {
                nextX = col.maxX + rad;
              } else if (posX <= col.minX + 0.01) {
                nextX = col.minX - rad;
              } else if (posZ >= col.maxZ - 0.01) {
                nextZ = col.maxZ + rad;
              } else if (posZ <= col.minZ + 0.01) {
                nextZ = col.minZ - rad;
              } else {
                const overlapLeft = Math.abs(nextX - col.minX);
                const overlapRight = Math.abs(col.maxX - nextX);
                const overlapTop = Math.abs(nextZ - col.minZ);
                const overlapBottom = Math.abs(col.maxZ - nextZ);

                const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
                if (minOverlap === overlapLeft) nextX = col.minX - rad;
                else if (minOverlap === overlapRight) nextX = col.maxX + rad;
                else if (minOverlap === overlapTop) nextZ = col.minZ - rad;
                else nextZ = col.maxZ + rad;
              }
            }
          }
        }

        posX = nextX;
        posY = nextY;
        posZ = nextZ;
      }

      return { x: posX, y: posY, z: posZ };
    }

    /**
     * Update door collider open/closed state
     */
    setDoorState(doorId, isOpen) {
      this.colliders = this.colliders.filter(c => !(c.type === 'door' && c.id === doorId));
    }
  }

  return {
    CollisionSystem
  };
}));
