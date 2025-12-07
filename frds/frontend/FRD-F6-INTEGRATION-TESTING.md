# FRD-F6: Integration Testing

## Phase Overview

| Attribute | Value |
|-----------|-------|
| **Phase** | F6 |
| **Depends On** | F1, F2, F3, F4, F5 (All previous phases) |
| **Blocks** | None (Final phase) |
| **Estimated Time** | 20 minutes |

---

## Objective

Verify the complete frontend works correctly, both in isolation and with the backend API.

---

## Source Documentation

**READ THESE FILES for test specifications:**

| Document | Path | What to Verify |
|----------|------|----------------|
| API Specification | `docs-source/API_SPECIFICATION.md` | Request/response formats, error codes, example payloads |
| Validation Strategy | `docs-source/VALIDATION_STRATEGY.md` | Field constraints, error messages |
| Error Handling | `docs-source/ERROR_HANDLING.md` | Error codes, user messages |
| Frontend Architecture | `docs-source/FRONTEND_ARCHITECTURE.md` | Component behavior, state management |

---

## Prerequisites

1. Frontend running: `pnpm dev` (port 5173)
2. Backend running: `cd ../backend && uv run uvicorn app.main:app --reload` (port 8000)
3. Valid `ANTHROPIC_API_KEY` in backend `.env`

---

## Test Categories

| Category | Backend Required? |
|----------|-------------------|
| A: Visual Verification | No |
| B: Functional Verification | No |
| C: End-to-End Testing | Yes |

---

## Category A: Visual Verification

Open `http://localhost:5173` and verify each element:

### A1: Header

| Check | Expected | Pass? |
|-------|----------|-------|
| Logo icon | Teal gradient background, white Atom icon | ☐ |
| Title | "FLONP" in bold | ☐ |
| Subtitle | "Flow-Optimized Nanoparticle Protocol" in muted text | ☐ |
| Sticky behavior | Header stays at top when scrolling | ☐ |

### A2: Hero Section

| Check | Expected | Pass? |
|-------|----------|-------|
| Title | "LNP Formulation Optimizer" centered | ☐ |
| Description | Two lines of muted text about AI-powered recommendations | ☐ |
| Animation | Fade-in on page load | ☐ |

### A3: Form Sections

Reference: `docs-source/FRONTEND_ARCHITECTURE.md` → Component Tree

| Check | Expected | Pass? |
|-------|----------|-------|
| Lipid Formulation section | Beaker icon in teal gradient box | ☐ |
| Payload section | DNA icon in teal gradient box | ☐ |
| Target Parameters section | Target icon in teal gradient box | ☐ |
| Left accent bars | Teal gradient on all three sections | ☐ |
| Section titles | Bold, with muted descriptions | ☐ |
| Staggered animation | Sections fade in with delay | ☐ |

### A4: Form Fields

Reference: `docs-source/FRONTEND_ARCHITECTURE.md` → Form Fields table

| Check | Expected | Pass? |
|-------|----------|-------|
| All 7 fields present | Lipid Composition, Lipid Concentration, Solvent Type, Payload Type, Payload Concentration, Buffer Type, N/P Ratio | ☐ |
| Labels | Above each input, muted text | ☐ |
| Units displayed | "mM" for Lipid Concentration, "mg/mL" for Payload Concentration | ☐ |
| Solvent field | Disabled, shows "Ethanol 99%" | ☐ |
| Focus ring | Teal ring on input focus | ☐ |

### A5: Submit Button

| Check | Expected | Pass? |
|-------|----------|-------|
| Default state | "Calculate Optimal Parameters" | ☐ |
| Full width | Spans the section width | ☐ |
| Teal background | Matches primary color | ☐ |

### A6: Empty State (Right Column)

| Check | Expected | Pass? |
|-------|----------|-------|
| Dashed border | Gray dashed border | ☐ |
| Icon | Beaker in muted circle | ☐ |
| Title | "Ready to Optimize" | ☐ |
| Description | Instruction text | ☐ |

### A7: Background

| Check | Expected | Pass? |
|-------|----------|-------|
| Gradient | Light gray gradient (top to bottom) | ☐ |
| Molecular pattern | Subtle teal radial gradients | ☐ |

### A8: Footer

| Check | Expected | Pass? |
|-------|----------|-------|
| Border top | Light gray border | ☐ |
| Copyright | "© 2024 FLONP. For research use only." | ☐ |
| Version | "v1.0.0-beta" in monospace | ☐ |

---

## Category B: Functional Verification

### B1: Form Validation

Reference: `docs-source/VALIDATION_STRATEGY.md` → Request Field Constraints

