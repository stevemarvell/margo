/**
 * BDD tests for SimulationEngine lifecycle behaviors and operations
 */

import { BDDTestRunner } from '../bdd-helpers';
import { SimulationEngine } from '../../services/SimulationEngine';
import { SimulationConfig, SimulationState, SimulationStatus } from '../../types/Simulation';
import { WorldState, AgentState } from '../../types/Grid';
import { Agent, AgentAction } from '../../types/Agent';
import { Position, Direction, CellType, AgentType } from '../../types/Common';

// Mock agent for testing
class MockAgent implements Agent {
  id: string;
  name: string;
  type: AgentType = AgentType.Predefined;

  constructor(id: string, name: string = 'Mock Agent') {
    this.id = id;
    this.name = name;
  }

  step(worldState: WorldState, agentState: AgentState): AgentAction {
    return { type: 'wait' };
  }
}

// Mock moving agent for testing movement
class MockMovingAgent implements Agent {
  id: string;
  name: string;
  type: AgentType = AgentType.Predefined;
  private moveDirection: Direction;

  constructor(id: string, moveDirection: Direction = Direction.East) {
    this.id = id;
    this.name = 'Mock Moving Agent';
    this.moveDirection = moveDirection;
  }

  step(worldState: WorldState, agentState: AgentState): AgentAction {
    return { type: 'move', direction: this.moveDirection };
  }
}

BDDTestRunner.feature('Simulation Engine Lifecycle Management', () => {
  
  let simulationEngine: SimulationEngine;
  let mockConfig: SimulationConfig;

  beforeEach(() => {
    simulationEngine = new SimulationEngine();
    mockConfig = {
      gridSize: { width: 10, height: 10 },
      tickRate: 10,
      maxAgents: 20,
      worldRules: {
        allowDiagonalMovement: true,
        maxAgentsPerCell: 1,
        energyConsumptionPerMove: 1,
        collisionBehavior: 'block',
        communicationRange: 3
      }
    };
  });

  BDDTestRunner.scenario('Initialize simulation engine', {
    given: 'a simulation engine and valid configuration',
    when: 'the engine is initialized with the configuration',
    then: 'the simulation should be in stopped state with initialized world'
  }, () => {
    simulationEngine.initialize(mockConfig);
    
    const state = simulationEngine.getState();
    expect(state.isRunning).toBe(false);
    expect(state.isPaused).toBe(false);
    expect(state.currentTick).toBe(0);
    expect(state.worldState.dimensions).toEqual(mockConfig.gridSize);
    expect(state.config).toEqual(mockConfig);
  });

  BDDTestRunner.scenario('Start simulation from stopped state', {
    given: 'an initialized simulation engine in stopped state',
    when: 'the play method is called',
    then: 'the simulation should transition to running state'
  }, () => {
    simulationEngine.initialize(mockConfig);
    
    simulationEngine.play();
    
    const state = simulationEngine.getState();
    expect(state.isRunning).toBe(true);
    expect(state.isPaused).toBe(false);
    expect(state.startTime).toBeDefined();
  });

  BDDTestRunner.scenario('Pause running simulation', {
    given: 'a running simulation',
    when: 'the pause method is called',
    then: 'the simulation should transition to paused state'
  }, () => {
    simulationEngine.initialize(mockConfig);
    simulationEngine.play();
    
    simulationEngine.pause();
    
    const state = simulationEngine.getState();
    expect(state.isRunning).toBe(false);
    expect(state.isPaused).toBe(true);
  });

  BDDTestRunner.scenario('Resume paused simulation', {
    given: 'a paused simulation',
    when: 'the play method is called',
    then: 'the simulation should resume running'
  }, () => {
    simulationEngine.initialize(mockConfig);
    simulationEngine.play();
    simulationEngine.pause();
    
    simulationEngine.play();
    
    const state = simulationEngine.getState();
    expect(state.isRunning).toBe(true);
    expect(state.isPaused).toBe(false);
  });

  BDDTestRunner.scenario('Reset simulation to initial state', {
    given: 'a simulation that has been running with agents and ticks',
    when: 'the reset method is called',
    then: 'the simulation should return to initial state with zero ticks'
  }, () => {
    simulationEngine.initialize(mockConfig);
    const agent = new MockAgent('agent1');
    simulationEngine.addAgent(agent, { x: 5, y: 5 });
    simulationEngine.play();
    simulationEngine.step(); // Advance one tick
    
    simulationEngine.reset();
    
    const state = simulationEngine.getState();
    expect(state.isRunning).toBe(false);
    expect(state.isPaused).toBe(false);
    expect(state.currentTick).toBe(0);
    expect(state.agents).toHaveLength(0);
    expect(state.startTime).toBeUndefined();
    expect(state.endTime).toBeUndefined();
  });

  BDDTestRunner.scenario('Step through simulation manually', {
    given: 'a paused or stopped simulation with agents',
    when: 'the step method is called',
    then: 'the simulation should advance exactly one tick'
  }, () => {
    simulationEngine.initialize(mockConfig);
    const agent = new MockAgent('agent1');
    simulationEngine.addAgent(agent, { x: 5, y: 5 });
    
    const initialTick = simulationEngine.getState().currentTick;
    simulationEngine.step();
    
    const state = simulationEngine.getState();
    expect(state.currentTick).toBe(initialTick + 1);
    expect(state.isRunning).toBe(false); // Should remain stopped after manual step
  });
});

