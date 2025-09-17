/**
 * Base agent classes with validation
 */

import { Agent, AgentAction, AgentConfig, AgentValidator } from '../types/Agent';
import { WorldState, AgentState } from '../types/Grid';
import { AgentType } from '../types/Common';

export abstract class BaseAgent implements Agent {
  public readonly id: string;
  public readonly name: string;
  public readonly type: AgentType;
  protected config?: AgentConfig;

  constructor(id: string, name: string, type: AgentType) {
    this.id = id;
    this.name = name;
    this.type = type;
    
    // Validate the agent instance
    const errors = AgentValidator.validateAgent(this);
    if (errors.length > 0) {
      throw new Error(`Agent validation failed: ${errors.join(', ')}`);
    }
  }

  abstract step(worldState: WorldState, agentState: AgentState): AgentAction;

  initialize(config: AgentConfig): void {
    const errors = AgentValidator.validateAgentConfig(config);
    if (errors.length > 0) {
      throw new Error(`Agent config validation failed: ${errors.join(', ')}`);
    }
    this.config = config;
  }

  cleanup(): void {
    // Default cleanup implementation
    this.config = undefined;
  }

  protected validateAction(action: AgentAction): void {
    const errors = AgentValidator.validateAgentAction(action);
    if (errors.length > 0) {
      throw new Error(`Agent action validation failed: ${errors.join(', ')}`);
    }
  }
}