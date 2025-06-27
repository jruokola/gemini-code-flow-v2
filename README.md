# Gemini Code Flow 🚀

> AI-powered development orchestration for Gemini CLI - adapted from Claude Code Flow by [ruvnet](https://github.com/ruvnet)

## 🌟 Overview

Gemini Code Flow brings the powerful SPARC methodology and multi-agent orchestration capabilities to Google's Gemini CLI platform. This comprehensive framework features 29 specialized AI agents with intelligent workflow selection, enabling developers to leverage the right combination of agents for any project - from simple scripts to enterprise systems.

## 🙏 Attribution

This project is adapted from the excellent [Claude Code Flow](https://github.com/ruvnet/claude-code-flow) by ruvnet. Full credit goes to the original author for the innovative SPARC methodology and multi-agent orchestration concepts.

## ✨ Features

- **29 Specialized AI Agents**: Complete software development ecosystem from product management to deployment
- **Intelligent Workflow Selection**: Automatically selects appropriate agents based on project complexity
- **Multi-Agent Orchestration**: Run up to 12 Gemini agents in parallel with smart conflict prevention
- **Dynamic Agent Delegation**: Agents can spawn specialists as needed through delegation patterns
- **Persistent Memory**: Share knowledge across agents and sessions
- **Multimodal Support**: Leverage Gemini's ability to process images, PDFs, and sketches
- **Large Context Window**: Utilize Gemini's 1M token context for complex codebases
- **Google Search Integration**: Ground responses with real-time information

## 🛠️ Comprehensive Agent Ecosystem

### 29 Specialized AI Agents organized in 4 categories:

**🏗️ Core Development (17 agents)**: architect, coder, tester, debugger, security, documentation, integrator, monitor, optimizer, ask, devops, tutorial, database, specification, mcp, orchestrator, designer

**📊 Product & Strategy (4 agents)**: product, qa, reviewer, research

**☁️ Enterprise & Cloud (4 agents)**: cloud, sre, ai, ux  

**📱 Domain-Specific (4 agents)**: mobile, api, performance, release

### Intelligent Workflow Selection:
- **🚀 Minimal**: 1-2 agents for simple projects (calculators, demos)
- **⚡ Rapid**: 2-3 agents for prototypes and MVPs
- **🏗️ Standard**: 5-6 agents for normal applications  
- **🏢 Comprehensive**: 8-12 agents for enterprise systems

*See [Agent Roles Documentation](docs/agent-roles.md) for detailed capabilities and [Intelligent Workflows](docs/intelligent-workflows.md) for selection mechanics.*

## 📦 Installation

### Prerequisites
- Node.js 18+
- Gemini CLI installed globally

```bash
# Install Gemini CLI first
npm install -g @google/gemini-cli

# Install Gemini Code Flow
npm install -g gemini-code-flow
```

## 🔐 Authentication Options

Gemini Code Flow supports multiple authentication methods:

### Option 1: Personal Google Account (Recommended for Individual Use)
**Free usage with generous limits:**
- 60 requests per minute
- 1,000 requests per day
- Access to Gemini 2.5 Pro with 1M token context

```bash
# Simply login with your Google account when prompted
gemini-flow init --sparc
# No API key configuration needed!
```

### Option 2: API Key (For Professional/Enterprise Use)
For multiple simultaneous agents or usage-based billing:

```bash
# Set your API key from Google AI Studio or Vertex AI
export GEMINI_API_KEY="your-api-key-here"
```

### Current Limitations (Preview)
- Personal Google accounts: 60 requests/minute, 1,000/day
- Some advanced features may require API key authentication
- For the latest usage limits and capabilities, see [Google's official announcement](https://developers.googleblog.com/en/gemini-cli-your-open-source-ai-agent/)

## 🚀 Quick Start

```bash
# Initialize a new project with SPARC
gemini-flow init --sparc

# Start the orchestrator
gemini-flow start

# Run a specific SPARC mode
gemini-flow sparc architect "Design a microservices architecture"

# Launch multi-agent workflow
gemini-flow sparc "Build a REST API with authentication"
```

## 💡 Usage Examples

### Simple Task
```bash
gemini-flow agent "Refactor this function to use async/await"
```

### Complex Multi-Agent Workflow
```bash
gemini-flow sparc orchestrator "Create a full-stack application with React frontend and Node.js backend, including tests and documentation"
```

### Multimodal Development
```bash
gemini-flow sparc designer "Convert this wireframe sketch to React components" --file ./wireframe.png
```

## 🔧 Configuration

Create a `.gemini-flow.json` in your project root:

```json
{
  "maxAgents": 10,
  "memoryPath": "./gemini-memory.json",
  "authMethod": "google-account",
  "modes": {
    "architect": {
      "temperature": 0.7,
      "maxTokens": 8000
    }
  }
}
```

**Configuration Options:**
- `authMethod`: `"google-account"` (default) or `"api-key"`
- `apiKey`: Only needed if using `"api-key"` method
- `maxAgents`: Number of parallel agents (consider rate limits)
- `memoryPath`: Location for persistent memory storage

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙌 Acknowledgments

- Original Claude Code Flow by [ruvnet](https://github.com/ruvnet)
- Google Gemini team for the excellent CLI tool
- All contributors and users of this project

## 📚 Documentation

- **[Intelligent Workflows](docs/intelligent-workflows.md)** - How the system selects appropriate agents and prevents over-engineering
- **[Agent Roles & Specializations](docs/agent-roles.md)** - Complete guide to all 29 agents and their capabilities
- **[Setup Guide](SETUP-GUIDE.md)** - Comprehensive setup and troubleshooting guide
- **[Development Guide](DEV-README.md)** - Local development and contribution guidelines

For additional documentation, visit our [Wiki](https://github.com/luketh/gemini-code-flow/wiki).

## 🐛 Issues

Found a bug or have a suggestion? Please [open an issue](https://github.com/luketh/gemini-code-flow/issues).

---

Built with ❤️ by the community, adapted from Claude Code Flow