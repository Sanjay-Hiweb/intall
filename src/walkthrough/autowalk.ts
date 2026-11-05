export interface AutoWalkOptions {
  speed?: number;
  jumpInstantly?: boolean;
  targetRoomId?: string;
  onArrival?: (finalPos: { x: number; y: number; z: number }, focalPoint: { x: number; y: number; z: number } | null) => void;
  onDoorApproached?: (targetWp: { x: number; y: number; z: number }) => void;
}

export declare class AutoWalkController {
  speed: number;
  isWalking: boolean;
  waypoints: Array<{ x: number; y: number; z: number }>;
  currentWpIndex: number;
  targetFocalPoint: { x: number; y: number; z: number } | null;
  targetRoomId: string | null;
  jumpInstantly: boolean;

  constructor(options?: { speed?: number });
  startPath(pathResult: any, options?: AutoWalkOptions): boolean;
  cancel(): boolean;
  update(currentPos: { x: number; y: number; z: number }, delta?: number, lookDirection?: { yaw: number; pitch: number }): {
    position: { x: number; y: number; z: number };
    lookYaw: number;
    isFinished: boolean;
  } | null;
}
