/**
 * Common types and enums used across the application
 */

export interface Position {
  x: number;
  y: number;
}

export interface GridDimensions {
  width: number;
  height: number;
}

export enum Direction {
  North = 'north',
  South = 'south',
  East = 'east',
  West = 'west',
  Northeast = 'northeast',
  Northwest = 'northwest',
  Southeast = 'southeast',
  Southwest = 'southwest'
}

export enum CellType {
  Empty = 'empty',
  Wall = 'wall',
  Goal = 'goal',
  Hazard = 'hazard',
  Resource = 'resource'
}

export interface CellProperties {
  traversable: boolean;
  cost: number;
  metadata?: Record<string, any>;
}

export interface Item {
  id: string;
  name: string;
  type: string;
  properties?: Record<string, any>;
}

export enum AgentType {
  Predefined = 'predefined',
  WASM = 'wasm',
  RustCompiled = 'rust-compiled'
}

export enum ThemeType {
  Light = 'light',
  Dark = 'dark',
  HighContrast = 'high-contrast'
}

export interface AccessibilityOptions {
  theme: ThemeType;
  fontSize: 'small' | 'medium' | 'large';
  reducedMotion: boolean;
  screenReaderOptimized: boolean;
}