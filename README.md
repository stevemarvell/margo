# Multi-Agent Grid World 🌐

A Progressive Web App for simulating multi-agent systems in a grid environment, built with **Ionic React** and **TypeScript**.

![PWA](https://img.shields.io/badge/PWA-Ready-brightgreen)
![Ionic](https://img.shields.io/badge/Ionic-React-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)
![Tests](https://img.shields.io/badge/Tests-48%20Passing-green)
![Build](https://img.shields.io/badge/Build-Passing-green)

## ✨ Features

### 🎮 Grid World Simulation
- **Canvas-based rendering** with smooth 60fps performance
- **Interactive grid** with touch, mouse, and keyboard support
- **Multiple cell types**: Empty, Wall, Goal, Hazard, Resource
- **Agent visualization** with distinct colors and IDs
- **Real-time updates** and responsive design

### 🤖 Multi-Agent System
- **Predefined agent behaviors**: Random Walker, Goal Seeker, Stationary
- **WASM agent support** for high-performance custom agents
- **Agent state management** with health, energy, and inventory
- **Collision detection** and movement validation
- **Communication system** between agents

### 📱 Progressive Web App
- **Installable** on mobile and desktop devices
- **Offline functionality** with intelligent caching
- **Auto-generated PWA assets** and manifest
- **Service worker** with update notifications
- **Native-like experience** across all platforms

### 🎨 Modern UI/UX
- **Ionic design system** with minimal custom CSS
- **Dark mode support** and accessibility compliance
- **Responsive layout** that adapts to any screen size
- **Touch-friendly controls** with proper gesture support
- **Tab navigation** following Ionic best practices

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Modern web browser with Canvas support

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/multi-agent-grid-world.git
cd multi-agent-grid-world

# Install dependencies
npm install

# Generate PWA assets
npm run generate-pwa-assets

# Start development server
npm run dev
```

### Building for Production

```bash
# Build the app
npm run build

# Preview the build
npm run preview
```

## 🧪 Testing

We use **Vitest** with **BDD-style tests** for comprehensive coverage:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

**Test Coverage**: 48 tests covering:
- ✅ Grid rendering and interactions
- ✅ Agent behaviors and validation  
- ✅ Simulation state management
- ✅ Accessibility compliance
- ✅ Performance characteristics

## 📁 Project Structure

```
src/
├── components/
│   └── GridWorld/          # Canvas-based grid rendering
├── agents/                 # Agent implementations
│   ├── PredefinedAgent.ts  # Built-in agent behaviors
│   └── WASMAgent.ts        # WebAssembly agent support
├── types/                  # TypeScript type definitions
├── pages/                  # Ionic page components
├── tests/                  # BDD test suites
└── theme/                  # Ionic design tokens

.kiro/specs/               # Feature specifications
public/                    # PWA assets and icons
```

## 🎯 Architecture

### Component Architecture
- **GridWorld**: Canvas-based rendering with touch/mouse/keyboard input
- **Agent System**: Pluggable agent behaviors with validation
- **Simulation Engine**: State management and update loops
- **PWA Shell**: Ionic React with tab navigation

### Design Patterns
- **BDD Testing**: Behavior-driven development with clear scenarios
- **Ionic Design System**: Leveraging CSS variables and utilities
- **TypeScript**: Full type safety with strict configuration
- **PWA Best Practices**: Following Vite PWA official patterns

## 🔧 Configuration

### PWA Configuration
The app uses **Vite PWA** with auto-generated assets:
- Icons generated from `public/pwa-icon.svg`
- Manifest with proper PWA metadata
- Service worker with intelligent caching
- Update prompts for new versions

### Development
- **Hot reload** with Vite development server
- **TypeScript** with strict type checking
- **ESLint** for code quality
- **Vitest** for fast testing

## 🤝 Contributing

### Branch Naming Convention

We follow a structured branch naming convention to keep the project organized and make it easy to understand what each branch does.

#### Format
```
<type>/<description>[-<issue-number>]
```

#### Branch Types

| Type | Purpose | Example |
|------|---------|---------|
| `feature/` | New functionality or enhancements | `feature/agent-pathfinding` |
| `fix/` | Bug fixes and corrections | `fix/grid-rendering-performance` |
| `hotfix/` | Urgent production fixes | `hotfix/critical-memory-leak` |
| `refactor/` | Code improvements without functional changes | `refactor/agent-class-hierarchy` |
| `docs/` | Documentation updates | `docs/api-reference-update` |
| `chore/` | Maintenance, CI/CD, tooling | `chore/update-dependencies` |
| `experiment/` | Experimental or proof-of-concept work | `experiment/webgl-rendering` |

#### Examples for This Project

```bash
# Grid World Features
feature/mobile-pwa-setup
feature/wasm-agent-support
feature/grid-simulation-controls

# Bug Fixes
fix/agent-collision-detection
fix/mobile-touch-responsiveness-42

# Documentation
docs/installation-guide-improvements
docs/branch-naming-convention

# Maintenance
chore/setup-github-actions
chore/add-eslint-configuration
```

#### Naming Guidelines

- Use **kebab-case** (lowercase with hyphens)
- Be descriptive but concise (2-5 words)
- Focus on **what** you're doing, not **how**
- Include issue numbers when relevant: `-123`
- Avoid abbreviations unless widely understood

#### Post-Merge Workflow

After your PR is merged, clean up your local repository:

```bash
# Switch back to main and pull latest changes
git checkout main
git pull origin main

# Delete the merged feature branch
git branch -d feature/your-branch-name

# Verify clean state
git status
```

### Development Process

1. Fork the repository
2. Create a feature branch following our naming convention
3. Make your changes and add tests
4. Ensure all tests pass: `npm test`
5. Commit your changes with clear messages
6. Push to your branch: `git push origin feature/your-branch`
7. Open a Pull Request with a descriptive title
8. After merge, follow the post-merge cleanup workflow

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Ionic Team** for the excellent React components and design system
- **Vite PWA** for modern PWA tooling and best practices
- **Vitest** for fast and reliable testing framework
- **TypeScript** for type safety and developer experience

---

**Built with ❤️ using Ionic React, TypeScript, and modern web technologies**