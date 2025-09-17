/**
 * BDD tests for Simulation configuration and state validation
 */

import { BDDTestRunner } from '../bdd-helpers';
import { SimulationValidator, SimulationConfig, SimulationState } from '../../types/Simulation';
import { WorldState, AgentState } from '../../types/Grid';
import { CellType, ThemeType } from '../../types/Common';

BDDTestRunner.feature('Simulation Configuration Validation', () => {
  
  BDDTestRunner.scenario('Valid simulation configuration', {
    given: 'a simulation configuration with all valid parameters',
    when: 'the configuration is validated',
    then: 'no validation errors should be returned'
  }, () => {
    const config: SimulationConfig = {
      gridSize: { width: 20, height: 15 },
      tickRate: 10,
      maxAgents: 50,
      worldRules: {
        allowDiagonalMovement: true,
        maxAgentsPerCell: 1,
        energyConsumptionPerMove: 1,
        collisionBehavior: 'block',
        communicationRange: 3
      }
    };

    const errors = SimulationValidator.validateSimulationConfig(config);
    expect(errors).toHaveLength(0);
  });

  BDDTestRunner.scenario('Invalid simulation configuration with zero grid size', {
    given: 'a simulation configuration with zero grid dimensions',
    when: 'the configuration is validated',
    then: 'validation errors should include invalid grid size'
  }, () => {
    const config: SimulationConfig = {
      gridSize: { width: 0, height: 10 },
      tickRate: 10,
      maxAgents: 50,
      worldRules: {
        allowDiagonalMovement: true,
        maxAgentsPerCell: 1,
        energyConsumptionPerMove: 1,
        collisionBehavior: 'block',
        communicationRange: 3
      }
    };

    const errors = SimulationValidator.validateSimulationConfig(config);
    expect(errors).toContain('Valid grid size is required');
  });

  BDDTestRunner.scenario('Invalid simulation configuration with excessive grid size', {
    given: 'a simulation configuration with grid size exceeding maximum',
    when: 'the configuration is validated',
    then: 'validation errors should include grid size limit exceeded'
  }, () => {
    const config: SimulationConfig = {
      gridSize: { width: 1500, height: 800 },
      tickRate: 10,
      maxAgents: 50,
      worldRules: {
        allowDiagonalMovement: true,
        maxAgentsPerCell: 1,
        energyConsumptionPerMove: 1,
        collisionBehavior: 'block',
        communicationRange: 3
      }
    };

    const errors = SimulationValidator.validateSimulationConfig(config);
    expect(errors).toContain('Grid size cannot exceed 1000x1000');
  });

  BDDTestRunner.scenario('Invalid simulation configuration with negative tick rate', {
    given: 'a simulation configuration with negative tick rate',
    when: 'the configuration is validated',
    then: 'validation errors should include positive tick rate requirement'
  }, () => {
    const config: SimulationConfig = {
      gridSize: { width: 10, height: 10 },
      tickRate: -5,
      maxAgents: 10,
      worldRules: {
        allowDiagonalMovement: true,
        maxAgentsPerCell: 1,
        energyConsumptionPerMove: 1,
        collisionBehavior: 'block',
        communicationRange: 3
      }
    };

    const errors = SimulationValidator.validateSimulationConfig(config);
    expect(errors).toContain('Tick rate must be positive');
  });

  BDDTestRunner.scenario('Invalid simulation configuration with excessive tick rate', {
    given: 'a simulation configuration with tick rate exceeding maximum',
    when: 'the configuration is validated',
    then: 'validation errors should include tick rate limit'
  }, () => {
    const config: SimulationConfig = {
      gridSize: { width: 10, height: 10 },
      tickRate: 1500,
      maxAgents: 10,
      worldRules: {
        allowDiagonalMovement: true,
        maxAgentsPerCell: 1,
        energyConsumptionPerMove: 1,
        collisionBehavior: 'block',
        communicationRange: 3
      }
    };

    const errors = SimulationValidator.validateSimulationConfig(config);
    expect(errors).toContain('Tick rate cannot exceed 1000 ticks per second');
  });

  BDDTestRunner.scenario('Invalid simulation configuration with excessive max agents', {
    given: 'a simulation configuration with more agents than grid capacity',
    when: 'the configuration is validated',
    then: 'validation errors should include agent capacity exceeded'
  }, () => {
    const config: SimulationConfig = {
      gridSize: { width: 5, height: 5 }, // 25 cells total
      tickRate: 10,
      maxAgents: 30, // More than 25 cells
      worldRules: {
        allowDiagonalMovement: true,
        maxAgentsPerCell: 1,
        energyConsumptionPerMove: 1,
        collisionBehavior: 'block',
        communicationRange: 3
      }
    };

    const errors = SimulationValidator.validateSimulationConfig(config);
    expect(errors).toContain('Max agents cannot exceed grid capacity');
  });
});

