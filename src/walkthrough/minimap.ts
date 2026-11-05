export declare class MinimapHUD {
  container: HTMLElement;
  size: number;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  graph: any;
  currentLevel: 'ground' | 'first';
  playerPos: { x: number; z: number };
  playerYaw: number;
  currentRoomId: string | null;
  visible: boolean;
  onRoomClick: ((roomId: string) => void) | null;
  domElement: HTMLElement;

  constructor(container: HTMLElement, options?: { size?: number });
  initDOM(): void;
  setGraph(graph: any): void;
  setLevel(level: string): void;
  updatePlayer(pos: { x: number; z: number }, yaw: number, currentRoomId: string | null): void;
  toggle(): boolean;
  canvasToWorld(cx: number, cy: number, w: number, h: number): { x: number; z: number };
  render(): void;
  destroy(): void;
}
