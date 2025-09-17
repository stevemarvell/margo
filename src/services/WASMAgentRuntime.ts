/**
 * WebAssembly agent runtime system for loading, validating, and managing WASM agents
 */

import { WASMAgentModule } from '../types/Agent';
import { WorldState, AgentState } from '../types/Grid';
import { Position, Direction } from '../types/Common';

export interface WASMAgentInterface {
  step: (worldStatePtr: number, agentStatePtr: number) => number;
  initialize?: () => void;
  cleanup?: () => void;
}

export interface WASMMemoryLayout {
  worldStateOffset: number;
  agentStateOffset: number;
  resultOffset: number;
  memorySize: number;
}

export interface WASMExecutionConfig {
  timeoutMs: number;
  maxMemoryPages: number;
  enableSandboxing: boolean;
}

/**
 * WASM Agent Loader - handles loading and compilation of WASM modules
 */
export class WASMAgentLoader {
  private static readonly DEFAULT_CONFIG: WASMExecutionConfig = {
    timeoutMs: 5000,
    maxMemoryPages: 16, // 1MB max memory
    enableSandboxing: true
  };

  /**
   * Load WASM module from binary data
   */
  static async loadFromBinary(wasmBinary: Uint8Array, config?: Partial<WASMExecutionConfig>): Promise<WASMAgentModule> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    
    try {
      // Validate WASM binary format
      this.validateWASMBinary(wasmBinary);
      
      // Compile the WASM module
      const module = await WebAssembly.compile(wasmBinary);
      
      // Validate module exports
      await this.validateModuleExports(module);
      
      return {
        module,
        instance: undefined,
        exports: undefined
      };
    } catch (error) {
      throw new Error(`Failed to load WASM module: ${error}`);
    }
  }

  /**
   * Load WASM module from URL
   */
  static async loadFromURL(url: string, config?: Partial<WASMExecutionConfig>): Promise<WASMAgentModule> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch WASM module: ${response.statusText}`);
      }
      
      const wasmBinary = new Uint8Array(await response.arrayBuffer());
      return this.loadFromBinary(wasmBinary, config);
    } catch (error) {
      throw new Error(`Failed to load WASM module from URL: ${error}`);
    }
  }

  /**
   * Instantiate a WASM module with proper imports and memory management
   */
  static async instantiateModule(wasmModule: WASMAgentModule, config?: Partial<WASMExecutionConfig>): Promise<void> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    
    try {
      // Create memory with size limits
      const memory = new WebAssembly.Memory({ 
        initial: 1, 
        maximum: finalConfig.maxMemoryPages 
      });
      
      // Define imports for the WASM module
      const imports = {
        env: {
          memory,
          // Utility functions that WASM agents can call
          log: (ptr: number, len: number) => {
            const view = new Uint8Array(memory.buffer, ptr, len);
            const message = new TextDecoder().decode(view);
            console.log(`[WASM Agent]: ${message}`);
          },
          abort: (msg: number, file: number, line: number, column: number) => {
            throw new Error(`WASM agent aborted at ${file}:${line}:${column}`);
          }
        }
      };
      
      // Instantiate with timeout protection
      const instance = await Promise.race([
        WebAssembly.instantiate(wasmModule.module, imports),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('WASM instantiation timeout')), finalConfig.timeoutMs)
        )
      ]);
      
      wasmModule.instance = instance;
      wasmModule.exports = instance.exports as WASMAgentInterface;
      
      // Call initialize if available
      if (wasmModule.exports.initialize) {
        wasmModule.exports.initialize();
      }
      
    } catch (error) {
      throw new Error(`Failed to instantiate WASM module: ${error}`);
    }
  }

  /**
   * Validate WASM binary format
   */
  private static validateWASMBinary(binary: Uint8Array): void {
    if (binary.length < 8) {
      throw new Error('Invalid WASM binary: too short');
    }
    
    // Check WASM magic number (0x00 0x61 0x73 0x6d)
    const magicNumber = new Uint32Array(binary.buffer.slice(0, 4))[0];
    if (magicNumber !== 0x6d736100) {
      throw new Error('Invalid WASM binary: incorrect magic number');
    }
    
    // Check version (0x01 0x00 0x00 0x00)
    const version = new Uint32Array(binary.buffer.slice(4, 8))[0];
    if (version !== 0x00000001) {
      throw new Error('Unsupported WASM version');
    }
  }

  /**
   * Validate that module has required exports
   */
  private static async validateModuleExports(module: WebAssembly.Module): Promise<void> {
    const exports = WebAssembly.Module.exports(module);
    const exportNames = exports.map(exp => exp.name);
    
    // Check for required step function
    if (!exportNames.includes('step')) {
      throw new Error('WASM module must export a "step" function');
    }
    
    // Validate step function signature
    const stepExport = exports.find(exp => exp.name === 'step');
    if (stepExport?.kind !== 'function') {
      throw new Error('WASM "step" export must be a function');
    }
  }
}

/**
 * WASM Memory Manager - handles serialization and memory management
 */
export class WASMMemoryManager {
  private memory: WebAssembly.Memory;
  private memoryView: DataView;
  private textEncoder: TextEncoder;
  private textDecoder: TextDecoder;
  private nextOffset: number;

  constructor(memory: WebAssembly.Memory) {
    this.memory = memory;
    this.memoryView = new DataView(memory.buffer);
    this.textEncoder = new TextEncoder();
    this.textDecoder = new TextDecoder();
    this.nextOffset = 0;
  }

  /**
   * Serialize world state to WASM memory
   */
  serializeWorldState(worldState: WorldState): number {
    const startOffset = this.allocateMemory(1024); // Allocate 1KB for world state
    let offset = startOffset;
    
    try {
      // Write dimensions
      this.memoryView.setUint32(offset, worldState.dimensions.width, true);
      offset += 4;
      this.memoryView.setUint32(offset, worldState.dimensions.height, true);
      offset += 4;
      
      // Write tick
      this.memoryView.setUint32(offset, worldState.tick, true);
      offset += 4;
      
      // Write grid data (simplified - just cell types)
      for (let y = 0; y < worldState.dimensions.height; y++) {
        for (let x = 0; x < worldState.dimensions.width; x++) {
          const cell = worldState.grid[y][x];
          this.memoryView.setUint8(offset, this.cellTypeToNumber(cell.type));
          offset += 1;
          
          // Write occupant flag
          this.memoryView.setUint8(offset, cell.occupant ? 1 : 0);
          offset += 1;
        }
      }
      
      // Write agent count
      this.memoryView.setUint32(offset, worldState.agents.size, true);
      offset += 4;
      
      // Write agent positions (simplified)
      for (const [agentId, agentState] of worldState.agents) {
        this.memoryView.setUint32(offset, agentState.position.x, true);
        offset += 4;
        this.memoryView.setUint32(offset, agentState.position.y, true);
        offset += 4;
      }
      
      return startOffset;
    } catch (error) {
      throw new Error(`Failed to serialize world state: ${error}`);
    }
  }

  /**
   * Serialize agent state to WASM memory
   */
  serializeAgentState(agentState: AgentState): number {
    const startOffset = this.allocateMemory(64); // Allocate 64 bytes for agent state
    let offset = startOffset;
    
    try {
      // Write position
      this.memoryView.setUint32(offset, agentState.position.x, true);
      offset += 4;
      this.memoryView.setUint32(offset, agentState.position.y, true);
      offset += 4;
      
      // Write health and energy
      this.memoryView.setUint32(offset, agentState.health, true);
      offset += 4;
      this.memoryView.setUint32(offset, agentState.energy, true);
      offset += 4;
      
      // Write inventory count
      const inventoryCount = agentState.inventory?.length || 0;
      this.memoryView.setUint32(offset, inventoryCount, true);
      offset += 4;
      
      return startOffset;
    } catch (error) {
      throw new Error(`Failed to serialize agent state: ${error}`);
    }
  }

  /**
   * Deserialize agent action from WASM memory
   */
  deserializeAgentAction(ptr: number): { type: string; direction?: Direction; message?: string; customData?: any } {
    try {
      let offset = ptr;
      
      // Read action type (0=wait, 1=move, 2=communicate, 3=custom)
      const actionType = this.memoryView.getUint8(offset);
      offset += 1;
      
      switch (actionType) {
        case 0:
          return { type: 'wait' };
        
        case 1: {
          // Read direction (0=north, 1=south, 2=east, 3=west, etc.)
          const directionCode = this.memoryView.getUint8(offset);
          const direction = this.numberToDirection(directionCode);
          return { type: 'move', direction };
        }
        
        case 2: {
          // Read message length and content
          const messageLength = this.memoryView.getUint32(offset, true);
          offset += 4;
          
          const messageBytes = new Uint8Array(this.memory.buffer, offset, messageLength);
          const message = this.textDecoder.decode(messageBytes);
          
          return { type: 'communicate', message };
        }
        
        case 3: {
          // Custom action - read data length and content
          const dataLength = this.memoryView.getUint32(offset, true);
          offset += 4;
          
          const dataBytes = new Uint8Array(this.memory.buffer, offset, dataLength);
          const customData = this.textDecoder.decode(dataBytes);
          
          return { type: 'custom', customData: JSON.parse(customData) };
        }
        
        default:
          throw new Error(`Unknown action type: ${actionType}`);
      }
    } catch (error) {
      console.warn('Failed to deserialize agent action:', error);
      return { type: 'wait' }; // Fallback to safe action
    }
  }

  /**
   * Allocate memory block and return offset
   */
  private allocateMemory(size: number): number {
    const offset = this.nextOffset;
    this.nextOffset += size;
    
    // Check if we need to grow memory
    const requiredPages = Math.ceil(this.nextOffset / 65536); // 64KB per page
    if (requiredPages > this.memory.buffer.byteLength / 65536) {
      this.memory.grow(1);
      this.memoryView = new DataView(this.memory.buffer); // Update view after growth
    }
    
    return offset;
  }

  /**
   * Convert cell type enum to number for WASM
   */
  private cellTypeToNumber(cellType: string): number {
    const typeMap: Record<string, number> = {
      'empty': 0,
      'wall': 1,
      'goal': 2,
      'hazard': 3,
      'resource': 4
    };
    return typeMap[cellType] || 0;
  }

  /**
   * Convert number to Direction enum
   */
  private numberToDirection(directionCode: number): Direction {
    const directions = [
      Direction.North,
      Direction.South,
      Direction.East,
      Direction.West,
      Direction.Northeast,
      Direction.Northwest,
      Direction.Southeast,
      Direction.Southwest
    ];
    
    return directions[directionCode] || Direction.North;
  }

  /**
   * Reset memory allocation pointer
   */
  reset(): void {
    this.nextOffset = 0;
  }
}

/**
 * WASM Agent Validator - validates WASM modules and execution
 */
export class WASMAgentValidator {
  /**
   * Validate WASM module structure and exports
   */
  static validateModule(wasmModule: WASMAgentModule): string[] {
    const errors: string[] = [];
    
    if (!wasmModule.module) {
      errors.push('WASM module is required');
      return errors;
    }
    
    try {
      const exports = WebAssembly.Module.exports(wasmModule.module);
      const exportNames = exports.map(exp => exp.name);
      
      // Check required exports
      if (!exportNames.includes('step')) {
        errors.push('WASM module must export "step" function');
      }
      
      // Check optional exports
      const stepExport = exports.find(exp => exp.name === 'step');
      if (stepExport && stepExport.kind !== 'function') {
        errors.push('WASM "step" export must be a function');
      }
      
      // Validate imports
      const imports = WebAssembly.Module.imports(wasmModule.module);
      for (const imp of imports) {
        if (imp.module !== 'env') {
          errors.push(`Unsupported import module: ${imp.module}`);
        }
      }
      
    } catch (error) {
      errors.push(`Failed to validate WASM module: ${error}`);
    }
    
    return errors;
  }

  /**
   * Validate WASM execution environment
   */
  static validateExecutionEnvironment(wasmModule: WASMAgentModule): string[] {
    const errors: string[] = [];
    
    if (!wasmModule.instance) {
      errors.push('WASM module not instantiated');
      return errors;
    }
    
    if (!wasmModule.exports) {
      errors.push('WASM module exports not available');
      return errors;
    }
    
    if (typeof wasmModule.exports.step !== 'function') {
      errors.push('WASM step function not callable');
    }
    
    return errors;
  }

  /**
   * Validate agent action returned from WASM
   */
  static validateAgentAction(action: any): string[] {
    const errors: string[] = [];
    
    if (!action || typeof action !== 'object') {
      errors.push('Agent action must be an object');
      return errors;
    }
    
    if (!action.type || typeof action.type !== 'string') {
      errors.push('Agent action must have a valid type');
    }
    
    const validTypes = ['move', 'wait', 'communicate', 'custom'];
    if (!validTypes.includes(action.type)) {
      errors.push(`Invalid action type: ${action.type}`);
    }
    
    if (action.type === 'move' && !action.direction) {
      errors.push('Move action must specify direction');
    }
    
    if (action.type === 'communicate' && !action.message) {
      errors.push('Communicate action must specify message');
    }
    
    return errors;
  }

  /**
   * Check if WASM module is safe to execute
   */
  static isSafeToExecute(wasmModule: WASMAgentModule): boolean {
    const moduleErrors = this.validateModule(wasmModule);
    const executionErrors = this.validateExecutionEnvironment(wasmModule);
    
    return moduleErrors.length === 0 && executionErrors.length === 0;
  }
}

/**
 * WASM Execution Sandbox - provides isolated execution environment
 */
export class WASMExecutionSandbox {
  private config: WASMExecutionConfig;
  private memoryManager: WASMMemoryManager;

  constructor(config: WASMExecutionConfig, memory: WebAssembly.Memory) {
    this.config = config;
    this.memoryManager = new WASMMemoryManager(memory);
  }

  /**
   * Execute WASM agent step function with timeout and error handling
   */
  async executeStep(
    wasmModule: WASMAgentModule, 
    worldState: WorldState, 
    agentState: AgentState
  ): Promise<{ type: string; direction?: Direction; message?: string; customData?: any }> {
    
    if (!WASMAgentValidator.isSafeToExecute(wasmModule)) {
      throw new Error('WASM module is not safe to execute');
    }
    
    try {
      // Serialize input data
      const worldStatePtr = this.memoryManager.serializeWorldState(worldState);
      const agentStatePtr = this.memoryManager.serializeAgentState(agentState);
      
      // Execute with timeout
      const resultPtr = await Promise.race([
        Promise.resolve(wasmModule.exports!.step(worldStatePtr, agentStatePtr)),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('WASM execution timeout')), this.config.timeoutMs)
        )
      ]);
      
      // Deserialize result
      const action = this.memoryManager.deserializeAgentAction(resultPtr);
      
      // Validate result
      const actionErrors = WASMAgentValidator.validateAgentAction(action);
      if (actionErrors.length > 0) {
        console.warn('Invalid WASM action:', actionErrors);
        return { type: 'wait' }; // Fallback to safe action
      }
      
      return action;
      
    } catch (error) {
      console.error('WASM execution error:', error);
      return { type: 'wait' }; // Fallback to safe action
    } finally {
      // Reset memory for next execution
      this.memoryManager.reset();
    }
  }
}