export interface BoxCollider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY: number;
  maxY: number;
  type: 'wall' | 'door' | 'window' | 'furniture' | 'vehicle' | 'fence';
  id?: string | null;
}

export interface PlayerCapsule {
  radius: number;
  height: number;
  stepHeight: number;
}

export declare class CollisionSystem {
  radius: number;
  height: number;
  stepHeight: number;
  colliders: BoxCollider[];
  plotBounds: { minX: number; maxX: number; minZ: number; maxZ: number } | null;

  constructor(options?: { radius?: number; height?: number; stepHeight?: number });
  setPlotBounds(width: number, length: number): void;
  clearColliders(): void;
  addBoxCollider(minX: number, maxX: number, minZ: number, maxZ: number, minY?: number, maxY?: number, type?: string, id?: string | null): void;
  buildFromScene(roomGraph: any, furnitureMeshes?: any[], activeFloor?: string): void;
  resolveMovement(currentPos: { x: number; y: number; z: number }, deltaMove: { x: number; y: number; z: number }, subSteps?: number): { x: number; y: number; z: number };
  setDoorState(doorId: string, isOpen: boolean): void;
}
