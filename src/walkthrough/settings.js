/**
 * Walkthrough Settings & User Preferences Manager
 * Persists mouse sensitivity, invert-Y, FOV, instant jump, and tour timing to localStorage.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.WalkthroughSettings = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const STORAGE_KEY = 'intall_walkthrough_settings';

  const DEFAULT_SETTINGS = {
    mouseSensitivity: 0.0022,
    invertY: false,
    fov: 70,
    jumpInstantly: false,
    tourHoldDuration: 4.0,
    showMinimap: true,
    showHelpOnStart: true
  };

  class SettingsManager {
    constructor() {
      this.settings = Object.assign({}, DEFAULT_SETTINGS);
      this.load();
    }

    load() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          this.settings = Object.assign({}, DEFAULT_SETTINGS, parsed);
        }
      } catch (e) {
        console.warn('[WalkthroughSettings] Could not read localStorage:', e.message);
      }
    }

    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
      } catch (e) {
        console.warn('[WalkthroughSettings] Could not save to localStorage:', e.message);
      }
    }

    get(key) {
      return this.settings[key];
    }

    set(key, value) {
      this.settings[key] = value;
      this.save();
    }
  }

  return {
    SettingsManager,
    DEFAULT_SETTINGS
  };
}));
