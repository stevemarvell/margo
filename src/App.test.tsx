import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders multi-agent grid world title', () => {
    render(<App />);
    const titleElements = screen.getAllByText(/Multi-Agent Grid World/i);
    expect(titleElements.length).toBeGreaterThan(0);
    expect(titleElements[0]).toBeInTheDocument();
  });
});