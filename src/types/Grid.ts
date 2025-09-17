/**
 * Grid world data structures and interfaces
 */

import { Position, GridDimensions, CellType, CellProperties, Item } from './Common';

export interface Cell {
  type: CellType;
  occupant?: string; // Agent ID
  properties?: CellProperties;
}

export interface WorldState {
  grid: Cell[][];
  agents: Map<string, AgentState>;
  dimensions: GridDimensions;
  tick: number;
}

export interface AgentState {
  id: string;
  position: Position;
  health: number;
  energy: number;
  inventory?: Item[];
  customState?: any;
}

export interface WorldRules {
  allowDiagonalMovement: boolean;
  maxAgentsPerCell: number;
  energyConsumptionPerMove: number;
  collisionBehavior: 'block' | 'push' | 'overlap';
  communicationRange: number;
}

// Grid validation utilities
export class GridValidator {
  static isValidPosition(position: Position, dimensions: GridDimensions): boolean {
    return position.x >= 0 && 
           position.x < dimensions.width && 
           position.y >= 0 && 
           position.y < dimensions.height;
  }

  static isValidDimensions(dimensions: GridDimensions): boolean {
    return dimensions.width > 0 && 
           dimensions.height > 0 && 
           dimensions.width <= 1000 && 
           dimensions.height <= 1000;
  }

  static validateWorldState(worldState: WorldState): string[] {
    const errors: string[] = [];
    
    if (!this.isValidDimensions(worldState.dimensions)) {
      errors.push('Invalid grid dimensions');
    }
    
    if (worldState.grid.length !== worldState.dimensions.height) {
      errors.push('Grid height does not match dimensions');
    }
    
    if (worldState.grid[0]?.length !== worldState.dimensions.width) {
      errors.push('Grid width does not match dimensions');
    }
    
    if (worldState.tick < 0) {
      errors.push('Tick count cannot be negative');
    }
    
    return errors;
  }
}