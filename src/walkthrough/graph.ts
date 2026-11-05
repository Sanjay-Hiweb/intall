export interface RoomNode {
  id: string;
  name: string;
  type: string;
  floor: 'ground' | 'first';
  elevation: number;
  center: { x: number; y: number; z: number };
  floorY: number;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number; floorY: number; ceilY: number };
  width: number;
  length: number;
  areaSqft: number;
  notes?: string;
  focalLookAt: { x: number; y: number; z: number };
  neighbors: Array<{ roomId: string; edge: DoorEdge }>;
  isReachable: boolean;
}

export interface DoorEdge {
  id: string;
  fromRoomId: string;
  toRoomId: string;
  doorId: string | null;
  doorCenter: { x: number; y: number; z: number };
  waypoints: Array<{ x: number; y: number; z: number }>;
  cost: number;
  isStairs: boolean;
  isOpenPlan?: boolean;
  direction?: 'up' | 'down';
}

export interface DoorRecord {
  id: string;
  roomId: string;
  targetRoomId: string | null;
  center: { x: number; y: number; z: number };
  width: number;
  wall: string;
  isOpen: boolean;
  isEntrance: boolean;
  swingAngle: number;
  floor: string;
}

export interface ShortestPathResult {
  roomIds: string[];
  edges: DoorEdge[];
  waypoints: Array<{ x: number; y: number; z: number }>;
  targetFocalPoint: { x: number; y: number; z: number };
}

export declare class RoomGraph {
  rooms: any[];
  plot: { width: number; length: number; unit?: string };
  facing: string;
  nodes: Map<string, RoomNode>;
  edges: DoorEdge[];
  doors: Map<string, DoorRecord>;
  entranceNode: RoomNode | null;
  mainDoor: DoorRecord | null;

  constructor(rooms: any[], plot: any, facing?: string);
  buildGraph(): void;
  evaluateReachability(): void;
  findShortestPath(startRoomId: string, targetRoomId: string): ShortestPathResult | null;
  getRoomAtPoint(x: number, z: number, floor?: string, previousRoomId?: string | null, hysteresis?: number): RoomNode | null;
}

export declare function getOrBuildGraph(rooms: any[], plot: any, facing: string): RoomGraph;
