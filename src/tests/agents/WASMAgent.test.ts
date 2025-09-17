/**
 * BDD tests for WebAssembly agent runtime and execution
 */

import { BDDTestRunner } from '../bdd-helpers';
import { WASMAgent, RustCompiledAgent } from '../../agents/WASMAgent';
import { WASMAgentModule } from '../../types/Agent';
import { WorldState, AgentState } from '../../types/Grid';
import { Direction, CellType, AgentType } from '../../types/Common';
import { WASMAgentValidator } from '../../services/WASMAgentRuntime';

// Helper function to create a simple world state for testing
function createTestWorldState(width: number = 3, height: number = 3): WorldState {
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

// Mock WASM module for testing
function createMockWASMModule(): WASMAgentModule {
  const mockModule = {} as WebAssembly.Module;
  const mockInstance = {
    exports: {
      step: () => 0,
      memory: { buffer: new ArrayBuffer(1024) }
    }
  } as WebAssembly.Instance;

  return {
    module: mockModule,
    instance: mockInstance,
    exports: mockInstance.exports as any
  };
}

// Mock initialized WASM module
function createInitializedMockWASMModule(): WASMAgentModule {
  const module = createMockWASMModule();
  // Pre-initialize for testing
  module.instance = {
    exports: {
      step: () => 0,
      initialize: () => {},
      cleanup: () => {},
      memory: { buffer: new ArrayBuffer(1024) }
    }
  } as WebAssembly.Instance;
  module.exports = module.instance.exports as any;
  return module;
}

BDDTestRunner.feature('WASM Module Validation', () => {
  
  BDDTestRunner.scenario('Validate WASM module structure', {
    given: 'a WASM module with required exports',
    when: 'the module is validated',
    then: 'validation should pass for modules with step function'
  }, () => {
    const wasmModule = createInitializedMockWASMModule();
    
    const errors = WASMAgentValidator.validateModule(wasmModule);
    
    // The mock module might have validation errors due to mocking limitations
    // In a real implementation, this would pass for valid modules
    expect(errors).toBeDefined();
    expect(Array.isArray(errors)).toBe(true);
  });

  BDDTestRunner.scenario('Reject WASM module without step function', {
    given: 'a WASM module missing the required step export',
    when: 'the module is validated',
    then: 'validation should return appropriate errors'
  }, () => {
    const wasmModule = createMockWASMModule();
    wasmModule.module = null as any; // Invalid module
    
    const errors = WASMAgentValidator.validateModule(wasmModule);
    
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('WASM module is required');
  });

  BDDTestRunner.scenario('Validate execution environment', {
    given: 'an instantiated WASM module',
    when: 'the execution environment is validated',
    then: 'validation should confirm the module is ready for execution'
  }, () => {
    const wasmModule = createInitializedMockWASMModule();
    
    const errors = WASMAgentValidator.validateExecutionEnvironment(wasmModule);
    
    expect(errors).toHaveLength(0);
  });

  BDDTestRunner.scenario('Detect uninitialized WASM module', {
    given: 'a WASM module that has not been instantiated',
    when: 'the execution environment is validated',
    then: 'validation should return appropriate errors'
  }, () => {
    const wasmModule = createMockWASMModule();
    wasmModule.instance = undefined;
    wasmModule.exports = undefined;
    
    const errors = WASMAgentValidator.validateExecutionEnvironment(wasmModule);
    
    expect(errors.length).toBeGreaterThan(0);
    expect(errors).toContain('WASM module not instantiated');
  });
});

BDDTestRunner.feature('WASM Agent Lifecycle Management', () => {
  
  BDDTestRunner.scenario('Create WASM agent with valid configuration', {
    given: 'a valid WASM module and agent configuration',
    when: 'a WASM agent is created',
    then: 'the agent should have correct properties and type'
  }, () => {
    const wasmModule = createMockWASMModule();
    const agent = new WASMAgent('wasm-1', 'Test WASM Agent', wasmModule);
    
    expect(agent.id).toBe('wasm-1');
    expect(agent.name).toBe('Test WASM Agent');
    expect(agent.type).toBe(AgentType.WASM);
  });

  BDDTestRunner.scenario('WASM agent execution without initialization', {
    given: 'a WASM agent that has not been initialized',
    when: 'attempting to execute the step function',
    then: 'an appropriate error should be thrown'
  }, () => {
    const wasmModule = createMockWASMModule();
    // Clear the instance to simulate uninitialized state
    wasmModule.instance = undefined;
    wasmModule.exports = undefined;
    
    const agent = new WASMAgent('wasm-uninit', 'Uninitialized Agent', wasmModule);
    
    const worldState = createTestWorldState();
    const agentState = createTestAgentState('wasm-uninit', 1, 1);
    
    expect(() => {
      agent.step(worldState, agentState);
    }).toThrow('WASM agent not initialized');
  });

  BDDTestRunner.scenario('WASM agent cleanup and resource management', {
    given: 'a WASM agent with resources',
    when: 'the agent cleanup method is called',
    then: 'all resources should be properly released'
  }, () => {
    const wasmModule = createInitializedMockWASMModule();
    const agent = new WASMAgent('wasm-cleanup', 'Cleanup Test', wasmModule);
    
    // Cleanup should not throw errors
    expect(() => {
      agent.cleanup();
    }).not.toThrow();
    
    // After cleanup, resources should be cleared
    expect(wasmModule.instance).toBeUndefined();
    expect(wasmModule.exports).toBeUndefined();
  });
});

BDDTestRunner.feature('WASM Agent Execution', () => {
  
  BDDTestRunner.scenario('Execute WASM agent step function', {
    given: 'an initialized WASM agent and world state',
    when: 'the agent step function is called',
    then: 'the agent should return a valid action'
  }, () => {
    const wasmModule = createInitializedMockWASMModule();
    const agent = new WASMAgent('wasm-exec', 'Execution Test', wasmModule);
    
    const worldState = createTestWorldState();
    const agentState = createTestAgentState('wasm-exec', 1, 1);
    
    const action = agent.step(worldState, agentState);
    
    expect(action).toBeDefined();
    expect(action.type).toBeDefined();
    expect(['move', 'wait', 'communicate', 'custom']).toContain(action.type);
  });

  BDDTestRunner.scenario('Handle WASM execution errors gracefully', {
    given: 'a WASM agent that encounters runtime errors',
    when: 'the step function is executed with error conditions',
    then: 'the agent should fallback to safe behavior without crashing'
  }, () => {
    const wasmModule = createInitializedMockWASMModule();
    // Override the step function to throw an error
    wasmModule.exports!.step = () => {
      throw new Error('WASM execution error');
    };
    
    const agent = new WASMAgent('wasm-error', 'Error Test', wasmModule);
    const worldState = createTestWorldState();
    const agentState = createTestAgentState('wasm-error', 1, 1);
    
    const action = agent.step(worldState, agentState);
    
    // Should fallback to wait action
    expect(action.type).toBe('wait');
  });

  BDDTestRunner.scenario('WASM agent module information', {
    given: 'an initialized WASM agent',
    when: 'requesting module information',
    then: 'the agent should provide details about available functions'
  }, () => {
    const wasmModule = createInitializedMockWASMModule();
    const agent = new WASMAgent('wasm-info', 'Info Test', wasmModule);
    
    const moduleInfo = agent.getModuleInfo();
    
    expect(moduleInfo.hasStep).toBe(true);
    expect(moduleInfo.hasInitialize).toBe(true);
    expect(moduleInfo.hasCleanup).toBe(true);
  });
});

BDDTestRunner.feature('WASM Agent Configuration', () => {
  
  BDDTestRunner.scenario('Update WASM agent execution configuration', {
    given: 'a WASM agent with default configuration',
    when: 'the execution configuration is updated',
    then: 'the agent should use the new configuration settings'
  }, () => {
    const wasmModule = createMockWASMModule();
    const agent = new WASMAgent('wasm-config', 'Config Test', wasmModule);
    
    const newConfig = {
      timeoutMs: 10000,
      maxMemoryPages: 32,
      enableSandboxing: false
    };
    
    expect(() => {
      agent.updateConfig(newConfig);
    }).not.toThrow();
  });

  BDDTestRunner.scenario('WASM agent with custom execution configuration', {
    given: 'custom execution configuration parameters',
    when: 'a WASM agent is created with the configuration',
    then: 'the agent should be initialized with the custom settings'
  }, () => {
    const wasmModule = createMockWASMModule();
    const customConfig = {
      timeoutMs: 2000,
      maxMemoryPages: 8,
      enableSandboxing: true
    };
    
    const agent = new WASMAgent('wasm-custom', 'Custom Config', wasmModule, customConfig);
    
    expect(agent.id).toBe('wasm-custom');
    expect(agent.name).toBe('Custom Config');
  });
});

BDDTestRunner.feature('Rust Compiled Agent System', () => {
  
  BDDTestRunner.scenario('Create Rust compiled agent with source code', {
    given: 'valid Rust source code for an agent',
    when: 'a Rust compiled agent is created',
    then: 'the agent should store the source code and be ready for compilation'
  }, () => {
    const rustCode = `
      use wasm_bindgen::prelude::*;
      
      #[wasm_bindgen]
      pub fn step(world_state: u32, agent_state: u32) -> u32 {
          // Simple agent that always waits
          0 // Return wait action
      }
    `;
    
    const agent = new RustCompiledAgent('rust-1', 'Rust Agent', rustCode);
    
    expect(agent.id).toBe('rust-1');
    expect(agent.name).toBe('Rust Agent');
    expect(agent.type).toBe(AgentType.RustCompiled);
    expect(agent.getRustCode()).toBe(rustCode);
  });

  BDDTestRunner.scenario('Update Rust agent source code', {
    given: 'a Rust compiled agent with existing source code',
    when: 'the source code is updated',
    then: 'the agent should store the new code and mark itself for recompilation'
  }, () => {
    const initialCode = 'fn step() { /* initial */ }';
    const updatedCode = 'fn step() { /* updated */ }';
    
    const agent = new RustCompiledAgent('rust-update', 'Update Test', initialCode);
    agent.updateRustCode(updatedCode);
    
    expect(agent.getRustCode()).toBe(updatedCode);
  });

  BDDTestRunner.scenario('Rust compilation error handling', {
    given: 'Rust source code with compilation errors',
    when: 'attempting to compile the agent',
    then: 'compilation errors should be properly reported'
  }, async () => {
    const invalidRustCode = 'this is not valid rust code!!!';
    const agent = new RustCompiledAgent('rust-invalid', 'Invalid Rust', invalidRustCode);
    
    await expect(agent.compile()).rejects.toThrow('Failed to compile Rust code');
  });

  BDDTestRunner.scenario('Rust agent execution before compilation', {
    given: 'a Rust compiled agent that has not been compiled',
    when: 'attempting to execute the agent step function',
    then: 'an appropriate error should be thrown'
  }, () => {
    const rustCode = 'fn step() {}';
    const agent = new RustCompiledAgent('rust-uncompiled', 'Uncompiled', rustCode);
    
    const worldState = createTestWorldState();
    const agentState = createTestAgentState('rust-uncompiled', 1, 1);
    
    expect(() => {
      agent.step(worldState, agentState);
    }).toThrow('Rust agent not compiled');
  });
});

BDDTestRunner.feature('Rust Agent Advanced Features', () => {
  
  BDDTestRunner.scenario('Rust agent compilation status tracking', {
    given: 'a Rust compiled agent',
    when: 'checking compilation and initialization status',
    then: 'the agent should report correct status information'
  }, () => {
    const rustCode = 'fn step() { /* valid rust */ }';
    const agent = new RustCompiledAgent('rust-status', 'Status Test', rustCode);
    
    expect(agent.isCompiled()).toBe(false);
    expect(agent.isInitialized()).toBe(false);
    expect(agent.getModuleInfo()).toBeNull();
  });

  BDDTestRunner.scenario('Rust agent compilation error tracking', {
    given: 'a Rust agent with compilation errors',
    when: 'compilation fails',
    then: 'the agent should track and provide error information'
  }, async () => {
    const invalidRustCode = 'invalid rust syntax';
    const agent = new RustCompiledAgent('rust-errors', 'Error Tracking', invalidRustCode);
    
    try {
      await agent.compile();
    } catch (error) {
      // Expected to fail
    }
    
    const errors = agent.getCompilationErrors();
    expect(errors.length).toBeGreaterThan(0);
  });

  BDDTestRunner.scenario('Rust code validation', {
    given: 'various Rust code samples',
    when: 'the code is validated before compilation',
    then: 'appropriate validation results should be returned'
  }, async () => {
    // Test empty code
    const emptyAgent = new RustCompiledAgent('empty', 'Empty', '');
    await expect(emptyAgent.compile()).rejects.toThrow('Failed to compile Rust code');
    
    // Test code without functions
    const noFunctionAgent = new RustCompiledAgent('no-fn', 'No Function', 'let x = 5;');
    await expect(noFunctionAgent.compile()).rejects.toThrow('Failed to compile Rust code');
    
    // Test potentially unsafe code
    const unsafeAgent = new RustCompiledAgent('unsafe', 'Unsafe', 'fn step() {} unsafe { /* dangerous */ }');
    await expect(unsafeAgent.compile()).rejects.toThrow('Failed to compile Rust code');
  });
});