BDDTestRunner.feature('Agent Placement and Management', () => {
  
  let simulationEngine: SimulationEngine;
  let mockConfig: SimulationConfig;

  beforeEach(() => {
    simulationEngine = new SimulationEngine();
    mockConfig = {
      gridSize: { width: 5, height: 5 },
      tickRate: 10,
      maxAgents: 10,
      worldRules: {
        allowDiagonalMovement: true,
        maxAgentsPerCell: 1,
        energyConsumptionPerMove: 1,
        collisionBehavior: 'block',
        communicationRange: 3
      }
    };
    simulationEngine.initialize(mockConfig);
  });

  BDDTestRunner.scenario('Add agent to valid position', {
    given: 'an initialized simulation and a valid agent',
    when: 'the agent is added to a valid grid position',
    then: 'the agent should be placed successfully and appear in simulation state'
  }, () => {
    const agent = new MockAgent('agent1');
    const position: Position = { x: 2, y: 3 };
    
    const success = simulationEngine.addAgent(agent, position);
    
    expect(success).toBe(true);
    const state = simulationEngine.getState();
    expect(state.agents).toHaveLength(1);
    expect(state.worldState.agents.get('agent1')?.position).toEqual(position);
    expect(state.worldState.grid[position.y][position.x].occupant).toBe('agent1');
  });

  BDDTestRunner.scenario('Reject agent placement at invalid position', {
    given: 'an initialized simulation and a valid agent',
    when: 'the agent is added to an invalid grid position outside boundaries',
    then: 'the agent placement should be rejected'
  }, () => {
    const agent = new MockAgent('agent1');
    const invalidPosition: Position = { x: 10, y: 10 }; // Outside 5x5 grid
    
    const success = simulationEngine.addAgent(agent, invalidPosition);
    
    expect(success).toBe(false);
    const state = simulationEngine.getState();
    expect(state.agents).toHaveLength(0);
  });

  BDDTestRunner.scenario('Reject agent placement when cell is occupied', {
    given: 'an initialized simulation with one agent already placed',
    when: 'another agent is added to the same position',
    then: 'the second agent placement should be rejected due to collision rules'
  }, () => {
    const agent1 = new MockAgent('agent1');
    const agent2 = new MockAgent('agent2');
    const position: Position = { x: 2, y: 2 };
    
    simulationEngine.addAgent(agent1, position);
    const success = simulationEngine.addAgent(agent2, position);
    
    expect(success).toBe(false);
    const state = simulationEngine.getState();
    expect(state.agents).toHaveLength(1);
    expect(state.worldState.agents.get('agent2')).toBeUndefined();
  });

  BDDTestRunner.scenario('Remove agent from simulation', {
    given: 'a simulation with an agent placed',
    when: 'the agent is removed',
    then: 'the agent should no longer exist in the simulation state'
  }, () => {
    const agent = new MockAgent('agent1');
    const position: Position = { x: 1, y: 1 };
    simulationEngine.addAgent(agent, position);
    
    const success = simulationEngine.removeAgent('agent1');
    
    expect(success).toBe(true);
    const state = simulationEngine.getState();
    expect(state.agents).toHaveLength(0);
    expect(state.worldState.agents.get('agent1')).toBeUndefined();
    expect(state.worldState.grid[position.y][position.x].occupant).toBeUndefined();
  });
});

