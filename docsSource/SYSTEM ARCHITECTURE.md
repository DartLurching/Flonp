# FLONP — System Architecture

## Overview

FLONP is a stateless web application with three distinct layers: a React frontend, a FastAPI backend, and an AI/ML integration layer powered by LangChain and Claude. This document describes how these layers interact and where each piece of functionality lives.

---

## High-Level Architecture
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER'S BROWSER                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTPS
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Netlify CDN)                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                        React Application                              │  │
│  │                                                                       │  │
│  │   ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐   │  │
│  │   │  Form UI    │───>│  Zod        │───>│  API Client (fetch)     │   │  │
│  │   │  (shadcn)   │    │  Validation │    │                         │   │  │
│  │   └─────────────┘    └─────────────┘    └────────────┬────────────┘   │  │
│  │                                                      │                │  │
│  │   ┌─────────────────────────────────────────────────┐│                │  │
│  │   │              Results Card (shadcn)              <┘                │  │
│  │   └─────────────────────────────────────────────────┘                 │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTPS (CORS)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BACKEND (Railway)                                  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                        FastAPI Application                            │  │
│  │                                                                       │  │
│  │   ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐   │  │
│  │   │  POST       │───>│  Pydantic   │───>│  LangChain              │   │  │
│  │   │  /optimize  │    │  Validation │    │  Agent                  │   │  │
│  │   └─────────────┘    └─────────────┘    └────────────┬────────────┘   │  │
│  │                                                      │                │  │
│  └──────────────────────────────────────────────────────┼────────────────┘  │
└─────────────────────────────────────────────────────────┼───────────────────┘
                                                          │
                                                          │ HTTPS
                                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ANTHROPIC API                                      │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                     Claude 3.5 Haiku                                  │  │
│  │                                                                       │  │
│  │   • Receives: System prompt + User formulation parameters             │  │
│  │   • Returns: Structured JSON with flow recommendations                │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Layer Responsibilities

### Frontend Layer

| Responsibility | Description |
|----------------|-------------|
| **User Interface** | Render the 3-section form and results card |
| **Client-Side Validation** | Validate inputs with Zod before sending to API |
| **API Communication** | Send POST request to `/optimize`, handle response |
| **State Management** | Manage form state (React Hook Form) and loading/error states |
| **User Feedback** | Display loading spinners, error messages, and results |

**The frontend does NOT:**
- Store data persistently
- Make decisions about formulation logic
- Communicate directly with Anthropic API

### Backend Layer

| Responsibility | Description |
|----------------|-------------|
| **Request Handling** | Accept POST requests at `/optimize` endpoint |
| **Server-Side Validation** | Re-validate all inputs with Pydantic (never trust client) |
| **AI Orchestration** | Construct prompts, call Claude, parse responses |
| **Error Handling** | Return appropriate HTTP status codes and error messages |
| **CORS Management** | Allow cross-origin requests from frontend domain |

**The backend does NOT:**
- Serve the frontend (separate deployments)
- Store data in a database
- Implement formulation logic directly (delegated to AI)

### AI/ML Layer

| Responsibility | Description |
|----------------|-------------|
| **Domain Reasoning** | Apply LNP formulation knowledge to generate recommendations |
| **Structured Output** | Return JSON matching the `FormulationResponse` schema |
| **Scientific Explanation** | Provide reasoning for recommended parameters |

**The AI layer does NOT:**
- Validate inputs (backend does this first)
- Have memory of previous requests (stateless)
- Access external data sources

---

## Request Lifecycle

