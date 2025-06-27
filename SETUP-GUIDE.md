# Gemini Code Flow - Setup Guide

## Issues Fixed ✅

The following critical issues have been resolved:

### 1. **Missing Configuration File**
- **Problem**: `gemini-flow start` failed because `.gemini-flow.json` didn't exist
- **Solution**: Created default configuration with proper agent settings and workflows

### 2. **Authentication Flow Missing**
- **Problem**: No clear way to authenticate with Gemini API
- **Solution**: Added comprehensive authentication system supporting both Google Account and API key methods

### 3. **Single Agent Execution Only**
- **Problem**: SPARC commands ran single agents instead of spawning collaborative multi-agent workflows
- **Solution**: Enhanced orchestrator to support multi-agent task delegation and coordination

### 4. **Missing Command Implementations**
- **Problem**: Several command files were incomplete or missing
- **Solution**: Implemented all SPARC commands, agent coordination, and workflow orchestration

### 5. **Build System Issues**
- **Problem**: TypeScript compilation failed due to missing dependencies and configuration
- **Solution**: Fixed TypeScript configuration and installed required type definitions

---

## Quick Start 🚀

### Step 1: Authentication

Choose one of two authentication methods:

#### Option A: Google Account (Recommended)
```bash
# Check if you need authentication
gemini-flow auth --status

# Start authentication flow
gemini-flow auth --login
```

This will open your browser to authenticate with your Google account.

#### Option B: API Key
```bash
# Get your API key from: https://makersuite.google.com/app/apikey
export GEMINI_API_KEY="your-api-key-here"

# Add to your shell profile for persistence
echo 'export GEMINI_API_KEY="your-api-key-here"' >> ~/.bashrc
source ~/.bashrc
```

### Step 2: Verify Setup
```bash
# Check overall status
gemini-flow status

# List available modes
gemini-flow list
```

### Step 3: Start Multi-Agent Development

#### Option A: Single SPARC Mode
```bash
# Run individual agents
gemini-flow sparc architect "Design a REST API for a blog platform"
gemini-flow sparc coder "Implement the blog API endpoints"
gemini-flow sparc tester "Create comprehensive tests for the blog API"
```

#### Option B: Multi-Agent Orchestration (Fixed!)
```bash
# Start orchestrator with initial task - agents will collaborate automatically
gemini-flow start --task "Build a complete blog platform with authentication"

# Or start interactive mode and add tasks via the orchestrator
gemini-flow start
```

---

## Multi-Agent Workflows 🤖

The orchestrator now properly spawns and coordinates multiple agents:

### Default Workflow
When you run `gemini-flow start --task "Your project"`, it automatically:

1. **Orchestrator Agent** - Breaks down your project into manageable tasks
2. **Architect Agent** - Designs system architecture based on requirements
3. **Coder Agent** - Implements core functionality following the architecture
4. **Tester Agent** - Creates comprehensive tests for all components
5. **Documentation Agent** - Generates documentation and usage guides

### Custom Workflows
Edit `.gemini-flow.json` to customize agent behavior:

```json
{
  "maxAgents": 5,
  "defaultWorkflow": {
    "enabled": true,
    "tasks": [
      {
        "mode": "orchestrator",
        "description": "Plan the development approach",
        "priority": "high"
      },
      {
        "mode": "security",
        "description": "Review security requirements",
        "priority": "high",
        "dependencies": ["orchestrator"]
      }
    ]
  }
}
```

---

## Command Reference 📚

### Core Commands

```bash
# Authentication
gemini-flow auth --status          # Check auth status
gemini-flow auth --login          # Start auth flow

# Multi-Agent Orchestration
gemini-flow start                  # Interactive mode
gemini-flow start --task "Build X" # Start with specific task
gemini-flow start --config custom.json # Use custom config

# Single Agent Tasks
gemini-flow sparc <mode> <task>    # Run specific agent mode
gemini-flow agent <task>           # Run agent with default mode

# Information
gemini-flow list                   # Show available modes
gemini-flow status                 # Show system status
gemini-flow --help                 # Show help
```

### SPARC Modes Available

| Mode | Icon | Description |
|------|------|-------------|
| `orchestrator` | ⚡ | Coordinates complex multi-agent workflows |
| `architect` | 🏗️ | System design and architecture |
| `coder` | 🧠 | Clean, modular implementation |
| `tester` | 🧪 | Test-driven development |
| `debugger` | 🪲 | Troubleshooting and bug fixes |
| `security` | 🛡️ | Security audits and reviews |
| `documentation` | 📚 | Comprehensive documentation |
| `integrator` | 🔗 | Component integration |
| `monitor` | 📈 | Performance monitoring |
| `optimizer` | 🧹 | Code optimization |
| `designer` | 🎨 | UI/UX with multimodal support |
| `devops` | 🚀 | Deployment and infrastructure |