BDDTestRunner.feature('Agent Movement and Collision Handling', () => {
  
  let simulationEngine: SimulationEngine;
  let mockConfig: SimulationConfig;

  beforeEach(() => {
    simulationEngine = new SimulationEngine();
    mockConfig = {
      gridSize: { width: 5, height: 5 },
      tickRate: 10,
      maxAgents: 10,
      worldRules: {
        allowDiagonalMovement: true,
        maxAgentsPerCell: 1,
        energyConsumptionPerMove: 1,
        collisionBehavior: 'block',
        communicationRange: 3
      }
    };
    simulationEngine.initialize(mockConfig);
  });

  BDDTestRunner.scenario('Agent moves to valid adjacent cell', {
    given: 'an agent placed in the grid with an empty adjacent cell',
    when: 'the agent attempts to move to the empty cell during a simulation step',
    then: 'the agent should successfully move to the new position'
  }, () => {
    const agent = new MockMovingAgent('agent1', Direction.East);
    const initialPosition: Position = { x: 1, y: 2 };
    const expectedPosition: Position = { x: 2, y: 2 };
    
    simulationEngine.addAgent(agent, initialPosition);
    simulationEngine.step();
    
    const state = simulationEngine.getState();
    const agentState = state.worldState.agents.get('agent1');
    expect(agentState?.position).toEqual(expectedPosition);
    expect(state.worldState.grid[expectedPosition.y][expectedPosition.x].occupant).toBe('agent1');
    expect(state.worldState.grid[initialPosition.y][initialPosition.x].occupant).toBeUndefined();
  });

  BDDTestRunner.scenario('Agent movement blocked by grid boundary', {
    given: 'an agent at the edge of the grid',
    when: 'the agent attempts to move outside the grid boundaries',
    then: 'the agent should remain in its current position'
  }, () => {
    const agent = new MockMovingAgent('agent1', Direction.East);
    const edgePosition: Position = { x: 4, y: 2 }; // Right edge of 5x5 grid
    
    simulationEngine.addAgent(agent, edgePosition);
    simulationEngine.step();
    
    const state = simulationEngine.getState();
    const agentState = state.worldState.agents.get('agent1');
    expect(agentState?.position).toEqual(edgePosition); // Should not move
  });

  BDDTestRunner.scenario('Agent movement blocked by another agent', {
    given: 'two agents where one blocks the path of another',
    when: 'the moving agent attempts to move to the occupied cell',
    then: 'the moving agent should be blocked and remain in place'
  }, () => {
    const movingAgent = new MockMovingAgent('agent1', Direction.East);
    const blockingAgent = new MockAgent('agent2');
    const movingPosition: Position = { x: 1, y: 2 };
    const blockingPosition: Position = { x: 2, y: 2 };
    
    simulationEngine.addAgent(movingAgent, movingPosition);
    simulationEngine.addAgent(blockingAgent, blockingPosition);
    simulationEngine.step();
    
    const state = simulationEngine.getState();
    const movingAgentState = state.worldState.agents.get('agent1');
    expect(movingAgentState?.position).toEqual(movingPosition); // Should not move
  });

  BDDTestRunner.scenario('Agent movement blocked by wall cell', {
    given: 'an agent next to a wall cell',
    when: 'the agent attempts to move into the wall',
    then: 'the agent should be blocked and remain in place'
  }, () => {
    // Set up a wall at position (2, 2)
    const state = simulationEngine.getState();
    state.worldState.grid[2][2].type = CellType.Wall;
    
    const agent = new MockMovingAgent('agent1', Direction.East);
    const position: Position = { x: 1, y: 2 };
    
    simulationEngine.addAgent(agent, position);
    simulationEngine.step();
    
    const newState = simulationEngine.getState();
    const agentState = newState.worldState.agents.get('agent1');
    expect(agentState?.position).toEqual(position); // Should not move into wall
  });

  BDDTestRunner.scenario('Agent energy consumption during movement', {
    given: 'an agent with initial energy',
    when: 'the agent moves during simulation steps',
    then: 'the agent energy should decrease according to world rules'
  }, () => {
    const agent = new MockMovingAgent('agent1', Direction.East);
    const position: Position = { x: 1, y: 2 };
    
    simulationEngine.addAgent(agent, position);
    const initialState = simulationEngine.getState();
    const initialEnergy = initialState.worldState.agents.get('agent1')?.energy || 100;
    
    simulationEngine.step();
    
    const finalState = simulationEngine.getState();
    const finalEnergy = finalState.worldState.agents.get('agent1')?.energy || 0;
    expect(finalEnergy).toBe(initialEnergy - mockConfig.worldRules.energyConsumptionPerMove);
  });
});

