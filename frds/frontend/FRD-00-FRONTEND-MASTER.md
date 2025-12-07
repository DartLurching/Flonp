# FRD-00: Frontend Master Orchestration

## Purpose

This document controls the execution order for building the FLONP frontend. Complete each phase in order. Do not skip phases. Verify acceptance criteria before proceeding.

---

## Source Documentation

All specifications come from the project documentation in `/docs-source/`:

| Document | Contains |
|----------|----------|
| `TECH_STACK.md` | Package versions, dependencies |
| `API_SPECIFICATION.md` | Request/response schemas, field types |
| `VALIDATION_STRATEGY.md` | Validation rules, constraints, error messages |
| `FRONTEND_ARCHITECTURE.md` | Component structure, file locations, state management |
| `ERROR_HANDLING.md` | Error codes, user messages, timeout values |

**CRITICAL:** Read these documents before implementing. Do not guess versions or values.

---

## Global Rules

1. **NO IMPROVISATION** — Follow the specifications exactly. Do not add features, libraries, or patterns not specified.

2. **NO SKIPPING** — Complete each FRD fully before moving to the next.

3. **READ THE DOCS** — Before each phase, read the referenced source documents to get exact values.

4. **VERIFY BEFORE PROCEEDING** — Run the acceptance tests at the end of each FRD.

5. **EXACT NAMES** — Use the exact field names, file paths, and component names from the docs. Do not rename.

6. **ASK IF UNCLEAR** — If any instruction is ambiguous, stop and ask.

---

## Execution Order

```
F1 (Project Structure + Design System)
    ↓
F2 (Types + Zod Schema)
    ↓
F3 (UI Components)
    ↓
F4 (Form Implementation)
    ↓
F5 (API Client + Results)
    ↓
F6 (Integration Testing)
```

---

## Phase Dependencies

| Phase | Depends On | Creates |
|-------|------------|---------|
| F1 | None | Vite project, Tailwind, design system CSS |
| F2 | F1 | TypeScript types, Zod schema, constants |
| F3 | F1 | shadcn/ui components, styled wrappers |
| F4 | F2, F3 | FormulationForm with validation |
| F5 | F2, F3, F4 | API client, ResultsCard, App assembly |
| F6 | All above | Verification tests |

---

## Working Directory

All commands run from: `frontend/`

---

## File Structure Target

After completing all phases (from `/docs-source/FRONTEND_ARCHITECTURE.md`):

```
src/
├── components/
│   ├── ui/                        # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   └── select.tsx
│   ├── Header.tsx
│   ├── FormulationForm.tsx
│   ├── ResultsCard.tsx
│   ├── LoadingSpinner.tsx
│   └── ErrorDisplay.tsx
├── lib/
│   ├── api.ts
│   ├── utils.ts
│   └── schemas.ts
├── types/
│   └── formulation.ts
├── App.tsx
├── main.tsx
└── index.css
```

---

## Success Criteria

All phases complete when:

1. ✅ `pnpm dev` starts without errors
2. ✅ Form renders with all 7 fields
3. ✅ Validation errors display inline
4. ✅ Submit calls backend API at `POST /optimize`
5. ✅ Results card displays AI response
6. ✅ Loading and error states work
7. ✅ Visual styling matches Lovable reference

---

## Handoff to Agent

```
@frds/frontend/FRD-00-FRONTEND-MASTER.md
@frds/frontend/FRD-F1-PROJECT-STRUCTURE.md
@frds/frontend/FRD-F2-TYPES-SCHEMA.md
@frds/frontend/FRD-F3-UI-COMPONENTS.md
@frds/frontend/FRD-F4-FORM-IMPLEMENTATION.md
@frds/frontend/FRD-F5-API-RESULTS.md
@frds/frontend/FRD-F6-INTEGRATION-TESTING.md

Working directory: frontend/

You are building the FLONP frontend. Follow FRD-00-FRONTEND-MASTER.md as the orchestration controller. 

IMPORTANT: Before each phase, read the source documents in /docs-source/ to get exact versions and values.

Complete each phase in order (F1 → F2 → F3 → F4 → F5 → F6), verify acceptance criteria before proceeding.

Start with FRD-F1.
```
