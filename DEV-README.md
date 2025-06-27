# Gemini Code Flow v2 - Local Development Guide

## 🚀 Quick Start for Development

This is your local development copy of Gemini Code Flow v2, located at:
```
/Users/jokkeruokolainen/Documents/Solita/GenAI/IDE/gemini-code-flow
```

### Prerequisites
- Node.js 18+
- TypeScript (globally installed)
- Git with SSH access to GitHub

### Initial Setup

```bash
# Navigate to the project
cd /Users/jokkeruokolainen/Documents/Solita/GenAI/IDE/gemini-code-flow

# Install dependencies
npm install

# Build the project
npm run build

# Verify everything works
node verify-config.js
```

## 🔧 Development Workflow

### Building and Testing

```bash
# Build TypeScript
npm run build

# Run verification tests
node verify-config.js

# Run setup tests
node test-setup.js

# Test CLI locally
node dist/cli.js --version
node dist/cli.js list
```

### Local CLI Usage

You have three ways to run the CLI during development:

#### 1. Direct Node Execution
```bash
cd /Users/jokkeruokolainen/Documents/Solita/GenAI/IDE/gemini-code-flow
node dist/cli.js [commands]
```

#### 2. Convenience Script (Recommended)
```bash
# From anywhere:
/Users/jokkeruokolainen/Documents/Solita/GenAI/IDE/gemini-code-flow/gemini-flow-local.sh [commands]

# Examples:
./gemini-flow-local.sh list
./gemini-flow-local.sh status
./gemini-flow-local.sh start --task "Test local development"
```

#### 3. Global NPM Link (Optional)
```bash
# Link for global access during development
cd /Users/jokkeruokolainen/Documents/Solita/GenAI/IDE/gemini-code-flow
npm link

# Now you can use 'gemini-flow' globally
gemini-flow list
```

## 📁 Project Structure

```
gemini-code-flow/
├── src/                          # TypeScript source code
│   ├── cli.ts                   # Main CLI entry point
│   ├── commands/                # Command implementations
│   │   ├── agent.ts            # Single agent commands
│   │   ├── init.ts             # Project initialization
│   │   ├── sparc.ts            # SPARC mode commands
│   │   └── status.ts           # Status checking
│   ├── core/                    # Core functionality
│   │   ├── gemini-client.ts    # Gemini API integration
│   │   ├── memory-manager.ts   # Agent memory management
│   │   ├── orchestrator.ts     # Multi-agent orchestration
│   │   └── task-queue.ts       # Task queue management
│   ├── types/                   # TypeScript type definitions
│   │   └── index.ts            # All type exports
│   └── utils/                   # Utility functions
│       ├── auth-helper.ts      # Authentication handling
│       ├── logger.ts           # Logging utilities
│       └── rate-limiter.ts     # Rate limiting
├── templates/                   # Configuration templates
│   └── default-config.json     # Comprehensive default config
├── dist/                        # Compiled JavaScript (generated)
├── tests/                       # Test files
├── .github/                     # GitHub workflows and templates
├── docs/                        # Documentation
├── package.json                 # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── verify-config.js            # Configuration verification
├── test-setup.js               # Setup testing
└── gemini-flow-local.sh        # Local development script
```

## 🛠️ Development Commands

### Core Development
```bash
# Watch mode for development (auto-rebuild on changes)
npx tsc --watch

# Build for production
npm run build

# Run linting
npm run lint

# Run tests
npm test
```

### Configuration Testing
```bash
# Verify all 17 SPARC modes are properly configured
node verify-config.js

# Test CLI functionality
node test-setup.js

# Test specific configurations
node dist/cli.js start --config ./templates/default-config.json --task "Test config" --no-auth
```

### Authentication Testing
```bash
# Test authentication status
node dist/cli.js auth --status

# Test different auth methods
node dist/cli.js status
```

## 🔄 Git Workflow

### Repository Information
- **Remote**: `git@github.com:jruokola/gemini-code-flow-v2.git`
- **Branch**: `main`
- **Protocol**: SSH

### Common Git Commands
```bash
# Check status
git status

# Create feature branch
git checkout -b feature/your-feature-name

# Commit changes
git add .
git commit -m "feat: your description"

# Push to remote
git push origin feature/your-feature-name

# Sync with main
git checkout main
git pull origin main
```

