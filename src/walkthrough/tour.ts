import { RoomNode } from './graph';
import { AutoWalkController } from './autowalk';

export declare class GuidedTourController {
  graph: any;
  autowalk: AutoWalkController;
  holdDuration: number;
  stops: RoomNode[];
  currentStopIndex: number;
  isActive: boolean;
  isPaused: boolean;
  state: 'idle' | 'walking' | 'holding' | 'paused';
  timer: number;
  onStopChanged: ((stopNode: RoomNode, index: number, total: number) => void) | null;
  onTourFinished: (() => void) | null;

  constructor(roomGraph: any, autowalk: AutoWalkController, options?: { holdDuration?: number });
  buildTourSequence(): RoomNode[];
  start(): boolean;
  stop(): void;
  pause(): void;
  resume(): void;
  togglePause(): void;
  next(): void;
  previous(): void;
  moveToCurrentStop(): void;
  onArrivedAtStop(): void;
  update(delta?: number): void;
}
