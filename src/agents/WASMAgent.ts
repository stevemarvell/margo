/**
 * WebAssembly agent implementation
 */

import { BaseAgent } from './BaseAgent';
import { AgentAction, WASMAgentModule } from '../types/Agent';
import { WorldState, AgentState } from '../types/Grid';
import { AgentType } from '../types/Common';

export class WASMAgent extends BaseAgent {
  private wasmModule: WASMAgentModule;

  constructor(id: string, name: string, wasmModule: WASMAgentModule) {
    super(id, name, AgentType.WASM);
    this.wasmModule = wasmModule;
  }

  async initialize(): Promise<void> {
    try {
      this.wasmModule.instance = await WebAssembly.instantiate(this.wasmModule.module);
      this.wasmModule.exports = this.wasmModule.instance.exports;
      
      // Validate that the WASM module has the required exports
      if (!this.wasmModule.exports.step) {
        throw new Error('WASM module must export a "step" function');
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
      // Convert JavaScript objects to WASM-compatible format
      const worldStateBuffer = this.serializeWorldState(worldState);
      const agentStateBuffer = this.serializeAgentState(agentState);
      
      // Call the WASM step function
      const resultPtr = this.wasmModule.exports.step(worldStateBuffer, agentStateBuffer);
      
      // Deserialize the result back to JavaScript
      const action = this.deserializeAgentAction(resultPtr);
      
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
    this.wasmModule.instance = undefined;
    this.wasmModule.exports = undefined;
  }

  private serializeWorldState(worldState: WorldState): number {
    // This is a simplified serialization - in a real implementation,
    // you would need to properly serialize the world state to WASM memory
    // For now, return a placeholder pointer
    return 0;
  }

  private serializeAgentState(agentState: AgentState): number {
    // This is a simplified serialization - in a real implementation,
    // you would need to properly serialize the agent state to WASM memory
    // For now, return a placeholder pointer
    return 0;
  }

  private deserializeAgentAction(ptr: number): AgentAction {
    // This is a simplified deserialization - in a real implementation,
    // you would need to properly deserialize from WASM memory
    // For now, return a default wait action
    return { type: 'wait' };
  }
}

export class RustCompiledAgent extends BaseAgent {
  private rustCode: string;
  private compiledModule?: WASMAgentModule;

  constructor(id: string, name: string, rustCode: string) {
    super(id, name, AgentType.RustCompiled);
    this.rustCode = rustCode;
  }

  async compile(): Promise<void> {
    try {
      // This would integrate with rust-wasm-bindgen for actual compilation
      // For now, this is a placeholder implementation
      throw new Error('Rust compilation not yet implemented - requires rust-wasm-bindgen integration');
    } catch (error) {
      throw new Error(`Failed to compile Rust code: ${error}`);
    }
  }

  step(worldState: WorldState, agentState: AgentState): AgentAction {
    if (!this.compiledModule) {
      throw new Error('Rust agent not compiled');
    }

    // Delegate to the compiled WASM module
    const wasmAgent = new WASMAgent(this.id, this.name, this.compiledModule);
    return wasmAgent.step(worldState, agentState);
  }

  getRustCode(): string {
    return this.rustCode;
  }

  updateRustCode(newCode: string): void {
    this.rustCode = newCode;
    this.compiledModule = undefined; // Mark as needing recompilation
  }
}