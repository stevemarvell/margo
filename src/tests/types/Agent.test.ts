/**
 * BDD tests for Agent interfaces and validation
 */

import { BDDTestRunner } from '../bdd-helpers';
import { AgentValidator, AgentConfig, AgentAction } from '../../types/Agent';
import { AgentType, Direction, CellType } from '../../types/Common';
import { RandomWalkerAgent, GoalSeekerAgent, StationaryAgent } from '../../agents/PredefinedAgent';
import { WorldState, AgentState } from '../../types/Grid';

BDDTestRunner.feature('Agent Interface Compliance', () => {
  
  BDDTestRunner.scenario('Valid agent configuration', {
    given: 'a valid agent configuration with all required fields',
    when: 'the configuration is validated',
    then: 'no validation errors should be returned'
  }, () => {
    const config: AgentConfig = {
      id: 'agent-1',
      name: 'Test Agent',
      initialHealth: 100,
      initialEnergy: 50
    };

    const errors = AgentValidator.validateAgentConfig(config);
    expect(errors).toHaveLength(0);
  });

  BDDTestRunner.scenario('Invalid agent configuration with missing ID', {
    given: 'an agent configuration with missing ID',
    when: 'the configuration is validated',
    then: 'validation errors should include missing ID error'
  }, () => {
    const config: AgentConfig = {
      id: '',
      name: 'Test Agent'
    };

    const errors = AgentValidator.validateAgentConfig(config);
    expect(errors).toContain('Agent ID is required');
  });

  BDDTestRunner.scenario('Invalid agent configuration with negative health', {
    given: 'an agent configuration with negative initial health',
    when: 'the configuration is validated',
    then: 'validation errors should include negative health error'
  }, () => {
    const config: AgentConfig = {
      id: 'agent-1',
      name: 'Test Agent',
      initialHealth: -10
    };

    const errors = AgentValidator.validateAgentConfig(config);
    expect(errors).toContain('Initial health cannot be negative');
  });

  BDDTestRunner.scenario('Valid move action', {
    given: 'a move action with a valid direction',
    when: 'the action is validated',
    then: 'no validation errors should be returned'
  }, () => {
    const action: AgentAction = {
      type: 'move',
      direction: Direction.North
    };

    const errors = AgentValidator.validateAgentAction(action);
    expect(errors).toHaveLength(0);
  });

  BDDTestRunner.scenario('Invalid move action without direction', {
    given: 'a move action without a direction',
    when: 'the action is validated',
    then: 'validation errors should include missing direction error'
  }, () => {
    const action: AgentAction = {
      type: 'move'
    };

    const errors = AgentValidator.validateAgentAction(action);
    expect(errors).toContain('Direction is required for move actions');
  });

  BDDTestRunner.scenario('Valid communicate action', {
    given: 'a communicate action with a message',
    when: 'the action is validated',
    then: 'no validation errors should be returned'
  }, () => {
    const action: AgentAction = {
      type: 'communicate',
      message: 'Hello, world!'
    };

    const errors = AgentValidator.validateAgentAction(action);
    expect(errors).toHaveLength(0);
  });

  BDDTestRunner.scenario('Invalid communicate action without message', {
    given: 'a communicate action without a message',
    when: 'the action is validated',
    then: 'validation errors should include missing message error'
  }, () => {
    const action: AgentAction = {
      type: 'communicate'
    };

    const errors = AgentValidator.validateAgentAction(action);
    expect(errors).toContain('Message is required for communicate actions');
  });
});

BDDTestRunner.feature('Predefined Agent Behaviors', () => {
  
  const mockWorldState: WorldState = {
    grid: [
      [{ type: CellType.Empty }, { type: CellType.Empty }, { type: CellType.Goal }],
      [{ type: CellType.Empty }, { type: CellType.Wall }, { type: CellType.Empty }],
      [{ type: CellType.Empty }, { type: CellType.Empty }, { type: CellType.Empty }]
    ],
    agents: new Map(),
    dimensions: { width: 3, height: 3 },
    tick: 0
  };

  const mockAgentState: AgentState = {
    id: 'test-agent',
    position: { x: 0, y: 0 },
    health: 100,
    energy: 50
  };

  BDDTestRunner.scenario('Random walker agent produces valid move actions', {
    given: 'a random walker agent in a world state',
    when: 'the agent takes a step',
    then: 'it should return a valid move action with a direction'
  }, () => {
    const agent = new RandomWalkerAgent('random-1');
    const action = agent.step(mockWorldState, mockAgentState);

    expect(action.type).toBe('move');
    expect(action.direction).toBeDefined();
    expect(Object.values(Direction)).toContain(action.direction);
  });

  BDDTestRunner.scenario('Goal seeker agent moves toward goal', {
    given: 'a goal seeker agent and a world with a goal cell',
    when: 'the agent takes a step',
    then: 'it should return a move action toward the goal'
  }, () => {
    const agent = new GoalSeekerAgent('seeker-1');
    const action = agent.step(mockWorldState, mockAgentState);

    expect(action.type).toBe('move');
    expect(action.direction).toBeDefined();
    // Since goal is at (2,0) and agent is at (0,0), it should move East
    expect(action.direction).toBe(Direction.East);
  });

  BDDTestRunner.scenario('Stationary agent always waits', {
    given: 'a stationary agent in any world state',
    when: 'the agent takes a step',
    then: 'it should return a wait action'
  }, () => {
    const agent = new StationaryAgent('stationary-1');
    const action = agent.step(mockWorldState, mockAgentState);

    expect(action.type).toBe('wait');
    expect(action.direction).toBeUndefined();
  });

  BDDTestRunner.scenario('Agent validation catches invalid agent', {
    given: 'an agent with missing required properties',
    when: 'the agent is validated',
    then: 'validation errors should be returned'
  }, () => {
    const invalidAgent = {
      id: '',
      name: 'Invalid Agent',
      type: AgentType.Predefined,
      step: 'not a function' // Invalid step function
    } as any;

    const errors = AgentValidator.validateAgent(invalidAgent);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors).toContain('Agent ID is required');
    expect(errors).toContain('Agent must implement step function');
  });
});