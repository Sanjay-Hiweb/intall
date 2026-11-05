export interface WalkthroughSettingsConfig {
  mouseSensitivity: number;
  invertY: boolean;
  fov: number;
  jumpInstantly: boolean;
  tourHoldDuration: number;
  showMinimap: boolean;
  showHelpOnStart: boolean;
}

export declare class SettingsManager {
  settings: WalkthroughSettingsConfig;
  constructor();
  load(): void;
  save(): void;
  get<K extends keyof WalkthroughSettingsConfig>(key: K): WalkthroughSettingsConfig[K];
  set<K extends keyof WalkthroughSettingsConfig>(key: K, value: WalkthroughSettingsConfig[K]): void;
}

export declare const DEFAULT_SETTINGS: WalkthroughSettingsConfig;
