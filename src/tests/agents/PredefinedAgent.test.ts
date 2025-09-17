/**
 * BDD tests for predefined agent behaviors and interactions
 */

import { BDDTestRunner } from '../bdd-helpers';
import { 
  RandomWalkerAgent, 
  GoalSeekerAgent, 
  StationaryAgent, 
  PatrolAgent 
} from '../../agents/PredefinedAgent';
import { AgentFactory, AgentTypeUtils, PredefinedAgentType } from '../../services/AgentFactory';
import { WorldState, AgentState } from '../../types/Grid';
import { Direction, CellType, AgentType } from '../../types/Common';
import { AgentAction } from '../../types/Agent';

// Helper function to create a simple world state for testing
function createTestWorldState(width: number = 5, height: number = 5): WorldState {
  const grid = Array(height).fill(null).map(() =>
    Array(width).fill(null).map(() => ({ type: CellType.Empty }))
  );

  return {
    grid,
    agents: new Map(),
    dimensions: { width, height },
    tick: 0
  };
}

// Helper function to create test agent state
function createTestAgentState(id: string, x: number, y: number): AgentState {
  return {
    id,
    position: { x, y },
    health: 100,
    energy: 100,
    inventory: []
  };
}

BDDTestRunner.feature('Random Walker Agent Behavior', () => {
  
  let agent: RandomWalkerAgent;
  let worldState: WorldState;

  beforeEach(() => {
    agent = new RandomWalkerAgent('random-1');
    worldState = createTestWorldState();
  });

  BDDTestRunner.scenario('Random walker agent initialization', {
    given: 'a random walker agent with valid ID',
    when: 'the agent is created',
    then: 'it should have correct properties and type'
  }, () => {
    expect(agent.id).toBe('random-1');
    expect(agent.name).toBe('Random Walker');
    expect(agent.type).toBe(AgentType.Predefined);
  });

  BDDTestRunner.scenario('Random walker moves in available directions', {
    given: 'a random walker agent in the center of an empty grid',
    when: 'the agent takes a step',
    then: 'it should choose to move in one of the four cardinal directions'
  }, () => {
    const agentState = createTestAgentState('random-1', 2, 2);
    
    const action = agent.step(worldState, agentState);
    
    expect(action.type).toBe('move');
    expect([Direction.North, Direction.South, Direction.East, Direction.West])
      .toContain(action.direction);
  });

  BDDTestRunner.scenario('Random walker waits when surrounded by walls', {
    given: 'a random walker agent completely surrounded by walls',
    when: 'the agent takes a step',
    then: 'it should wait since no movement is possible'
  }, () => {
    const agentState = createTestAgentState('random-1', 2, 2);
    
    // Surround agent with walls
    worldState.grid[1][2] = { type: CellType.Wall }; // North
    worldState.grid[3][2] = { type: CellType.Wall }; // South
    worldState.grid[2][1] = { type: CellType.Wall }; // West
    worldState.grid[2][3] = { type: CellType.Wall }; // East
    
    const action = agent.step(worldState, agentState);
    
    expect(action.type).toBe('wait');
  });

  BDDTestRunner.scenario('Random walker avoids occupied cells', {
    given: 'a random walker agent with some directions blocked by other agents',
    when: 'the agent takes a step',
    then: 'it should only choose from unoccupied directions'
  }, () => {
    const agentState = createTestAgentState('random-1', 2, 2);
    
    // Block some directions with other agents
    worldState.grid[1][2].occupant = 'other-agent-1'; // North blocked
    worldState.grid[2][3].occupant = 'other-agent-2'; // East blocked
    
    const action = agent.step(worldState, agentState);
    
    expect(action.type).toBe('move');
    expect([Direction.South, Direction.West]).toContain(action.direction);
  });

  BDDTestRunner.scenario('Random walker avoids grid boundaries', {
    given: 'a random walker agent at the edge of the grid',
    when: 'the agent takes a step',
    then: 'it should not attempt to move outside the grid boundaries'
  }, () => {
    const agentState = createTestAgentState('random-1', 0, 0); // Top-left corner
    
    const action = agent.step(worldState, agentState);
    
    expect(action.type).toBe('move');
    expect([Direction.South, Direction.East]).toContain(action.direction);
  });
});

