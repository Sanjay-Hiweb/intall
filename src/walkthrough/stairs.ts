export interface StairZone {
  id: string;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  center: { x: number; y: number; z: number };
  bottomY: number;
  topY: number;
  isHoriz: boolean;
  startZone: { minX: number; maxX: number; minZ: number; maxZ: number };
  endZone: { minX: number; maxX: number; minZ: number; maxZ: number };
}

export declare class StairsController {
  stairs: StairZone[];
  activeStair: StairZone | null;
  currentLevel: 'ground' | 'first';
  targetY: number;
  currentY: number;
  isTransitioningLevel: boolean;
  stepRiser: number;
  totalSteps: number;
  onLevelChange: ((newLevel: string) => void) | null;

  constructor();
  registerFromGraph(roomGraph: any): void;
  update(pos: { x: number; y: number; z: number }, delta?: number): {
    elevationY: number;
    cameraDip: number;
    currentLevel: string;
    isOnStair: boolean;
  };
  manualStep(direction: 'up' | 'down', playerPos: { x: number; y: number; z: number }): number | null;
}
