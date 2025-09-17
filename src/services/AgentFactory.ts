/**
 * Agent factory for creating and managing predefined agents
 */

import { Agent, AgentConfig } from '../types/Agent';
import { 
  RandomWalkerAgent, 
  GoalSeekerAgent, 
  StationaryAgent, 
  PatrolAgent 
} from '../agents/PredefinedAgent';
import { Direction } from '../types/Common';

export type PredefinedAgentType = 
  | 'random-walker'
  | 'goal-seeker' 
  | 'stationary'
  | 'patrol';

export interface AgentFactoryConfig extends AgentConfig {
  agentType: PredefinedAgentType;
  patrolPattern?: Direction[]; // For patrol agents
}

export interface AgentTypeInfo {
  type: PredefinedAgentType;
  name: string;
  description: string;
  configurable: boolean;
  parameters?: {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'direction[]';
    description: string;
    required: boolean;
    default?: any;
  }[];
}

export class AgentFactory {
  private static readonly AGENT_TYPES: AgentTypeInfo[] = [
    {
      type: 'random-walker',
      name: 'Random Walker',
      description: 'Moves randomly in available directions, avoiding walls and other agents',
      configurable: false
    },
    {
      type: 'goal-seeker',
      name: 'Goal Seeker',
      description: 'Seeks out goal cells using simple pathfinding, falls back to random movement if no goals exist',
      configurable: false
    },
    {
      type: 'stationary',
      name: 'Stationary',
      description: 'Never moves, always waits in place',
      configurable: false
    },
    {
      type: 'patrol',
      name: 'Patrol',
      description: 'Follows a predefined movement pattern, cycling through directions',
      configurable: true,
      parameters: [
        {
          name: 'patrolPattern',
          type: 'direction[]',
          description: 'Array of directions to patrol in sequence',
          required: false,
          default: ['north', 'east', 'south', 'west']
        }
      ]
    }
  ];

  /**
   * Get information about all available agent types
   */
  static getAvailableAgentTypes(): AgentTypeInfo[] {
    return [...this.AGENT_TYPES];
  }

  /**
   * Get information about a specific agent type
   */
  static getAgentTypeInfo(type: PredefinedAgentType): AgentTypeInfo | null {
    return this.AGENT_TYPES.find(info => info.type === type) || null;
  }

  /**
   * Create an agent instance of the specified type
   */
  static createAgent(config: AgentFactoryConfig): Agent {
    this.validateAgentFactoryConfig(config);

    switch (config.agentType) {
      case 'random-walker':
        return new RandomWalkerAgent(config.id);
      
      case 'goal-seeker':
        return new GoalSeekerAgent(config.id);
      
      case 'stationary':
        return new StationaryAgent(config.id);
      
      case 'patrol':
        return new PatrolAgent(config.id, config.patrolPattern);
      
      default:
        throw new Error(`Unknown agent type: ${config.agentType}`);
    }
  }

  /**
   * Create multiple agents of the same type with auto-generated IDs
   */
  static createMultipleAgents(
    agentType: PredefinedAgentType, 
    count: number, 
    baseConfig?: Partial<AgentFactoryConfig>
  ): Agent[] {
    if (count <= 0) {
      throw new Error('Agent count must be positive');
    }

    if (count > 100) {
      throw new Error('Cannot create more than 100 agents at once');
    }

    const agents: Agent[] = [];
    
    for (let i = 0; i < count; i++) {
      const config: AgentFactoryConfig = {
        id: `${agentType}-${Date.now()}-${i}`,
        name: `${this.getAgentTypeInfo(agentType)?.name || agentType} ${i + 1}`,
        agentType,
        ...baseConfig
      };
      
      agents.push(this.createAgent(config));
    }
    
    return agents;
  }

