# Enhanced CLI Orchestration & Delegation

## Overview

Gemini Code Flow now provides **true multi-agent orchestration** with Gemini CLI integration, enabling agents to create, modify, and collaborate on actual files while intelligently delegating work to specialized agents.

## Architecture Changes

### 1. CLI-First Design
- **Default Mode**: All agents use Gemini CLI by default (with `--yolo` enabled)
- **File Operations**: Agents directly create, modify, and delete files in your project
- **Output Tracking**: System monitors file changes and parses CLI outputs
- **Context Sharing**: File operations and results are shared between agents

### 2. Intelligent Task Generation
- **Auto-Delegation**: Agents automatically spawn follow-up tasks based on their work
- **Context-Aware**: Task generation considers file operations, content analysis, and agent expertise
- **Workflow Continuity**: Maintains development flow from architecture → implementation → testing → security

## How It Works

### Initial Task Processing

```bash
gemini-flow start --task "Build a REST API for user management" --progress
```

**Flow**:
1. **Orchestrator Agent** receives the task
2. Creates initial project analysis and breakdown
3. **Auto-generates** follow-up tasks for specialized agents
4. **Queues** tasks with proper dependencies

### Agent Execution Process

Each agent follows this enhanced process:

1. **Context Loading**: Retrieves previous agent results and file states
2. **CLI Execution**: Runs Gemini CLI with mode-specific prompts
3. **File Tracking**: Monitors created/modified files before and after
4. **Output Analysis**: Parses CLI output for delegation patterns and file operations
5. **Auto-Task Generation**: Creates intelligent follow-up tasks
6. **Memory Storage**: Stores results, file operations, and context

### Delegation Mechanisms

#### 1. Explicit Delegation (in agent output)
```
DELEGATE_TO: tester - Create unit tests for the authentication service
REQUEST_AGENT: security - Review password hashing implementation  
NEEDS_REVIEW: architect - Validate API design patterns
```

#### 2. Automatic Task Generation
Based on agent type and file operations:

**Architect → Coder**
- When architecture creates structure files
- Automatically delegates implementation

**Coder → Tester**  
- When code files are created (.js, .ts, .py)
- Automatically requests test creation

**Coder → Security**
- When auth/security-related code is detected
- Automatically requests security review

**Any → Documentation**
- When config files or APIs are created
- Automatically requests documentation

### File Operation Intelligence

The system tracks and responds to file operations:

#### Created Files Trigger Tasks
```
📁 Created: src/auth/user.service.js
→ Auto-generates: "Create unit tests for user.service.js"
→ Assigns to: tester agent

📁 Created: config/database.yml  
→ Auto-generates: "Document database configuration options"
→ Assigns to: documentation agent
```

#### Modified Files Maintain Context
```
📝 Modified: package.json (added auth dependencies)
→ Auto-generates: "Review new dependencies for security vulnerabilities"  
→ Assigns to: security agent
```

## Agent Specialization

### Architect Agent
**Input**: High-level requirements  
**Output**: Project structure, configuration files, architectural documents  
**Auto-Delegates To**:
- `coder`: Implement designed components
- `tester`: Create test architecture
- `documentation`: Document architectural decisions

### Coder Agent  
**Input**: Implementation requirements  
**Output**: Source code files, modules, services  
**Auto-Delegates To**:
- `tester`: Unit tests for new code
- `security`: Security review for auth/sensitive code
- `documentation`: API documentation
- `integrator`: Component integration

### Tester Agent
**Input**: Code files to test  
**Output**: Test files, test configurations  
**Auto-Delegates To**:
- `security`: Security test review
- `performance`: Performance test creation

### Security Agent
**Input**: Code/config review requests  
**Output**: Security recommendations, fixed configurations  
**Auto-Delegates To**:
- `coder`: Implement security fixes
- `documentation`: Security guidelines

## Practical Examples

### Example 1: Full Web Application
```bash
gemini-flow start --task "Create a Node.js REST API with authentication" --compact
```

**Orchestration Flow**:
1. **Orchestrator**: Analyzes requirements, creates project breakdown
2. **Architect**: Creates project structure, package.json, basic configs
3. **Coder** (auto): Implements authentication service
4. **Tester** (auto): Creates auth service tests  
5. **Security** (auto): Reviews authentication implementation
6. **Documentation** (auto): Documents API endpoints
7. **Integrator** (auto): Sets up middleware and routing

