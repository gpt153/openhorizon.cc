# Project Pipeline Management System

An AI-powered project pipeline management system for Erasmus+ projects with intelligent automation, learning capabilities, and visual timeline management.

## Overview

This system provides:
- **Visual Interactive Timeline** - Drag-and-drop Gantt-style pipeline management
- **AI Agents** - Specialized assistants for accommodation, travel, food, activities, etc.
- **Automated Communication** - AI-generated vendor emails and follow-ups
- **Learning System** - Progressively improves suggestions based on historical data
- **Budget Integration** - Real-time cost tracking integrated with OpenProject

## Project Structure

```
project-pipeline/
├── backend/          # Node.js + Fastify API server
├── frontend/         # React + TypeScript frontend
├── docs/            # Documentation
│   ├── PRD-ProjectPipeline.md
│   └── IMPLEMENTATION-PLAN-ProjectPipeline.md
└── docker-compose.yml
```

## Quick Start

See [IMPLEMENTATION-PLAN-ProjectPipeline.md](../IMPLEMENTATION-PLAN-ProjectPipeline.md) for detailed setup instructions.

## Documentation

- [Product Requirements Document (PRD)](../PRD-ProjectPipeline.md)
- [Implementation Plan](../IMPLEMENTATION-PLAN-ProjectPipeline.md)

## Technology Stack

- **Frontend:** React 18, TypeScript, SVAR Gantt, TailwindCSS
- **Backend:** Node.js, Fastify, Prisma, PostgreSQL
- **AI:** LangGraph, Anthropic Claude, Weaviate
- **Infrastructure:** Docker, Traefik, Redis, MinIO

## Development Timeline

18 weeks across 8 phases - see implementation plan for details.

## License

MIT
