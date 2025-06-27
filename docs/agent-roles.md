# Agent Roles & Specializations

## Overview

Gemini Code Flow features a comprehensive ecosystem of 29 specialized AI agents, each with distinct expertise and capabilities. These agents work collaboratively to handle every aspect of software development, from initial product planning to production deployment and maintenance.

## Agent Categories

### 🏗️ Core Development Agents (17)
The foundational agents that handle the primary software development lifecycle.

### 📊 Product & Strategy Agents (4) 
Business-focused agents for requirements, quality, and technical excellence.

### ☁️ Enterprise & Cloud Agents (4)
Specialized agents for modern, scalable, and reliable systems.

### 📱 Domain-Specific Agents (4)
Experts in particular technology domains and platforms.

---

## Core Development Agents

### 🏗️ Architect
**Role**: System Architect  
**Temperature**: 0.7 | **Max Tokens**: 4096

**Capabilities**:
- System design and architecture planning
- Technology stack selection
- Design pattern implementation
- Scalability and performance architecture
- Integration strategy design

**Use Cases**:
- Designing microservices architectures
- Planning system integrations
- Technology evaluation and selection
- Creating architectural documentation

**Delegation Patterns**:
```
DELEGATE_TO: cloud - Design cloud-native deployment strategy
DELEGATE_TO: security - Architect authentication and authorization
REQUEST_AGENT: performance - Review architecture for bottlenecks
```

### 🧠 Coder
**Role**: Expert Programmer  
**Temperature**: 0.3 | **Max Tokens**: 4096

**Capabilities**:
- Clean, efficient code implementation
- Multiple programming language expertise
- Design pattern implementation
- Code organization and structure
- Error handling and edge cases

**Use Cases**:
- Implementing business logic
- Creating reusable components
- Database integration
- API implementation

**Delegation Patterns**:
```
DELEGATE_TO: mobile - Implement responsive mobile components
REQUEST_AGENT: reviewer - Review complex algorithm implementation
NEEDS_REVIEW: performance - Optimize data processing pipeline
```

### 🧪 Tester
**Role**: Test Engineer  
**Temperature**: 0.2 | **Max Tokens**: 3072

**Capabilities**:
- Unit test creation
- Integration testing
- End-to-end test design
- Test automation
- Quality assurance strategies

**Use Cases**:
- Creating comprehensive test suites
- Test-driven development
- Performance testing
- Security testing

**Delegation Patterns**:
```
DELEGATE_TO: qa - Design comprehensive QA process
REQUEST_AGENT: performance - Load testing for high-traffic scenarios
ITERATE_WITH: security - Security penetration testing
```

### 🪲 Debugger
**Role**: Debug Expert  
**Temperature**: 0.1 | **Max Tokens**: 3072

**Capabilities**:
- Systematic issue identification
- Root cause analysis
- Bug reproduction and fixing
- Performance bottleneck identification
- Code quality improvement

**Use Cases**:
- Troubleshooting production issues
- Performance optimization
- Memory leak detection
- Integration problem solving

**Delegation Patterns**:
```
REQUEST_AGENT: monitor - Set up debugging instrumentation
DELEGATE_TO: performance - Investigate performance bottlenecks
NEEDS_REVIEW: sre - Analyze production incident patterns
```

### 🛡️ Security
**Role**: Security Specialist  
**Temperature**: 0.2 | **Max Tokens**: 3072

**Capabilities**:
- Security vulnerability assessment
- Authentication and authorization design
- Data protection strategies
- Compliance requirements
- Threat modeling

**Use Cases**:
- Security audits
- Penetration testing
- Compliance implementation
- Security architecture design

**Delegation Patterns**:
```
DELEGATE_TO: cloud - Implement cloud security best practices
REQUEST_AGENT: reviewer - Security code review standards
ITERATE_WITH: sre - Security monitoring and alerting
```

