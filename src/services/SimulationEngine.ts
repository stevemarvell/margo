/**
 * Core simulation engine for managing grid world simulations
 */

import { SimulationConfig, SimulationState, SimulationStatus } from '../types/Simulation';
import { WorldState, AgentState, Cell } from '../types/Grid';
import { Agent, AgentAction } from '../types/Agent';
import { Position, Direction, CellType } from '../types/Common';
import { GridValidator } from '../types/Grid';
import { AgentValidator } from '../types/Agent';

export class SimulationEngine {
  private state: SimulationState;
  private intervalId: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor() {
    this.state = this.createInitialState();
  }

  /**
   * Initialize the simulation engine with configuration
   */
  initialize(config: SimulationConfig): void {
    // Validate configuration
    const configErrors = this.validateConfig(config);
    if (configErrors.length > 0) {
      throw new Error(`Invalid configuration: ${configErrors.join(', ')}`);
    }

    // Stop any running simulation
    this.stop();

    // Create initial world state
    const worldState = this.createWorldState(config.gridSize);

    this.state = {
      isRunning: false,
      isPaused: false,
      currentTick: 0,
      worldState,
      agents: [],
      config
    };

    this.isInitialized = true;
  }

  /**
   * Start or resume the simulation
   */
  play(): void {
    if (!this.isInitialized) {
      throw new Error('Simulation must be initialized before playing');
    }

    if (this.state.isRunning) {
      return; // Already running
    }

    this.state.isRunning = true;
    this.state.isPaused = false;

    // Set start time if this is the first time playing
    if (!this.state.startTime) {
      this.state.startTime = new Date();
    }

    // Start the simulation loop
    this.startSimulationLoop();
  }

  /**
   * Pause the simulation
   */
  pause(): void {
    if (!this.state.isRunning) {
      return; // Already paused or stopped
    }

    this.state.isRunning = false;
    this.state.isPaused = true;
    this.stopSimulationLoop();
  }

  /**
   * Stop and reset the simulation
   */
  reset(): void {
    this.stop();

    if (this.isInitialized) {
      // Reset to initial state but keep configuration
      const config = this.state.config;
      const worldState = this.createWorldState(config.gridSize);

      this.state = {
        isRunning: false,
        isPaused: false,
        currentTick: 0,
        worldState,
        agents: [],
        config,
        startTime: undefined,
        endTime: undefined
      };
    }
  }

  /**
   * Execute a single simulation step
   */
  step(): void {
    if (!this.isInitialized) {
      throw new Error('Simulation must be initialized before stepping');
    }

    this.executeSimulationTick();
  }

  /**
   * Add an agent to the simulation at the specified position
   */
  addAgent(agent: Agent, position: Position): boolean {
    if (!this.isInitialized) {
      throw new Error('Simulation must be initialized before adding agents');
    }

    // Validate agent
    const agentErrors = AgentValidator.validateAgent(agent);
    if (agentErrors.length > 0) {
      console.warn(`Agent validation failed: ${agentErrors.join(', ')}`);
      return false;
    }

    // Validate position
    if (!GridValidator.isValidPosition(position, this.state.worldState.dimensions)) {
      console.warn(`Invalid position: ${position.x}, ${position.y}`);
      return false;
    }

    // Check if position is occupied
    const cell = this.state.worldState.grid[position.y][position.x];
    if (cell.occupant && this.state.config.worldRules.maxAgentsPerCell <= 1) {
      console.warn(`Position ${position.x}, ${position.y} is already occupied`);
      return false;
    }

    // Check if cell is traversable
    if (cell.type === CellType.Wall) {
      console.warn(`Cannot place agent on wall at ${position.x}, ${position.y}`);
      return false;
    }

    // Check agent limit
    if (this.state.agents.length >= this.state.config.maxAgents) {
      console.warn('Maximum agent limit reached');
      return false;
    }

    // Create agent state
    const agentState: AgentState = {
      id: agent.id,
      position: { ...position },
      health: 100,
      energy: 100,
      inventory: []
    };

    // Initialize agent if it has an initialize method
    if (agent.initialize) {
      agent.initialize({
        id: agent.id,
        name: agent.name,
        initialPosition: position,
        initialHealth: 100,
        initialEnergy: 100
      });
    }

    // Add agent to simulation
    this.state.agents.push(agent);
    this.state.worldState.agents.set(agent.id, agentState);
    this.state.worldState.grid[position.y][position.x].occupant = agent.id;

    return true;
  }

