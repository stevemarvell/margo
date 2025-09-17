# Branch Naming Quick Reference

## Format
```
<type>/<description>[-<issue-number>]
```

## Branch Types

### Development
- `feature/` - New functionality, enhancements
- `experiment/` - Experimental work, POCs

### Maintenance  
- `fix/` - Bug fixes, corrections
- `hotfix/` - Urgent production fixes
- `refactor/` - Code improvements without functional changes

### Support
- `docs/` - Documentation updates
- `chore/` - Maintenance, CI/CD, tooling
- `release/` - Release preparation

## Decision Tree

```
Are you adding new functionality?
├─ Yes → feature/your-feature-name
└─ No
   ├─ Fixing a bug?
   │  ├─ Urgent production issue? → hotfix/fix-description
   │  └─ Regular bug? → fix/bug-description
   ├─ Improving code without changing behavior? → refactor/improvement-description
   ├─ Updating documentation? → docs/doc-description
   ├─ Maintenance/tooling work? → chore/task-description
   └─ Experimental work? → experiment/experiment-description
```

## Examples

### Grid World Project
```bash
# Features
feature/mobile-pwa-setup
feature/wasm-agent-support
feature/multi-agent-pathfinding-15

# Fixes
fix/agent-collision-detection
fix/grid-rendering-performance-42
hotfix/critical-memory-leak

# Refactoring
refactor/agent-class-hierarchy
refactor/simplify-grid-calculations

# Documentation
docs/api-reference-update
docs/installation-guide

# Maintenance
chore/update-dependencies
chore/setup-github-actions
chore/add-eslint-rules
```

## Naming Rules

✅ **Do:**
- Use kebab-case (lowercase with hyphens)
- Be descriptive but concise (2-5 words)
- Focus on WHAT you're doing
- Include issue numbers: `-123`
- Use standard prefixes

❌ **Don't:**
- Use camelCase or snake_case
- Use abbreviations unless widely known
- Make names too long or too short
- Focus on HOW you're implementing
- Skip the type prefix

## Post-Merge Cleanup

```bash
# After PR is merged
git checkout main
git pull origin main
git branch -d feature/your-branch-name
git status
```

## Git Aliases (Optional)

Add to your `.gitconfig`:

```ini
[alias]
    cleanup = "!f() { git checkout main && git pull origin main && git branch -d $1; }; f"
    new-feature = "!f() { git checkout main && git pull origin main && git checkout -b feature/$1; }; f"
    new-fix = "!f() { git checkout main && git pull origin main && git checkout -b fix/$1; }; f"
```

Usage:
```bash
git new-feature agent-pathfinding
git cleanup feature/agent-pathfinding
```