### 📚 Documentation
**Role**: Technical Writer  
**Temperature**: 0.5 | **Max Tokens**: 4096

**Capabilities**:
- Technical documentation creation
- API documentation
- User guides and tutorials
- Code commenting
- Process documentation

**Use Cases**:
- Creating developer documentation
- Writing user manuals
- API reference generation
- Onboarding guides

**Delegation Patterns**:
```
REQUEST_AGENT: tutorial - Create interactive learning materials
DELEGATE_TO: api - Generate API documentation
ITERATE_WITH: ux - User-friendly documentation design
```

### 🔗 Integrator
**Role**: Integration Expert  
**Temperature**: 0.4 | **Max Tokens**: 3072

**Capabilities**:
- System integration design
- API integration
- Message queue implementation
- Service communication
- Data flow management

**Use Cases**:
- Third-party service integration
- Microservices communication
- Legacy system integration
- Real-time data synchronization

**Delegation Patterns**:
```
DELEGATE_TO: api - Design integration API specifications
REQUEST_AGENT: cloud - Cloud service integration patterns
NEEDS_REVIEW: security - Secure integration protocols
```

### 📈 Monitor
**Role**: Monitoring Specialist  
**Temperature**: 0.2 | **Max Tokens**: 3072

**Capabilities**:
- System monitoring setup
- Performance metrics collection
- Alerting system design
- Dashboard creation
- Observability implementation

**Use Cases**:
- Production monitoring
- Performance tracking
- Error detection and alerting
- Business metrics monitoring

**Delegation Patterns**:
```
DELEGATE_TO: sre - Production monitoring strategy
REQUEST_AGENT: performance - Performance metrics collection
ITERATE_WITH: devops - Monitoring infrastructure setup
```

### 🧹 Optimizer
**Role**: Performance Expert  
**Temperature**: 0.3 | **Max Tokens**: 3072

**Capabilities**:
- Code optimization
- Resource utilization improvement
- Caching strategies
- Database optimization
- Memory management

**Use Cases**:
- Performance bottleneck resolution
- Resource efficiency improvement
- Scalability optimization
- Cost reduction through optimization

**Delegation Patterns**:
```
REQUEST_AGENT: performance - Detailed performance analysis
DELEGATE_TO: database - Database query optimization
NEEDS_REVIEW: cloud - Cloud resource optimization
```

### ❓ Ask
**Role**: Requirements Analyst  
**Temperature**: 0.8 | **Max Tokens**: 2048

**Capabilities**:
- Requirement clarification
- Stakeholder communication
- Problem decomposition
- Scope definition
- Question formulation

**Use Cases**:
- Gathering detailed requirements
- Clarifying ambiguous specifications
- Stakeholder interviews
- Problem analysis

**Delegation Patterns**:
```
DELEGATE_TO: product - Business requirement analysis
REQUEST_AGENT: ux - User experience requirements
ITERATE_WITH: research - Feasibility analysis
```

### 🚀 DevOps
**Role**: DevOps Engineer  
**Temperature**: 0.3 | **Max Tokens**: 3072

**Capabilities**:
- CI/CD pipeline design
- Infrastructure automation
- Deployment strategies
- Container orchestration
- Environment management

**Use Cases**:
- Setting up deployment pipelines
- Infrastructure as code
- Automated testing and deployment
- Environment provisioning

**Delegation Patterns**:
```
DELEGATE_TO: cloud - Cloud infrastructure design
REQUEST_AGENT: sre - Production deployment strategy
ITERATE_WITH: release - Release automation
```

### 📘 Tutorial
**Role**: Educational Expert  
**Temperature**: 0.6 | **Max Tokens**: 4096

**Capabilities**:
- Interactive tutorial creation
- Step-by-step guides
- Learning path design
- Educational content
- Training materials

**Use Cases**:
- Creating learning materials
- Onboarding documentation
- Interactive tutorials
- Workshop content