BDDTestRunner.feature('Goal Seeker Agent Behavior', () => {
  
  let agent: GoalSeekerAgent;
  let worldState: WorldState;

  beforeEach(() => {
    agent = new GoalSeekerAgent('seeker-1');
    worldState = createTestWorldState();
  });

  BDDTestRunner.scenario('Goal seeker agent initialization', {
    given: 'a goal seeker agent with valid ID',
    when: 'the agent is created',
    then: 'it should have correct properties and type'
  }, () => {
    expect(agent.id).toBe('seeker-1');
    expect(agent.name).toBe('Goal Seeker');
    expect(agent.type).toBe(AgentType.Predefined);
  });

  BDDTestRunner.scenario('Goal seeker moves toward nearest goal', {
    given: 'a goal seeker agent with a goal cell to the east',
    when: 'the agent takes a step',
    then: 'it should move toward the goal'
  }, () => {
    const agentState = createTestAgentState('seeker-1', 1, 2);
    worldState.grid[2][4] = { type: CellType.Goal }; // Goal to the east
    
    const action = agent.step(worldState, agentState);
    
    expect(action.type).toBe('move');
    expect(action.direction).toBe(Direction.East);
  });

  BDDTestRunner.scenario('Goal seeker chooses nearest goal when multiple exist', {
    given: 'a goal seeker agent with multiple goals at different distances',
    when: 'the agent takes a step',
    then: 'it should move toward the nearest goal'
  }, () => {
    const agentState = createTestAgentState('seeker-1', 2, 2);
    worldState.grid[2][3] = { type: CellType.Goal }; // Closer goal (distance 1)
    worldState.grid[0][0] = { type: CellType.Goal }; // Farther goal (distance 4)
    
    const action = agent.step(worldState, agentState);
    
    expect(action.type).toBe('move');
    expect(action.direction).toBe(Direction.East); // Toward closer goal
  });

  BDDTestRunner.scenario('Goal seeker finds alternative path when direct route blocked', {
    given: 'a goal seeker agent with direct path to goal blocked by wall',
    when: 'the agent takes a step',
    then: 'it should choose an alternative direction that gets closer to the goal'
  }, () => {
    const agentState = createTestAgentState('seeker-1', 1, 2);
    worldState.grid[2][4] = { type: CellType.Goal }; // Goal to the east
    worldState.grid[2][2] = { type: CellType.Wall }; // Block direct path east
    
    const action = agent.step(worldState, agentState);
    
    expect(action.type).toBe('move');
    // Should move north or south to go around the wall
    expect([Direction.North, Direction.South]).toContain(action.direction);
  });

  BDDTestRunner.scenario('Goal seeker behaves like random walker when no goals exist', {
    given: 'a goal seeker agent in a world with no goal cells',
    when: 'the agent takes a step',
    then: 'it should move randomly like a random walker'
  }, () => {
    const agentState = createTestAgentState('seeker-1', 2, 2);
    // No goals in the world
    
    const action = agent.step(worldState, agentState);
    
    expect(action.type).toBe('move');
    expect([Direction.North, Direction.South, Direction.East, Direction.West])
      .toContain(action.direction);
  });

  BDDTestRunner.scenario('Goal seeker waits when completely blocked', {
    given: 'a goal seeker agent surrounded by walls with a goal nearby',
    when: 'the agent takes a step',
    then: 'it should wait since no movement is possible'
  }, () => {
    const agentState = createTestAgentState('seeker-1', 2, 2);
    worldState.grid[2][4] = { type: CellType.Goal }; // Goal exists but unreachable
    
    // Surround agent with walls
    worldState.grid[1][2] = { type: CellType.Wall };
    worldState.grid[3][2] = { type: CellType.Wall };
    worldState.grid[2][1] = { type: CellType.Wall };
    worldState.grid[2][3] = { type: CellType.Wall };
    
    const action = agent.step(worldState, agentState);
    
    expect(action.type).toBe('wait');
  });
});