---

## Configuration 🔧

### Default Configuration Location
- Global: `/opt/homebrew/lib/node_modules/gemini-code-flow/.gemini-flow.json`
- Project: `./.gemini-flow.json` (takes precedence)

### Key Configuration Options

```json
{
  "maxAgents": 5,                    // Max concurrent agents
  "memoryPath": "./gemini-memory.json", // Agent memory storage
  "authMethod": "google-account",    // or "api-key"
  
  "modes": {
    "coder": {
      "temperature": 0.3,           // Creativity level (0-1)
      "maxTokens": 4096            // Response length limit
    }
  },
  
  "defaultWorkflow": {
    "enabled": true,               // Auto-start workflow
    "tasks": [ /* custom tasks */ ]
  },
  
  "logging": {
    "level": "info",               // debug, info, warn, error
    "console": true
  }
}
```

---

## Examples 💡

### Web Application Development
```bash
# Multi-agent approach
gemini-flow start --task "Build a task management web app with user authentication, real-time updates, and responsive design"

# This will automatically:
# 1. Plan the architecture
# 2. Design the database schema  
# 3. Implement backend APIs
# 4. Create frontend components
# 5. Add authentication
# 6. Write tests
# 7. Generate documentation
```

### API Development
```bash
# Step-by-step approach
gemini-flow sparc orchestrator "Plan a RESTful API for an e-commerce platform"
gemini-flow sparc architect "Design the API architecture based on the plan"
gemini-flow sparc coder "Implement the core API endpoints"
gemini-flow sparc security "Review API security and add protection"
gemini-flow sparc tester "Create comprehensive API tests"
```

### Code Review and Optimization
```bash
# Review existing code
gemini-flow sparc debugger "Review this codebase for potential issues" --file ./src/
gemini-flow sparc optimizer "Optimize performance bottlenecks"
gemini-flow sparc security "Conduct security audit"
```

---

## Troubleshooting 🔍

### Common Issues

#### "Authentication required"
```bash
# Check status
gemini-flow auth --status

# Re-authenticate if needed
gemini-flow auth --login
```

#### "No agents spawned"
- Ensure you have a valid task: `gemini-flow start --task "Specific project description"`
- Check configuration: `gemini-flow status`
- Verify memory path is writable

#### "GEMINI_API_KEY not found"
```bash
# Set environment variable
export GEMINI_API_KEY="your-key-here"

# Or use Google Account auth
gemini-flow auth --login
```

#### "Orchestrator starts but no tasks"
The orchestrator needs either:
- An initial task: `--task "Build something"`
- Default workflow enabled in config
- Manual task addition via API (future feature)

### Debug Mode
```bash
# Enable verbose logging
LOG_LEVEL=debug gemini-flow start --task "Your project"
```

### Reset Everything
```bash
# Clear memory and start fresh
rm -f gemini-memory.json .gemini-flow.json
gemini-flow start --task "Your new project"
```

---

## What's New 🆕

### Multi-Agent Coordination
- ✅ Agents now properly collaborate on complex tasks
- ✅ Task dependencies and workflow orchestration
- ✅ Shared memory between agents
- ✅ Progress tracking and status updates

### Enhanced Authentication
- ✅ Google Account integration
- ✅ API key management
- ✅ Automatic token refresh
- ✅ Fallback authentication methods

### Improved Configuration
- ✅ Default configuration templates
- ✅ Project-specific settings
- ✅ Workflow customization
- ✅ Agent behavior tuning

### Better Error Handling
- ✅ Descriptive error messages
- ✅ Graceful failure recovery
- ✅ Debugging assistance
- ✅ Status reporting

---

## Next Steps 🔮

1. **Set up authentication** using your preferred method
2. **Try a simple project**: `gemini-flow start --task "Build a simple calculator"`
3. **Experiment with different modes** using `gemini-flow sparc <mode> <task>`
4. **Customize workflows** by editing `.gemini-flow.json`
5. **Scale up to complex projects** with multi-agent orchestration

---

## Support 💬

- **Issues**: Report bugs or request features
- **Documentation**: Check the built-in help with `gemini-flow --help`
- **Status**: Use `gemini-flow status` to diagnose problems
- **Community**: Based on Claude Code Flow by ruvnet

---

*Built with ❤️ - Gemini Code Flow v0.1.0*