BDDTestRunner.feature('Simulation State Management and Tick Execution', () => {
  
  let simulationEngine: SimulationEngine;
  let mockConfig: SimulationConfig;

  beforeEach(() => {
    simulationEngine = new SimulationEngine();
    mockConfig = {
      gridSize: { width: 3, height: 3 },
      tickRate: 10,
      maxAgents: 5,
      worldRules: {
        allowDiagonalMovement: false,
        maxAgentsPerCell: 1,
        energyConsumptionPerMove: 2,
        collisionBehavior: 'block',
        communicationRange: 1
      }
    };
    simulationEngine.initialize(mockConfig);
  });

  BDDTestRunner.scenario('Tick counter increments during simulation steps', {
    given: 'an initialized simulation',
    when: 'multiple simulation steps are executed',
    then: 'the tick counter should increment correctly'
  }, () => {
    const initialTick = simulationEngine.getState().currentTick;
    
    simulationEngine.step();
    simulationEngine.step();
    simulationEngine.step();
    
    const finalState = simulationEngine.getState();
    expect(finalState.currentTick).toBe(initialTick + 3);
    expect(finalState.worldState.tick).toBe(initialTick + 3);
  });

  BDDTestRunner.scenario('World state synchronization during ticks', {
    given: 'a simulation with agents',
    when: 'simulation steps are executed',
    then: 'the world state should remain synchronized with simulation state'
  }, () => {
    const agent = new MockAgent('agent1');
    simulationEngine.addAgent(agent, { x: 1, y: 1 });
    
    simulationEngine.step();
    
    const state = simulationEngine.getState();
    expect(state.currentTick).toBe(state.worldState.tick);
    expect(state.worldState.agents.size).toBe(state.agents.length);
  });

  BDDTestRunner.scenario('Simulation state persistence across pause/resume cycles', {
    given: 'a running simulation with agents and progress',
    when: 'the simulation is paused and resumed multiple times',
    then: 'the simulation state should be preserved correctly'
  }, () => {
    const agent = new MockAgent('agent1');
    simulationEngine.addAgent(agent, { x: 0, y: 0 });
    simulationEngine.play();
    simulationEngine.step();
    
    const stateBeforePause = simulationEngine.getState();
    simulationEngine.pause();
    simulationEngine.play();
    simulationEngine.pause();
    const stateAfterCycles = simulationEngine.getState();
    
    expect(stateAfterCycles.currentTick).toBe(stateBeforePause.currentTick);
    expect(stateAfterCycles.agents).toHaveLength(stateBeforePause.agents.length);
    expect(stateAfterCycles.worldState.agents.size).toBe(stateBeforePause.worldState.agents.size);
  });

  BDDTestRunner.scenario('Multiple agents execute in single tick', {
    given: 'multiple agents placed in the simulation',
    when: 'a single simulation step is executed',
    then: 'all agents should execute their step functions once'
  }, () => {
    const agent1 = new MockAgent('agent1');
    const agent2 = new MockAgent('agent2');
    const agent3 = new MockAgent('agent3');
    
    simulationEngine.addAgent(agent1, { x: 0, y: 0 });
    simulationEngine.addAgent(agent2, { x: 1, y: 1 });
    simulationEngine.addAgent(agent3, { x: 2, y: 2 });
    
    const initialTick = simulationEngine.getState().currentTick;
    simulationEngine.step();
    
    const finalState = simulationEngine.getState();
    expect(finalState.currentTick).toBe(initialTick + 1);
    // All agents should still be present and have been processed
    expect(finalState.agents).toHaveLength(3);
    expect(finalState.worldState.agents.size).toBe(3);
  });
});