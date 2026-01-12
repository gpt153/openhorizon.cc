# 🚀 Start Here - Open Horizon Project Pipeline

**New to this project? Read this first.**

---

## What Is This Project?

Open Horizon Project Pipeline is an **AI-powered system for planning Erasmus+ youth exchange projects**. It takes you from initial brainstorming to completed grant application, automating budget calculations, vendor research, and documentation.

**User:** Single project coordinator (you!)
**Goal:** Plan 3-5 projects by February 2026 deadline
**Time Savings:** 40-60 hours → 4-6 hours per project

---

## 📖 Essential Reading (In Order)

### 1. **README.md** (5 minutes)
Start here to understand:
- What this project does
- Tech stack and structure
- How to set up locally
- Basic commands

[Read README.md](README.md)

---

### 2. **DOCUMENTATION.md** (10 minutes)
Navigation guide to all documentation:
- Where to find specifications
- Current implementation status
- Phase 1 roadmap (4 weeks)
- Quick links to everything

[Read DOCUMENTATION.md](DOCUMENTATION.md)

---

### 3. **PRD (Product Requirements Document)** (30-60 minutes)
Complete system specification:
- 11-step pipeline flow
- Budget auto-calculation engine
- AI agent designs (accommodation, travel, food)
- Week-by-week implementation plan
- Technical specifications with code examples

[Read .agents/PRD-ProjectPipeline-Complete.md](.agents/PRD-ProjectPipeline-Complete.md)

---

## 🎯 Current Status

### ✅ What's Working (91% Complete)

**Pipeline Foundation:**
1. ✅ AI seed generation (brainstorming)
2. ✅ Seed garden (organize ideas)
3. ✅ Seed elaboration (conversational refinement)
4. ✅ Seed-to-project conversion
5. ✅ Project management (Gantt chart, phases)
6. ✅ Phase CRUD operations
7. ✅ AI chat integration
8. ✅ Phase-specific AI agents UI
9. ✅ Budget tracking system (backend)
10. ✅ Application form generation (KA1/KA2)
11. ✅ Project report export (PDF/Excel/Word)

### 🆕 What's Next (Phase 1 - 4 Weeks)

**Week 1 (Jan 13-19):** Budget Calculator
- Auto-calculate from Erasmus+ rules
- Distance-based travel costs
- Per diem by country
- Budget breakdown UI

**Week 2 (Jan 20-26):** Accommodation Agent
- Scrape Booking.com/Hotels.com
- AI pros/cons analysis
- Quote email generation

**Week 3 (Jan 27-Feb 2):** Travel & Food Agents
- Flight search + agencies
- Caterer search
- Same workflow as accommodation

**Week 4 (Feb 3-9):** Integration & Testing
- End-to-end validation
- Real project test
- Production ready for February deadline

---

## 🏃 Quick Start

### For Development

```bash
# Install dependencies
npm install

# Start backend (from project-pipeline/backend)
cd project-pipeline/backend
npm run dev

# Start frontend (from project-pipeline/frontend)
cd project-pipeline/frontend
npm run dev
```

**Backend:** http://localhost:4000
**Frontend:** http://localhost:5173

---

### For Supervision

```bash
# In project directory
claude

# Prime supervisor with context
/prime-supervisor

# Start supervising Phase 1 work
/supervise
```

See [docs/autonomous-supervision.md](docs/autonomous-supervision.md) for details.

---

## 📁 Project Structure (Simplified)

```
openhorizon.cc/
├── START-HERE.md              ← You are here
├── README.md                  ← Project overview
├── DOCUMENTATION.md           ← Documentation index
├── CLAUDE.md                  ← AI instructions
│
├── .agents/
│   └── PRD-ProjectPipeline-Complete.md  ← System specification
│
├── project-pipeline/          ← Main system
│   ├── backend/               ← Fastify API + Prisma
│   └── frontend/              ← React + Vite
│
├── landing/                   ← Marketing site
├── app/                       ← Main application
└── .archive/                  ← Old docs (ignore)
```

---

## 🎓 Learning Path

### If You're a Developer

**Day 1:** Understand the system
1. Read README.md (project overview)
2. Skim PRD (get big picture)
3. Explore `project-pipeline/backend/src` (see what exists)
4. Run locally and test seed generation

**Day 2:** Deep dive into specifications
1. Read PRD Section 5 (Budget Calculator) - Week 1 task
2. Review Erasmus+ unit cost tables (Appendix A)
3. Study code examples in PRD

**Day 3:** Start implementing
1. Create implementation plan for Week 1
2. Set up distance calculation (Haversine formula)
3. Build budget calculation engine

---

### If You're Supervising

**Step 1:** Prime yourself
```
/prime-supervisor
```

**Step 2:** Review PRD
- Understand Phase 1 scope (4 weeks)
- Note acceptance criteria per week
- Understand February deadline importance

**Step 3:** Start supervision
```
/supervise
```

**Step 4:** Create issues for Week 1
- Issue: "Implement Budget Calculator"
- Issue: "Distance calculation with Haversine formula"
- Issue: "Budget breakdown UI"

**Step 5:** Monitor SCAR progress
- Let SCAR implement features
- Verify against PRD acceptance criteria
- Handle blockers and questions

---

## ⚠️ Important Notes

### February 2026 Deadline

**This is urgent.** User needs working system for 3-5 real Erasmus+ applications.

**Priorities:**
1. ✅ Budget auto-calculation (Week 1)
2. ✅ Vendor research with AI analysis (Weeks 2-3)
3. ✅ Quote generation workflow (Weeks 2-3)
4. ❌ RAG features (Phase 2, post-deadline)
5. ❌ Partner matching (Phase 2, post-deadline)

**Focus ruthlessly on Phase 1 deliverables.**

---

### What NOT to Read

**Skip these (they're archived):**
- `.archive/` directory - Historical documents, superseded
- Old PRD versions - Use PRD v2.0 only
- Old implementation reports - Past work, not current
- Completed plans - Already implemented

**If you see multiple PRDs, use only:**
`.agents/PRD-ProjectPipeline-Complete.md` (v2.0, Jan 2026)

---

## 🆘 Common Questions

**Q: Where do I start?**
A: Read README.md → DOCUMENTATION.md → PRD (in that order)

**Q: What should I build first?**
A: Budget Calculator (Week 1) - see PRD Section 5

**Q: Is this for multiple users?**
A: No, single user (project coordinator) for now

**Q: What's the February deadline?**
A: Real Erasmus+ grant applications due, system must work

**Q: Should I implement RAG/SALTO-Youth integration?**
A: Not yet - Phase 2 (March-April), after deadline

**Q: Where are the old PRDs?**
A: Archived in `.archive/` - don't use them, they're obsolete

**Q: How do I supervise this project?**
A: Read `docs/autonomous-supervision.md` then run `/prime-supervisor`

---

## ✅ You're Ready!

**Next steps:**
1. ✅ Read README.md (5 min)
2. ✅ Read DOCUMENTATION.md (10 min)
3. ✅ Skim PRD (30 min)
4. 🚀 Start Week 1 development or supervision

**Questions?** Check [DOCUMENTATION.md](DOCUMENTATION.md) for where to find answers.

**Let's build something great for February 2026! 🎯**

---

**Last Updated:** 2026-01-12
**Current Phase:** Phase 1 - Week 1 (Budget Calculator)
**Deadline:** February 10, 2026