BDDTestRunner.feature('Stationary Agent Behavior', () => {
  
  let agent: StationaryAgent;
  let worldState: WorldState;

  beforeEach(() => {
    agent = new StationaryAgent('stationary-1');
    worldState = createTestWorldState();
  });

  BDDTestRunner.scenario('Stationary agent initialization', {
    given: 'a stationary agent with valid ID',
    when: 'the agent is created',
    then: 'it should have correct properties and type'
  }, () => {
    expect(agent.id).toBe('stationary-1');
    expect(agent.name).toBe('Stationary');
    expect(agent.type).toBe(AgentType.Predefined);
  });

  BDDTestRunner.scenario('Stationary agent always waits', {
    given: 'a stationary agent in any world state',
    when: 'the agent takes a step',
    then: 'it should always choose to wait'
  }, () => {
    const agentState = createTestAgentState('stationary-1', 2, 2);
    
    const action = agent.step(worldState, agentState);
    
    expect(action.type).toBe('wait');
  });

  BDDTestRunner.scenario('Stationary agent waits even with available moves', {
    given: 'a stationary agent with all directions available for movement',
    when: 'the agent takes a step',
    then: 'it should still choose to wait instead of moving'
  }, () => {
    const agentState = createTestAgentState('stationary-1', 2, 2);
    // All directions are clear
    
    const action = agent.step(worldState, agentState);
    
    expect(action.type).toBe('wait');
  });

  BDDTestRunner.scenario('Stationary agent consistent behavior across multiple steps', {
    given: 'a stationary agent',
    when: 'the agent takes multiple steps',
    then: 'it should consistently wait on every step'
  }, () => {
    const agentState = createTestAgentState('stationary-1', 2, 2);
    
    for (let i = 0; i < 5; i++) {
      const action = agent.step(worldState, agentState);
      expect(action.type).toBe('wait');
    }
  });
});

