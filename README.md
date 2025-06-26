# Gemini Code Flow 🚀

> AI-powered development orchestration for Gemini CLI - adapted from Claude Code Flow by [ruvnet](https://github.com/ruvnet)

## 🌟 Overview

Gemini Code Flow brings the powerful SPARC methodology and multi-agent orchestration capabilities to Google's Gemini CLI platform. This tool enables developers to leverage multiple AI agents working in parallel to write, test, and optimize code systematically.

## 🙏 Attribution

This project is adapted from the excellent [Claude Code Flow](https://github.com/ruvnet/claude-code-flow) by ruvnet. Full credit goes to the original author for the innovative SPARC methodology and multi-agent orchestration concepts.

## ✨ Features

- **Multi-Agent Orchestration**: Run up to 10 Gemini agents in parallel
- **17 SPARC Development Modes**: Specialized agents for every development need
- **Persistent Memory**: Share knowledge across agents and sessions
- **Multimodal Support**: Leverage Gemini's ability to process images, PDFs, and sketches
- **Large Context Window**: Utilize Gemini's 1M token context for complex codebases
- **Google Search Integration**: Ground responses with real-time information

## 🛠️ SPARC Development Modes

1. 🏗️ **Architect** - System design and architecture
2. 🧠 **Auto-Coder** - Clean, modular implementation
3. 🧪 **Tester (TDD)** - Test-driven development
4. 🪲 **Debugger** - Troubleshooting and bug fixes
5. 🛡️ **Security Reviewer** - Security audits
6. 📚 **Documentation Writer** - Comprehensive documentation
7. 🔗 **System Integrator** - Component integration
8. 📈 **Deployment Monitor** - Post-launch monitoring
9. 🧹 **Optimizer** - Performance optimization
10. ❓ **Ask** - Task formulation guide
11. 🚀 **DevOps** - Deployment and infrastructure
12. 📘 **SPARC Tutorial** - Interactive learning
13. 🔐 **Database Admin** - Database management
14. 📋 **Specification Writer** - Requirements and pseudocode
15. ♾️ **MCP Integration** - External service connections
16. ⚡️ **SPARC Orchestrator** - Complex workflows
17. 🎨 **Designer** - UI/UX with multimodal capabilities

## 📦 Installation

### Prerequisites
- Node.js 18+
- Gemini CLI installed globally

```bash
# Install Gemini CLI first
npm install -g @google/gemini-cli

# Install Gemini Code Flow (now available on npm!)
npm install -g gemini-code-flow
```

**✅ Package is now live on npm:** https://www.npmjs.com/package/gemini-code-flow

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

For detailed documentation:
- **Project Requirements**: See [PRD.md](PRD.md)
- **SPARC Methodology**: See [SPARC-SUMMARY.md](SPARC-SUMMARY.md)
- **Contributing**: See [CONTRIBUTING.md](CONTRIBUTING.md)

## 🐛 Issues & Support

Found a bug or have a suggestion? Please [open an issue](https://github.com/Theopsguide/gemini-code-flow/issues) on GitHub.

For questions and discussions, feel free to start a conversation in the issues section.

---

Built with ❤️ by the community, adapted from Claude Code Flow