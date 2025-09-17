/**
 * BDD tests for Grid data structures and validation
 */

import { BDDTestRunner } from '../bdd-helpers';
import { GridValidator, WorldState, AgentState } from '../../types/Grid';
import { GridDimensions, Position, CellType } from '../../types/Common';

BDDTestRunner.feature('Grid Data Validation', () => {
  
  BDDTestRunner.scenario('Valid grid dimensions', {
    given: 'grid dimensions with positive width and height',
    when: 'the dimensions are validated',
    then: 'validation should pass'
  }, () => {
    const dimensions: GridDimensions = { width: 10, height: 10 };
    const isValid = GridValidator.isValidDimensions(dimensions);
    expect(isValid).toBe(true);
  });

  BDDTestRunner.scenario('Invalid grid dimensions with zero width', {
    given: 'grid dimensions with zero width',
    when: 'the dimensions are validated',
    then: 'validation should fail'
  }, () => {
    const dimensions: GridDimensions = { width: 0, height: 10 };
    const isValid = GridValidator.isValidDimensions(dimensions);
    expect(isValid).toBe(false);
  });

  BDDTestRunner.scenario('Invalid grid dimensions exceeding maximum', {
    given: 'grid dimensions exceeding the maximum allowed size',
    when: 'the dimensions are validated',
    then: 'validation should fail'
  }, () => {
    const dimensions: GridDimensions = { width: 1001, height: 500 };
    const isValid = GridValidator.isValidDimensions(dimensions);
    expect(isValid).toBe(false);
  });

  BDDTestRunner.scenario('Valid position within grid bounds', {
    given: 'a position within the grid boundaries',
    when: 'the position is validated against grid dimensions',
    then: 'validation should pass'
  }, () => {
    const position: Position = { x: 5, y: 5 };
    const dimensions: GridDimensions = { width: 10, height: 10 };
    const isValid = GridValidator.isValidPosition(position, dimensions);
    expect(isValid).toBe(true);
  });

  BDDTestRunner.scenario('Invalid position outside grid bounds', {
    given: 'a position outside the grid boundaries',
    when: 'the position is validated against grid dimensions',
    then: 'validation should fail'
  }, () => {
    const position: Position = { x: 15, y: 5 };
    const dimensions: GridDimensions = { width: 10, height: 10 };
    const isValid = GridValidator.isValidPosition(position, dimensions);
    expect(isValid).toBe(false);
  });

  BDDTestRunner.scenario('Valid world state structure', {
    given: 'a properly structured world state',
    when: 'the world state is validated',
    then: 'no validation errors should be returned'
  }, () => {
    const worldState: WorldState = {
      grid: [
        [{ type: CellType.Empty }, { type: CellType.Wall }],
        [{ type: CellType.Goal }, { type: CellType.Empty }]
      ],
      agents: new Map<string, AgentState>(),
      dimensions: { width: 2, height: 2 },
      tick: 0
    };

    const errors = GridValidator.validateWorldState(worldState);
    expect(errors).toHaveLength(0);
  });

  BDDTestRunner.scenario('Invalid world state with mismatched grid dimensions', {
    given: 'a world state where grid size does not match declared dimensions',
    when: 'the world state is validated',
    then: 'validation errors should include dimension mismatch'
  }, () => {
    const worldState: WorldState = {
      grid: [
        [{ type: CellType.Empty }, { type: CellType.Wall }],
        [{ type: CellType.Goal }, { type: CellType.Empty }]
      ],
      agents: new Map<string, AgentState>(),
      dimensions: { width: 3, height: 2 }, // Width doesn't match actual grid
      tick: 0
    };

    const errors = GridValidator.validateWorldState(worldState);
    expect(errors).toContain('Grid width does not match dimensions');
  });

  BDDTestRunner.scenario('Invalid world state with negative tick count', {
    given: 'a world state with negative tick count',
    when: 'the world state is validated',
    then: 'validation errors should include negative tick error'
  }, () => {
    const worldState: WorldState = {
      grid: [
        [{ type: CellType.Empty }, { type: CellType.Wall }]
      ],
      agents: new Map<string, AgentState>(),
      dimensions: { width: 2, height: 1 },
      tick: -1
    };

    const errors = GridValidator.validateWorldState(worldState);
    expect(errors).toContain('Tick count cannot be negative');
  });
});

BDDTestRunner.feature('Agent State Management', () => {
  
  BDDTestRunner.scenario('Agent state with valid properties', {
    given: 'an agent state with all valid properties',
    when: 'the agent state is created',
    then: 'all properties should be accessible and valid'
  }, () => {
    const agentState: AgentState = {
      id: 'agent-1',
      position: { x: 5, y: 3 },
      health: 100,
      energy: 75,
      inventory: [
        { id: 'item-1', name: 'Health Potion', type: 'consumable' }
      ],
      customState: { mood: 'happy', lastAction: 'move' }
    };

    expect(agentState.id).toBe('agent-1');
    expect(agentState.position.x).toBe(5);
    expect(agentState.position.y).toBe(3);
    expect(agentState.health).toBe(100);
    expect(agentState.energy).toBe(75);
    expect(agentState.inventory).toHaveLength(1);
    expect(agentState.customState.mood).toBe('happy');
  });

  BDDTestRunner.scenario('Agent state without optional properties', {
    given: 'an agent state with only required properties',
    when: 'the agent state is created',
    then: 'optional properties should be undefined'
  }, () => {
    const agentState: AgentState = {
      id: 'agent-2',
      position: { x: 0, y: 0 },
      health: 50,
      energy: 25
    };

    expect(agentState.id).toBe('agent-2');
    expect(agentState.inventory).toBeUndefined();
    expect(agentState.customState).toBeUndefined();
  });
});