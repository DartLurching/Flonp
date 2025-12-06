# FLONP — LNP Formulation Optimizer

**FLONP** (Flow + LNP) is an AI-powered web application that optimizes the synthesis of Lipid Nanoparticles (LNPs) using microfluidic technology. It helps process development scientists reduce trial-and-error cycles by providing AI-generated recommendations for optimal flow parameters and predicted particle characteristics.

---

## Quick Start

```bash
# Clone and install
git clone <repository-url>
cd flonp
pnpm install                              # Install frontend + root deps

# Setup backend
cd backend
uv venv --python 3.10                     # Create Python environment
uv pip install -r requirements.txt        # Install backend deps
cp .env.example .env                      # Add your ANTHROPIC_API_KEY

# Setup frontend
cd ../frontend
cp .env.example .env

# Setup docs
cd ../docs
pnpm install

# Run all services (from repository root)
cd ..
pnpm dev
```

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Documentation:** http://localhost:4321

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite 7.2, TypeScript 5, Tailwind 4, shadcn/ui |
| **Backend** | Python 3.10, FastAPI 0.123, Pydantic 2.12, Uvicorn 0.38 |
| **AI** | LangChain 1.1, Anthropic claude-3-5-haiku |
| **Tools** | pnpm 10, uv 0.9.15 |
| **Hosting** | Netlify (frontend), Railway (backend) |

---

## Project Structure

```
flonp/
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # UI components (FormulationForm, ResultsCard)
│   │   ├── lib/           # API client, schemas, utilities
│   │   └── types/         # TypeScript interfaces
│   └── .env.example
├── backend/               # FastAPI application
│   ├── app/
│   │   ├── main.py        # FastAPI routes, CORS
│   │   ├── models.py      # Pydantic request/response schemas
│   │   ├── agent.py       # LangChain integration
│   │   └── prompts.py     # System prompt template
│   ├── Dockerfile
│   └── .env.example
└── docs/                  # Starlight documentation
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     React Frontend (Netlify)                      │
│      Form UI → Zod Validation → API Client (fetch)               │
└──────────────────────────────────────────────────────────────────┘
                              │ HTTPS
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                     FastAPI Backend (Railway)                     │
│      POST /optimize → Pydantic Validation → LangChain Agent      │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                   LangChain + Claude Model                        │
│   ChatAnthropic (claude-3-5-haiku) → Structured JSON Response    │
└──────────────────────────────────────────────────────────────────┘
```

> **Note:** LangChain orchestrates the AI integration. The Claude model is accessed via the `langchain-anthropic` package, which handles prompt templating, output parsing, and retry logic.


---

## Key Design Decisions (Vertical Slice)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Stateless MVP** | No database | Reduces complexity, focuses on core AI functionality |
| **claude-3-5-haiku** | Over Sonnet | Sufficient reasoning at lower cost and latency |
| **PydanticOutputParser** | For AI responses | Enforces strict JSON output, prevents formatting errors |
| **Dual Validation** | Zod + Pydantic | Frontend for UX, backend for security |
| **Railway** | Over Render | No cold starts for Python backends |
| **Separate Deployments** | Netlify + Railway | Each optimized for its use case |

---

## Environment Configuration

### Backend (`backend/.env`)
```env
# Anthropic API Key (required)
# Get yours at https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-your-key-here

# CORS Allowed Origins (comma-separated)
# For local development:
ALLOWED_ORIGINS=http://localhost:5173
# For production, add your Netlify URL:
# ALLOWED_ORIGINS=http://localhost:5173,https://flonp.netlify.app
```

### Frontend (`frontend/.env`)
```env
# Backend API URL
# For local development:
VITE_API_URL=http://localhost:8000
# For production:
# VITE_API_URL=https://flonp-api.railway.app
```

> **Important:** Never commit `.env` files to version control. Get your Anthropic API key at https://console.anthropic.com/

---

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start frontend + backend |
| `pnpm dev:frontend` | Start frontend only |
| `pnpm dev:backend` | Start backend only |
| `pnpm build` | Build frontend for production |
| `cd docs && pnpm dev` | Start documentation site |
| `cd docs && pnpm build` | Build documentation for production |

---

## API Reference

**POST /optimize**

```json
// Request
{
  "lipid_composition": "SM-102",
  "lipid_concentration": 12.5,
  "solvent_type": "Ethanol 99%",
  "payload_type": "mRNA",
  "payload_concentration": 0.1,
  "buffer_type": "Citrate pH 4.0",
  "target_np_ratio": 6
}

// Response
{
  "flow_rate_ratio": 3.0,
  "total_flow_rate": 12.0,
  "particle_predicted_size": 80.0,
  "pdi": 0.15,
  "encapsulation_efficiency": 92.0,
  "post_process": "Dialyze against PBS pH 7.4...",
  "reasoning": "For SM-102 at pH 4.0 with mRNA..."
}
```

---

## Deployment

### Frontend (Netlify)
- Base directory: `frontend`
- Build command: `pnpm build`
- Publish directory: `frontend/dist`
- Set `VITE_API_URL` to production backend URL

### Backend (Railway)
- Root directory: `backend`
- Builder: Dockerfile
- Set `ANTHROPIC_API_KEY` and `ALLOWED_ORIGINS`

---

## Intern Onboarding

### Getting Started

1. **Prerequisites:** Install Node.js 24, pnpm 10, Python 3.10, and uv 0.9.15
2. **Setup:** Follow the Quick Start section above
3. **Read the docs:** Run `pnpm dev` in `/docs` to view full documentation locally

### Suggested Learning Modules

| Module | Focus Area | Estimated Time |
|--------|------------|----------------|
| **Frontend Basics** | React Hook Form, Zod validation, shadcn/ui components | 2-3 days |
| **Backend Basics** | FastAPI routes, Pydantic models, async handlers | 2-3 days |
| **AI Integration** | LangChain prompts, output parsing, error handling | 3-4 days |
| **Full Stack** | End-to-end request flow, debugging, deployment | 2-3 days |

### Example Starter Tasks

1. **Add a new field** — Add a `target_particle_size` input field (frontend + backend)
2. **Improve error messages** — Create user-friendly validation messages for each field
3. **Add loading states** — Implement skeleton loading for the results card
4. **Prompt engineering** — Improve the AI system prompt for better reasoning output
5. **Add a reset button** — Clear form and results with a single click

### Code Review Process

- Create feature branches from `main`
- Write descriptive commit messages
- Submit PRs with:
  - Summary of changes
  - Screenshots for UI changes
  - Test steps for reviewers
- Address review feedback promptly
- Squash and merge after approval

### Key Files to Understand

| File | Purpose |
|------|---------|
| `frontend/src/lib/schemas.ts` | Zod validation schemas |
| `frontend/src/components/FormulationForm.tsx` | Main form component |
| `backend/app/models.py` | Pydantic request/response models |
| `backend/app/agent.py` | LangChain AI integration |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `ANTHROPIC_API_KEY not set` | Check `.env` file exists and has valid key |
| CORS errors | Verify `ALLOWED_ORIGINS` includes frontend URL |
| `ModuleNotFoundError` | Run `uv pip install -r requirements.txt` |
| Port already in use | Kill existing process or change port |

---

## Documentation

Full documentation is available in the `/docs` directory. Run locally:

```bash
cd docs
pnpm install
pnpm dev
```

Or view the deployed docs at your Starlight URL.

---

## License

MIT
