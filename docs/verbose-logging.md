# Verbose Logging Guide for Gemini Code Flow

## Overview

Gemini Code Flow includes a comprehensive verbose logging system designed to help you monitor and control output from multi-agent workflows. With support for up to 29 specialized agents running in parallel, proper log management is essential for tracking progress and debugging issues.

## Log Levels

### 🔇 SILENT (`--quiet`)
- **Purpose**: Minimal noise for CI/CD or background processing
- **Shows**: Only critical errors and final completion status
- **Use when**: Running automated workflows, large-scale processing, or when you only care about success/failure

### 📋 MINIMAL (`default`)
- **Purpose**: Essential progress tracking
- **Shows**: Agent start/complete events, major milestones, warnings, and errors
- **Use when**: Standard development workflow monitoring

### 📝 NORMAL 
- **Purpose**: Standard development output
- **Shows**: All minimal logs plus detailed task information and delegation events
- **Use when**: Active development and debugging

### 🔍 VERBOSE (`-v` or `--verbose`)
- **Purpose**: Detailed progress tracking
- **Shows**: Context loading, prompt building, delegation details, and progress updates
- **Use when**: Debugging agent coordination issues or understanding workflow progression

### 🐛 DEBUG (`-vv` or `--debug`)
- **Purpose**: Full system transparency
- **Shows**: Complete API calls, memory operations, internal state changes, and full agent outputs
- **Use when**: Troubleshooting system issues or developing new features

## Output Formats

### 📄 DETAILED (default)
```
[14:32:15] [INFO] [Orchestrator] Starting Gemini Code Flow Orchestrator...
[14:32:16] [INFO] [CLI] 🤖 AGENT STARTED: ARCHITECT
   ID: agent-1703427136-xyz123
   Task: Design REST API architecture for user management
```

### 📦 COMPACT (`--compact`)
```
[INFO] Orchestrator: Starting Gemini Code Flow Orchestrator...
[INFO] CLI: 🤖 ARCHITECT: Started
[INFO] CLI: ✅ ARCHITECT: Done (4521ms)
```

### 📊 PROGRESS (`--progress`)
```
📊 [████████████████░░░░] 80% | Active: 3 | Pending: 127 | Done: 8
```

## CLI Flags Reference

### Global Verbosity Options
```bash
# Silent mode - only critical events and errors
gemini-flow start --task "Build API" --quiet

# Standard verbose - detailed progress
gemini-flow start --task "Build API" --verbose

# Debug mode - full details
gemini-flow start --task "Build API" --debug

# Alternative debug syntax
gemini-flow start --task "Build API" -vv
```

### Output Format Options
```bash
# Compact single-line updates
gemini-flow start --task "Build API" --compact

# Progress bars for large workflows
gemini-flow start --task "Build API" --progress

# Combination: quiet + progress for CI/CD
gemini-flow start --task "Build API" --quiet --progress
```

### Agent Filtering
```bash
# Show only architect and coder agents
gemini-flow start --task "Build API" --filter architect,coder

# Monitor specific workflow stages
gemini-flow start --task "Build API" --filter architect,tester,security --verbose

# Debug specific agent type
gemini-flow start --task "Build API" --filter debugger --debug
```

## Practical Examples

### Large-Scale Workflows (12+ Agents, 1000+ Tasks)
```bash
# Recommended: Minimal output with progress tracking
gemini-flow start --task "Build microservices platform" --compact --progress

# Alternative: Silent with periodic status checks
gemini-flow start --task "Build microservices platform" --quiet &
gemini-flow progress --watch --interval 30
```

### Development and Debugging
```bash
# Standard development monitoring
gemini-flow start --task "Add auth system" --verbose

# Focus on specific agent interactions
gemini-flow start --task "Add auth system" --filter architect,security,coder -v

# Full debugging session
gemini-flow start --task "Fix API issues" --debug --filter debugger,tester
```

### CI/CD Integration
```bash
# Minimal output for build logs
gemini-flow start --task "Generate deployment configs" --quiet --progress

# Structured output for parsing
gemini-flow start --task "Run quality checks" --compact --filter qa,security,tester
```

## Monitoring Running Workflows

### Real-time Progress Tracking
```bash
# Watch workflow progress (updates every 5 seconds)
gemini-flow progress --watch

# Custom update interval
gemini-flow progress --watch --interval 10

# One-time status check
gemini-flow progress
```

### Status Checking
```bash
# System status
gemini-flow status

# Authentication status
gemini-flow auth --status

# Verbose system information
gemini-flow status --verbose
```

## Environment Variables

You can also control logging via environment variables:

```bash
# Set default log level
export LOG_LEVEL=VERBOSE

# Then run without flags
gemini-flow start --task "Your task"
```

## Common Scenarios

### Scenario 1: "I have 12 agents with 1600 tasks - too much output!"
**Solution**: Use compact + progress mode
```bash
gemini-flow start --task "Your task" --compact --progress
```

### Scenario 2: "I need to debug why agent delegation isn't working"
**Solution**: Filter to relevant agents with verbose output
```bash
gemini-flow start --task "Your task" --filter orchestrator,architect --verbose
```

### Scenario 3: "Running in CI/CD, need minimal logs but want to track progress"
**Solution**: Quiet mode with progress tracking
```bash
gemini-flow start --task "Your task" --quiet --progress
```

### Scenario 4: "Want to monitor specific agent types only"
**Solution**: Use agent filtering
```bash
gemini-flow start --task "Your task" --filter security,tester,qa --compact
```

### Scenario 5: "Need full debugging information"
**Solution**: Debug mode with optional filtering
```bash
# Full debug - everything
gemini-flow start --task "Your task" --debug

# Focused debug - specific agents
gemini-flow start --task "Your task" --debug --filter coder,debugger
```

## Performance Impact

- **SILENT/MINIMAL**: Negligible performance impact
- **NORMAL/VERBOSE**: ~2-5% overhead from additional logging
- **DEBUG**: ~5-10% overhead due to detailed output formatting
- **PROGRESS**: Minimal impact, updates every 2-10 seconds depending on mode

## Tips for Large Workflows

1. **Start with COMPACT**: For workflows with 500+ tasks, begin with `--compact`
2. **Use PROGRESS mode**: Visual progress bars help track completion without overwhelming output
3. **Filter strategically**: Use `--filter` to focus on problematic agent types
4. **Monitor externally**: Use `gemini-flow progress --watch` in a separate terminal
5. **Background processing**: Run with `--quiet` and check status periodically

## Troubleshooting

### Too Much Output
```bash
# Reduce verbosity
gemini-flow start --task "Your task" --compact

# Or filter to specific agents
gemini-flow start --task "Your task" --filter architect,coder
```

### Missing Important Information
```bash
# Increase verbosity
gemini-flow start --task "Your task" --verbose

# Or check full debug for specific agents
gemini-flow start --task "Your task" --debug --filter debugger
```

### Performance Issues
```bash
# Use minimal logging
gemini-flow start --task "Your task" --quiet --progress
```

The verbose logging system is designed to scale from simple single-agent tasks to complex multi-agent workflows with thousands of tasks, giving you the right level of visibility for your specific use case.