  /**
   * Validate agent factory configuration
   */
  private static validateAgentFactoryConfig(config: AgentFactoryConfig): void {
    if (!config.id || config.id.trim() === '') {
      throw new Error('Agent ID is required');
    }

    if (!config.agentType) {
      throw new Error('Agent type is required');
    }

    const agentTypeInfo = this.getAgentTypeInfo(config.agentType);
    if (!agentTypeInfo) {
      throw new Error(`Invalid agent type: ${config.agentType}`);
    }

    // Validate type-specific parameters
    if (config.agentType === 'patrol' && config.patrolPattern) {
      if (!Array.isArray(config.patrolPattern)) {
        throw new Error('Patrol pattern must be an array of directions');
      }

      if (config.patrolPattern.length === 0) {
        throw new Error('Patrol pattern cannot be empty');
      }

      const validDirections = Object.values(Direction);
      for (const direction of config.patrolPattern) {
        if (!validDirections.includes(direction)) {
          throw new Error(`Invalid direction in patrol pattern: ${direction}`);
        }
      }
    }

    // Validate common agent config properties
    if (config.initialHealth !== undefined && config.initialHealth < 0) {
      throw new Error('Initial health cannot be negative');
    }

    if (config.initialEnergy !== undefined && config.initialEnergy < 0) {
      throw new Error('Initial energy cannot be negative');
    }
  }

  /**
   * Get default configuration for an agent type
   */
  static getDefaultConfig(agentType: PredefinedAgentType): Partial<AgentFactoryConfig> {
    const baseConfig: Partial<AgentFactoryConfig> = {
      agentType,
      initialHealth: 100,
      initialEnergy: 100
    };

    switch (agentType) {
      case 'patrol':
        return {
          ...baseConfig,
          patrolPattern: [Direction.North, Direction.East, Direction.South, Direction.West]
        };
      
      default:
        return baseConfig;
    }
  }

  /**
   * Validate if an agent type supports a specific configuration parameter
   */
  static supportsParameter(agentType: PredefinedAgentType, parameterName: string): boolean {
    const agentTypeInfo = this.getAgentTypeInfo(agentType);
    if (!agentTypeInfo || !agentTypeInfo.parameters) {
      return false;
    }

    return agentTypeInfo.parameters.some(param => param.name === parameterName);
  }

  /**
   * Get configuration schema for an agent type (useful for UI generation)
   */
  static getConfigurationSchema(agentType: PredefinedAgentType): any {
    const agentTypeInfo = this.getAgentTypeInfo(agentType);
    if (!agentTypeInfo) {
      throw new Error(`Unknown agent type: ${agentType}`);
    }

    const schema = {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Unique identifier for the agent',
          minLength: 1
        },
        name: {
          type: 'string',
          description: 'Display name for the agent'
        },
        initialHealth: {
          type: 'number',
          description: 'Starting health value',
          minimum: 0,
          default: 100
        },
        initialEnergy: {
          type: 'number',
          description: 'Starting energy value',
          minimum: 0,
          default: 100
        }
      },
      required: ['id']
    };

    // Add type-specific parameters
    if (agentTypeInfo.parameters) {
      for (const param of agentTypeInfo.parameters) {
        schema.properties[param.name] = {
          type: param.type === 'direction[]' ? 'array' : param.type,
          description: param.description,
          ...(param.default !== undefined && { default: param.default })
        };

        if (param.required) {
          schema.required.push(param.name);
        }
      }
    }

    return schema;
  }
}

/**
 * Utility functions for working with agent types
 */
export class AgentTypeUtils {
  /**
   * Convert direction string to Direction enum
   */
  static stringToDirection(directionStr: string): Direction {
    const directionMap: Record<string, Direction> = {
      'north': Direction.North,
      'south': Direction.South,
      'east': Direction.East,
      'west': Direction.West,
      'northeast': Direction.Northeast,
      'northwest': Direction.Northwest,
      'southeast': Direction.Southeast,
      'southwest': Direction.Southwest
    };

    const direction = directionMap[directionStr.toLowerCase()];
    if (!direction) {
      throw new Error(`Invalid direction string: ${directionStr}`);
    }

    return direction;
  }

  /**
   * Convert Direction enum to string
   */
  static directionToString(direction: Direction): string {
    return direction.toLowerCase();
  }

  /**
   * Parse patrol pattern from string array
   */
  static parsePatrolPattern(patternStrings: string[]): Direction[] {
    return patternStrings.map(str => this.stringToDirection(str));
  }

  /**
   * Generate a random agent ID
   */
  static generateAgentId(agentType: PredefinedAgentType): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${agentType}-${timestamp}-${random}`;
  }

  /**
   * Check if an agent type is valid
   */
  static isValidAgentType(type: string): type is PredefinedAgentType {
    return ['random-walker', 'goal-seeker', 'stationary', 'patrol'].includes(type);
  }
}