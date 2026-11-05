/**
 * Walkthrough HUD Module Index
 */

export interface WalkthroughHUDOptions {
  graph?: any;
  unit?: 'ft' | 'm';
}

export declare class WalkthroughHUDManager {
  container: HTMLElement;
  unit: 'ft' | 'm';
  visible: boolean;
  constructor(container: HTMLElement, options?: WalkthroughHUDOptions);
  show(): void;
  hide(): void;
  toggleVisibility(): void;
  updateCurrentRoom(floor: string, roomName: string): void;
  showRoomBanner(room: any): void;
  showDoorPrompt(show: boolean, label?: string): void;
  showToast(message: string, duration?: number): void;
  toggleRoomDrawer(force?: boolean): void;
  refreshRoomList(): void;
  toggleSettings(force?: boolean): void;
  showHelpCard(show: boolean): void;
  updateTourStatus(isActive: boolean, currentStopIndex: number, totalStops: number, stopName: string, isPaused: boolean): void;
  fadeTransition(durationMs?: number): Promise<void>;
  destroy(): void;
}