A complete request flows through the system as follows:
```
┌──────────────────────────────────────────────────────────────────────────┐
│                         REQUEST LIFECYCLE                                │
└──────────────────────────────────────────────────────────────────────────┘

1. USER ACTION
   │
   │  User fills form and clicks "Calculate"
   ▼
2. CLIENT VALIDATION (Frontend)
   │
   │  Zod schema validates all fields
   │  ├─ Invalid → Display error messages, STOP
   │  └─ Valid   → Continue
   ▼
3. API REQUEST (Frontend → Backend)
   │
   │  fetch('POST /optimize', { body: formData })
   │  Frontend shows loading state
   ▼
4. SERVER VALIDATION (Backend)
   │
   │  Pydantic model validates request body
   │  ├─ Invalid → Return 422 Unprocessable Entity, STOP
   │  └─ Valid   → Continue
   ▼
5. PROMPT CONSTRUCTION (Backend)
   │
   │  LangChain builds prompt:
   │  ├─ System prompt (domain instructions)
   │  └─ User message (formulation parameters)
   ▼
6. LLM CALL (Backend → Anthropic)
   │
   │  ChatAnthropic sends request to Claude 3.5 Haiku
   │  ├─ Timeout → Return 504 Gateway Timeout, STOP
   │  └─ Success → Continue
   ▼
7. RESPONSE PARSING (Backend)
   │
   │  PydanticOutputParser extracts structured data
   │  ├─ Parse Error → OutputFixingParser retries once
   │  │                ├─ Still fails → Return 500, STOP
   │  │                └─ Success    → Continue
   │  └─ Success → Continue
   ▼
8. API RESPONSE (Backend → Frontend)
   │
   │  Return 200 OK with FormulationResponse JSON
   ▼
9. UI UPDATE (Frontend)
   │
   │  Hide loading state
   │  Display results card with recommendations
   ▼
10. USER SEES RESULTS
```

---

---

## Data Flow

### Constrained Field Types

Several fields accept only specific values. These are defined once and used for both type checking and UI rendering.

**Frontend (TypeScript)**
```typescript
// Single source of truth — used for types AND dropdown options
export const LIPID_COMPOSITIONS = ['SM-102', 'DOTAP/Chol', 'Custom'] as const;
export const PAYLOAD_TYPES = ['mRNA', 'siRNA', 'pDNA', 'Empty'] as const;
export const BUFFER_TYPES = ['Citrate pH 4.0', 'Acetate pH 5.0', 'PBS pH 7.4'] as const;
export const SOLVENT_TYPE = 'Ethanol 99%' as const;

// Derived types
export type LipidComposition = typeof LIPID_COMPOSITIONS[number];
export type PayloadType = typeof PAYLOAD_TYPES[number];
export type BufferType = typeof BUFFER_TYPES[number];
```

**Backend (Python)**
```python
from typing import Literal

LipidComposition = Literal['SM-102', 'DOTAP/Chol', 'Custom']
PayloadType = Literal['mRNA', 'siRNA', 'pDNA', 'Empty']
BufferType = Literal['Citrate pH 4.0', 'Acetate pH 5.0', 'PBS pH 7.4']
SolventType = Literal['Ethanol 99%']
```

### Request Data Shape
```
Frontend (TypeScript)              Backend (Python)                       AI (Claude)
─────────────────────               ────────────────                      ───────────

FormulationInput {                  FormulationRequest {                  Receives as
lipidComposition: LipidComposition  lipid_composition: LipidComposition   natural language
lipidConcentration: number          lipid_concentration: float            prompt with all
solventType: 'Ethanol 99%'          solvent_type: SolventType             parameters
payloadType: PayloadType            payload_type: PayloadType             formatted
payloadConcentration: number        payload_concentration: float
bufferType: BufferType              buffer_type: BufferType
targetNpRatio: number               target_np_ratio: int
}                                   }
        │                                     │                                    │
        │       HTTP POST JSON                │          LangChain Prompt          │
        └─────────────────────────────────────┴────────────────────────────────────┘
```

### Response Data Shape
```
AI (Claude)             Backend (Python)                    Frontend (TypeScript)
───────────             ────────────────                    ─────────────────────

Returns structured      FormulationResponse {               FormulationResult {
JSON matching           flow_rate_ratio: float              flowRateRatio: number
Pydantic schema         total_flow_rate: float              totalFlowRate: number
                        particle_predicted_size: float      particlePredictedSize: number
                        pdi: float                          pdi: number
                        encapsulation_efficiency: float     encapsulationEfficiency: number
                        post_process: str                   postProcess: string
                        reasoning: str                      reasoning: string
                        }                                   }
    │                                  │                                 │
    │       Parsed by LangChain        │          HTTP 200 JSON          │
    └──────────────────────────────────┴─────────────────────────────────┘
```

> **Naming Convention:** Backend uses `snake_case` (Python convention). Frontend uses `camelCase` (JavaScript convention). The API client in the frontend handles this conversion.

---

## Directory Structure