BDDTestRunner.feature('Simulation State Validation', () => {
  
  const mockWorldState: WorldState = {
    grid: [
      [{ type: CellType.Empty }, { type: CellType.Wall }],
      [{ type: CellType.Goal }, { type: CellType.Empty }]
    ],
    agents: new Map<string, AgentState>(),
    dimensions: { width: 2, height: 2 },
    tick: 5
  };

  const mockConfig: SimulationConfig = {
    gridSize: { width: 2, height: 2 },
    tickRate: 10,
    maxAgents: 4,
    worldRules: {
      allowDiagonalMovement: true,
      maxAgentsPerCell: 1,
      energyConsumptionPerMove: 1,
      collisionBehavior: 'block',
      communicationRange: 3
    }
  };

  BDDTestRunner.scenario('Valid simulation state', {
    given: 'a simulation state with all valid properties',
    when: 'the simulation state is validated',
    then: 'no validation errors should be returned'
  }, () => {
    const state: SimulationState = {
      isRunning: true,
      isPaused: false,
      currentTick: 10,
      worldState: mockWorldState,
      agents: [],
      config: mockConfig,
      startTime: new Date()
    };

    const errors = SimulationValidator.validateSimulationState(state);
    expect(errors).toHaveLength(0);
  });

  BDDTestRunner.scenario('Invalid simulation state with negative tick', {
    given: 'a simulation state with negative current tick',
    when: 'the simulation state is validated',
    then: 'validation errors should include negative tick error'
  }, () => {
    const state: SimulationState = {
      isRunning: false,
      isPaused: false,
      currentTick: -5,
      worldState: mockWorldState,
      agents: [],
      config: mockConfig
    };

    const errors = SimulationValidator.validateSimulationState(state);
    expect(errors).toContain('Current tick cannot be negative');
  });

  BDDTestRunner.scenario('Invalid simulation state with too many agents', {
    given: 'a simulation state with more agents than the maximum allowed',
    when: 'the simulation state is validated',
    then: 'validation errors should include agent count exceeded'
  }, () => {
    const state: SimulationState = {
      isRunning: false,
      isPaused: false,
      currentTick: 0,
      worldState: mockWorldState,
      agents: new Array(10).fill(null), // More than maxAgents (4)
      config: mockConfig
    };

    const errors = SimulationValidator.validateSimulationState(state);
    expect(errors).toContain('Agent count exceeds maximum allowed');
  });

  BDDTestRunner.scenario('Invalid simulation state with missing world state', {
    given: 'a simulation state without world state',
    when: 'the simulation state is validated',
    then: 'validation errors should include missing world state'
  }, () => {
    const state: SimulationState = {
      isRunning: false,
      isPaused: false,
      currentTick: 0,
      worldState: null as any,
      agents: [],
      config: mockConfig
    };

    const errors = SimulationValidator.validateSimulationState(state);
    expect(errors).toContain('World state is required');
  });
});

BDDTestRunner.feature('Preferences and Accessibility', () => {
  
  BDDTestRunner.scenario('Valid accessibility options', {
    given: 'accessibility options with all valid settings',
    when: 'the options are applied',
    then: 'all settings should be properly configured'
  }, () => {
    const accessibilityOptions = {
      theme: ThemeType.HighContrast,
      fontSize: 'large' as const,
      reducedMotion: true,
      screenReaderOptimized: true
    };

    expect(accessibilityOptions.theme).toBe(ThemeType.HighContrast);
    expect(accessibilityOptions.fontSize).toBe('large');
    expect(accessibilityOptions.reducedMotion).toBe(true);
    expect(accessibilityOptions.screenReaderOptimized).toBe(true);
  });

  BDDTestRunner.scenario('Theme switching functionality', {
    given: 'different theme options',
    when: 'themes are selected',
    then: 'the correct theme values should be set'
  }, () => {
    const lightTheme = ThemeType.Light;
    const darkTheme = ThemeType.Dark;
    const highContrastTheme = ThemeType.HighContrast;

    expect(lightTheme).toBe('light');
    expect(darkTheme).toBe('dark');
    expect(highContrastTheme).toBe('high-contrast');
  });
});