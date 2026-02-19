# Antfarm Integration

This repo uses Antfarm for automated bug fixes and feature development.

## Workflows

- **bug-fix**: Automated bug reproduction, investigation, and fix
- **feature-dev**: Feature implementation with verification

## Setup

```bash
# Install antfarm
npm install -g antfarm

# Run a bug fix workflow
antfarm workflow run bug-fix "Fix issue description"
```

## Risk Policy

See `risk-tier.json` for risk tier definitions and merge requirements.