## 🧪 Testing New Features

### Adding New SPARC Modes
1. Update `src/types/index.ts` - Add new mode to `AgentMode` type
2. Update `templates/default-config.json` - Add mode configuration
3. Update `src/commands/sparc.ts` - Add mode to valid modes list
4. Update `src/cli.ts` - Add mode to list display
5. Run verification: `node verify-config.js`

### Testing Multi-Agent Workflows
```bash
# Test orchestrator with minimal task
node dist/cli.js start --task "Simple test project" --no-auth

# Test individual SPARC modes
node dist/cli.js sparc orchestrator "Plan a test project"
node dist/cli.js sparc architect "Design test architecture"
```

### Testing Authentication
```bash
# Test without actual API calls
export GEMINI_API_KEY="test-key-for-testing"
node dist/cli.js auth --status

# Test Google Account flow (requires real auth)
node dist/cli.js auth --login
```

## 🚀 Deployment and Publishing

### Local NPM Install
```bash
# Install globally from local development
npm pack
npm install -g gemini-code-flow-0.1.0.tgz
```

### Publishing to NPM
```bash
# Update version in package.json first
npm version patch|minor|major

# Build and publish
npm run build
npm publish
```

## 🐛 Debugging Tips

### Common Issues
1. **Build Failures**: Check TypeScript errors with `npx tsc --noEmit`
2. **Module Not Found**: Ensure `npm install` was run and `dist/` exists
3. **Authentication Issues**: Check API key or run `node dist/cli.js auth --status`
4. **Config Loading**: Verify template file exists: `ls -la templates/default-config.json`

### Debug Mode
```bash
# Enable verbose logging
LOG_LEVEL=debug node dist/cli.js [command]

# Test with specific config
node dist/cli.js start --config ./templates/default-config.json --task "Debug test"
```

### Verification Scripts
```bash
# Comprehensive verification
node verify-config.js

# Basic functionality test
node test-setup.js

# Check CLI integration
node dist/cli.js list | grep -c "architect"  # Should output 1
```

## 📝 Contributing Guidelines

### Code Style
- Use TypeScript strict mode
- Follow existing naming conventions
- Add JSDoc comments for public APIs
- Keep functions under 50 lines when possible

### Commit Messages
- Use conventional commits: `feat:`, `fix:`, `docs:`, `test:`
- Keep first line under 50 characters
- Add detailed description for complex changes

### Pull Request Process
1. Create feature branch from `main`
2. Make changes and test locally
3. Run verification scripts
4. Update documentation if needed
5. Submit PR with clear description

## 🔧 Configuration Development

### Default Configuration
The comprehensive configuration template is in `templates/default-config.json` and includes:
- All 17 SPARC modes with unique settings
- Multiple workflow types (Standard, Rapid, Security-First)
- Authentication options
- Performance and logging settings

### Customizing Modes
Each mode can be customized with:
- `temperature`: Creativity level (0.0-1.0)
- `maxTokens`: Response length limit
- `systemPrompt`: Specialized instructions
- `icon`: Unique emoji identifier

### Adding Workflows
Add new workflows to `alternativeWorkflows` section in the template:
```json
"your-workflow": {
  "name": "Your Workflow Name",
  "description": "Description of the workflow",
  "tasks": [
    {
      "mode": "orchestrator",
      "description": "Task description",
      "priority": "high"
    }
  ]
}
```

## 📊 Performance Monitoring

### Memory Usage
```bash
# Monitor memory during development
node --max-old-space-size=4096 dist/cli.js start --task "Large project"
```

### Profiling
```bash
# Enable profiling in config
# Set "enableProfiling": true in .gemini-flow.json
```

## 🎯 Next Steps for Development

1. **Test multi-agent coordination** with real Gemini API
2. **Add more alternative workflows** for specific use cases
3. **Enhance error handling** and recovery mechanisms
4. **Add unit tests** for core functionality
5. **Improve CLI UX** with better progress indicators
6. **Add configuration validation** for custom configs

---

## 📞 Support

- **Issues**: Create GitHub issues for bugs or feature requests
- **Development**: This local setup is ready for full development workflow
- **Documentation**: See `SETUP-GUIDE.md` for user documentation

**Happy coding with Gemini Code Flow v2! 🚀**