BDDTestRunner.feature('Patrol Agent Behavior', () => {
  
  let agent: PatrolAgent;
  let worldState: WorldState;

  beforeEach(() => {
    agent = new PatrolAgent('patrol-1');
    worldState = createTestWorldState();
  });

  BDDTestRunner.scenario('Patrol agent initialization with default pattern', {
    given: 'a patrol agent with no custom pattern',
    when: 'the agent is created',
    then: 'it should have correct properties and default patrol pattern'
  }, () => {
    expect(agent.id).toBe('patrol-1');
    expect(agent.name).toBe('Patrol');
    expect(agent.type).toBe(AgentType.Predefined);
  });

  BDDTestRunner.scenario('Patrol agent follows default pattern sequence', {
    given: 'a patrol agent in the center of an empty grid',
    when: 'the agent takes multiple steps',
    then: 'it should follow the default patrol pattern: North, East, South, West'
  }, () => {
    const agentState = createTestAgentState('patrol-1', 2, 2);
    const expectedPattern = [Direction.North, Direction.East, Direction.South, Direction.West];
    
    for (let i = 0; i < expectedPattern.length; i++) {
      const action = agent.step(worldState, agentState);
      expect(action.type).toBe('move');
      expect(action.direction).toBe(expectedPattern[i]);
    }
  });

  BDDTestRunner.scenario('Patrol agent cycles through pattern repeatedly', {
    given: 'a patrol agent that has completed one full patrol cycle',
    when: 'the agent continues taking steps',
    then: 'it should restart the pattern from the beginning'
  }, () => {
    const agentState = createTestAgentState('patrol-1', 2, 2);
    
    // Complete one full cycle
    for (let i = 0; i < 4; i++) {
      agent.step(worldState, agentState);
    }
    
    // Next step should restart pattern
    const action = agent.step(worldState, agentState);
    expect(action.type).toBe('move');
    expect(action.direction).toBe(Direction.North); // First in pattern
  });

  BDDTestRunner.scenario('Patrol agent skips blocked directions in pattern', {
    given: 'a patrol agent with some pattern directions blocked',
    when: 'the agent encounters a blocked direction',
    then: 'it should skip to the next direction in the pattern'
  }, () => {
    const agentState = createTestAgentState('patrol-1', 2, 2);
    worldState.grid[1][2] = { type: CellType.Wall }; // Block north
    
    const action = agent.step(worldState, agentState);
    
    expect(action.type).toBe('move');
    expect(action.direction).toBe(Direction.East); // Should skip to next in pattern
  });

  BDDTestRunner.scenario('Patrol agent waits when all pattern directions blocked', {
    given: 'a patrol agent with all pattern directions blocked',
    when: 'the agent takes a step',
    then: 'it should wait since no pattern movement is possible'
  }, () => {
    const agentState = createTestAgentState('patrol-1', 2, 2);
    
    // Block all directions in default pattern
    worldState.grid[1][2] = { type: CellType.Wall }; // North
    worldState.grid[2][3] = { type: CellType.Wall }; // East
    worldState.grid[3][2] = { type: CellType.Wall }; // South
    worldState.grid[2][1] = { type: CellType.Wall }; // West
    
    const action = agent.step(worldState, agentState);
    
    expect(action.type).toBe('wait');
  });

  BDDTestRunner.scenario('Patrol agent with custom pattern', {
    given: 'a patrol agent initialized with a custom movement pattern',
    when: 'the agent takes steps',
    then: 'it should follow the custom pattern instead of the default'
  }, () => {
    const customPattern = [Direction.East, Direction.East, Direction.South];
    const customAgent = new PatrolAgent('patrol-custom', customPattern);
    const agentState = createTestAgentState('patrol-custom', 1, 1);
    
    for (let i = 0; i < customPattern.length; i++) {
      const action = customAgent.step(worldState, agentState);
      expect(action.type).toBe('move');
      expect(action.direction).toBe(customPattern[i]);
    }
  });
});

