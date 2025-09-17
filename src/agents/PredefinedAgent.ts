/**
 * Predefined agent implementations with different behaviors
 */

import { Agent, AgentAction, AgentConfig } from '../types/Agent';
import { WorldState, AgentState } from '../types/Grid';
import { AgentType, Direction, CellType } from '../types/Common';
import { BaseAgent } from './BaseAgent';

/**
 * Base class for predefined agents
 */
abstract class BasePredefinedAgent extends BaseAgent {
  constructor(id: string, name?: string) {
    super(id, name || 'Predefined Agent', AgentType.Predefined);
  }

  abstract step(worldState: WorldState, agentState: AgentState): AgentAction;
}

/**
 * Random Walker Agent - moves randomly in available directions
 */
export class RandomWalkerAgent extends BasePredefinedAgent {
  constructor(id: string) {
    super(id, 'Random Walker');
  }

  step(worldState: WorldState, agentState: AgentState): AgentAction {
    const availableDirections = this.getAvailableDirections(worldState, agentState);
    
    if (availableDirections.length === 0) {
      return { type: 'wait' };
    }
    
    const randomDirection = availableDirections[Math.floor(Math.random() * availableDirections.length)];
    return { type: 'move', direction: randomDirection };
  }

  private getAvailableDirections(worldState: WorldState, agentState: AgentState): Direction[] {
    const directions: Direction[] = [];
    
    try {
      const { x, y } = agentState.position;
      const { width, height } = worldState.dimensions;

      if (!worldState.grid || !Array.isArray(worldState.grid)) {
        return directions; // Return empty array for invalid grid
      }

      // Check all four cardinal directions
      if (y > 0 && this.canMoveTo(worldState, x, y - 1)) {
        directions.push(Direction.North);
      }
      if (y < height - 1 && this.canMoveTo(worldState, x, y + 1)) {
        directions.push(Direction.South);
      }
      if (x > 0 && this.canMoveTo(worldState, x - 1, y)) {
        directions.push(Direction.West);
      }
      if (x < width - 1 && this.canMoveTo(worldState, x + 1, y)) {
        directions.push(Direction.East);
      }
    } catch (error) {
      // Return empty directions array if there's any error
      console.warn('Error getting available directions:', error);
    }

    return directions;
  }

  private canMoveTo(worldState: WorldState, x: number, y: number): boolean {
    try {
      if (!worldState.grid || !Array.isArray(worldState.grid)) {
        return false;
      }
      
      if (y < 0 || y >= worldState.grid.length) {
        return false;
      }
      
      if (!worldState.grid[y] || !Array.isArray(worldState.grid[y])) {
        return false;
      }
      
      if (x < 0 || x >= worldState.grid[y].length) {
        return false;
      }
      
      const cell = worldState.grid[y][x];
      if (!cell) {
        return false;
      }
      
      return cell.type !== CellType.Wall && !cell.occupant;
    } catch (error) {
      console.warn('Error checking if can move to position:', error);
      return false;
    }
  }
}

/**
 * Goal Seeker Agent - moves toward goal cells using simple pathfinding
 */
export class GoalSeekerAgent extends BasePredefinedAgent {
  constructor(id: string) {
    super(id, 'Goal Seeker');
  }

  step(worldState: WorldState, agentState: AgentState): AgentAction {
    const goalPosition = this.findNearestGoal(worldState, agentState.position);
    
    if (!goalPosition) {
      // No goal found, behave like random walker
      const randomWalker = new RandomWalkerAgent(this.id);
      return randomWalker.step(worldState, agentState);
    }

    const direction = this.getDirectionToward(agentState.position, goalPosition);
    
    if (direction && this.canMoveTo(worldState, agentState.position, direction)) {
      return { type: 'move', direction };
    }

    // Can't move directly toward goal, try alternative directions
    const alternativeDirections = this.getAlternativeDirections(worldState, agentState, goalPosition);
    if (alternativeDirections.length > 0) {
      return { type: 'move', direction: alternativeDirections[0] };
    }

    return { type: 'wait' };
  }

  private findNearestGoal(worldState: WorldState, position: { x: number; y: number }): { x: number; y: number } | null {
    let nearestGoal: { x: number; y: number } | null = null;
    let minDistance = Infinity;

    try {
      if (!worldState.grid || !Array.isArray(worldState.grid)) {
        return null;
      }

      for (let y = 0; y < worldState.dimensions.height; y++) {
        if (!worldState.grid[y] || !Array.isArray(worldState.grid[y])) {
          continue;
        }
        
        for (let x = 0; x < worldState.dimensions.width; x++) {
          const cell = worldState.grid[y][x];
          if (cell && cell.type === CellType.Goal) {
            const distance = Math.abs(x - position.x) + Math.abs(y - position.y);
            if (distance < minDistance) {
              minDistance = distance;
              nearestGoal = { x, y };
            }
          }
        }
      }
    } catch (error) {
      console.warn('Error finding nearest goal:', error);
    }

    return nearestGoal;
  }

