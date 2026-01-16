
export type ElementType = 'core' | 'buffer' | 'cache' | 'signal' | 'virus' | 'empty';

export interface GridElement {
  id: string;
  type: ElementType;
  level: number;
  isNew?: boolean;
}

export interface GameStats {
  gold: number;
  diamonds: number;
  stamina: number;
  score: number;
  steps: number;
}

export interface ScoreEntry {
  name: string;
  score: number;
  date: number;
}

export interface LeaderboardData {
  entries: ScoreEntry[];
  nextReset: number;
}

// Added missing game object and weapon types for GameCanvas
export enum WeaponType {
  KATANA = 'KATANA',
  CANNON = 'CANNON',
  BOW = 'BOW'
}

export interface GameObject {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  type: 'fruit' | 'bomb';
  color: string;
  emoji: string;
  isSliced: boolean;
  angle: number;
  rotationSpeed: number;
}

export interface JuiceParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export interface CritEffect {
  id: string;
  x: number;
  y: number;
  life: number;
  text: string;
  scale: number;
}
