// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock Ionic components for testing
import { vi } from 'vitest';

// Mock WebAssembly for testing environment
Object.defineProperty(globalThis, 'WebAssembly', {
  value: {
    instantiate: vi.fn(),
    compile: vi.fn(),
    Module: vi.fn(),
    Instance: vi.fn(),
  },
});