BDDTestRunner.feature('Agent Selection and Instantiation System', () => {
  
  BDDTestRunner.scenario('Create agent by type string using factory', {
    given: 'a valid agent type string and configuration',
    when: 'an agent is instantiated using the factory method',
    then: 'the correct agent type should be created with proper configuration'
  }, () => {
    const config = {
      id: 'test-agent-1',
      name: 'Test Random Walker',
      agentType: 'random-walker' as PredefinedAgentType
    };
    
    const agent = AgentFactory.createAgent(config);
    
    expect(agent.id).toBe('test-agent-1');
    expect(agent.name).toBe('Random Walker');
    expect(agent.type).toBe(AgentType.Predefined);
    expect(agent).toBeInstanceOf(RandomWalkerAgent);
  });

  BDDTestRunner.scenario('Create patrol agent with custom pattern', {
    given: 'a patrol agent configuration with custom movement pattern',
    when: 'the agent is created using the factory',
    then: 'the agent should be configured with the custom pattern'
  }, () => {
    const config = {
      id: 'patrol-custom',
      name: 'Custom Patrol',
      agentType: 'patrol' as PredefinedAgentType,
      patrolPattern: [Direction.East, Direction.South]
    };
    
    const agent = AgentFactory.createAgent(config);
    
    expect(agent.id).toBe('patrol-custom');
    expect(agent).toBeInstanceOf(PatrolAgent);
  });

  BDDTestRunner.scenario('Get available agent types information', {
    given: 'the agent factory system',
    when: 'requesting available agent types',
    then: 'it should return complete information about all supported agent types'
  }, () => {
    const agentTypes = AgentFactory.getAvailableAgentTypes();
    
    expect(agentTypes).toHaveLength(4);
    expect(agentTypes.map(t => t.type)).toContain('random-walker');
    expect(agentTypes.map(t => t.type)).toContain('goal-seeker');
    expect(agentTypes.map(t => t.type)).toContain('stationary');
    expect(agentTypes.map(t => t.type)).toContain('patrol');
    
    const patrolType = agentTypes.find(t => t.type === 'patrol');
    expect(patrolType?.configurable).toBe(true);
    expect(patrolType?.parameters).toBeDefined();
  });

  BDDTestRunner.scenario('Create multiple agents with auto-generated IDs', {
    given: 'a request to create multiple agents of the same type',
    when: 'using the factory to create multiple agents',
    then: 'each agent should have a unique ID and correct type'
  }, () => {
    const agents = AgentFactory.createMultipleAgents('stationary', 3);
    
    expect(agents).toHaveLength(3);
    
    const ids = agents.map(a => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(3); // All IDs should be unique
    
    agents.forEach(agent => {
      expect(agent).toBeInstanceOf(StationaryAgent);
      expect(agent.type).toBe(AgentType.Predefined);
    });
  });

  BDDTestRunner.scenario('Validate agent configuration before instantiation', {
    given: 'agent configuration with invalid parameters',
    when: 'attempting to create an agent',
    then: 'appropriate validation errors should be thrown'
  }, () => {
    expect(() => {
      AgentFactory.createAgent({
        id: '', // Invalid empty ID
        name: 'Test Agent',
        agentType: 'random-walker'
      });
    }).toThrow('Agent ID is required');
    
    expect(() => {
      AgentFactory.createAgent({
        id: 'test',
        name: 'Test Agent',
        agentType: 'invalid-type' as PredefinedAgentType
      });
    }).toThrow('Invalid agent type');
  });

  BDDTestRunner.scenario('Agent behavior consistency across multiple instances', {
    given: 'multiple instances of the same agent type',
    when: 'they are placed in identical world states',
    then: 'they should exhibit consistent behavior patterns'
  }, () => {
    const agent1 = AgentFactory.createAgent({
      id: 'stat-1',
      name: 'Stationary 1',
      agentType: 'stationary'
    });
    const agent2 = AgentFactory.createAgent({
      id: 'stat-2', 
      name: 'Stationary 2',
      agentType: 'stationary'
    });
    
    const worldState = createTestWorldState();
    const agentState1 = createTestAgentState('stat-1', 2, 2);
    const agentState2 = createTestAgentState('stat-2', 3, 3);
    
    const action1 = agent1.step(worldState, agentState1);
    const action2 = agent2.step(worldState, agentState2);
    
    expect(action1.type).toBe(action2.type);
    expect(action1.type).toBe('wait');
  });

  BDDTestRunner.scenario('Get configuration schema for agent type', {
    given: 'a specific agent type',
    when: 'requesting the configuration schema',
    then: 'it should return a valid JSON schema for that agent type'
  }, () => {
    const schema = AgentFactory.getConfigurationSchema('patrol');
    
    expect(schema.type).toBe('object');
    expect(schema.properties.id).toBeDefined();
    expect(schema.properties.patrolPattern).toBeDefined();
    expect(schema.required).toContain('id');
  });
});

BDDTestRunner.feature('Agent Type Utilities', () => {
  
  BDDTestRunner.scenario('Convert direction strings to Direction enums', {
    given: 'valid direction strings',
    when: 'converting them to Direction enums',
    then: 'the correct Direction values should be returned'
  }, () => {
    expect(AgentTypeUtils.stringToDirection('north')).toBe(Direction.North);
    expect(AgentTypeUtils.stringToDirection('SOUTH')).toBe(Direction.South);
    expect(AgentTypeUtils.stringToDirection('East')).toBe(Direction.East);
    expect(AgentTypeUtils.stringToDirection('west')).toBe(Direction.West);
  });

  BDDTestRunner.scenario('Handle invalid direction strings', {
    given: 'invalid direction strings',
    when: 'attempting to convert them',
    then: 'appropriate errors should be thrown'
  }, () => {
    expect(() => {
      AgentTypeUtils.stringToDirection('invalid');
    }).toThrow('Invalid direction string');
    
    expect(() => {
      AgentTypeUtils.stringToDirection('');
    }).toThrow('Invalid direction string');
  });

  BDDTestRunner.scenario('Parse patrol pattern from string array', {
    given: 'an array of direction strings',
    when: 'parsing them into a patrol pattern',
    then: 'the correct Direction array should be returned'
  }, () => {
    const pattern = AgentTypeUtils.parsePatrolPattern(['north', 'east', 'south']);
    
    expect(pattern).toEqual([Direction.North, Direction.East, Direction.South]);
  });

  BDDTestRunner.scenario('Generate unique agent IDs', {
    given: 'an agent type',
    when: 'generating multiple agent IDs',
    then: 'each ID should be unique and contain the agent type'
  }, () => {
    const id1 = AgentTypeUtils.generateAgentId('random-walker');
    const id2 = AgentTypeUtils.generateAgentId('random-walker');
    
    expect(id1).not.toBe(id2);
    expect(id1).toContain('random-walker');
    expect(id2).toContain('random-walker');
  });

  BDDTestRunner.scenario('Validate agent type strings', {
    given: 'various strings',
    when: 'checking if they are valid agent types',
    then: 'the validation should correctly identify valid and invalid types'
  }, () => {
    expect(AgentTypeUtils.isValidAgentType('random-walker')).toBe(true);
    expect(AgentTypeUtils.isValidAgentType('goal-seeker')).toBe(true);
    expect(AgentTypeUtils.isValidAgentType('invalid-type')).toBe(false);
    expect(AgentTypeUtils.isValidAgentType('')).toBe(false);
  });
});

BDDTestRunner.feature('Agent Error Handling and Validation', () => {
  
  BDDTestRunner.scenario('Agent handles invalid world state gracefully', {
    given: 'an agent and a malformed world state',
    when: 'the agent attempts to take a step',
    then: 'it should handle the error gracefully without crashing'
  }, () => {
    const agent = new RandomWalkerAgent('random-1');
    const agentState = createTestAgentState('random-1', 2, 2);
    const invalidWorldState = {
      ...createTestWorldState(),
      grid: [] // Invalid empty grid
    };
    
    expect(() => {
      agent.step(invalidWorldState, agentState);
    }).not.toThrow();
  });

  BDDTestRunner.scenario('Agent validates action before returning', {
    given: 'an agent that generates actions',
    when: 'the agent takes a step',
    then: 'the returned action should be valid according to action validation rules'
  }, () => {
    const agent = new RandomWalkerAgent('random-1');
    const worldState = createTestWorldState();
    const agentState = createTestAgentState('random-1', 2, 2);
    
    const action = agent.step(worldState, agentState);
    
    expect(action.type).toBeDefined();
    expect(['move', 'wait', 'communicate', 'custom']).toContain(action.type);
    
    if (action.type === 'move') {
      expect(action.direction).toBeDefined();
    }
  });

  BDDTestRunner.scenario('Agent initialization with invalid configuration', {
    given: 'an agent and invalid initialization configuration',
    when: 'the agent is initialized',
    then: 'appropriate validation errors should be provided'
  }, () => {
    const agent = new RandomWalkerAgent('random-1');
    
    expect(() => {
      agent.initialize({
        id: '', // Invalid empty ID
        name: 'Test Agent',
        initialPosition: { x: 0, y: 0 }
      });
    }).toThrow();
  });
});