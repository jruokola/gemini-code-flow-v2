# Gemini Code Flow 🚀

> **Built on the amazing work by [RuV](https://github.com/ruvnet)** - this is an adaptation of [Claude Code Flow](https://github.com/ruvnet/claude-code-flow) for Gemini CLI

## 🙏 Credit Where Credit is Due

**This project exists because of [RuV's](https://github.com/ruvnet) incredible work on Claude Code Flow.** All the brilliant concepts, SPARC methodology, and multi-agent orchestration come from RuV's original project. I'm just trying to adapt it for Gemini CLI!

👉 **Go check out the original:** https://github.com/ruvnet/claude-code-flow

## 🌟 Overview

Gemini Code Flow brings the powerful SPARC methodology and multi-agent orchestration capabilities to Google's Gemini CLI platform. This tool enables developers to leverage multiple AI agents working in parallel to write, test, and optimize code systematically.

## 🏆 All Credit to RuV

**Everything cool about this project comes from [RuV](https://github.com/ruvnet)!** 🌟

- 🧠 **SPARC methodology** - RuV's brilliant creation
- 🤖 **Multi-agent orchestration** - RuV's innovative approach  
- 🏗️ **System architecture** - Based on RuV's excellent design
- 📚 **Documentation structure** - Following RuV's clear patterns

**Original project:** [Claude Code Flow](https://github.com/ruvnet/claude-code-flow) by [RuV](https://github.com/ruvnet)

I'm just trying to adapt RuV's genius work for Gemini CLI - and probably making mistakes along the way! 😅

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

## 🤝 Contributing (Please Help a Noob!) 

**Full disclosure: I'm a total noob at this!** 🤷‍♂️ This project needs experienced developers to help make it actually good.

### 🆘 I Really Need Help With:
- 📝 **Code reviews** - I probably did things wrong
- 🐛 **Bug fixes** - There are definitely bugs I missed
- 🏗️ **Architecture improvements** - I'm sure there are better ways to do things
- 📚 **Documentation** - Help make it clearer than my attempts
- 🧪 **Testing** - I need to learn proper testing practices
- 🚀 **Performance** - No idea if this is optimized
- 🔧 **Best practices** - Teach me the right way!

**Seriously, ANY feedback is welcome!** Even if it's "you're doing this completely wrong" - I want to learn! 📚

### 👋 New to Open Source?
**Perfect!** This is a great project to start with. We welcome:
- 🐛 Bug reports and fixes
- 💡 Feature ideas and implementations  
- 📖 Documentation improvements
- 🧪 Tests and examples
- 🎨 UI/UX improvements
- 🌟 Any creative ideas!

### 🚀 Quick Start for Contributors
```bash
# 1. Fork this repo on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR-USERNAME/gemini-code-flow.git
# 3. Install dependencies
npm install
# 4. Make your changes
# 5. Test your changes
npm run build
# 6. Submit a pull request!
```

**Don't know where to start?** Look for issues labeled `good first issue` or `help wanted`!

See our [Contributing Guide](CONTRIBUTING.md) for more details.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙌 Acknowledgments

### 🏆 The Real Hero
**[RuV](https://github.com/ruvnet)** - The mastermind behind [Claude Code Flow](https://github.com/ruvnet/claude-code-flow). This entire project is just me trying (and probably failing) to adapt RuV's brilliant work. Go star RuV's original repo! ⭐

### 🙏 Also Thanks To
- **Google Gemini team** - For the excellent CLI tool
- **Future contributors** - Who will hopefully fix all my mistakes! See [CONTRIBUTORS.md](CONTRIBUTORS.md)
- **You!** - For being patient with a learning developer 😅

### 🌟 Want to Help a Noob Learn?
Any contribution, feedback, or guidance would be amazing! I'm here to learn and improve! 📚

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