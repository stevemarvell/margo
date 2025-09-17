/**
 * Agent-related types and interfaces
 */

import { Position, Direction, AgentType, Item } from './Common';
import { WorldState, AgentState } from './Grid';

export interface AgentAction {
  type: 'move' | 'wait' | 'communicate' | 'custom';
  direction?: Direction;
  message?: string;
  customData?: any;
}

export interface AgentConfig {
  id: string;
  name: string;
  initialPosition?: Position;
  initialHealth?: number;
  initialEnergy?: number;
  customProperties?: Record<string, any>;
}

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  step(worldState: WorldState, agentState: AgentState): AgentAction;
  initialize?(config: AgentConfig): void;
  cleanup?(): void;
}

export interface PredefinedAgentBehavior {
  name: string;
  description: string;
  stepFunction: (worldState: WorldState, agentState: AgentState) => AgentAction;
}

export interface WASMAgentModule {
  module: WebAssembly.Module;
  instance?: WebAssembly.Instance;
  exports?: any;
}

// Agent validation utilities
export class AgentValidator {
  static validateAgentConfig(config: AgentConfig): string[] {
    const errors: string[] = [];
    
    if (!config.id || config.id.trim() === '') {
      errors.push('Agent ID is required');
    }
    
    if (!config.name || config.name.trim() === '') {
      errors.push('Agent name is required');
    }
    
    if (config.initialHealth !== undefined && config.initialHealth < 0) {
      errors.push('Initial health cannot be negative');
    }
    
    if (config.initialEnergy !== undefined && config.initialEnergy < 0) {
      errors.push('Initial energy cannot be negative');
    }
    
    return errors;
  }
  
  static validateAgentAction(action: AgentAction): string[] {
    const errors: string[] = [];
    
    if (!action.type) {
      errors.push('Action type is required');
    }
    
    if (action.type === 'move' && !action.direction) {
      errors.push('Direction is required for move actions');
    }
    
    if (action.type === 'communicate' && !action.message) {
      errors.push('Message is required for communicate actions');
    }
    
    return errors;
  }
  
  static validateAgent(agent: Agent): string[] {
    const errors: string[] = [];
    
    if (!agent.id || agent.id.trim() === '') {
      errors.push('Agent ID is required');
    }
    
    if (!agent.name || agent.name.trim() === '') {
      errors.push('Agent name is required');
    }
    
    if (!agent.type || !Object.values(AgentType).includes(agent.type)) {
      errors.push('Valid agent type is required');
    }
    
    if (typeof agent.step !== 'function') {
      errors.push('Agent must implement step function');
    }
    
    return errors;
  }
}