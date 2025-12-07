# FRD-00: Backend Master Orchestration

## Purpose

This document controls the execution order for building the FLONP backend. The AI agent MUST follow this orchestration exactly, completing each phase before proceeding to the next.

---

## Global Rules

1. **NO IMPROVISATION** — Follow specifications exactly as written
2. **NO SKIPPING** — Complete each FRD before starting the next
3. **VERIFY BEFORE PROCEEDING** — Run acceptance tests after each phase
4. **USE SOURCE DOCS** — Reference the documentation files listed in each FRD
5. **EXACT NAMES** — Use field names, file paths, and values exactly as specified
6. **ASK IF UNCLEAR** — Do not guess; ask for clarification

---

## Execution Order

```
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND BUILD SEQUENCE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   FRD-B1: Project Structure                                     │
│   ─────────────────────────                                     │
│   Creates: Directory structure, stubs, requirements.txt         │
│   Verify: Folders exist, dependencies install                   │
│         │                                                       │
│         ▼                                                       │
│   FRD-B2: Pydantic Models                                       │
│   ─────────────────────────                                     │
│   Creates: app/models.py with request/response schemas          │
│   Verify: Models can be imported and validated                  │
│         │                                                       │
│         ▼                                                       │
│   FRD-B3: LangChain Agent                                       │
│   ─────────────────────────                                     │
│   Creates: app/agent.py with Claude integration                 │
│   Verify: Agent module imports successfully                     │
│         │                                                       │
│         ▼                                                       │
│   FRD-B4: FastAPI Application                                   │
│   ───────────────────────────                                   │
│   Creates: app/main.py with endpoints and error handling        │
│   Verify: Server starts without errors                          │
│         │                                                       │
│         ▼                                                       │
│   FRD-B5: Environment Configuration                             │
│   ─────────────────────────────────                             │
│   Creates: .env.example, .gitignore, .env (local)               │
│   Verify: Environment variables load correctly                  │
│         │                                                       │
│         ▼                                                       │
│   FRD-B6: Integration Testing                                   │
│   ────────────────────────────                                  │
│   Executes: curl tests for all endpoints                        │
│   Verify: All API contracts fulfilled                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase Dependencies

| Phase | Depends On | Blocking For |
|-------|------------|--------------|
| FRD-B1 | None | FRD-B2, FRD-B3, FRD-B4, FRD-B5 |
| FRD-B2 | FRD-B1 | FRD-B3, FRD-B4 |
| FRD-B3 | FRD-B1, FRD-B2 | FRD-B4, FRD-B6 |
| FRD-B4 | FRD-B1, FRD-B2, FRD-B3 | FRD-B6 |
| FRD-B5 | FRD-B1 | FRD-B6 |
| FRD-B6 | FRD-B1, FRD-B2, FRD-B3, FRD-B4, FRD-B5 | None |

---

## Success Criteria (Full Backend)

The backend is complete when FRD-B6 passes ALL tests:

```bash
# 1. Health check
curl http://localhost:8000/health
# Expected: {"status":"healthy","version":"1.0.0"}

# 2. Valid optimization request
curl -X POST http://localhost:8000/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "lipid_composition": "SM-102",
    "lipid_concentration": 12.5,
    "solvent_type": "Ethanol 99%",
    "payload_type": "mRNA",
    "payload_concentration": 0.1,
    "buffer_type": "Citrate pH 4.0",
    "target_np_ratio": 6
  }'
# Expected: 200 OK with all 7 response fields

# 3. Invalid field returns 422
curl -X POST http://localhost:8000/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "lipid_composition": "SM-102",
    "lipid_concentration": 999,
    "solvent_type": "Ethanol 99%",
    "payload_type": "mRNA",
    "payload_concentration": 0.1,
    "buffer_type": "Citrate pH 4.0",
    "target_np_ratio": 6
  }'
# Expected: 422 with error details
```

---

## File Manifest (Final State)

After completing all phases, the backend directory should contain:

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py           # FastAPI application
│   ├── models.py         # Pydantic models
│   └── agent.py          # LangChain agent
├── .env                  # Local environment (not committed)
├── .env.example          # Environment template
├── .gitignore            # Git ignore rules
├── .python-version       # Python version for uv
├── requirements.txt      # Python dependencies
└── pyproject.toml        # Project metadata
```

---

## How to Start

Load all FRDs and begin orchestration:

```
@frds/backend/FRD-00-BACKEND-MASTER.md
@frds/backend/FRD-B1-PROJECT-STRUCTURE.md
@frds/backend/FRD-B2-PYDANTIC-MODELS.md
@frds/backend/FRD-B3-LANGCHAIN-AGENT.md
@frds/backend/FRD-B4-FASTAPI-APP.md
@frds/backend/FRD-B5-ENVIRONMENT-CONFIG.md
@frds/backend/FRD-B6-INTEGRATION-TESTING.md

Working directory: backend/

Start the orchestration. Begin with FRD-B1.
```

---

## Source Documentation

The following MDX documentation files contain the original specifications:

| Document | Location | Contains |
|----------|----------|----------|
| Tech Stack | `docs/src/content/docs/architecture/tech-stack.mdx` | Versions, dependencies, rationale |
| System Architecture | `docs/src/content/docs/architecture/system-architecture.mdx` | Component responsibilities, data flow |
| Agent Architecture | `docs/src/content/docs/architecture/agent-architecture.mdx` | LangChain setup, prompts, retry logic |
| Development Setup | `docs/src/content/docs/guides/development-setup.mdx` | Environment setup, commands |
| API Specification | `docs/src/content/docs/reference/api-specification.mdx` | Request/response schemas, constraints |
| Validation Strategy | `docs/src/content/docs/reference/validation-strategy.mdx` | Validation rules, error messages |
| Error Handling | `docs/src/content/docs/reference/error-handling.mdx` | Error types, HTTP status codes |
| Domain Context | `docs/src/content/docs/getting-started/domain-context.mdx` | LNP science, system prompt content |

**IMPORTANT:** The FRDs contain all necessary code and specifications. Reference these docs only for additional context or clarification.
