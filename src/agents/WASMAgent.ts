/**
 * WebAssembly agent implementation
 */

import { BaseAgent } from './BaseAgent';
import { AgentAction, WASMAgentModule } from '../types/Agent';
import { WorldState, AgentState } from '../types/Grid';
import { AgentType } from '../types/Common';
import { 
  WASMAgentLoader, 
  WASMAgentValidator, 
  WASMExecutionSandbox,
  WASMExecutionConfig 
} from '../services/WASMAgentRuntime';

export class WASMAgent extends BaseAgent {
  private wasmModule: WASMAgentModule;
  private executionSandbox?: WASMExecutionSandbox;
  private executionConfig: WASMExecutionConfig;

  constructor(id: string, name: string, wasmModule: WASMAgentModule, config?: Partial<WASMExecutionConfig>) {
    super(id, name, AgentType.WASM);
    this.wasmModule = wasmModule;
    this.executionConfig = {
      timeoutMs: 5000,
      maxMemoryPages: 16,
      enableSandboxing: true,
      ...config
    };
  }

  async initialize(): Promise<void> {
    try {
      // Validate the WASM module before instantiation
      const moduleErrors = WASMAgentValidator.validateModule(this.wasmModule);
      if (moduleErrors.length > 0) {
        throw new Error(`WASM module validation failed: ${moduleErrors.join(', ')}`);
      }

      // Instantiate the WASM module using the loader
      await WASMAgentLoader.instantiateModule(this.wasmModule, this.executionConfig);
      
      // Validate the execution environment
      const executionErrors = WASMAgentValidator.validateExecutionEnvironment(this.wasmModule);
      if (executionErrors.length > 0) {
        throw new Error(`WASM execution environment validation failed: ${executionErrors.join(', ')}`);
      }

      // Create execution sandbox if sandboxing is enabled
      if (this.executionConfig.enableSandboxing && this.wasmModule.instance) {
        const memory = this.wasmModule.instance.exports.memory as WebAssembly.Memory;
        if (memory) {
          this.executionSandbox = new WASMExecutionSandbox(this.executionConfig, memory);
        }
      }
      
    } catch (error) {
      throw new Error(`Failed to initialize WASM agent: ${error}`);
    }
  }

  step(worldState: WorldState, agentState: AgentState): AgentAction {
    if (!this.wasmModule.instance || !this.wasmModule.exports) {
      throw new Error('WASM agent not initialized');
    }

    try {
      let action: AgentAction;

      if (this.executionSandbox) {
        // Use sandboxed execution
        const result = this.executionSandbox.executeStep(this.wasmModule, worldState, agentState);
        // Convert the result to AgentAction format
        action = result as AgentAction;
      } else {
        // Direct execution (less safe)
        action = this.executeDirectly(worldState, agentState);
      }
      
      // Validate the action before returning
      this.validateAction(action);
      return action;
      
    } catch (error) {
      // Fallback to wait action if WASM execution fails
      console.error('WASM agent execution failed:', error);
      const fallbackAction: AgentAction = { type: 'wait' };
      this.validateAction(fallbackAction);
      return fallbackAction;
    }
  }

  cleanup(): void {
    super.cleanup();
    
    // Call WASM cleanup if available
    if (this.wasmModule.exports?.cleanup) {
      try {
        this.wasmModule.exports.cleanup();
      } catch (error) {
        console.warn('Error during WASM cleanup:', error);
      }
    }
    
    this.wasmModule.instance = undefined;
    this.wasmModule.exports = undefined;
    this.executionSandbox = undefined;
  }

  /**
   * Get WASM module information
   */
  getModuleInfo(): { hasStep: boolean; hasInitialize: boolean; hasCleanup: boolean } {
    if (!this.wasmModule.exports) {
      return { hasStep: false, hasInitialize: false, hasCleanup: false };
    }

    return {
      hasStep: typeof this.wasmModule.exports.step === 'function',
      hasInitialize: typeof this.wasmModule.exports.initialize === 'function',
      hasCleanup: typeof this.wasmModule.exports.cleanup === 'function'
    };
  }

  /**
   * Update execution configuration
   */
  updateConfig(config: Partial<WASMExecutionConfig>): void {
    this.executionConfig = { ...this.executionConfig, ...config };
  }