| Test | Field | Input | Expected Error | Pass? |
|------|-------|-------|----------------|-------|
| Min lipid concentration | `lipidConcentration` | `5` | Error about minimum 10.0 | ☐ |
| Max lipid concentration | `lipidConcentration` | `60` | Error about maximum 50.0 | ☐ |
| Min payload concentration | `payloadConcentration` | `-0.1` | Error about minimum 0.0 | ☐ |
| Max payload concentration | `payloadConcentration` | `1.5` | Error about maximum 1.0 | ☐ |
| Min N/P ratio | `targetNpRatio` | `2` | Error about minimum 4 | ☐ |
| Max N/P ratio | `targetNpRatio` | `25` | Error about maximum 20 | ☐ |
| N/P integer check | `targetNpRatio` | `4.5` | Error about whole number | ☐ |

### B2: Dropdown Options

Reference: `docs-source/API_SPECIFICATION.md` → Data Types & Enums Reference

| Dropdown | Expected Options | Pass? |
|----------|------------------|-------|
| Lipid Composition | `SM-102`, `DOTAP/Chol`, `Custom` | ☐ |
| Payload Type | `mRNA`, `siRNA`, `pDNA`, `Empty` | ☐ |
| Buffer Type | `Citrate pH 4.0`, `Acetate pH 5.0`, `PBS pH 7.4` | ☐ |

### B3: Error Message Styling

| Check | Expected | Pass? |
|-------|----------|-------|
| Color | Red text (destructive color) | ☐ |
| Animation | Slides in | ☐ |
| Position | Below the field | ☐ |
| Size | Small text | ☐ |

### B4: Form Submission (Mock Mode)

To test without backend, temporarily add mock in `handleSubmit`:

```typescript
// Use example response from docs-source/API_SPECIFICATION.md → Complete Request/Response Examples
setResult({
  flowRateRatio: 3.0,
  totalFlowRate: 12.0,
  particlePredictedSize: 80.0,
  pdi: 0.15,
  encapsulationEfficiency: 92.0,
  postProcess: 'Dialyze against PBS pH 7.4 for 2 hours to remove ethanol and exchange buffer. Use 100 kDa MWCO dialysis cassette. Final pH should be 7.4.',
  reasoning: 'For SM-102 at pH 4.0 with mRNA, a 3:1 FRR provides optimal ionization for electrostatic complexation. The 12 mL/min TFR ensures rapid mixing (millisecond timescale) which produces uniform 80nm particles. The N/P ratio of 6 balances encapsulation efficiency (~92%) with minimal excess lipid, reducing potential cytotoxicity while maintaining structural integrity.',
});
```

| Test | Steps | Expected | Pass? |
|------|-------|----------|-------|
| Loading state | Click submit | Button shows "Optimizing..." with spinner | ☐ |
| Button disabled | During loading | Button is not clickable | ☐ |
| Results appear | After loading | ResultsCard replaces EmptyState | ☐ |

### B5: ResultsCard Display

Reference: `docs-source/FRONTEND_ARCHITECTURE.md` → Component: ResultsCard.tsx → Display Sections

| Check | Expected | Pass? |
|-------|----------|-------|
| Header | Teal gradient with "Optimization Results" | ☐ |
| Flow Rate Ratio | Formatted as "X:1" (e.g., "3:1") | ☐ |
| Total Flow Rate | With "mL/min" unit | ☐ |
| Predicted Size | With "nm" unit | ☐ |
| PDI | Decimal value, no unit | ☐ |
| Encapsulation bar | Progress bar filled to percentage | ☐ |
| Post-process | Monospace font in sunken box | ☐ |
| Reasoning | With Info icon | ☐ |

---

## Category C: End-to-End Testing

**Prerequisite:** Backend must be running at `http://localhost:8000`

### C1: Health Check

```bash
curl http://localhost:8000/health
```

Expected response from `docs-source/API_SPECIFICATION.md` → GET /health:
```json
{"status":"healthy","version":"1.0.0"}
```

### C2: Valid Form Submission

Reference: `docs-source/API_SPECIFICATION.md` → Complete Request/Response Examples → Example 1

| Test | Steps | Expected | Pass? |
|------|-------|----------|-------|
| Submit valid form | Use default values, click submit | AI response appears in ResultsCard | ☐ |
| Response time | Observe | < 5 seconds (per SLA in docs) | ☐ |
| All fields populated | Check ResultsCard | All 7 fields have values | ☐ |

### C3: Network DevTools Verification

Open DevTools → Network tab, submit form, verify:

| Check | Expected | Pass? |
|-------|----------|-------|
| Request URL | `http://localhost:8000/optimize` | ☐ |
| Request method | `POST` | ☐ |
| Content-Type header | `application/json` | ☐ |
| Request body format | snake_case field names | ☐ |
| Response status | `200 OK` | ☐ |

### C4: Request Body Verification

Reference: `docs-source/API_SPECIFICATION.md` → Request Body → JSON Schema

Verify request body uses exact snake_case field names:

```json
{
  "lipid_composition": "SM-102",
  "lipid_concentration": 12.5,
  "solvent_type": "Ethanol 99%",
  "payload_type": "mRNA",
  "payload_concentration": 0.1,
  "buffer_type": "Citrate pH 4.0",
  "target_np_ratio": 6
}
```