  /**
   * Remove an agent from the simulation
   */
  removeAgent(agentId: string): boolean {
    const agentIndex = this.state.agents.findIndex(agent => agent.id === agentId);
    if (agentIndex === -1) {
      return false;
    }

    const agentState = this.state.worldState.agents.get(agentId);
    if (agentState) {
      // Clear the cell occupancy
      const { x, y } = agentState.position;
      this.state.worldState.grid[y][x].occupant = undefined;

      // Remove from world state
      this.state.worldState.agents.delete(agentId);
    }

    // Remove from agents array
    const agent = this.state.agents[agentIndex];
    this.state.agents.splice(agentIndex, 1);

    // Call cleanup if available
    if (agent.cleanup) {
      agent.cleanup();
    }

    return true;
  }

  /**
   * Get the current simulation state
   */
  getState(): SimulationState {
    return { ...this.state };
  }

  /**
   * Stop the simulation completely
   */
  private stop(): void {
    this.state.isRunning = false;
    this.state.isPaused = false;
    this.stopSimulationLoop();

    if (this.state.startTime && !this.state.endTime) {
      this.state.endTime = new Date();
    }
  }

  /**
   * Start the simulation loop with the configured tick rate
   */
  private startSimulationLoop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    const tickInterval = 1000 / this.state.config.tickRate;
    this.intervalId = setInterval(() => {
      if (this.state.isRunning) {
        this.executeSimulationTick();
      }
    }, tickInterval);
  }

  /**
   * Stop the simulation loop
   */
  private stopSimulationLoop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Execute a single simulation tick
   */
  private executeSimulationTick(): void {
    // Process all agents
    for (const agent of this.state.agents) {
      const agentState = this.state.worldState.agents.get(agent.id);
      if (!agentState) continue;

      try {
        // Get agent's action
        const action = agent.step(this.state.worldState, agentState);

        // Validate and execute action
        this.executeAgentAction(agent, agentState, action);
      } catch (error) {
        console.error(`Error executing agent ${agent.id}:`, error);
      }
    }

    // Increment tick counter
    this.state.currentTick++;
    this.state.worldState.tick = this.state.currentTick;
  }

  /**
   * Execute an agent's action
   */
  private executeAgentAction(agent: Agent, agentState: AgentState, action: AgentAction): void {
    // Validate action
    const actionErrors = AgentValidator.validateAgentAction(action);
    if (actionErrors.length > 0) {
      console.warn(`Invalid action from agent ${agent.id}: ${actionErrors.join(', ')}`);
      return;
    }

    switch (action.type) {
      case 'move':
        this.executeMove(agentState, action.direction!);
        break;
      case 'wait':
        // Agent does nothing this tick
        break;
      case 'communicate':
        this.executeCommunicate(agentState, action.message!);
        break;
      case 'custom':
        // Handle custom actions - for now just log
        console.log(`Custom action from agent ${agent.id}:`, action.customData);
        break;
    }
  }

  /**
   * Execute a move action for an agent
   */
  private executeMove(agentState: AgentState, direction: Direction): void {
    const newPosition = this.calculateNewPosition(agentState.position, direction);

    // Check if new position is valid
    if (!GridValidator.isValidPosition(newPosition, this.state.worldState.dimensions)) {
      return; // Can't move outside grid
    }

    const targetCell = this.state.worldState.grid[newPosition.y][newPosition.x];

    // Check if target cell is traversable
    if (targetCell.type === CellType.Wall) {
      return; // Can't move into wall
    }

    // Check collision behavior
    if (targetCell.occupant && this.state.config.worldRules.collisionBehavior === 'block') {
      return; // Blocked by another agent
    }

    // Check diagonal movement rules
    if (!this.state.config.worldRules.allowDiagonalMovement && this.isDiagonalMove(direction)) {
      return; // Diagonal movement not allowed
    }

    // Execute the move
    const oldPosition = agentState.position;

    // Clear old position
    this.state.worldState.grid[oldPosition.y][oldPosition.x].occupant = undefined;

    // Set new position
    agentState.position = newPosition;
    this.state.worldState.grid[newPosition.y][newPosition.x].occupant = agentState.id;

    // Consume energy
    agentState.energy = Math.max(0, agentState.energy - this.state.config.worldRules.energyConsumptionPerMove);
  }

  /**
   * Execute a communicate action for an agent
   */
  private executeCommunicate(agentState: AgentState, message: string): void {
    // Find agents within communication range
    const range = this.state.config.worldRules.communicationRange;
    const nearbyAgents = Array.from(this.state.worldState.agents.values()).filter(otherAgent => {
      if (otherAgent.id === agentState.id) return false;

      const distance = Math.abs(otherAgent.position.x - agentState.position.x) +
        Math.abs(otherAgent.position.y - agentState.position.y);
      return distance <= range;
    });

    // For now, just log the communication
    console.log(`Agent ${agentState.id} communicates "${message}" to ${nearbyAgents.length} nearby agents`);
  }

  /**
   * Calculate new position based on current position and direction
   */
  private calculateNewPosition(position: Position, direction: Direction): Position {
    const newPosition = { ...position };

    switch (direction) {
      case Direction.North:
        newPosition.y--;
        break;
      case Direction.South:
        newPosition.y++;
        break;
      case Direction.East:
        newPosition.x++;
        break;
      case Direction.West:
        newPosition.x--;
        break;
      case Direction.Northeast:
        newPosition.x++;
        newPosition.y--;
        break;
      case Direction.Northwest:
        newPosition.x--;
        newPosition.y--;
        break;
      case Direction.Southeast:
        newPosition.x++;
        newPosition.y++;
        break;
      case Direction.Southwest:
        newPosition.x--;
        newPosition.y++;
        break;
    }

    return newPosition;
  }

  /**
   * Check if a direction represents diagonal movement
   */
  private isDiagonalMove(direction: Direction): boolean {
    return [
      Direction.Northeast,
      Direction.Northwest,
      Direction.Southeast,
      Direction.Southwest
    ].includes(direction);
  }

  /**
   * Create initial world state with empty grid
   */
  private createWorldState(dimensions: { width: number; height: number }): WorldState {
    const grid: Cell[][] = [];

    for (let y = 0; y < dimensions.height; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < dimensions.width; x++) {
        row.push({
          type: CellType.Empty,
          properties: {
            traversable: true,
            cost: 1
          }
        });
      }
      grid.push(row);
    }

    return {
      grid,
      agents: new Map(),
      dimensions,
      tick: 0
    };
  }

  /**
   * Create initial simulation state
   */
  private createInitialState(): SimulationState {
    return {
      isRunning: false,
      isPaused: false,
      currentTick: 0,
      worldState: {
        grid: [],
        agents: new Map(),
        dimensions: { width: 0, height: 0 },
        tick: 0
      },
      agents: [],
      config: {
        gridSize: { width: 0, height: 0 },
        tickRate: 10,
        maxAgents: 0,
        worldRules: {
          allowDiagonalMovement: true,
          maxAgentsPerCell: 1,
          energyConsumptionPerMove: 1,
          collisionBehavior: 'block',
          communicationRange: 3
        }
      }
    };
  }

  /**
   * Validate simulation configuration
   */
  private validateConfig(config: SimulationConfig): string[] {
    const errors: string[] = [];

    if (!config.gridSize || config.gridSize.width <= 0 || config.gridSize.height <= 0) {
      errors.push('Valid grid size is required');
    }

    if (config.gridSize.width > 1000 || config.gridSize.height > 1000) {
      errors.push('Grid size cannot exceed 1000x1000');
    }

    if (config.tickRate <= 0) {
      errors.push('Tick rate must be positive');
    }

    if (config.tickRate > 1000) {
      errors.push('Tick rate cannot exceed 1000 ticks per second');
    }

    if (config.maxAgents <= 0) {
      errors.push('Max agents must be positive');
    }

    if (config.maxAgents > config.gridSize.width * config.gridSize.height) {
      errors.push('Max agents cannot exceed grid capacity');
    }

    if (!config.worldRules) {
      errors.push('World rules are required');
    }

    return errors;
  }
}