**Delegation Patterns**:
```
REQUEST_AGENT: documentation - Technical reference materials
DELEGATE_TO: ux - User-friendly learning interfaces
ITERATE_WITH: designer - Visual learning aids
```

### 🔐 Database
**Role**: Database Administrator  
**Temperature**: 0.2 | **Max Tokens**: 3072

**Capabilities**:
- Database design and modeling
- Query optimization
- Data migration strategies
- Backup and recovery
- Database security

**Use Cases**:
- Database schema design
- Performance optimization
- Data modeling
- Migration planning

**Delegation Patterns**:
```
REQUEST_AGENT: security - Database security hardening
DELEGATE_TO: cloud - Cloud database solutions
NEEDS_REVIEW: performance - Query performance optimization
```

### 📋 Specification
**Role**: Requirements Analyst  
**Temperature**: 0.4 | **Max Tokens**: 3072

**Capabilities**:
- Technical specification writing
- Requirements documentation
- Pseudocode creation
- System requirements
- Functional specifications

**Use Cases**:
- Creating technical specifications
- Requirements documentation
- System design documents
- API specifications

**Delegation Patterns**:
```
DELEGATE_TO: product - Business requirements analysis
REQUEST_AGENT: architect - Technical architecture requirements
ITERATE_WITH: ask - Requirement clarification
```

### ♾️ MCP
**Role**: Integration Specialist  
**Temperature**: 0.3 | **Max Tokens**: 3072

**Capabilities**:
- Model Context Protocol implementation
- External service integration
- Protocol design
- Service orchestration
- Data exchange patterns

**Use Cases**:
- External API integration
- Service communication protocols
- Data synchronization
- Protocol implementation

**Delegation Patterns**:
```
DELEGATE_TO: api - Protocol specification design
REQUEST_AGENT: security - Secure communication protocols
ITERATE_WITH: integrator - Service integration patterns
```

### ⚡ Orchestrator
**Role**: Workflow Coordinator  
**Temperature**: 0.5 | **Max Tokens**: 4096

**Capabilities**:
- Project coordination
- Task breakdown
- Workflow management
- Agent delegation
- Timeline management

**Use Cases**:
- Project planning and coordination
- Multi-agent workflow design
- Task prioritization
- Resource allocation

**Delegation Patterns**:
```
DELEGATE_TO: product - Business requirement analysis
DELEGATE_TO: architect - Technical architecture design
REQUEST_AGENT: research - Technology feasibility study
```

### 🎨 Designer
**Role**: UI/UX Designer  
**Temperature**: 0.8 | **Max Tokens**: 4096

**Capabilities**:
- User interface design
- User experience optimization
- Visual design
- Interaction design
- Accessibility design

**Use Cases**:
- UI component design
- User journey mapping
- Visual brand implementation
- Accessibility compliance

**Delegation Patterns**:
```
DELEGATE_TO: ux - User research and testing
REQUEST_AGENT: mobile - Mobile-specific design patterns
ITERATE_WITH: accessibility - Accessibility compliance review
```

---

## Product & Strategy Agents

### 📊 Product
**Role**: Product Manager  
**Temperature**: 0.6 | **Max Tokens**: 4096

**Capabilities**:
- Product strategy development
- Feature prioritization
- Market analysis
- Stakeholder management
- Business requirements

**Use Cases**:
- Product roadmap planning
- Feature specification
- Market research
- Stakeholder communication

**Delegation Patterns**:
```
DELEGATE_TO: ux - User experience research
REQUEST_AGENT: research - Market and technology analysis
ITERATE_WITH: ask - Stakeholder requirement gathering
```

### 🔍 QA
**Role**: QA Engineer  
**Temperature**: 0.2 | **Max Tokens**: 3072

**Capabilities**:
- Quality assurance processes
- Test strategy development
- Quality metrics
- Process improvement
- Quality gates

**Use Cases**:
- QA process design
- Quality standard implementation
- Test strategy development
- Quality metrics tracking