### Frontend (`/frontend`)
```
frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components (auto-generated)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   └── select.tsx
│   │   ├── FormulationForm.tsx    # Main 3-section form component
│   │   └── ResultsCard.tsx        # Displays AI recommendations
│   ├── lib/
│   │   ├── api.ts                 # API client (fetch wrapper)
│   │   ├── utils.ts               # shadcn/ui utility (cn function)
│   │   └── schemas.ts             # Zod validation schemas
│   ├── types/
│   │   └── formulation.ts         # TypeScript interfaces
│   ├── App.tsx                    # Root component
│   ├── main.tsx                   # Entry point
│   └── index.css                  # Tailwind imports
├── .env                           # Environment variables (not committed)
├── .env.example                   # Template for .env
├── .gitignore
├── index.html
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
└── vite.config.ts
```

### Backend (`/backend`)
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app, CORS, routes
│   ├── models.py                  # Pydantic request/response models
│   ├── agent.py                   # LangChain integration
│   └── prompts.py                 # System prompt template
├── .env                           # Environment variables (not committed)
├── .env.example                   # Template for .env
├── .gitignore
├── .python-version                # Python version for uv
├── Dockerfile                     # Railway deployment
├── requirements.txt               # Python dependencies
└── pyproject.toml                 # Project metadata
```

### Repository Root
```
flonp/
├── frontend/                      # React application
├── backend/                       # FastAPI application
├── docs/                          # Documentation (you are here)
│   ├── TECH_STACK.md
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── DEVELOPMENT_SETUP.md
│   └── ...
└── README.md                      # Project overview
```

---

## Key Architectural Decisions

### 1. Monorepo Structure

**Decision:** Keep frontend and backend in the same repository, but in separate directories.

**Rationale:**
- Easier to maintain consistency during development
- Single PR can update both layers if needed
- Separate deployment pipelines (Netlify watches `/frontend`, Railway watches `/backend`)

### 2. Stateless Architecture

**Decision:** No database, no session storage, no persistence.

**Rationale:**
- Simplifies MVP development
- Each request is independent
- Reduces infrastructure cost and complexity
- State management deferred to 3-month plan

### 3. Dual Validation

**Decision:** Validate on both frontend (Zod) and backend (Pydantic).

**Rationale:**
- Frontend validation provides instant user feedback
- Backend validation ensures security (never trust client)
- Schemas are defined separately but must stay in sync

### 4. Separate Deployments

**Decision:** Frontend on Netlify, Backend on Railway.

**Rationale:**
- Each platform optimized for its use case
- Independent scaling
- Frontend can be cached globally on CDN
- Backend benefits from Railway's no-cold-start containers

### 5. AI as Domain Expert

**Decision:** Delegate formulation logic to Claude rather than implementing rules in code.

**Rationale:**
- Faster iteration on recommendations
- Easier to adjust behavior via prompt engineering
- Scientific reasoning provided in natural language
- Reduces need for deep domain expertise in codebase

---

## Communication Patterns

### Frontend → Backend

| Aspect | Detail |
|--------|--------|
| **Protocol** | HTTPS |
| **Method** | POST |
| **Endpoint** | `/optimize` |
| **Content-Type** | `application/json` |
| **Authentication** | None (MVP) |
| **Timeout** | 30 seconds (client-side) |

### Backend → Anthropic

| Aspect | Detail |
|--------|--------|
| **Protocol** | HTTPS |
| **Library** | langchain-anthropic |
| **Model** | claude-3-5-haiku-20241022 |
| **Authentication** | API key in environment variable |
| **Timeout** | 60 seconds (LangChain default) |

---

## Error Boundaries

Each layer has defined error handling responsibilities:

| Layer | Error Type | Handling |
|-------|------------|----------|
| **Frontend** | Validation errors | Display inline field errors |
| **Frontend** | Network errors | Display toast/alert with retry option |
| **Frontend** | API 4xx errors | Parse error message, display to user |
| **Frontend** | API 5xx errors | Display generic "Server error" message |
| **Backend** | Validation errors | Return 422 with field-specific details |
| **Backend** | LLM timeout | Return 504 Gateway Timeout |
| **Backend** | LLM parse error | Retry once with OutputFixingParser, then 500 |
| **Backend** | Unknown errors | Return 500 Internal Server Error |

---

## Scaling Considerations (Future)

While the MVP is stateless and single-instance, the architecture supports future scaling:

| Component | Current | Future Possibility |
|-----------|---------|---------------------|
| Frontend | Single Netlify deploy | Same (CDN handles scale) |
| Backend | Single Railway container | Horizontal scaling via Railway |
| AI | Direct API calls | Queue-based processing for batch operations |
| Data | None | PostgreSQL for persistence |
| Auth | None | JWT tokens or OAuth |
