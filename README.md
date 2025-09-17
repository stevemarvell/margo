# Multi-Agent Grid World

A Progressive Web Application (PWA) for simulating multi-agent systems in a grid environment, built with React, Ionic, and WebAssembly.

## Features

- Interactive grid-based simulation environment
- Support for multiple programming languages via WebAssembly
- Real-time agent behavior visualization
- Offline-capable PWA functionality
- Accessibility-compliant interface
- Mobile-responsive design

## Development

### Prerequisites

- Node.js 18+ 
- npm or yarn
- wasm-pack (for WebAssembly compilation)

### Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Run tests:
```bash
npm test
```

4. Build for production:
```bash
npm run build
```

### Project Structure

```
src/
├── components/     # React components
├── services/       # Business logic services
├── agents/         # Agent implementations and interfaces
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── theme/          # Ionic theming and CSS
└── pages/          # Page components
```

## Technology Stack

- **Frontend**: React 18, TypeScript, Ionic Framework
- **Build Tool**: Vite
- **Testing**: Vitest, React Testing Library
- **PWA**: Vite PWA Plugin with Workbox
- **WebAssembly**: wasm-pack for Rust compilation