### Example 2: Security-First Development
```bash
gemini-flow start --task "Add OAuth2 integration to existing app" --filter security,coder,tester
```

**Orchestration Flow**:
1. **Security**: Reviews current auth, identifies OAuth2 requirements
2. **Coder** (delegated): Implements OAuth2 service
3. **Tester** (auto): Creates OAuth2 integration tests
4. **Security** (auto): Reviews OAuth2 implementation
5. **Documentation** (auto): Updates API documentation

### Example 3: Incremental Development  
```bash
gemini-flow sparc coder "Add password reset functionality" --cli
```

**Single Agent with Auto-Delegation**:
1. **Coder**: Implements password reset service
2. **Tester** (auto): Creates password reset tests
3. **Security** (auto): Reviews password reset security
4. **Documentation** (auto): Documents password reset API

## Monitoring & Control

### Real-Time Progress
```bash
# Compact progress for large workflows
gemini-flow start --task "Build microservices" --compact --progress

# Detailed delegation tracking  
gemini-flow start --task "Refactor authentication" --verbose --filter security,coder

# External monitoring
gemini-flow progress --watch --interval 5
```

### File Operation Visibility
```
📁 Created 3 files: src/auth.js, tests/auth.test.js, docs/auth.md
📝 Modified 2 files: package.json, server.js
🔄 CODER → TESTER: Create integration tests for auth service
🔄 CODER → SECURITY: Review JWT implementation security
```

## Configuration Options

### Orchestrator Configuration
```json
{
  "maxAgents": 12,
  "useCLI": true,
  "yolo": true,
  "workingDirectory": "./",
  "autoTaskGeneration": true,
  "delegationPatterns": ["DELEGATE_TO", "REQUEST_AGENT", "NEEDS_REVIEW"],
  "fileOperationTracking": true
}
```

### Agent Behavior Control
```bash
# Full automation (default)
gemini-flow start --task "Build app" 

# Manual confirmation
gemini-flow start --task "Build app" --no-yolo

# Text-only mode (no file operations)
gemini-flow start --task "Plan architecture" --no-cli
```

## Best Practices

### 1. Task Granularity
```bash
# Good: Specific, actionable tasks
gemini-flow start --task "Add user authentication with JWT tokens"

# Better: Include context
gemini-flow start --task "Add JWT authentication to existing Express API"
```

### 2. Agent Filtering
```bash
# Focus on specific workflow stages
gemini-flow start --task "Security audit" --filter security,tester,reviewer

# Development workflow
gemini-flow start --task "Add feature" --filter architect,coder,tester
```

### 3. Progress Monitoring
```bash
# Large workflows - minimal output
gemini-flow start --task "Build platform" --compact --progress

# Development - detailed tracking
gemini-flow start --task "Add feature" --verbose
```

### 4. Incremental Development
```bash
# Start with architecture
gemini-flow sparc architect "Design user system" --cli

# Then implement  
gemini-flow sparc coder "Implement user service" --cli

# Let auto-delegation handle testing and security
```

## Troubleshooting

### No Auto-Delegation Occurring
**Check**: Agent outputs for delegation patterns  
**Solution**: Use `--debug` to see parsing details

### Too Many Agents Spawning
**Check**: Auto-task generation settings  
**Solution**: Use `--filter` to limit agent types

### File Operations Not Tracked
**Check**: Gemini CLI is properly installed and working  
**Solution**: Verify with `gemini --version`

### Agents Not Collaborating
**Check**: Task dependencies and memory sharing  
**Solution**: Use `--verbose` to see context loading

## Summary

The enhanced orchestration system provides:

- ✅ **True file-based collaboration** between agents
- ✅ **Intelligent auto-delegation** based on work completed  
- ✅ **Context-aware task generation** using file operations
- ✅ **Seamless workflow continuity** from architecture to deployment
- ✅ **Real-time progress tracking** with file operation visibility
- ✅ **Scalable from single agents to complex multi-agent workflows**

This creates a **truly collaborative AI development environment** where agents build upon each other's work automatically while maintaining oversight and control.