**Delegation Patterns**:
```
DELEGATE_TO: tester - Specific test case implementation
REQUEST_AGENT: performance - Performance quality standards
ITERATE_WITH: reviewer - Code quality processes
```

### 👁️ Reviewer
**Role**: Code Reviewer  
**Temperature**: 0.2 | **Max Tokens**: 3072

**Capabilities**:
- Code quality analysis
- Technical debt identification
- Best practices enforcement
- Code standard compliance
- Refactoring recommendations

**Use Cases**:
- Code review processes
- Technical debt management
- Coding standards enforcement
- Quality improvement

**Delegation Patterns**:
```
REQUEST_AGENT: security - Security code review guidelines
DELEGATE_TO: performance - Performance code review
ITERATE_WITH: qa - Quality review processes
```

### 🔬 Research
**Role**: Research Engineer  
**Temperature**: 0.8 | **Max Tokens**: 4096

**Capabilities**:
- Technology research
- Feasibility analysis
- Innovation exploration
- Proof of concept development
- Technical risk assessment

**Use Cases**:
- Technology evaluation
- Innovation projects
- Feasibility studies
- R&D initiatives

**Delegation Patterns**:
```
DELEGATE_TO: ai - AI/ML technology research
REQUEST_AGENT: cloud - Cloud technology evaluation
ITERATE_WITH: architect - Technology architecture assessment
```

---

## Enterprise & Cloud Agents

### ☁️ Cloud
**Role**: Cloud Architect  
**Temperature**: 0.4 | **Max Tokens**: 4096

**Capabilities**:
- Cloud architecture design
- Multi-cloud strategies
- Serverless design
- Cloud service selection
- Cost optimization

**Use Cases**:
- Cloud migration planning
- Serverless architecture design
- Cloud cost optimization
- Multi-cloud strategy

**Delegation Patterns**:
```
DELEGATE_TO: sre - Cloud reliability design
REQUEST_AGENT: security - Cloud security architecture
ITERATE_WITH: devops - Cloud deployment automation
```

### 🚨 SRE
**Role**: Site Reliability Engineer  
**Temperature**: 0.2 | **Max Tokens**: 3072

**Capabilities**:
- System reliability design
- Incident response
- SLA management
- Disaster recovery
- Observability implementation

**Use Cases**:
- Reliability engineering
- Incident management
- SLA definition and monitoring
- Disaster recovery planning

**Delegation Patterns**:
```
REQUEST_AGENT: monitor - Comprehensive monitoring setup
DELEGATE_TO: cloud - Reliable cloud infrastructure
ITERATE_WITH: devops - Reliable deployment processes
```

### 🤖 AI
**Role**: AI/ML Specialist  
**Temperature**: 0.6 | **Max Tokens**: 4096

**Capabilities**:
- Machine learning model design
- AI integration
- Data pipeline design
- Model deployment
- AI ethics and governance

**Use Cases**:
- ML model development
- AI feature integration
- Data science projects
- Intelligent automation

**Delegation Patterns**:
```
DELEGATE_TO: research - AI technology evaluation
REQUEST_AGENT: cloud - ML infrastructure design
ITERATE_WITH: performance - AI model optimization
```

### 👥 UX
**Role**: UX Researcher  
**Temperature**: 0.7 | **Max Tokens**: 3072

**Capabilities**:
- User research
- Usability testing
- User journey mapping
- Persona development
- Accessibility analysis

**Use Cases**:
- User experience research
- Usability optimization
- User journey design
- Accessibility compliance

**Delegation Patterns**:
```
DELEGATE_TO: designer - User interface improvements
REQUEST_AGENT: mobile - Mobile user experience
ITERATE_WITH: product - User-centered product features
```

---

## Domain-Specific Agents

### 📱 Mobile
**Role**: Mobile Developer  
**Temperature**: 0.4 | **Max Tokens**: 4096

