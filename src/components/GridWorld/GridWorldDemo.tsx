/**
 * Demo component to showcase GridWorld functionality
 */

import React, { useState, useEffect } from 'react';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCheckbox, IonItem, IonLabel } from '@ionic/react';
import { GridWorld } from './GridWorld';
import { WorldState, AgentState } from '../../types/Grid';
import { CellType, Position, GridDimensions } from '../../types/Common';
import { RandomWalkerAgent, GoalSeekerAgent, StationaryAgent } from '../../agents/PredefinedAgent';
import './GridWorldDemo.css';

export const GridWorldDemo: React.FC = () => {
  const [worldState, setWorldState] = useState<WorldState>(() => {
    const dimensions: GridDimensions = { width: 8, height: 6 };
    const grid = Array(dimensions.height).fill(null).map(() =>
      Array(dimensions.width).fill(null).map(() => ({ type: CellType.Empty }))
    );
    
    // Add some walls
    grid[2][3] = { type: CellType.Wall };
    grid[2][4] = { type: CellType.Wall };
    grid[3][3] = { type: CellType.Wall };
    
    // Add a goal
    grid[1][6] = { type: CellType.Goal };
    
    // Add a hazard
    grid[4][2] = { type: CellType.Hazard };
    
    // Add a resource
    grid[5][5] = { type: CellType.Resource };
    
    return {
      grid,
      agents: new Map<string, AgentState>(),
      dimensions,
      tick: 0
    };
  });
  
  const [enablePanZoom, setEnablePanZoom] = useState(false);
  const [enableKeyboardNav, setEnableKeyboardNav] = useState(false);
  const [selectedCell, setSelectedCell] = useState<Position | null>(null);

  const handleCellClick = (position: Position) => {
    setSelectedCell(position);
    console.log('Cell clicked:', position);
  };

  const handleCellFocus = (position: Position) => {
    console.log('Cell focused:', position);
  };

  const addRandomAgent = () => {
    const agentId = `random-${Date.now()}`;
    const agent = new RandomWalkerAgent(agentId);
    
    // Find empty position
    const emptyPositions: Position[] = [];
    for (let y = 0; y < worldState.dimensions.height; y++) {
      for (let x = 0; x < worldState.dimensions.width; x++) {
        const cell = worldState.grid[y][x];
        if (cell.type === CellType.Empty && !cell.occupant) {
          emptyPositions.push({ x, y });
        }
      }
    }
    
    if (emptyPositions.length === 0) return;
    
    const position = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
    const agentState: AgentState = {
      id: agentId,
      position,
      health: 100,
      energy: 75
    };
    
    setWorldState(prev => {
      const newState = { ...prev };
      newState.agents = new Map(prev.agents);
      newState.agents.set(agentId, agentState);
      newState.grid = prev.grid.map(row => [...row]);
      newState.grid[position.y][position.x] = { ...newState.grid[position.y][position.x], occupant: agentId };
      return newState;
    });
  };

  const addGoalSeekerAgent = () => {
    const agentId = `seeker-${Date.now()}`;
    const agent = new GoalSeekerAgent(agentId);
    
    // Find empty position
    const emptyPositions: Position[] = [];
    for (let y = 0; y < worldState.dimensions.height; y++) {
      for (let x = 0; x < worldState.dimensions.width; x++) {
        const cell = worldState.grid[y][x];
        if (cell.type === CellType.Empty && !cell.occupant) {
          emptyPositions.push({ x, y });
        }
      }
    }
    
    if (emptyPositions.length === 0) return;
    
    const position = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
    const agentState: AgentState = {
      id: agentId,
      position,
      health: 100,
      energy: 75
    };
    
    setWorldState(prev => {
      const newState = { ...prev };
      newState.agents = new Map(prev.agents);
      newState.agents.set(agentId, agentState);
      newState.grid = prev.grid.map(row => [...row]);
      newState.grid[position.y][position.x] = { ...newState.grid[position.y][position.x], occupant: agentId };
      return newState;
    });
  };

  const clearAgents = () => {
    setWorldState(prev => {
      const newState = { ...prev };
      newState.agents = new Map();
      newState.grid = prev.grid.map(row => 
        row.map(cell => ({ ...cell, occupant: undefined }))
      );
      return newState;
    });
  };

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>Grid World Demo</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <div className="grid-demo-container">
          <GridWorld
            worldState={worldState}
            onCellClick={handleCellClick}
            onCellFocus={handleCellFocus}
            enablePanZoom={enablePanZoom}
            enableKeyboardNavigation={enableKeyboardNav}
          />
        </div>
        
        <div className="ion-margin-top">
          <IonButton onClick={addRandomAgent} size="small" fill="outline">
            Add Random Walker
          </IonButton>
          <IonButton onClick={addGoalSeekerAgent} size="small" fill="outline" className="ion-margin-start">
            Add Goal Seeker
          </IonButton>
          <IonButton onClick={clearAgents} size="small" color="danger" fill="outline" className="ion-margin-start">
            Clear Agents
          </IonButton>
        </div>
        
        <div className="ion-margin-top">
          <IonItem>
            <IonCheckbox 
              checked={enablePanZoom} 
              onIonChange={e => setEnablePanZoom(e.detail.checked)}
            >
              Enable Pan & Zoom
            </IonCheckbox>
          </IonItem>
          <IonItem>
            <IonCheckbox 
              checked={enableKeyboardNav} 
              onIonChange={e => setEnableKeyboardNav(e.detail.checked)}
            >
              Enable Keyboard Navigation
            </IonCheckbox>
          </IonItem>
        </div>
        
        {selectedCell && (
          <div className="selected-cell-info ion-margin-top ion-padding">
            <strong>Selected Cell:</strong> ({selectedCell.x}, {selectedCell.y}) - {worldState.grid[selectedCell.y][selectedCell.x].type}
            {worldState.grid[selectedCell.y][selectedCell.x].occupant && (
              <> | <strong>Agent:</strong> {worldState.grid[selectedCell.y][selectedCell.x].occupant}</>
            )}
          </div>
        )}
        
        <div className="ion-text-center ion-margin-top">
          <p><small>🟦 Empty | ⬛ Wall | 🟢 Goal | 🔴 Hazard | 🔵 Resource | 🟠 Agent</small></p>
          <p><small>Agents: {worldState.agents.size} | Tick: {worldState.tick}</small></p>
        </div>
      </IonCardContent>
    </IonCard>
  );
};