  private getDirectionToward(from: { x: number; y: number }, to: { x: number; y: number }): Direction | null {
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    // Prioritize the direction with the larger difference
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? Direction.East : Direction.West;
    } else if (dy !== 0) {
      return dy > 0 ? Direction.South : Direction.North;
    }

    return null;
  }

  private getAlternativeDirections(
    worldState: WorldState, 
    agentState: AgentState, 
    goalPosition: { x: number; y: number }
  ): Direction[] {
    const directions: Direction[] = [Direction.North, Direction.South, Direction.East, Direction.West];
    const availableDirections = directions.filter(dir => 
      this.canMoveTo(worldState, agentState.position, dir)
    );

    // Sort by distance to goal
    return availableDirections.sort((a, b) => {
      const posA = this.getPositionInDirection(agentState.position, a);
      const posB = this.getPositionInDirection(agentState.position, b);
      
      const distA = Math.abs(posA.x - goalPosition.x) + Math.abs(posA.y - goalPosition.y);
      const distB = Math.abs(posB.x - goalPosition.x) + Math.abs(posB.y - goalPosition.y);
      
      return distA - distB;
    });
  }

  private getPositionInDirection(position: { x: number; y: number }, direction: Direction): { x: number; y: number } {
    switch (direction) {
      case Direction.North:
        return { x: position.x, y: position.y - 1 };
      case Direction.South:
        return { x: position.x, y: position.y + 1 };
      case Direction.East:
        return { x: position.x + 1, y: position.y };
      case Direction.West:
        return { x: position.x - 1, y: position.y };
      default:
        return position;
    }
  }

  private canMoveTo(worldState: WorldState, position: { x: number; y: number }, direction: Direction): boolean {
    const newPos = this.getPositionInDirection(position, direction);
    
    if (newPos.x < 0 || newPos.x >= worldState.dimensions.width ||
        newPos.y < 0 || newPos.y >= worldState.dimensions.height) {
      return false;
    }

    const cell = worldState.grid[newPos.y][newPos.x];
    return cell.type !== CellType.Wall && !cell.occupant;
  }
}

/**
 * Stationary Agent - never moves, always waits
 */
export class StationaryAgent extends BasePredefinedAgent {
  constructor(id: string) {
    super(id, 'Stationary');
  }

  step(worldState: WorldState, agentState: AgentState): AgentAction {
    return { type: 'wait' };
  }
}

/**
 * Patrol Agent - moves in a predefined pattern
 */
export class PatrolAgent extends BasePredefinedAgent {
  private patrolPattern: Direction[] = [Direction.North, Direction.East, Direction.South, Direction.West];
  private currentPatrolIndex = 0;

  constructor(id: string, pattern?: Direction[]) {
    super(id, 'Patrol');
    if (pattern) {
      this.patrolPattern = pattern;
    }
  }

  step(worldState: WorldState, agentState: AgentState): AgentAction {
    const direction = this.patrolPattern[this.currentPatrolIndex];
    
    if (this.canMoveTo(worldState, agentState.position, direction)) {
      this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPattern.length;
      return { type: 'move', direction };
    }

    // Can't move in current direction, try next in pattern
    this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPattern.length;
    const nextDirection = this.patrolPattern[this.currentPatrolIndex];
    
    if (this.canMoveTo(worldState, agentState.position, nextDirection)) {
      return { type: 'move', direction: nextDirection };
    }

    return { type: 'wait' };
  }

  private canMoveTo(worldState: WorldState, position: { x: number; y: number }, direction: Direction): boolean {
    const newPos = this.getPositionInDirection(position, direction);
    
    if (newPos.x < 0 || newPos.x >= worldState.dimensions.width ||
        newPos.y < 0 || newPos.y >= worldState.dimensions.height) {
      return false;
    }

    const cell = worldState.grid[newPos.y][newPos.x];
    return cell.type !== CellType.Wall && !cell.occupant;
  }

  private getPositionInDirection(position: { x: number; y: number }, direction: Direction): { x: number; y: number } {
    switch (direction) {
      case Direction.North:
        return { x: position.x, y: position.y - 1 };
      case Direction.South:
        return { x: position.x, y: position.y + 1 };
      case Direction.East:
        return { x: position.x + 1, y: position.y };
      case Direction.West:
        return { x: position.x - 1, y: position.y };
      default:
        return position;
    }
  }
}