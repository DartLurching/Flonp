# FLONP — Developer README

> **Flow + LNP** — AI-powered optimization for lipid nanoparticle synthesis via microfluidics.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Quick Start](#quick-start)
3. [Project Structure](#project-structure)
4. [Key Design Decisions](#key-design-decisions)
5. [Development Workflow](#development-workflow)
6. [Intern Onboarding](#intern-onboarding)
7. [Code Review Process](#code-review-process)
8. [Documentation Index](#documentation-index)
9. [Troubleshooting](#troubleshooting)

---

## Project Overview

FLONP is a web application that helps researchers optimize lipid nanoparticle (LNP) formulations for microfluidic synthesis. Users input formulation parameters, and an AI engine (Claude 3.5 Haiku via LangChain) returns optimized flow settings with scientific reasoning.

### What We're Building (MVP Vertical Slice)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Input Form    │────▶│   POST /optimize│────▶│  Results Card   │
│   (3 sections)  │     │   (FastAPI)     │     │  (AI response)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
   React + Zod            Pydantic + LangChain      shadcn/ui Card
```

### MVP Scope

**In Scope:**
- 3-section form (Organic Phase, Aqueous Phase, Process Target)
- Full client and server-side validation
- Single API endpoint: `POST /optimize`
- AI-generated recommendations with reasoning
- Loading states and error handling
- Deployment to Netlify (frontend) and Railway (backend)

**Out of Scope (deferred):**
- User authentication
- Database/persistence
- Mobile responsiveness
- Export features (PDF, CSV)
- Batch processing

---

## Quick Start

### Prerequisites

| Tool | Version | Installation |
|------|---------|--------------|
| Git | latest | https://git-scm.com/downloads |
| Node.js | 24.11.1 LTS | https://nodejs.org/ |
| pnpm | 10.x | `npm install -g pnpm@10` |
| Python | 3.10 | https://www.python.org/downloads/ |
| uv | 0.9.15 | See below |

**Install uv (Python package manager):**

```bash
# macOS / Linux
curl -LsSf https://astral.sh/uv/0.9.15/install.sh | sh

# Windows (PowerShell)
irm https://astral.sh/uv/0.9.15/install.ps1 | iex
```

### Setup Steps

```bash
# 1. Clone the repository
git clone <repository-url>
cd flonp

# 2. Install frontend dependencies (from root)
pnpm install

# 3. Set up backend
cd backend
uv venv --python 3.10
uv pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# 4. Set up frontend environment
cd ../frontend
cp .env.example .env
# Verify VITE_API_URL=http://localhost:8000

# 5. Run everything (from root)
cd ..
pnpm dev
```

### Verify Setup

- **Frontend:** Open http://localhost:5173 — you should see the form
- **Backend:** Open http://localhost:8000/docs — you should see FastAPI docs
- **End-to-end:** Submit a form and verify you get AI-generated results

---

## Project Structure

```
flonp/
├── frontend/                      # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                # shadcn/ui components (generated)
│   │   │   ├── FormulationForm.tsx
│   │   │   ├── ResultsCard.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorDisplay.tsx
│   │   │   └── Header.tsx
│   │   ├── lib/
│   │   │   ├── api.ts             # API client
│   │   │   ├── schemas.ts         # Zod validation
│   │   │   └── utils.ts           # shadcn utility
│   │   ├── types/
│   │   │   └── formulation.ts     # TypeScript types + constants
│   │   ├── App.tsx                # Root component
│   │   ├── main.tsx               # Entry point
│   │   └── index.css              # Tailwind imports
│   ├── .env.example
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                       # FastAPI application
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                # FastAPI app + routes
│   │   ├── models.py              # Pydantic models
│   │   └── agent.py               # LangChain integration
│   ├── .env.example
│   ├── requirements.txt
│   └── Dockerfile
│
├── docs/                          # Technical documentation
│   ├── INTRODUCTION.md
│   ├── DOMAIN_CONTEXT.md
│   ├── TECH_STACK.md
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── API_SPECIFICATION.md
│   ├── AGENT_ARCHITECTURE.md
│   ├── FRONTEND_ARCHITECTURE.md
│   ├── VALIDATION_STRATEGY.md
│   ├── ERROR_HANDLING.md
│   └── DEPLOYMENT_GUIDE.md
│
├── package.json                   # Root workspace scripts
├── pnpm-workspace.yaml
└── README.md                      # You are here
```

---

## Key Design Decisions

Understanding *why* we made certain choices will help you work within the architecture effectively.

### 1. Stateless Architecture

**Decision:** No database, no sessions, no persistence.

**Why:** MVP simplicity. Each request is independent. This lets us focus on proving the core value proposition (AI-generated recommendations) without infrastructure complexity. Persistence is planned for post-MVP.

**Impact on you:** Don't design features that require remembering previous requests.

### 2. Dual Validation (Zod + Pydantic)

**Decision:** Validate the same rules on both frontend and backend.

**Why:** 
- Frontend (Zod): Instant user feedback, prevents wasted API calls
- Backend (Pydantic): Security — never trust client data

**Impact on you:** When changing validation rules, update **both** `frontend/src/lib/schemas.ts` AND `backend/app/models.py`.

### 3. AI as Domain Expert

**Decision:** Formulation logic lives in the AI prompt, not in code.

**Why:** Faster iteration on recommendations. We adjust behavior by editing prompts rather than writing complex physics simulations. The AI provides human-readable reasoning.

**Impact on you:** If recommendations seem wrong, the fix is likely in `backend/app/agent.py` (the system prompt), not in business logic code.

### 4. PydanticOutputParser for Structured Output

**Decision:** Force Claude to return strict JSON matching our Pydantic model.

**Why:** LLMs sometimes return prose or malformed JSON. PydanticOutputParser + OutputFixingParser gives us reliable structured data with automatic retry on failure.

**Impact on you:** The AI response shape is defined by `FormulationResponse` in `models.py`. If you need new output fields, add them there first.

### 5. Monorepo with Separate Deployments

**Decision:** Frontend and backend in one repo, deployed to different platforms.

**Why:** Single source of truth for development, but each layer scales independently. Netlify is optimized for static sites. Railway handles Python containers without cold starts.

**Impact on you:** A PR can touch both layers. Use the workspace scripts (`pnpm dev`) to run both locally.

### 6. shadcn/ui Over Custom Components

**Decision:** Use shadcn/ui's copy-paste component model.

**Why:** Professional, accessible components with minimal effort. Unlike traditional component libraries, shadcn components live in your codebase, so you can modify them freely.

**Impact on you:** UI components are in `frontend/src/components/ui/`. You own this code — customize as needed.

---

## Development Workflow

### Daily Commands

| Command | What It Does |
|---------|--------------|
| `pnpm dev` | Start both frontend and backend |
| `pnpm dev:frontend` | Start only frontend |
| `pnpm dev:backend` | Start only backend |
| `pnpm build` | Build frontend for production |

### Environment Variables

**Backend (`backend/.env`):**
```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
ALLOWED_ORIGINS=http://localhost:5173
```

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:8000
```

> ⚠️ **Never commit `.env` files.** Get your own Anthropic API key at https://console.anthropic.com/

### Git Workflow

```
main (protected)
  │
  └── feature/your-feature-name
        │
        └── PR → Code Review → Merge to main
```

**Branch naming:**
- `feature/form-validation` — new features
- `fix/cors-error` — bug fixes
- `docs/update-readme` — documentation

**Commit messages:**
- Use present tense: "Add form validation" not "Added form validation"
- Be specific: "Fix lipid concentration range check" not "Fix bug"

---

## Intern Onboarding

Welcome to FLONP! This section will help you get oriented and productive quickly.

### Team Structure

| Role | Focus Area | Primary Files |
|------|------------|---------------|
| **Frontend Intern** | React UI, form handling, API integration | `frontend/src/` |
| **Backend Intern** | FastAPI, Pydantic, LangChain | `backend/app/` |
| **PM (Papi)** | Architecture decisions, code review, guidance | `docs/` |

You'll work on **parallel tracks** with clear ownership boundaries. The API contract (`docs/API_SPECIFICATION.md`) is the handshake between your work.

### Week 1: Foundation

**Both Interns:**
1. Complete [Quick Start](#quick-start) — verify everything runs locally
2. Read these docs in order:
   - `INTRODUCTION.md` — what and why
   - `DOMAIN_CONTEXT.md` — the science (essential for understanding field names)
   - `SYSTEM_ARCHITECTURE.md` — how pieces connect
   - `API_SPECIFICATION.md` — the contract between frontend and backend

**Frontend Intern additionally:**
- Read `FRONTEND_ARCHITECTURE.md`
- Read `VALIDATION_STRATEGY.md` (Zod section)
- Explore `frontend/src/` — understand component structure

**Backend Intern additionally:**
- Read `AGENT_ARCHITECTURE.md`
- Read `VALIDATION_STRATEGY.md` (Pydantic section)
- Explore `backend/app/` — understand endpoint flow

### Starter Tasks

These are designed to be achievable in your first week while learning the codebase.

#### Frontend Intern — Starter Tasks

| Task | Files | Learning Goal |
|------|-------|---------------|
| **Add unit labels to input fields** | `FormulationForm.tsx` | Understand form structure |
| **Improve loading spinner styling** | `LoadingSpinner.tsx`, `index.css` | Tailwind basics |
| **Add placeholder text to dropdowns** | `FormulationForm.tsx` | React Hook Form integration |
| **Display validation errors with icons** | `FormulationForm.tsx`, shadcn `Form` | Error handling patterns |
| **Format flow ratio as "X:1"** | `ResultsCard.tsx` | Data transformation |

#### Backend Intern — Starter Tasks

| Task | Files | Learning Goal |
|------|-------|---------------|
| **Add request logging** | `main.py` | FastAPI middleware |
| **Add response time header** | `main.py` | HTTP response patterns |
| **Improve validation error messages** | `models.py` | Pydantic customization |
| **Add health check details** | `main.py` | Endpoint creation |
| **Test agent with mock inputs** | `agent.py` | LangChain basics |

### Module Ownership (Week 2+)

Once comfortable, you'll own specific modules:

#### Frontend Modules

| Module | Description | Key Files |
|--------|-------------|-----------|
| **Form System** | Input collection, validation, submission | `FormulationForm.tsx`, `schemas.ts` |
| **Results Display** | Rendering AI output, formatting | `ResultsCard.tsx` |
| **Error States** | Loading, errors, empty states | `LoadingSpinner.tsx`, `ErrorDisplay.tsx` |
| **API Layer** | Fetch wrapper, type conversion | `api.ts`, `formulation.ts` |

#### Backend Modules

| Module | Description | Key Files |
|--------|-------------|-----------|
| **API Layer** | Routes, CORS, middleware | `main.py` |
| **Validation** | Request/response schemas | `models.py` |
| **AI Agent** | Prompt, parsing, retry | `agent.py` |

### Growth Tasks (Week 3+)

| Frontend | Backend |
|----------|---------|
| Add form reset button | Add request rate limiting |
| Implement skeleton loading | Improve system prompt |
| Add copy-to-clipboard for results | Add output validation warnings |
| Responsive layout adjustments | Add retry with exponential backoff |
| Add form field tooltips with domain info | Log AI token usage |

---

## Code Review Process

### Before Submitting a PR

**Checklist:**
- [ ] Code runs locally without errors
- [ ] Changes are in scope (check MVP boundaries)
- [ ] Validation rules match between frontend and backend (if applicable)
- [ ] No `.env` files or secrets committed
- [ ] Meaningful commit messages
- [ ] PR description explains *what* and *why*

### PR Template

```markdown
## What does this PR do?
[Brief description]

## How to test
1. [Step-by-step testing instructions]
2. [Expected results]

## Checklist
- [ ] Tested locally
- [ ] Updated documentation (if needed)
- [ ] No breaking changes to API contract

## Screenshots (if UI changes)
[Add screenshots]
```

### Review Workflow

```
Developer submits PR
        │
        ▼
PM reviews within 24 hours
        │
        ├── Approved → Merge to main
        │
        └── Changes requested
                │
                ▼
        Developer addresses feedback
                │
                ▼
        Re-review → Approved → Merge
```

### Review Focus Areas

| What We Check | Why It Matters |
|---------------|----------------|
| **Does it work?** | Functionality first |
| **Is it in scope?** | MVP discipline |
| **Is it readable?** | Future maintainability |
| **Are edge cases handled?** | Robustness |
| **Does validation stay in sync?** | Data integrity |

### Feedback Cycles

**Daily:** Async questions via comments or chat

**Weekly:** 
- Brief sync meeting (30 min)
- Review completed work
- Prioritize next week's tasks
- Address blockers

**Per PR:**
- Expect feedback within 24 hours
- Small PRs preferred (easier to review)
- If PR is blocked, create a draft and ask for early feedback

---

## Documentation Index

Read these in order for comprehensive understanding:

| Document | Purpose | When to Read |
|----------|---------|--------------|
| `INTRODUCTION.md` | Project overview, problem statement | Day 1 |
| `COMPLETE_BRIEF.md` | Full product requirements | Day 1 |
| `DOMAIN_CONTEXT.md` | LNP science for developers | Day 1 (essential) |
| `TECH_STACK.md` | Tools and versions | Day 1 |
| `SYSTEM_ARCHITECTURE.md` | How components connect | Day 1 |
| `DEVELOPMENT_SETUP.md` | Detailed setup instructions | Day 1 |
| `API_SPECIFICATION.md` | Endpoint contract | Day 2 |
| `FRONTEND_ARCHITECTURE.md` | React component specs | Day 2 (Frontend) |
| `AGENT_ARCHITECTURE.md` | LangChain integration | Day 2 (Backend) |
| `VALIDATION_STRATEGY.md` | Zod + Pydantic alignment | Day 3 |
| `ERROR_HANDLING.md` | Error types and handling | Day 3 |
| `DEPLOYMENT_GUIDE.md` | Production deployment | When deploying |

---

## Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| `pnpm: command not found` | Run `npm install -g pnpm@10` |
| `uv: command not found` | Restart terminal after installation |
| Python version mismatch | Use `uv venv --python 3.10` |
| `ModuleNotFoundError` | Run `uv pip install -r requirements.txt` in backend/ |
| CORS errors in browser | Check `ALLOWED_ORIGINS` includes `http://localhost:5173` |
| "Network Error" in browser | Backend not running — check terminal for errors |
| API key errors | Verify `.env` has valid `ANTHROPIC_API_KEY` |
| Port already in use | Kill the process using that port |

### Getting Help

1. **Check documentation** — your question may be answered in `/docs`
2. **Search existing PRs/issues** — someone may have encountered this
3. **Ask with context** — include error messages, what you tried, expected vs actual behavior

### Useful Commands

```bash
# Check what's using a port (macOS/Linux)
lsof -i :8000

# Kill a process by PID
kill <PID>

# Check Python version
python --version

# Check Node version
node --version

# Reinstall frontend dependencies
rm -rf node_modules && pnpm install

# Recreate Python virtual environment
cd backend
rm -rf .venv
uv venv --python 3.10
uv pip install -r requirements.txt
```

---

## Contributing

### Ground Rules

1. **Stay in scope** — MVP first, features later
2. **Keep validation in sync** — frontend and backend must agree
3. **Write for future readers** — clear code > clever code
4. **Small PRs** — easier to review and less risk
5. **Ask when unsure** — better to clarify than to build the wrong thing

### Success Metrics

Your work is successful when:
- End-to-end latency stays under 5 seconds
- All AI responses are valid JSON (no parse errors)
- Invalid inputs are caught before API calls
- Another developer can understand your code without explanation

---

## Questions?

- **Technical questions:** Ask in PR comments or team chat
- **Architecture questions:** Check documentation first, then ask PM
- **Domain questions:** See `DOMAIN_CONTEXT.md` or ask PM

Welcome to the team. Let's build something great. 🚀
