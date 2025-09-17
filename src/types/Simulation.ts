/**
 * Simulation state and configuration types
 */

import { GridDimensions, AccessibilityOptions } from './Common';
import { WorldState, WorldRules } from './Grid';
import { Agent } from './Agent';

export interface SimulationConfig {
  gridSize: GridDimensions;
  tickRate: number;
  maxAgents: number;
  worldRules: WorldRules;
}

export interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  currentTick: number;
  worldState: WorldState;
  agents: Agent[];
  config: SimulationConfig;
  startTime?: Date;
  endTime?: Date;
}

export enum SimulationStatus {
  Stopped = 'stopped',
  Running = 'running',
  Paused = 'paused',
  Error = 'error'
}

export interface SimulationMetrics {
  totalTicks: number;
  averageTickTime: number;
  agentCount: number;
  collisions: number;
  messages: number;
}

export interface PreferencesState {
  accessibility: AccessibilityOptions;
  simulation: {
    defaultGridSize: GridDimensions;
    defaultTickRate: number;
    autoSave: boolean;
  };
  ui: {
    showGrid: boolean;
    showAgentPaths: boolean;
    showMetrics: boolean;
  };
}

// Simulation validation utilities
export class SimulationValidator {
  static validateSimulationConfig(config: SimulationConfig): string[] {
    const errors: string[] = [];
    
    if (!config.gridSize || config.gridSize.width <= 0 || config.gridSize.height <= 0) {
      errors.push('Valid grid size is required');
    }
    
    if (config.gridSize.width > 1000 || config.gridSize.height > 1000) {
      errors.push('Grid size cannot exceed 1000x1000');
    }
    
    if (config.tickRate <= 0) {
      errors.push('Tick rate must be positive');
    }
    
    if (config.tickRate > 1000) {
      errors.push('Tick rate cannot exceed 1000 ticks per second');
    }
    
    if (config.maxAgents <= 0) {
      errors.push('Max agents must be positive');
    }
    
    if (config.maxAgents > config.gridSize.width * config.gridSize.height) {
      errors.push('Max agents cannot exceed grid capacity');
    }
    
    if (!config.worldRules) {
      errors.push('World rules are required');
    }
    
    return errors;
  }
  
  static validateSimulationState(state: SimulationState): string[] {
    const errors: string[] = [];
    
    if (state.currentTick < 0) {
      errors.push('Current tick cannot be negative');
    }
    
    if (!state.worldState) {
      errors.push('World state is required');
    }
    
    if (!state.config) {
      errors.push('Simulation config is required');
    }
    
    if (state.agents.length > state.config.maxAgents) {
      errors.push('Agent count exceeds maximum allowed');
    }
    
    return errors;
  }
}