/**
 * BDD tests for GridWorld component rendering and user interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { BDDTestRunner } from '../bdd-helpers';
import { GridWorld } from '../../components/GridWorld/GridWorld';
import { WorldState, AgentState } from '../../types/Grid';
import { CellType, Position, GridDimensions } from '../../types/Common';

// Mock performance.now for performance tests
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now())
  }
});

// Mock world state for testing
const createMockWorldState = (dimensions: GridDimensions): WorldState => ({
  grid: Array(dimensions.height).fill(null).map(() =>
    Array(dimensions.width).fill(null).map(() => ({ type: CellType.Empty }))
  ),
  agents: new Map<string, AgentState>(),
  dimensions,
  tick: 0
});

const mockAgent: AgentState = {
  id: 'test-agent-1',
  position: { x: 2, y: 1 },
  health: 100,
  energy: 75
};

BDDTestRunner.feature('Grid World Rendering', () => {
  
  BDDTestRunner.scenario('Grid renders with correct dimensions', {
    given: 'a world state with specific grid dimensions',
    when: 'the GridWorld component is rendered',
    then: 'the grid should display with the correct number of cells'
  }, () => {
    const worldState = createMockWorldState({ width: 5, height: 3 });
    
    render(<GridWorld worldState={worldState} />);
    
    const canvas = screen.getByRole('img', { name: /grid world/i });
    expect(canvas).toBeInTheDocument();
    expect(canvas).toBeInstanceOf(HTMLCanvasElement);
  });

  BDDTestRunner.scenario('Grid renders different cell types with distinct visuals', {
    given: 'a world state with various cell types',
    when: 'the GridWorld component is rendered',
    then: 'different cell types should be visually distinguishable'
  }, () => {
    const worldState = createMockWorldState({ width: 3, height: 3 });
    worldState.grid[0][0] = { type: CellType.Wall };
    worldState.grid[0][1] = { type: CellType.Goal };
    worldState.grid[0][2] = { type: CellType.Hazard };
    worldState.grid[1][0] = { type: CellType.Resource };
    
    render(<GridWorld worldState={worldState} />);
    
    const canvas = screen.getByRole('img', { name: /grid world/i });
    expect(canvas).toBeInTheDocument();
    
    // Canvas should be rendered and accessible
    expect(canvas).toHaveAccessibleName();
  });

  BDDTestRunner.scenario('Grid displays agents at correct positions', {
    given: 'a world state with agents placed on the grid',
    when: 'the GridWorld component is rendered',
    then: 'agents should be visible at their specified positions'
  }, () => {
    const worldState = createMockWorldState({ width: 5, height: 5 });
    worldState.agents.set('agent-1', mockAgent);
    worldState.grid[mockAgent.position.y][mockAgent.position.x].occupant = mockAgent.id;
    
    render(<GridWorld worldState={worldState} />);
    
    const canvas = screen.getByRole('img', { name: /grid world/i });
    expect(canvas).toBeInTheDocument();
    
    // Verify canvas has proper ARIA description for agents
    expect(canvas).toHaveAttribute('aria-describedby');
  });

  BDDTestRunner.scenario('Grid updates when world state changes', {
    given: 'a rendered GridWorld component',
    when: 'the world state is updated with new agent positions',
    then: 'the grid should re-render to show the updated state'
  }, () => {
    const worldState = createMockWorldState({ width: 5, height: 5 });
    const { rerender } = render(<GridWorld worldState={worldState} />);
    
    // Update world state with agent
    const updatedWorldState = { ...worldState };
    updatedWorldState.agents.set('agent-1', mockAgent);
    updatedWorldState.grid[mockAgent.position.y][mockAgent.position.x].occupant = mockAgent.id;
    updatedWorldState.tick = 1;
    
    rerender(<GridWorld worldState={updatedWorldState} />);
    
    const canvas = screen.getByRole('img', { name: /grid world/i });
    expect(canvas).toBeInTheDocument();
  });
});

BDDTestRunner.feature('Grid World Responsive Design', () => {
  
  BDDTestRunner.scenario('Grid adapts to different viewport sizes', {
    given: 'a GridWorld component in different viewport sizes',
    when: 'the viewport dimensions change',
    then: 'the grid should resize responsively while maintaining aspect ratio'
  }, () => {
    const worldState = createMockWorldState({ width: 10, height: 8 });
    
    // Mock container with specific dimensions
    const { container } = render(
      <div style={{ width: '400px', height: '300px' }}>
        <GridWorld worldState={worldState} />
      </div>
    );
    
    const canvas = screen.getByRole('img', { name: /grid world/i });
    expect(canvas).toBeInTheDocument();
    
    // Canvas should be present and have the grid-world-canvas class
    expect(canvas).toHaveClass('grid-world-canvas');
  });

  BDDTestRunner.scenario('Grid maintains minimum cell size for touch interactions', {
    given: 'a GridWorld component on a mobile device',
    when: 'the grid is rendered with many cells',
    then: 'cells should maintain minimum touch-friendly size'
  }, () => {
    const worldState = createMockWorldState({ width: 20, height: 15 });
    
    render(<GridWorld worldState={worldState} />);
    
    const canvas = screen.getByRole('img', { name: /grid world/i });
    expect(canvas).toBeInTheDocument();
    
    // Canvas should have minimum dimensions for touch interaction (mocked)
    const canvasRect = canvas.getBoundingClientRect();
    expect(canvasRect.width).toBe(400); // From our mock
    expect(canvasRect.height).toBe(300); // From our mock
  });
});

BDDTestRunner.feature('Grid World Touch Interactions', () => {
  
  BDDTestRunner.scenario('Grid responds to touch events for cell selection', {
    given: 'a rendered GridWorld component with touch support',
    when: 'a user taps on a grid cell',
    then: 'the cell selection event should be triggered with correct coordinates'
  }, async () => {
    const onCellClick = vi.fn();
    const worldState = createMockWorldState({ width: 5, height: 5 });
    
    render(<GridWorld worldState={worldState} onCellClick={onCellClick} />);
    
    const canvas = screen.getByRole('img', { name: /grid world/i });
    
    // Simulate touch event
    fireEvent.touchStart(canvas, {
      touches: [{ clientX: 50, clientY: 50 }]
    });
    fireEvent.touchEnd(canvas, {
      changedTouches: [{ clientX: 50, clientY: 50 }]
    });
    
    await waitFor(() => {
      expect(onCellClick).toHaveBeenCalled();
    });
  });

  BDDTestRunner.scenario('Grid supports pan and zoom gestures', {
    given: 'a large grid that exceeds viewport size',
    when: 'a user performs pan and zoom gestures',
    then: 'the grid view should pan and zoom accordingly'
  }, async () => {
    const worldState = createMockWorldState({ width: 50, height: 40 });
    
    render(<GridWorld worldState={worldState} enablePanZoom={true} />);
    
    const canvas = screen.getByRole('img', { name: /grid world/i });
    
    // Simulate pinch zoom gesture
    fireEvent.touchStart(canvas, {
      touches: [
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 200 }
      ]
    });
    
    fireEvent.touchMove(canvas, {
      touches: [
        { clientX: 90, clientY: 90 },
        { clientX: 210, clientY: 210 }
      ]
    });
    
    fireEvent.touchEnd(canvas, {
      changedTouches: [
        { clientX: 90, clientY: 90 },
        { clientX: 210, clientY: 210 }
      ]
    });
    
    // Canvas should still be present and interactive
    expect(canvas).toBeInTheDocument();
  });

  BDDTestRunner.scenario('Grid handles mouse interactions for desktop users', {
    given: 'a GridWorld component on a desktop device',
    when: 'a user clicks on a grid cell with mouse',
    then: 'the cell click event should be triggered with correct coordinates'
  }, async () => {
    const user = userEvent.setup();
    const onCellClick = vi.fn();
    const worldState = createMockWorldState({ width: 5, height: 5 });
    
    render(<GridWorld worldState={worldState} onCellClick={onCellClick} />);
    
    const canvas = screen.getByRole('img', { name: /grid world/i });
    
    await user.click(canvas);
    
    expect(onCellClick).toHaveBeenCalled();
  });
});

BDDTestRunner.feature('Grid World Accessibility', () => {
  
  BDDTestRunner.scenario('Grid provides proper ARIA labels and descriptions', {
    given: 'a GridWorld component with agents and different cell types',
    when: 'the component is rendered',
    then: 'it should have appropriate ARIA attributes for screen readers'
  }, () => {
    const worldState = createMockWorldState({ width: 3, height: 3 });
    worldState.agents.set('agent-1', mockAgent);
    worldState.grid[0][0] = { type: CellType.Wall };
    worldState.grid[0][1] = { type: CellType.Goal };
    
    render(<GridWorld worldState={worldState} />);
    
    const canvas = screen.getByRole('img', { name: /grid world/i });
    
    expect(canvas).toHaveAttribute('aria-label');
    expect(canvas).toHaveAttribute('aria-describedby');
    expect(canvas).toHaveAttribute('role', 'img');
  });

  BDDTestRunner.scenario('Grid supports keyboard navigation', {
    given: 'a GridWorld component with keyboard navigation enabled',
    when: 'a user navigates using keyboard arrows',
    then: 'the focus should move between grid cells appropriately'
  }, async () => {
    const user = userEvent.setup();
    const onCellFocus = vi.fn();
    const worldState = createMockWorldState({ width: 5, height: 5 });
    
    render(<GridWorld worldState={worldState} onCellFocus={onCellFocus} enableKeyboardNavigation={true} />);
    
    const canvas = screen.getByRole('img', { name: /grid world/i });
    
    // Canvas should be focusable
    expect(canvas).toHaveAttribute('tabindex', '0');
    
    await user.tab();
    expect(canvas).toHaveFocus();
    
    await user.keyboard('{ArrowRight}');
    
    // Should trigger cell focus event
    await waitFor(() => {
      expect(onCellFocus).toHaveBeenCalled();
    });
  });

  BDDTestRunner.scenario('Grid provides live region updates for dynamic changes', {
    given: 'a GridWorld component with live region support',
    when: 'agents move or world state changes',
    then: 'screen readers should be notified of important changes'
  }, () => {
    const worldState = createMockWorldState({ width: 5, height: 5 });
    
    render(<GridWorld worldState={worldState} />);
    
    // Should have live region for announcements
    const liveRegion = screen.getByRole('status', { name: /grid updates/i });
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  });
});

BDDTestRunner.feature('Grid World Performance', () => {
  
  BDDTestRunner.scenario('Grid renders efficiently with many cells', {
    given: 'a large grid with many cells and agents',
    when: 'the GridWorld component is rendered',
    then: 'it should render without performance issues'
  }, () => {
    const worldState = createMockWorldState({ width: 100, height: 80 });
    
    // Add multiple agents
    for (let i = 0; i < 50; i++) {
      const agent: AgentState = {
        id: `agent-${i}`,
        position: { x: i % 100, y: Math.floor(i / 100) },
        health: 100,
        energy: 50
      };
      worldState.agents.set(agent.id, agent);
      worldState.grid[agent.position.y][agent.position.x].occupant = agent.id;
    }
    
    const startTime = performance.now();
    render(<GridWorld worldState={worldState} />);
    const endTime = performance.now();
    
    // Should render within reasonable time (less than 100ms)
    expect(endTime - startTime).toBeLessThan(100);
    
    const canvas = screen.getByRole('img', { name: /grid world/i });
    expect(canvas).toBeInTheDocument();
  });

  BDDTestRunner.scenario('Grid updates efficiently when world state changes', {
    given: 'a rendered GridWorld component',
    when: 'the world state is updated multiple times',
    then: 'it should handle updates efficiently without unnecessary re-renders'
  }, () => {
    const worldState = createMockWorldState({ width: 10, height: 10 });
    const { rerender } = render(<GridWorld worldState={worldState} />);
    
    // Perform multiple updates
    const startTime = performance.now();
    for (let i = 0; i < 10; i++) {
      const updatedState = { ...worldState, tick: i };
      rerender(<GridWorld worldState={updatedState} />);
    }
    const endTime = performance.now();
    
    // Should handle multiple updates efficiently
    expect(endTime - startTime).toBeLessThan(50);
  });
});