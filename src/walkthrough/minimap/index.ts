/**
 * Walkthrough Minimap Module Index
 */

export interface MinimapOptions {
  size?: number;
}

export declare class WalkthroughMinimap {
  container: HTMLElement;
  size: number;
  visible: boolean;
  constructor(container: HTMLElement, options?: MinimapOptions);
  setGraph(graph: any): void;
  setLevel(level: 'ground' | 'first'): void;
  updatePlayer(x: number, z: number, yaw: number): void;
  setCurrentRoom(roomId: string): void;
  show(): void;
  hide(): void;
  toggle(): void;
  draw(): void;
  destroy(): void;
}
