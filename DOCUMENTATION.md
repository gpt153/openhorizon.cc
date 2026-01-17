# Open Horizon Documentation Index

**Last Updated:** 2026-01-12
**Project:** Erasmus+ Project Pipeline System

---

## 📋 Quick Navigation

### For Users
- [User Guide](#user-guide) - How to use OpenHorizon (for project coordinators)
- [Getting Started](#getting-started-user) - Your first project in 5 minutes
- [Troubleshooting](#troubleshooting-user) - Common user issues and solutions

### For Development
- [Product Requirements Document (PRD)](#prd) - Complete system specification
- [README](#readme) - Project overview and setup
- [Quick Start](#quickstart) - Get started quickly
- [Claude Instructions](#claude-instructions) - AI assistant guidelines

### For Supervision
- [Autonomous Supervision Guide](#supervision) - How to supervise this project
- [Current Status](#current-status) - What's implemented, what's next

### For Deployment
- [Deployment Guide](#deployment) - Production deployment instructions

---

## 📚 User Documentation

### <a name="user-guide"></a>User Guide

**Location:** `docs/user-guide/README.md`

**What it contains:**
- Complete guide to using OpenHorizon platform
- Feature walkthroughs (seeds, projects, programmes, budget, vendor search, export)
- Tips and best practices for Erasmus+ projects
- Workflow examples and use cases

**When to use:**
- Learning how to use OpenHorizon features
- Understanding optimal workflows
- Getting tips for better project planning
- Reference for feature capabilities

---

### <a name="getting-started-user"></a>Getting Started (Users)

**Location:** `docs/user-guide/getting-started.md`

**What it contains:**
- 5-minute quick start guide
- Step-by-step first project creation
- Screenshot walkthrough
- Introduction to all major features

**When to use:**
- First-time user onboarding
- Quick platform overview
- Teaching others to use OpenHorizon
- Refresher on basic workflows

---

### <a name="troubleshooting-user"></a>Troubleshooting Guide

**Location:** `docs/user-guide/troubleshooting.md`

**What it contains:**
- Common user issues (login, project generation, export failures)
- Step-by-step solutions for each issue
- Contact support information
- FAQ for general questions
- Links to bug reporting

**When to use:**
- Something isn't working as expected
- Error messages appear
- Need help with a feature
- Before contacting support

---

### Feature-Specific Guides

**Location:** `docs/user-guide/features/`

**Available guides:**
- **Seeds** (`seeds.md`) - AI-powered project ideation, seed garden, elaboration
- **Projects** (`projects.md`) - Project management, phases, Gantt charts, AI assistance
- **Programmes** (`programmes.md`) - Activity scheduling, programme builder
- **Budget** (`budget.md`) - Erasmus+ budget calculator, unit costs, distance calculation
- **Vendor Search** (`vendor-search.md`) - Finding accommodation, travel, and food providers
- **Export** (`export.md`) - Document export, application forms, formats

**When to use:**
- Learning specific features in depth
- Advanced feature usage
- Understanding feature limitations
- Optimizing your workflow

---

## 📖 Core Documents

### <a name="prd"></a>Product Requirements Document (PRD)

**Location:** `.agents/PRD-ProjectPipeline-Complete.md`

**Version:** 2.0 (January 2026)

**What it contains:**
- Complete 11-step pipeline (seed → finished Erasmus+ application)
- Budget auto-calculation engine (Erasmus+ rules)
- AI agent specifications (accommodation, travel, food)
- Vendor research workflow with pros/cons analysis
- Application form generation
- Phase 1: February 2026 deadline (4-week implementation)
- Phase 2: Intelligence layer (post-deadline enhancements)

**When to use:**
- Planning new features
- Understanding system architecture
- Implementing budget calculator
- Building AI agents
- Reference for Erasmus+ rules and calculations

---

### <a name="readme"></a>Project Overview

**Location:** `README.md`

**What it contains:**
- Project description and purpose
- Tech stack overview
- Monorepo structure (landing, app, project-pipeline)
- Domain structure (openhorizon.cc, app.openhorizon.cc)
- Getting started instructions
- Development commands
- Deployment overview

**When to use:**
- First time setting up project
- Understanding project structure
- Quick reference for commands
- Deployment checklist

---

### <a name="quickstart"></a>Quick Start Guide

**Location:** `QUICKSTART.md`

**What it contains:**
- Rapid setup instructions
- Essential commands
- Common workflows
- Troubleshooting basics

**When to use:**
- Need to start quickly
- Forgot common commands
- Quick problem solving

---

### <a name="claude-instructions"></a>Claude Instructions

**Location:** `CLAUDE.md`

**What it contains:**
- Project-specific rules for AI assistants
- Development workflows
- Available commands (/plan, /execute, /commit, etc.)
- Port conflict prevention
- Secrets management
- Supervision commands

**When to use:**
- Starting new Claude session
- Understanding available workflows
- Reference for SCAR commands
- Supervision setup

---

## 🤖 Supervision & Automation

### <a name="supervision"></a>Autonomous Supervision Guide

**Location:** `docs/autonomous-supervision.md`

**What it contains:**
- Complete supervision system documentation
- Commands: /prime-supervisor, /supervise, /supervise-issue
- Workflows for complex features
- Context handoff procedures
- Port conflict prevention
- Secrets management protocols
- Communication principles

**When to use:**
- Starting project supervision
- Managing multiple issues
- Coordinating parallel work
- Handling context limits
- Understanding supervisor role

---

## 🚀 Deployment

### <a name="deployment"></a>Deployment Instructions

**Location:** `DEPLOY_INSTRUCTIONS.md`

**What it contains:**
- Google Cloud Run deployment
- Domain configuration
- Environment variables
- CI/CD setup
- Troubleshooting

**When to use:**
- Deploying to production
- Configuring domains
- Setting up continuous deployment
- Debugging deployment issues

---

## 📂 Directory Structure

```
openhorizon.cc/
├── README.md                          # Project overview
├── DOCUMENTATION.md                   # This file
├── CLAUDE.md                          # AI assistant instructions
├── QUICKSTART.md                      # Quick start guide
├── DEPLOY_INSTRUCTIONS.md             # Deployment guide
│
├── .agents/                           # AI agent workspace
│   ├── PRD-ProjectPipeline-Complete.md  # CURRENT PRD ✅
│   ├── plans/                         # Implementation plans
│   ├── discussions/                   # Design discussions
│   └── supervision/                   # Supervision state
│
├── docs/                              # Additional documentation
│   ├── autonomous-supervision.md      # Supervision guide
│   └── rca/                           # Root cause analyses
│
├── .archive/                          # Historical documents 📦
│   ├── root-docs/                     # Old root-level docs
│   ├── reports/                       # Old implementation reports
│   ├── agents-old/                    # Old .agents files
│   └── plans-old/                     # Completed plans
│
├── project-pipeline/                  # Pipeline system
│   ├── backend/                       # Fastify API
│   └── frontend/                      # React app
│
├── landing/                           # Marketing site
└── app/                               # Main application
```

---

## 🎯 Current Status

### <a name="current-status"></a>What's Implemented (91% Complete)

**Working Features:**
1. ✅ Seed generation (AI brainstorming)
2. ✅ Seed garden (save/organize ideas)
3. ✅ Seed elaboration (conversational refinement)
4. ✅ Seed-to-project conversion
5. ✅ Project management (Gantt chart, phases)
6. ✅ Phase detail pages with CRUD
7. ✅ AI chat for projects
8. ✅ AI agents UI (phase-specific agents)
9. ✅ Budget tracking backend
10. ✅ Application form generation (KA1/KA2)
11. ✅ Project report export (PDF/Excel/Word)

**What's Next (Phase 1 - February 2026):**

**Week 1 (Jan 13-19):** Budget Calculator
- Auto-calculate from Erasmus+ rules
- Distance calculator integration
- Per diem calculation
- Budget breakdown UI

**Week 2 (Jan 20-26):** Accommodation Agent
- Booking.com/Hotels.com scraping
- AI pros/cons analysis
- Quote email generation

**Week 3 (Jan 27 - Feb 2):** Travel & Food Agents
- Flight search + travel agencies
- Caterer search
- Same workflow as accommodation

**Week 4 (Feb 3-9):** Integration & Testing
- End-to-end validation
- Real project test
- Production ready

### What's NOT Implemented

**Phase 1 Priorities (4 weeks):**
- ❌ Budget auto-calculation from Erasmus+ rules
- ❌ Accommodation agent (scraping + AI analysis)
- ❌ Travel agent (flights + agencies)
- ❌ Food agent (caterers)
- ❌ Quote request workflow (select + email)

**Phase 2 (Post-February):**
- ❌ SALTO-Youth partner matching (RAG)
- ❌ Application examples database (RAG)
- ❌ Enhanced learning from past projects

---

## 🔍 Finding Information

### "I need to..."

**...understand the complete system**
→ Read `.agents/PRD-ProjectPipeline-Complete.md`

**...set up the project for the first time**
→ Read `README.md` then `QUICKSTART.md`

**...start supervising development**
→ Read `docs/autonomous-supervision.md` then run `/prime-supervisor`

**...implement budget calculator**
→ See PRD Section 5 "Budget Calculation Engine" (pages 15-22)

**...build accommodation agent**
→ See PRD Section 6.A "Accommodation Agent" (pages 23-28)

**...deploy to production**
→ Read `DEPLOY_INSTRUCTIONS.md`

**...understand what's already built**
→ Read "Current Status" section above

**...find old documentation**
→ Check `.archive/` directory (historical reference only)

---

## 📝 Document Conventions

### Status Indicators

- ✅ **Implemented** - Feature is complete and working
- ⏳ **In Progress** - Currently being developed
- 🆕 **Specified** - Designed but not yet implemented
- ❌ **Not Started** - Planned for future
- 📦 **Archived** - Historical, no longer relevant

### File Naming

- `UPPERCASE.md` - Root-level documentation (important, visible)
- `lowercase.md` - Supporting documentation
- `kebab-case.md` - Technical specifications
- `PascalCase.md` - Legacy naming (being phased out)

### Version Control

Current PRD: **v2.0** (January 2026)
- Major version (2.x) = Complete system redesign
- Minor version (x.1) = Feature additions
- Patch version (x.x.1) = Corrections/clarifications

---

## 🆘 Need Help?

### For Development Questions
1. Check PRD for specifications
2. Review existing implementation in codebase
3. Ask in project discussion thread

### For Supervision Questions
1. Read `docs/autonomous-supervision.md`
2. Review `.agents/supervision/` session logs
3. Check previous session handoff docs

### For Deployment Issues
1. Review `DEPLOY_INSTRUCTIONS.md`
2. Check Cloud Run logs
3. Verify environment variables

---

## 🔄 Keeping This Updated

This documentation index should be updated when:
- ✅ New major documents are created
- ✅ Document locations change
- ✅ Project structure changes significantly
- ✅ Phase milestones are reached

**Last Review:** 2026-01-12
**Next Review:** After Phase 1 completion (Feb 2026)

---

**Quick Links:**
- [PRD](.agents/PRD-ProjectPipeline-Complete.md) - Complete system spec
- [README](README.md) - Project overview
- [Supervision Guide](docs/autonomous-supervision.md) - How to supervise
- [Archive](.archive/README.md) - Historical docs

**Everything you need is documented. Start with the PRD.**
