# Gemini CLI Code Generation Guide

## Overview

Gemini Code Flow integrates with **Gemini CLI** - Google's automated coding agent that can read, write, and modify files directly in your project directory. This is different from text-only AI responses.

## Two Modes of Operation

### 1. 📝 Text Generation Mode (Default)
- Uses Google Generative AI SDK
- Generates **text descriptions** of code
- **No files are created or modified**
- Saves results to `.gemini-flow/` directory as markdown files
- Good for planning, documentation, and code review

```bash
# Text-only mode (default)
gemini-flow sparc coder "Create a REST API"
# Result: Text description saved to .gemini-flow/coder-[timestamp].md
```

### 2. 🔧 Code Generation Mode (`--cli` or `--code`)
- Uses actual Gemini CLI processes
- **Creates, modifies, and deletes files** in your project
- Operates in current working directory
- Tracks file changes and reports them
- **This is what you want for actual development work**

```bash
# Code generation mode
gemini-flow sparc coder "Create a REST API" --cli
# Result: Actual files created in your project directory
```

## Key Commands

### Single Agent with File Operations
```bash
# Generate actual code files
gemini-flow sparc architect "Create project structure" --cli

# Auto-accept all file changes (YOLO mode)
gemini-flow sparc coder "Add authentication" --code --yolo

# With verbose logging to see file operations
gemini-flow sparc tester "Add unit tests" --cli --verbose
```

### Multi-Agent Orchestrator with File Operations
```bash
# Start orchestrator with CLI-enabled agents
gemini-flow start --task "Build a web application" --cli

# With minimal logging for large workflows
gemini-flow start --task "Refactor codebase" --cli --compact
```

## File Operations Tracking

When using `--cli` mode, the system tracks:

### Files Created
- New files that didn't exist before
- Reported in agent completion logs
- Tracked in memory for context

### Files Modified
- Existing files that were changed
- Detected by file size and modification time
- Helps identify what the agent worked on

### Example Output
```
📁 Created 3 files: src/app.js, package.json, README.md
📝 Modified 1 files: .gitignore
```

## Working Directory Behavior

### Default Working Directory
- Uses current directory where you run the command
- All file operations happen relative to this location
- Gemini CLI can see and modify all files (unless ignored)

### File Visibility
Gemini CLI automatically includes:
- All project files in context (with `--all_files`)
- Project structure and relationships
- Existing code patterns and conventions

### Ignored Files
The system ignores common patterns:
- `node_modules/`
- `.git/`
- `dist/`, `build/`
- `.env` files
- Log files

## Configuration Options

### Gemini CLI Settings
```json
{
  "model": "gemini-2.5-pro",
  "debug": false,
  "allFiles": true,
  "yolo": false,
  "checkpointing": true,
  "workingDirectory": "./",
  "timeout": 300000
}
```

### YOLO Mode (`--yolo`)
- **Automatically accepts all file operations**
- No interactive prompts
- Useful for automated workflows
- **Use with caution** - reviews all changes afterward

## Agent-Specific Behavior

### Architect Agent (`--cli`)
- Creates project structure files
- Sets up configuration files
- Creates documentation templates
- Establishes development environment

### Coder Agent (`--cli`)
- Writes implementation files
- Modifies existing code
- Adds new features
- Refactors code structure

### Tester Agent (`--cli`)
- Creates test files and directories
- Adds testing configuration
- Implements test cases
- Sets up testing infrastructure

### Security Agent (`--cli`)
- Reviews and modifies security configurations
- Adds security-related files
- Updates dependencies for security
- Creates security documentation

## Troubleshooting

### No Files Being Created
**Problem**: Running agents but no files appear in project

**Solution**: Add `--cli` or `--code` flag
```bash
# Wrong (text only)
gemini-flow sparc coder "Create API"

# Correct (creates files)
gemini-flow sparc coder "Create API" --cli
```

### Gemini CLI Not Found
**Problem**: `Gemini CLI is not available`

**Solutions**:
1. Install Gemini CLI:
   ```bash
   npm install -g @google-ai/generativelanguage
   ```

2. Verify installation:
   ```bash
   gemini --version
   ```

3. Check PATH:
   ```bash
   which gemini
   ```

### Permission Issues
**Problem**: Cannot write files

**Solutions**:
1. Check directory permissions:
   ```bash
   ls -la
   ```

2. Run from correct directory:
   ```bash
   cd your-project
   gemini-flow sparc coder "Add feature" --cli
   ```

### Large Workflow Management
**Problem**: Too many agents creating files simultaneously

**Solutions**:
1. Use compact logging:
   ```bash
   gemini-flow start --task "Build app" --cli --compact
   ```

2. Filter to specific agents:
   ```bash
   gemini-flow start --task "Build app" --cli --filter architect,coder
   ```

3. Monitor progress separately:
   ```bash
   gemini-flow start --task "Build app" --cli --quiet &
   gemini-flow progress --watch
   ```

## Best Practices

### 1. Start Small
```bash
# Test with single agent first
gemini-flow sparc architect "Create basic structure" --cli

# Then scale to multi-agent
gemini-flow start --task "Build full application" --cli
```

### 2. Use Version Control
```bash
# Commit before running agents
git add -A && git commit -m "Before Gemini agents"

# Run agents
gemini-flow sparc coder "Add new feature" --cli

# Review changes
git diff
```

### 3. Monitor File Operations
```bash
# Use verbose mode to see what's happening
gemini-flow sparc coder "Refactor code" --cli --verbose

# Or check file tracking
gemini-flow progress
```

### 4. Gradual Automation
```bash
# Start interactive (without --yolo)
gemini-flow sparc coder "Add tests" --cli

# Once confident, use YOLO mode
gemini-flow sparc coder "Add tests" --cli --yolo
```

## Integration Examples

### CI/CD Pipeline
```bash
# Automated code generation
gemini-flow sparc coder "Update API endpoints" --cli --yolo --quiet

# Check what was changed
git status
```

### Development Workflow
```bash
# Create feature structure
gemini-flow sparc architect "Design user auth" --cli

# Implement the feature
gemini-flow sparc coder "Implement user auth" --cli

# Add tests
gemini-flow sparc tester "Test user auth" --cli

# Security review
gemini-flow sparc security "Review auth security" --cli
```

### Team Collaboration
```bash
# Create consistent project structure
gemini-flow init --sparc
gemini-flow sparc architect "Setup team standards" --cli

# Generate documentation
gemini-flow sparc documentation "Create dev guide" --cli
```

## Summary

- **Without `--cli`**: Text descriptions only, no files created
- **With `--cli`**: Actual file operations, real code generation
- **Use `--yolo`**: For automated acceptance of all changes
- **Monitor with**: `--verbose` for details, `--compact` for minimal output
- **Track progress**: With `gemini-flow progress` command

The key insight: Gemini CLI is designed to be an **automated coding partner** that works directly with your files, just like a human developer would, but you need to explicitly enable this with the `--cli` flag.