| Check | Pass? |
|-------|-------|
| All 7 fields present in request | ☐ |
| Field names are snake_case | ☐ |
| Values match form inputs | ☐ |

### C5: Error Handling

Reference: `docs-source/ERROR_HANDLING.md` → User-Facing Messages

| Test | How to Trigger | Expected Message | Pass? |
|------|----------------|------------------|-------|
| Backend down | Stop backend, submit | "Unable to connect to server." | ☐ |
| Dismiss error | Click X on error | Error disappears | ☐ |

---

## Troubleshooting Guide

### Issue: Page is blank

| Check | Fix |
|-------|-----|
| Console errors | Check DevTools Console for errors |
| Import errors | Verify all `@/` imports resolve correctly |
| CSS not loading | Check `index.css` is imported in `main.tsx` |

### Issue: Styles look wrong

| Check | Fix |
|-------|-----|
| Tailwind not applied | Run `pnpm dev` to ensure Tailwind compiles |
| CSS variables missing | Check `:root` in `index.css` |
| Font not loading | Check Google Fonts import in `index.css` |

### Issue: Dropdowns don't work

| Check | Fix |
|-------|-----|
| Select component | Verify shadcn/ui select installed |
| Controller wrapper | Dropdowns need `Controller` from react-hook-form |

### Issue: Form doesn't submit

| Check | Fix |
|-------|-----|
| Validation errors | Check console for validation issues |
| handleSubmit | Ensure `zodResolver` is configured |

### Issue: API calls fail

| Check | Fix |
|-------|-----|
| VITE_API_URL | Check `.env` file has correct URL |
| CORS | Check backend `ALLOWED_ORIGINS` includes `http://localhost:5173` |
| Backend running | Verify backend is on port 8000 |

### Issue: Results don't display

| Check | Fix |
|-------|-----|
| Response parsing | Check `toCamelCase` function |
| State update | Verify `setResult` is called |
| ResultsCard import | Check import path |

---

## Final Checklist

### All Tests Passing?

| Category | Status |
|----------|--------|
| A: Visual Verification | ☐ All pass |
| B: Functional Verification | ☐ All pass |
| C: End-to-End Testing | ☐ All pass |

### Files Created in All Phases

Reference: `docs-source/FRONTEND_ARCHITECTURE.md` → Directory Structure

| File | Exists? |
|------|---------|
| `tailwind.config.js` | ☐ |
| `src/index.css` | ☐ |
| `src/lib/utils.ts` | ☐ |
| `src/lib/schemas.ts` | ☐ |
| `src/lib/api.ts` | ☐ |
| `src/types/formulation.ts` | ☐ |
| `src/components/ui/button.tsx` | ☐ |
| `src/components/ui/card.tsx` | ☐ |
| `src/components/ui/input.tsx` | ☐ |
| `src/components/ui/label.tsx` | ☐ |
| `src/components/ui/select.tsx` | ☐ |
| `src/components/FormField.tsx` | ☐ |
| `src/components/FormSection.tsx` | ☐ |
| `src/components/FormulationForm.tsx` | ☐ |
| `src/components/ResultsCard.tsx` | ☐ |
| `src/components/Header.tsx` | ☐ |
| `src/components/LoadingSpinner.tsx` | ☐ |
| `src/components/ErrorDisplay.tsx` | ☐ |
| `src/components/EmptyState.tsx` | ☐ |
| `src/App.tsx` | ☐ |
| `src/main.tsx` | ☐ |
| `.env` | ☐ |
| `.env.example` | ☐ |

---

## Success Criteria

Frontend build complete when:

1. ✅ `pnpm dev` starts without errors
2. ✅ All visual elements match Lovable reference
3. ✅ Form validation works for all fields per `docs-source/VALIDATION_STRATEGY.md`
4. ✅ API integration works with backend
5. ✅ Results display correctly per `docs-source/FRONTEND_ARCHITECTURE.md`
6. ✅ Error handling works per `docs-source/ERROR_HANDLING.md`
7. ✅ No TypeScript errors (`pnpm tsc --noEmit`)
8. ✅ Build succeeds (`pnpm build`)

---

## Build Verification

```bash
# Final build test
pnpm build
```

Expected: Build completes without errors, creates `dist/` folder.

---

## Deployment Preparation

If all tests pass, the frontend is ready for deployment:

1. Set production environment variable:
   ```
   VITE_API_URL=https://flonp-api.railway.app
   ```
   (URL from `docs-source/API_SPECIFICATION.md` → Document Metadata → API Base URL (Prod))

2. Build for production:
   ```bash
   pnpm build
   ```

3. Deploy `dist/` folder to Netlify

---

## Phase Complete

All frontend phases (F1-F6) are complete. The FLONP frontend is ready for integration with the backend.
