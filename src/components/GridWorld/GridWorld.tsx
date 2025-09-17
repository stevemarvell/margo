/**
 * GridWorld component - Canvas-based grid rendering with mobile touch support
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { IonContent } from '@ionic/react';
import { WorldState } from '../../types/Grid';
import { Position, CellType } from '../../types/Common';
import './GridWorld.css';

export interface GridWorldProps {
  worldState: WorldState;
  onCellClick?: (position: Position) => void;
  onCellFocus?: (position: Position) => void;
  enablePanZoom?: boolean;
  enableKeyboardNavigation?: boolean;
  className?: string;
}

interface ViewportState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

interface TouchState {
  lastTouchDistance?: number;
  lastTouchCenter?: Position;
  isDragging: boolean;
}

export const GridWorld: React.FC<GridWorldProps> = ({
  worldState,
  onCellClick,
  onCellFocus,
  enablePanZoom = false,
  enableKeyboardNavigation = false,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  
  const [viewport, setViewport] = useState<ViewportState>({
    scale: 1,
    offsetX: 0,
    offsetY: 0
  });
  
  const [touchState, setTouchState] = useState<TouchState>({
    isDragging: false
  });
  
  const [focusedCell, setFocusedCell] = useState<Position>({ x: 0, y: 0 });
  const [liveRegionText, setLiveRegionText] = useState<string>('');

  // Constants for rendering
  const MIN_CELL_SIZE = 20; // Minimum size for touch-friendly interaction
  const CELL_BORDER_WIDTH = 1;
  const AGENT_RADIUS_RATIO = 0.3;

  // Color scheme using Ionic CSS variables
  const getIonicColor = (colorName: string) => {
    return getComputedStyle(document.documentElement).getPropertyValue(`--ion-color-${colorName}`).trim();
  };

  const COLORS = {
    [CellType.Empty]: getIonicColor('light') || '#f4f5f8',
    [CellType.Wall]: getIonicColor('dark') || '#222428',
    [CellType.Goal]: getIonicColor('success') || '#2dd36f',
    [CellType.Hazard]: getIonicColor('danger') || '#eb445a',
    [CellType.Resource]: getIonicColor('primary') || '#3880ff',
    border: getIonicColor('medium') || '#92949c',
    agent: getIonicColor('warning') || '#ffc409',
    agentBorder: getIonicColor('warning-shade') || '#e0ac08',
    focus: getIonicColor('tertiary') || '#5260ff'
  };

  // Calculate optimal cell size based on container and grid dimensions
  const calculateCellSize = useCallback(() => {
    if (!containerRef.current) return MIN_CELL_SIZE;
    
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    const cellWidth = Math.floor(containerWidth / worldState.dimensions.width);
    const cellHeight = Math.floor(containerHeight / worldState.dimensions.height);
    
    const cellSize = Math.max(MIN_CELL_SIZE, Math.min(cellWidth, cellHeight));
    return cellSize;
  }, [worldState.dimensions]);

  // Convert screen coordinates to grid coordinates
  const screenToGrid = useCallback((screenX: number, screenY: number): Position => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const cellSize = calculateCellSize();
    
    const canvasX = (screenX - rect.left - viewport.offsetX) / viewport.scale;
    const canvasY = (screenY - rect.top - viewport.offsetY) / viewport.scale;
    
    const gridX = Math.floor(canvasX / cellSize);
    const gridY = Math.floor(canvasY / cellSize);
    
    return {
      x: Math.max(0, Math.min(worldState.dimensions.width - 1, gridX)),
      y: Math.max(0, Math.min(worldState.dimensions.height - 1, gridY))
    };
  }, [calculateCellSize, viewport, worldState.dimensions]);

  // Render the grid on canvas
  const renderGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const cellSize = calculateCellSize();
    const gridWidth = worldState.dimensions.width * cellSize;
    const gridHeight = worldState.dimensions.height * cellSize;
    
    // Set canvas size
    canvas.width = gridWidth;
    canvas.height = gridHeight;
    
    // Apply viewport transformations
    ctx.save();
    ctx.scale(viewport.scale, viewport.scale);
    ctx.translate(viewport.offsetX, viewport.offsetY);
    
    // Clear canvas
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, gridWidth, gridHeight);
    
    // Draw grid cells
    for (let y = 0; y < worldState.dimensions.height; y++) {
      for (let x = 0; x < worldState.dimensions.width; x++) {
        const cell = worldState.grid[y][x];
        const cellX = x * cellSize;
        const cellY = y * cellSize;
        
        // Fill cell based on type
        ctx.fillStyle = COLORS[cell.type];
        ctx.fillRect(cellX, cellY, cellSize, cellSize);
        
        // Draw cell border
        ctx.strokeStyle = COLORS.border;
        ctx.lineWidth = CELL_BORDER_WIDTH;
        ctx.strokeRect(cellX, cellY, cellSize, cellSize);
        
        // Highlight focused cell for keyboard navigation
        if (enableKeyboardNavigation && focusedCell.x === x && focusedCell.y === y) {
          ctx.strokeStyle = COLORS.focus;
          ctx.lineWidth = 3;
          ctx.strokeRect(cellX + 1, cellY + 1, cellSize - 2, cellSize - 2);
        }
      }
    }
    
    // Draw agents
    worldState.agents.forEach((agent) => {
      const agentX = agent.position.x * cellSize + cellSize / 2;
      const agentY = agent.position.y * cellSize + cellSize / 2;
      const radius = cellSize * AGENT_RADIUS_RATIO;
      
      // Agent body
      ctx.beginPath();
      ctx.arc(agentX, agentY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = COLORS.agent;
      ctx.fill();
      
      // Agent border
      ctx.strokeStyle = COLORS.agentBorder;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Agent ID text (for small grids)
      if (cellSize > 30) {
        ctx.fillStyle = '#000000';
        ctx.font = `${Math.floor(cellSize * 0.2)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(agent.id.slice(-2), agentX, agentY);
      }
    });
    
    ctx.restore();
  }, [worldState, calculateCellSize, viewport, focusedCell, enableKeyboardNavigation]);

  // Handle canvas click/touch events
  const handleCanvasInteraction = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    
    let clientX: number, clientY: number;
    
    if ('touches' in event) {
      if (event.touches.length === 1) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else {
        return; // Multi-touch, handle separately
      }
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    
    const gridPos = screenToGrid(clientX, clientY);
    
    if (onCellClick) {
      onCellClick(gridPos);
    }
    
    // Update live region for screen readers
    const cell = worldState.grid[gridPos.y][gridPos.x];
    const agent = worldState.agents.get(cell.occupant || '');
    const cellDescription = agent 
      ? `Cell ${gridPos.x}, ${gridPos.y} contains agent ${agent.id}`
      : `Cell ${gridPos.x}, ${gridPos.y} is ${cell.type}`;
    
    setLiveRegionText(cellDescription);
  }, [screenToGrid, onCellClick, worldState]);

  // Handle touch gestures for pan and zoom
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (!enablePanZoom) {
      handleCanvasInteraction(event);
      return;
    }
    
    if (event.touches.length === 2) {
      // Two-finger gesture for zoom
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      setTouchState({
        lastTouchDistance: distance,
        lastTouchCenter: { x: centerX, y: centerY },
        isDragging: false
      });
    } else if (event.touches.length === 1) {
      // Single finger for pan or tap
      setTouchState({
        lastTouchCenter: { x: event.touches[0].clientX, y: event.touches[0].clientY },
        isDragging: true
      });
    }
  }, [enablePanZoom, handleCanvasInteraction]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (!enablePanZoom) return;
    
    event.preventDefault();
    
    if (event.touches.length === 2 && touchState.lastTouchDistance && touchState.lastTouchCenter) {
      // Handle zoom
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const scaleChange = distance / touchState.lastTouchDistance;
      const newScale = Math.max(0.5, Math.min(3, viewport.scale * scaleChange));
      
      setViewport(prev => ({
        ...prev,
        scale: newScale
      }));
      
      setTouchState(prev => ({
        ...prev,
        lastTouchDistance: distance
      }));
    } else if (event.touches.length === 1 && touchState.isDragging && touchState.lastTouchCenter) {
      // Handle pan
      const deltaX = event.touches[0].clientX - touchState.lastTouchCenter.x;
      const deltaY = event.touches[0].clientY - touchState.lastTouchCenter.y;
      
      setViewport(prev => ({
        ...prev,
        offsetX: prev.offsetX + deltaX,
        offsetY: prev.offsetY + deltaY
      }));
      
      setTouchState(prev => ({
        ...prev,
        lastTouchCenter: { x: event.touches[0].clientX, y: event.touches[0].clientY }
      }));
    }
  }, [enablePanZoom, touchState, viewport.scale]);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    if (!enablePanZoom) {
      handleCanvasInteraction(event);
      return;
    }
    
    if (event.touches.length === 0) {
      // All touches ended
      if (!touchState.isDragging && touchState.lastTouchCenter) {
        // This was a tap, not a drag
        handleCanvasInteraction(event);
      }
      
      setTouchState({
        isDragging: false
      });
    }
  }, [enablePanZoom, touchState, handleCanvasInteraction]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!enableKeyboardNavigation) return;
    
    let newFocus = { ...focusedCell };
    
    switch (event.key) {
      case 'ArrowUp':
        newFocus.y = Math.max(0, focusedCell.y - 1);
        break;
      case 'ArrowDown':
        newFocus.y = Math.min(worldState.dimensions.height - 1, focusedCell.y + 1);
        break;
      case 'ArrowLeft':
        newFocus.x = Math.max(0, focusedCell.x - 1);
        break;
      case 'ArrowRight':
        newFocus.x = Math.min(worldState.dimensions.width - 1, focusedCell.x + 1);
        break;
      case 'Enter':
      case ' ':
        if (onCellClick) {
          onCellClick(focusedCell);
        }
        break;
      default:
        return;
    }
    
    event.preventDefault();
    
    if (newFocus.x !== focusedCell.x || newFocus.y !== focusedCell.y) {
      setFocusedCell(newFocus);
      
      if (onCellFocus) {
        onCellFocus(newFocus);
      }
      
      // Update live region
      const cell = worldState.grid[newFocus.y][newFocus.x];
      const agent = worldState.agents.get(cell.occupant || '');
      const cellDescription = agent 
        ? `Focused on cell ${newFocus.x}, ${newFocus.y} containing agent ${agent.id}`
        : `Focused on cell ${newFocus.x}, ${newFocus.y}, ${cell.type} cell`;
      
      setLiveRegionText(cellDescription);
    }
  }, [enableKeyboardNavigation, focusedCell, worldState, onCellClick, onCellFocus]);

  // Render the grid when world state changes
  useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(renderGrid);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [renderGrid]);

  // Generate ARIA description for the grid
  const generateAriaDescription = useCallback(() => {
    const agentCount = worldState.agents.size;
    const cellCounts = {
      [CellType.Empty]: 0,
      [CellType.Wall]: 0,
      [CellType.Goal]: 0,
      [CellType.Hazard]: 0,
      [CellType.Resource]: 0
    };
    
    worldState.grid.forEach(row => {
      row.forEach(cell => {
        cellCounts[cell.type]++;
      });
    });
    
    return `Grid world ${worldState.dimensions.width} by ${worldState.dimensions.height} with ${agentCount} agents. ` +
           `Contains ${cellCounts[CellType.Wall]} walls, ${cellCounts[CellType.Goal]} goals, ` +
           `${cellCounts[CellType.Hazard]} hazards, and ${cellCounts[CellType.Resource]} resources.`;
  }, [worldState]);

  return (
    <div 
      ref={containerRef}
      className={`grid-world-container ${className}`}
      role="application"
      aria-label="Multi-agent grid world simulation"
    >
      <canvas
        ref={canvasRef}
        className="grid-world-canvas"
        role="img"
        aria-label="Grid world visualization"
        aria-describedby="grid-description grid-live-region"
        tabIndex={enableKeyboardNavigation ? 0 : -1}
        onMouseDown={handleCanvasInteraction}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onKeyDown={handleKeyDown}
      />
      
      {/* Hidden description for screen readers */}
      <div 
        id="grid-description" 
        className="sr-only"
        aria-hidden="true"
      >
        {generateAriaDescription()}
      </div>
      
      {/* Live region for dynamic updates */}
      <div 
        id="grid-live-region"
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-label="Grid updates"
      >
        {liveRegionText}
      </div>
    </div>
  );
};