**Capabilities**:
- iOS and Android development
- Cross-platform solutions
- Mobile UX patterns
- App store optimization
- Mobile security

**Use Cases**:
- Mobile app development
- Cross-platform implementation
- Mobile-specific features
- App store deployment

**Delegation Patterns**:
```
DELEGATE_TO: designer - Mobile UI design patterns
REQUEST_AGENT: performance - Mobile performance optimization
ITERATE_WITH: ux - Mobile user experience
```

### 🌐 API
**Role**: API Specialist  
**Temperature**: 0.3 | **Max Tokens**: 3072

**Capabilities**:
- REST API design
- GraphQL implementation
- API documentation
- Rate limiting
- API versioning

**Use Cases**:
- API design and implementation
- API documentation
- Developer experience optimization
- API security and governance

**Delegation Patterns**:
```
DELEGATE_TO: security - API security implementation
REQUEST_AGENT: documentation - API documentation
ITERATE_WITH: integrator - API integration patterns
```

### 🏃 Performance
**Role**: Performance Engineer  
**Temperature**: 0.3 | **Max Tokens**: 3072

**Capabilities**:
- Performance analysis
- Load testing
- Optimization strategies
- Bottleneck identification
- Scalability planning

**Use Cases**:
- Performance optimization
- Load testing
- Scalability analysis
- Performance monitoring

**Delegation Patterns**:
```
REQUEST_AGENT: monitor - Performance monitoring setup
DELEGATE_TO: database - Database performance optimization
ITERATE_WITH: cloud - Cloud performance optimization
```

### 📦 Release
**Role**: Release Manager  
**Temperature**: 0.4 | **Max Tokens**: 3072

**Capabilities**:
- Release planning
- Deployment coordination
- Rollback strategies
- Release automation
- Change management

**Use Cases**:
- Release management
- Deployment coordination
- Change management
- Release automation

**Delegation Patterns**:
```
DELEGATE_TO: devops - Release automation setup
REQUEST_AGENT: qa - Release quality gates
ITERATE_WITH: sre - Production release monitoring
```

---

## Agent Interaction Patterns

### Delegation Hierarchy

**Strategic Level**:
- Orchestrator → Product → Research → Architect

**Implementation Level**:
- Architect → Coder → Integrator → Tester

**Quality Level**:
- QA → Reviewer → Security → Performance

**Operations Level**:
- DevOps → Cloud → SRE → Release

### Common Collaboration Patterns

**Web Application Development**:
```
Orchestrator → Product → Architect → Designer → Coder → Tester → DevOps
```

**Mobile App Development**:
```
Orchestrator → UX → Designer → Mobile → API → Performance → Release
```

**Enterprise System**:
```
Orchestrator → Product → Research → Cloud → Architect → Security → Coder → QA → SRE
```

**AI/ML Project**:
```
Orchestrator → Research → AI → Database → Performance → Monitor → Documentation
```

---

## Best Practices

### Agent Selection Guidelines

1. **Start Small**: Use minimal workflows for simple projects
2. **Scale Appropriately**: Let complexity drive agent selection
3. **Delegate Strategically**: Only delegate when specialized expertise is needed
4. **Avoid Over-Engineering**: Don't spawn agents unnecessarily

### Effective Delegation

1. **Be Specific**: Provide clear, actionable task descriptions
2. **Choose Appropriate Type**: Use DELEGATE_TO for new work, NEEDS_REVIEW for feedback
3. **Consider Dependencies**: Ensure delegated tasks have proper context
4. **Monitor Progress**: Track delegated work completion

### Performance Optimization

1. **Parallel Execution**: Leverage independent agents for parallel processing
2. **Smart Dependencies**: Minimize unnecessary sequential dependencies
3. **Resource Management**: Monitor agent resource usage
4. **Conflict Prevention**: Avoid running conflicting agents simultaneously

---

This comprehensive agent ecosystem provides specialized expertise for every aspect of modern software development, from initial ideation to production maintenance and scaling.