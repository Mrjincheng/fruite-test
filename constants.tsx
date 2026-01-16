
import { WeaponType } from './types';

export const DATA_NODES = [
  { emoji: '💎', color: '#00f2ff' }, // Core
  { emoji: '💿', color: '#ff00ff' }, // Buffer
  { emoji: '🔋', color: '#00ff41' }, // Cache
  { emoji: '📡', color: '#ffea00' }, // Signal
];

export const RESET_INTERVAL_MS = 30 * 60 * 1000;

// Added missing game constants for GameCanvas
export const FRUITS = [
  { emoji: '💎', color: '#00f2ff' },
  { emoji: '💿', color: '#ff00ff' },
  { emoji: '🔋', color: '#00ff41' },
  { emoji: '📡', color: '#ffea00' },
];

export const BOMBS = { emoji: '💀', color: '#ff0000' };

export const GRAVITY = 0.25;

export const WEAPON_CONFIGS = {
  [WeaponType.KATANA]: {
    cooldown: 50,
    trailColor: '#00f2ff',
  },
  [WeaponType.CANNON]: {
    cooldown: 800,
    trailColor: '#ff0000',
  },
  [WeaponType.BOW]: {
    cooldown: 300,
    trailColor: '#38bdf8',
  },
};
