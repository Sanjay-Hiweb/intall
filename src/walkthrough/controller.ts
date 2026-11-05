/**
 * Walkthrough Master Controller Types
 */

import { RoomGraph, RoomNode } from './graph';
import { CollisionSystem } from './collision';
import { StairsController } from './stairs';
import { AutoWalkController } from './autowalk';
import { GuidedTourController } from './tour';
import { SettingsManager } from './settings';
import { WalkthroughMinimap } from './minimap';

export interface WalkthroughControllerOptions {
  scene?: any;
  camera?: any;
  renderer?: any;
  orbitControls?: any;
  container?: HTMLElement;
}

export interface KeyInputMap {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  climbUp: boolean;
  climbDown: boolean;
}

export interface DoorAnimation {
  door: any;
  startAngle: number;
  targetAngle: number;
  startTime: number;
  duration: number;
}

export declare class WalkthroughController {
  scene: any;
  camera: any;
  renderer: any;
  orbitControls: any;
  container: HTMLElement;

  settings: SettingsManager;
  collision: CollisionSystem;
  stairs: StairsController;
  autowalk: AutoWalkController;
  tour: GuidedTourController | null;
  graph: RoomGraph | null;
  hud: any;
  minimap: WalkthroughMinimap | null;

  isActive: boolean;
  isPointerLocked: boolean;
  currentFloor: 'ground' | 'first';
  currentRoom: RoomNode | null;
  lastRoomId: string | null;
  playerPos: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  yaw: number;
  pitch: number;

  constructor(options?: WalkthroughControllerOptions);
  initOverlays(container?: HTMLElement): void;
  enter(rooms: any[], plot: any, facing?: string): void;
  exit(): void;
  navigateToRoom(targetRoomId: string): void;
  toggleTour(): void;
  toggleMinimap(): void;
  toggleHelp(): void;
  toggleDayNight(): void;
  updateLoop(now: number): void;
}
