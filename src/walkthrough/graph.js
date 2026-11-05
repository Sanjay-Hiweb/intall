/**
 * Room-to-Room Walkthrough Navigation Graph
 * Builds a topological graph of rooms, doorways, stairs, and waypoints.
 * Conforms to TRD and Room-to-Room Walkthrough specification.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.WalkthroughGraph = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  let cachedGraph = null;
  let cachedVersionKey = null;

  class RoomGraph {
    constructor(rooms, plot, facing = 'S') {
      this.rooms = rooms || [];
      this.plot = plot || { width: 35, length: 45, unit: 'ft' };
      this.facing = facing || 'S';
      this.nodes = new Map(); // roomId -> RoomNode
      this.edges = [];        // Array of DoorEdge
      this.doors = new Map(); // doorId -> DoorData
      this.entranceNode = null;
      this.mainDoor = null;

      this.buildGraph();
    }

    buildGraph() {
      const plotW = this.plot.width;
      const plotL = this.plot.length;

      // 1. Build Nodes
      this.rooms.forEach(room => {
        const floor = room.floor || 'ground';
        const floorY = floor === 'first' ? 10.25 : 0.45;
        const cx = (room.x + room.w / 2) - plotW / 2;
        const cz = plotL / 2 - (room.y + room.h / 2);

        const minX = room.x - plotW / 2;
        const maxX = (room.x + room.w) - plotW / 2;
        const minZ = plotL / 2 - (room.y + room.h);
        const maxZ = plotL / 2 - room.y;

        // Longest sightline / focal furniture direction
        let focalLookAt = { x: cx, y: floorY + 5.25, z: cz };
        if (room.type === 'hall' || room.type === 'living') {
          focalLookAt = { x: cx + (room.w * 0.2), y: floorY + 4.5, z: cz - (room.h * 0.25) };
        } else if (room.type === 'bedroom') {
          focalLookAt = { x: cx, y: floorY + 4.5, z: cz - (room.h * 0.3) };
        } else if (room.type === 'kitchen') {
          focalLookAt = { x: maxX - 2.0, y: floorY + 4.5, z: cz };
        }

        const node = {
          id: room.id,
          name: room.name || (room.type ? room.type.toUpperCase() : 'Room'),
          type: room.type || 'room',
          floor: floor,
          elevation: floorY,
          center: { x: cx, y: floorY + 5.25, z: cz }, // Eye height (1.6m = ~5.25 ft)
          floorY: floorY,
          bounds: { minX, maxX, minZ, maxZ, floorY, ceilY: floorY + 9.0 },
          width: room.w,
          length: room.h,
          areaSqft: Math.round(room.w * room.h),
          notes: room.notes || '',
          focalLookAt: focalLookAt,
          neighbors: [], // [{ roomId, edge }]
          isReachable: false
        };

        this.nodes.set(room.id, node);
      });

      // 2. Build Door Edges & Waypoints
      const EPS = 0.35;
      const WAYPOINT_OFFSET = 2.0; // 0.6m in feet (~2.0 ft)

      this.rooms.forEach(roomA => {
        const nodeA = this.nodes.get(roomA.id);
        const doorsA = roomA.doors || [];

        doorsA.forEach((door, doorIdx) => {
          const doorWidth = door.width || 3.2;
          const doorId = `${roomA.id}_d_${door.wall}_${doorIdx}`;
          let doorX, doorZ, normalX = 0, normalZ = 0;

          // Compute Door Center in 3D world space
          if (door.wall === 'north') {
            doorX = (roomA.x + door.offset + doorWidth / 2) - plotW / 2;
            doorZ = plotL / 2 - (roomA.y + roomA.h);
            normalZ = -1; // Points North into next room
          } else if (door.wall === 'south') {
            doorX = (roomA.x + door.offset + doorWidth / 2) - plotW / 2;
            doorZ = plotL / 2 - roomA.y;
            normalZ = 1; // Points South
          } else if (door.wall === 'west') {
            doorX = roomA.x - plotW / 2;
            doorZ = plotL / 2 - (roomA.y + door.offset + doorWidth / 2);
            normalX = -1; // Points West
          } else if (door.wall === 'east') {
            doorX = (roomA.x + roomA.w) - plotW / 2;
            doorZ = plotL / 2 - (roomA.y + door.offset + doorWidth / 2);
            normalX = 1; // Points East
          }

          const floorY = nodeA.floorY;
          const doorCenter = { x: doorX, y: floorY, z: doorZ };

          // Find adjacent room B on the other side of this wall
          let targetRoom = null;
          this.rooms.forEach(roomB => {
            if (roomB.id === roomA.id || (roomB.floor || 'ground') !== nodeA.floor) return;

            // Check if door center point lies within room B's perimeter
            const bMinX = roomB.x - plotW / 2 - EPS;
            const bMaxX = (roomB.x + roomB.w) - plotW / 2 + EPS;
            const bMinZ = plotL / 2 - (roomB.y + roomB.h) - EPS;
            const bMaxZ = plotL / 2 - roomB.y + EPS;

            const testPtX = doorX + normalX * 0.8;
            const testPtZ = doorZ + normalZ * 0.8;

            if (testPtX >= bMinX && testPtX <= bMaxX && testPtZ >= bMinZ && testPtZ <= bMaxZ) {
              targetRoom = roomB;
            }
          });

          // Check if this door is flagged or positioned as Main Entrance
          const isRoadSide = (this.facing === 'S' && door.wall === 'south') ||
                             (this.facing === 'N' && door.wall === 'north') ||
                             (this.facing === 'E' && door.wall === 'east') ||
                             (this.facing === 'W' && door.wall === 'west');

          const isEntrance = !!(door.isEntrance || (!targetRoom && isRoadSide && (roomA.type === 'hall' || roomA.type === 'living' || roomA.type === 'parking' || roomA.type === 'passage')));

          const doorRecord = {
            id: doorId,
            roomId: roomA.id,
            targetRoomId: targetRoom ? targetRoom.id : null,
            center: doorCenter,
            x: doorCenter.x,
            y: doorCenter.y,
            z: doorCenter.z,
            width: doorWidth,
            wall: door.wall,
            isOpen: false,
            isEntrance: isEntrance,
            swingAngle: 0,
            floor: nodeA.floor
          };
          this.doors.set(doorId, doorRecord);

          if (isEntrance && !this.mainDoor) {
            this.mainDoor = doorRecord;
            this.entranceNode = nodeA;
          }

          // If connects two rooms, create bidirectional edge
          if (targetRoom) {
            const nodeB = this.nodes.get(targetRoom.id);

            // Waypoints: inside A, at door, inside B
            const wpA = { x: doorX - normalX * WAYPOINT_OFFSET, y: floorY, z: doorZ - normalZ * WAYPOINT_OFFSET };
            const wpDoor = { x: doorX, y: floorY, z: doorZ };
            const wpB = { x: doorX + normalX * WAYPOINT_OFFSET, y: floorY, z: doorZ + normalZ * WAYPOINT_OFFSET };

            const dist = Math.hypot(nodeA.center.x - nodeB.center.x, nodeA.center.z - nodeB.center.z);

            const edgeAB = {
              id: `${roomA.id}->${targetRoom.id}`,
              fromRoomId: roomA.id,
              toRoomId: targetRoom.id,
              doorId: doorId,
              doorCenter: wpDoor,
              waypoints: [wpA, wpDoor, wpB],
              cost: dist,
              isStairs: false
            };

            const edgeBA = {
              id: `${targetRoom.id}->${roomA.id}`,
              fromRoomId: targetRoom.id,
              toRoomId: roomA.id,
              doorId: doorId,
              doorCenter: wpDoor,
              waypoints: [wpB, wpDoor, wpA],
              cost: dist,
              isStairs: false
            };

            this.edges.push(edgeAB, edgeBA);
            nodeA.neighbors.push({ roomId: targetRoom.id, edge: edgeAB });
            nodeB.neighbors.push({ roomId: roomA.id, edge: edgeBA });
          }
        });
      });

      // 3. Open-Plan Spaces (e.g. Living + Dining without full wall)
      this.rooms.forEach(roomA => {
        const nodeA = this.nodes.get(roomA.id);
        if (roomA.type !== 'hall' && roomA.type !== 'dining') return;

        this.rooms.forEach(roomB => {
          if (roomB.id === roomA.id || (roomB.floor || 'ground') !== nodeA.floor) return;
          if (roomB.type !== 'hall' && roomB.type !== 'dining') return;

          // Check if already connected by a door
          if (nodeA.neighbors.some(n => n.roomId === roomB.id)) return;

          // Check shared boundary
          const shareX = Math.max(0, Math.min(roomA.x + roomA.w, roomB.x + roomB.w) - Math.max(roomA.x, roomB.x));
          const shareY = Math.max(0, Math.min(roomA.y + roomA.h, roomB.y + roomB.h) - Math.max(roomA.y, roomB.y));

          if (shareX >= 5.0 || shareY >= 5.0) {
            // Generous shared opening
            const nodeB = this.nodes.get(roomB.id);
            const midX = (nodeA.center.x + nodeB.center.x) / 2;
            const midZ = (nodeA.center.z + nodeB.center.z) / 2;
            const midPt = { x: midX, y: nodeA.floorY, z: midZ };

            const edge = {
              id: `open_${roomA.id}_${roomB.id}`,
              fromRoomId: roomA.id,
              toRoomId: roomB.id,
              doorId: null,
              doorCenter: midPt,
              waypoints: [nodeA.center, midPt, nodeB.center],
              cost: Math.hypot(nodeA.center.x - nodeB.center.x, nodeA.center.z - nodeB.center.z),
              isStairs: false,
              isOpenPlan: true
            };
            this.edges.push(edge);
            nodeA.neighbors.push({ roomId: roomB.id, edge });
          }
        });
      });

      // 4. Stair Connections between Levels
      const groundStair = this.rooms.find(r => r.type === 'stairs' && (r.floor || 'ground') === 'ground');
      const firstStair = this.rooms.find(r => r.type === 'stairs' && r.floor === 'first');

      if (groundStair && firstStair) {
        const nodeG = this.nodes.get(groundStair.id);
        const nodeF = this.nodes.get(firstStair.id);

        const edgeUp = {
          id: `stair_${groundStair.id}_up`,
          fromRoomId: groundStair.id,
          toRoomId: firstStair.id,
          doorId: null,
          doorCenter: nodeG.center,
          waypoints: [nodeG.center, { x: nodeG.center.x, y: 5.5, z: nodeG.center.z }, nodeF.center],
          cost: 15.0,
          isStairs: true,
          direction: 'up'
        };

        const edgeDown = {
          id: `stair_${firstStair.id}_down`,
          fromRoomId: firstStair.id,
          toRoomId: groundStair.id,
          doorId: null,
          doorCenter: nodeF.center,
          waypoints: [nodeF.center, { x: nodeF.center.x, y: 5.5, z: nodeF.center.z }, nodeG.center],
          cost: 15.0,
          isStairs: true,
          direction: 'down'
        };

        this.edges.push(edgeUp, edgeDown);
        nodeG.neighbors.push({ roomId: firstStair.id, edge: edgeUp });
        nodeF.neighbors.push({ roomId: groundStair.id, edge: edgeDown });
      }

      // 5. Fallback Entrance Selection if none flagged
      if (!this.entranceNode) {
        // Look for Living/Hall or closest room to Road side
        const groundNodes = Array.from(this.nodes.values()).filter(n => n.floor === 'ground');
        const hallNode = groundNodes.find(n => n.type === 'hall' || n.type === 'living');
        this.entranceNode = hallNode || groundNodes[0] || null;

        if (this.entranceNode && !this.mainDoor) {
          // Virtual entrance point just inside front edge
          this.mainDoor = {
            id: 'virtual_main_door',
            roomId: this.entranceNode.id,
            center: {
              x: this.entranceNode.center.x,
              y: this.entranceNode.floorY,
              z: this.entranceNode.bounds.maxZ - 1.5
            },
            x: this.entranceNode.center.x,
            y: this.entranceNode.floorY,
            z: this.entranceNode.bounds.maxZ - 1.5,
            width: 3.5,
            wall: 'south',
            isOpen: true,
            isEntrance: true,
            isVirtual: true
          };
        }
      }

      // 6. Reachability Analysis (BFS from Entrance)
      this.evaluateReachability();
    }

    getEntranceSpawn() {
      if (this.mainDoor) {
        const targetNode = this.entranceNode;
        let yaw = 0;
        if (targetNode) {
          const dx = targetNode.center.x - this.mainDoor.center.x;
          const dz = targetNode.center.z - this.mainDoor.center.z;
          yaw = Math.atan2(-dx, -dz);
        }
        return {
          x: this.mainDoor.center.x,
          y: this.mainDoor.center.y !== undefined ? this.mainDoor.center.y : (targetNode ? targetNode.floorY : 0.45),
          z: this.mainDoor.center.z,
          yaw: yaw
        };
      }
      if (this.entranceNode) {
        return {
          x: this.entranceNode.center.x,
          y: this.entranceNode.floorY,
          z: this.entranceNode.bounds.maxZ - 1.5,
          yaw: 0
        };
      }
      return { x: 0, y: 0.45, z: 0, yaw: 0 };
    }

    evaluateReachability() {
      if (!this.entranceNode) return;

      const visited = new Set();
      const queue = [this.entranceNode.id];
      visited.add(this.entranceNode.id);

      while (queue.length > 0) {
        const currentId = queue.shift();
        const node = this.nodes.get(currentId);
        if (!node) continue;
        node.isReachable = true;

        for (const neighbor of node.neighbors) {
          if (!visited.has(neighbor.roomId)) {
            visited.add(neighbor.roomId);
            queue.push(neighbor.roomId);
          }
        }
      }

      // Mark unreachable
      this.nodes.forEach(node => {
        if (!visited.has(node.id)) {
          node.isReachable = false;
        }
      });
    }

    // A* / Dijkstra shortest path between two rooms
    findPath(startRoomId, targetRoomId) {
      return this.findShortestPath(startRoomId, targetRoomId);
    }

    findShortestPath(startRoomId, targetRoomId) {
      if (startRoomId === targetRoomId) return [];
      if (!this.nodes.has(startRoomId) || !this.nodes.has(targetRoomId)) return null;

      const dist = new Map();
      const prev = new Map();
      const edgeUsed = new Map();
      const unvisited = new Set(this.nodes.keys());

      this.nodes.forEach((_, id) => dist.set(id, Infinity));
      dist.set(startRoomId, 0);

      while (unvisited.size > 0) {
        // Find smallest dist in unvisited
        let u = null;
        let minDist = Infinity;
        for (const id of unvisited) {
          if (dist.get(id) < minDist) {
            minDist = dist.get(id);
            u = id;
          }
        }

        if (u === null || minDist === Infinity) break;
        if (u === targetRoomId) break;

        unvisited.delete(u);
        const uNode = this.nodes.get(u);

        for (const { roomId, edge } of uNode.neighbors) {
          if (!unvisited.has(roomId)) continue;
          const alt = dist.get(u) + edge.cost;
          if (alt < dist.get(roomId)) {
            dist.set(roomId, alt);
            prev.set(roomId, u);
            edgeUsed.set(roomId, edge);
          }
        }
      }

      if (!prev.has(targetRoomId)) return null; // No path

      // Reconstruct path of waypoints
      const pathNodes = [];
      const pathEdges = [];
      let curr = targetRoomId;
      while (curr !== startRoomId) {
        pathNodes.unshift(curr);
        pathEdges.unshift(edgeUsed.get(curr));
        curr = prev.get(curr);
      }
      pathNodes.unshift(startRoomId);

      // Assemble continuous waypoint list
      const fullWaypoints = [];
      const startNode = this.nodes.get(startRoomId);
      fullWaypoints.push(startNode.center);

      for (const edge of pathEdges) {
        for (const wp of edge.waypoints) {
          const last = fullWaypoints[fullWaypoints.length - 1];
          // Skip redundant close points
          if (Math.hypot(wp.x - last.x, wp.z - last.z) > 0.4 || Math.abs(wp.y - last.y) > 0.5) {
            fullWaypoints.push(wp);
          }
        }
      }

      const endNode = this.nodes.get(targetRoomId);
      fullWaypoints.push(endNode.center);

      return {
        roomIds: pathNodes,
        edges: pathEdges,
        waypoints: fullWaypoints,
        targetFocalPoint: endNode.focalLookAt
      };
    }

    // Determine current room from 3D coordinates (with hysteresis support)
    getRoomAtPoint(x, z, floor = 'ground', previousRoomId = null, hysteresis = 0.8) {
      if (previousRoomId && this.nodes.has(previousRoomId)) {
        const prev = this.nodes.get(previousRoomId);
        if (prev.floor === floor) {
          // Check with hysteresis padding to prevent doorway flickering
          if (x >= prev.bounds.minX - hysteresis && x <= prev.bounds.maxX + hysteresis &&
              z >= prev.bounds.minZ - hysteresis && z <= prev.bounds.maxZ + hysteresis) {
            return prev;
          }
        }
      }

      // Check standard containment
      for (const node of this.nodes.values()) {
        if (node.floor !== floor) continue;
        if (x >= node.bounds.minX && x <= node.bounds.maxX &&
            z >= node.bounds.minZ && z <= node.bounds.maxZ) {
          return node;
        }
      }

      return null;
    }
  }

  function getOrBuildGraph(rooms, plot, facing) {
    const versionKey = `${rooms.length}_${plot.width}_${plot.length}_${plot.unit}_${facing}_${(rooms[0] || {}).id}`;
    if (cachedGraph && cachedVersionKey === versionKey) {
      return cachedGraph;
    }
    cachedGraph = new RoomGraph(rooms, plot, facing);
    cachedVersionKey = versionKey;
    return cachedGraph;
  }

  return {
    RoomGraph,
    getOrBuildGraph
  };
}));