  /**
   * Direct execution without sandbox (for testing or trusted modules)
   */
  private executeDirectly(worldState: WorldState, agentState: AgentState): AgentAction {
    // This is a simplified direct execution
    // In a real implementation, you would properly serialize/deserialize data
    
    try {
      // For now, just call the step function with dummy pointers
      const resultPtr = this.wasmModule.exports!.step(0, 0);
      
      // Return a basic action based on the result
      // This is simplified - real implementation would deserialize properly
      return { type: 'wait' };
      
    } catch (error) {
      console.error('Direct WASM execution failed:', error);
      return { type: 'wait' };
    }
  }
}

export class RustCompiledAgent extends BaseAgent {
  private rustCode: string;
  private compiledModule?: WASMAgentModule;
  private wasmAgent?: WASMAgent;
  private compilationErrors: string[] = [];

  constructor(id: string, name: string, rustCode: string) {
    super(id, name, AgentType.RustCompiled);
    this.rustCode = rustCode;
  }

  async compile(): Promise<void> {
    try {
      // This would integrate with rust-wasm-bindgen for actual compilation
      // For now, this is a placeholder implementation that simulates compilation
      
      // Validate Rust code syntax (basic check)
      this.validateRustCode(this.rustCode);
      
      // In a real implementation, this would:
      // 1. Write Rust code to temporary file
      // 2. Call wasm-pack or similar tool to compile
      // 3. Load the resulting WASM binary
      // 4. Create WASMAgentModule from the binary
      
      throw new Error('Rust compilation not yet implemented - requires rust-wasm-bindgen integration');
      
    } catch (error) {
      this.compilationErrors.push(`Compilation failed: ${error}`);
      throw new Error(`Failed to compile Rust code: ${error}`);
    }
  }

  async initialize(): Promise<void> {
    if (!this.compiledModule) {
      throw new Error('Rust agent must be compiled before initialization');
    }

    // Create and initialize the underlying WASM agent
    this.wasmAgent = new WASMAgent(this.id, this.name, this.compiledModule);
    await this.wasmAgent.initialize();
  }

  step(worldState: WorldState, agentState: AgentState): AgentAction {
    if (!this.wasmAgent) {
      throw new Error('Rust agent not compiled or initialized');
    }

    // Delegate to the compiled WASM agent
    return this.wasmAgent.step(worldState, agentState);
  }

  cleanup(): void {
    super.cleanup();
    
    if (this.wasmAgent) {
      this.wasmAgent.cleanup();
      this.wasmAgent = undefined;
    }
    
    this.compiledModule = undefined;
    this.compilationErrors = [];
  }

  /**
   * Get the Rust source code
   */
  getRustCode(): string {
    return this.rustCode;
  }

  /**
   * Update the Rust source code
   */
  updateRustCode(newCode: string): void {
    this.rustCode = newCode;
    this.compiledModule = undefined; // Mark as needing recompilation
    this.compilationErrors = [];
    
    if (this.wasmAgent) {
      this.wasmAgent.cleanup();
      this.wasmAgent = undefined;
    }
  }

  /**
   * Get compilation errors
   */
  getCompilationErrors(): string[] {
    return [...this.compilationErrors];
  }

  /**
   * Check if the agent is compiled and ready
   */
  isCompiled(): boolean {
    return this.compiledModule !== undefined;
  }

  /**
   * Check if the agent is initialized and ready to execute
   */
  isInitialized(): boolean {
    return this.wasmAgent !== undefined;
  }

  /**
   * Get information about the compiled WASM module
   */
  getModuleInfo(): { hasStep: boolean; hasInitialize: boolean; hasCleanup: boolean } | null {
    return this.wasmAgent?.getModuleInfo() || null;
  }

  /**
   * Basic Rust code validation
   */
  private validateRustCode(code: string): void {
    if (!code || code.trim().length === 0) {
      throw new Error('Rust code cannot be empty');
    }

    // Basic syntax checks
    if (!code.includes('fn ') && !code.includes('pub fn ')) {
      throw new Error('Rust code must contain at least one function');
    }

    // Check for required step function (basic pattern matching)
    if (!code.includes('step') || !code.includes('fn step')) {
      console.warn('Rust code should include a "step" function for agent behavior');
    }

    // Check for potentially unsafe operations
    const unsafePatterns = ['unsafe', 'std::process', 'std::fs', 'std::net'];
    for (const pattern of unsafePatterns) {
      if (code.includes(pattern)) {
        throw new Error(`Potentially unsafe Rust code detected: ${pattern}`);
      }
    }
  }
}