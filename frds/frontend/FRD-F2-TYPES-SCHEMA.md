# FRD-F2: Types + Zod Schema

## Phase Overview

| Attribute | Value |
|-----------|-------|
| **Phase** | F2 |
| **Depends On** | F1 |
| **Blocks** | F4, F5 |

---

## Objective

Create TypeScript types, constants, and Zod validation schema that match the backend API contract.

---

## Source Documents to Read First

| Document | What to Extract |
|----------|-----------------|
| `/docs-source/API_SPECIFICATION.md` | Enum values, field types, response schema |
| `/docs-source/VALIDATION_STRATEGY.md` | **Validation constraints** (source of truth for min/max values) |

**CRITICAL:** Use constraints from VALIDATION_STRATEGY.md, not API_SPECIFICATION.md. The validation strategy has the authoritative rules.

---

## Verified Constraints (from VALIDATION_STRATEGY.md)

### Request Fields

| Field | Type | Constraints |
|-------|------|-------------|
| `lipid_composition` | enum | `SM-102`, `DOTAP/Chol`, `Custom` |
| `lipid_concentration` | float | 10.0 ≤ value ≤ 50.0 |
| `solvent_type` | literal | `Ethanol 99%` |
| `payload_type` | enum | `mRNA`, `siRNA`, `pDNA`, `Empty` |
| `payload_concentration` | float | **0.0** ≤ value ≤ 1.0 |
| `buffer_type` | enum | `Citrate pH 4.0`, `Acetate pH 5.0`, `PBS pH 7.4` |
| `target_np_ratio` | integer | 4 ≤ value ≤ 20 |

> **Note:** `payload_concentration` allows 0.0 to support control experiments when `payload_type` is `Empty`.

### Response Fields

| Field | Type | Constraints |
|-------|------|-------------|
| `flow_rate_ratio` | float | 1.0 ≤ value ≤ 10.0 |
| `total_flow_rate` | float | 1.0 ≤ value ≤ 30.0 |
| `particle_predicted_size` | float | 30.0 ≤ value ≤ 300.0 |
| `pdi` | float | 0.01 ≤ value ≤ 0.50 |
| `encapsulation_efficiency` | float | 50.0 ≤ value ≤ 100.0 |
| `post_process` | string | Non-empty |
| `reasoning` | string | Non-empty |

---

## Tasks

### Task 2.1: Create Type Constants and Interfaces

**File: `src/types/formulation.ts`**

```typescript
// =============================================================================
// CONSTANTS — Single source of truth for dropdown options
// Values from /docs-source/API_SPECIFICATION.md
// =============================================================================

export const LIPID_COMPOSITIONS = ['SM-102', 'DOTAP/Chol', 'Custom'] as const;
export const PAYLOAD_TYPES = ['mRNA', 'siRNA', 'pDNA', 'Empty'] as const;
export const BUFFER_TYPES = ['Citrate pH 4.0', 'Acetate pH 5.0', 'PBS pH 7.4'] as const;
export const SOLVENT_TYPE = 'Ethanol 99%' as const;

// =============================================================================
// DERIVED TYPES
// =============================================================================

export type LipidComposition = typeof LIPID_COMPOSITIONS[number];
export type PayloadType = typeof PAYLOAD_TYPES[number];
export type BufferType = typeof BUFFER_TYPES[number];

// =============================================================================
// REQUEST INTERFACE (Frontend → Backend)
// Field names in camelCase for frontend
// =============================================================================

export interface FormulationInput {
  lipidComposition: LipidComposition;
  lipidConcentration: number;
  solventType: typeof SOLVENT_TYPE;
  payloadType: PayloadType;
  payloadConcentration: number;
  bufferType: BufferType;
  targetNpRatio: number;
}

// =============================================================================
// RESPONSE INTERFACE (Backend → Frontend)
// Field names in camelCase for frontend
// =============================================================================

export interface FormulationResult {
  flowRateRatio: number;
  totalFlowRate: number;
  particlePredictedSize: number;
  pdi: number;
  encapsulationEfficiency: number;
  postProcess: string;
  reasoning: string;
}

// =============================================================================
// ERROR INTERFACE
// From /docs-source/ERROR_HANDLING.md
// =============================================================================

export interface ApiError {
  error: string;
  message: string;
  details?: {
    field?: string;
    constraint?: string;
    value?: unknown;
  };
}
```

### Task 2.2: Create Zod Schema

**File: `src/lib/schemas.ts`**

```typescript
import { z } from 'zod';
import {
  LIPID_COMPOSITIONS,
  PAYLOAD_TYPES,
  BUFFER_TYPES,
  SOLVENT_TYPE,
} from '@/types/formulation';

// =============================================================================
// FORMULATION INPUT SCHEMA
// Constraints from /docs-source/VALIDATION_STRATEGY.md
// =============================================================================

export const formulationSchema = z.object({
  lipidComposition: z.enum(LIPID_COMPOSITIONS, {
    required_error: 'Lipid composition is required',
  }),

  lipidConcentration: z
    .number({
      required_error: 'Lipid concentration is required',
      invalid_type_error: 'Must be a number',
    })
    .min(10.0, 'Must be at least 10.0 mM')
    .max(50.0, 'Must be at most 50.0 mM'),

  solventType: z.literal(SOLVENT_TYPE),

  payloadType: z.enum(PAYLOAD_TYPES, {
    required_error: 'Payload type is required',
  }),

  // NOTE: Min is 0.0 (not 0.05) to support control experiments with Empty payload
  payloadConcentration: z
    .number({
      required_error: 'Payload concentration is required',
      invalid_type_error: 'Must be a number',
    })
    .min(0.0, 'Must be at least 0.0 mg/mL')
    .max(1.0, 'Must be at most 1.0 mg/mL'),

  bufferType: z.enum(BUFFER_TYPES, {
    required_error: 'Buffer type is required',
  }),

  targetNpRatio: z
    .number({
      required_error: 'N/P ratio is required',
      invalid_type_error: 'Must be a number',
    })
    .int('Must be a whole number')
    .min(4, 'Must be at least 4')
    .max(20, 'Must be at most 20'),
});

// =============================================================================
// INFERRED TYPE — Use this for React Hook Form
// =============================================================================

export type FormulationSchemaType = z.infer<typeof formulationSchema>;

// =============================================================================
// DEFAULT VALUES — For form initialization
// =============================================================================

export const defaultFormValues: FormulationSchemaType = {
  lipidComposition: 'SM-102',
  lipidConcentration: 12.5,
  solventType: SOLVENT_TYPE,
  payloadType: 'mRNA',
  payloadConcentration: 0.1,
  bufferType: 'Citrate pH 4.0',
  targetNpRatio: 6,
};
```

---

## Verification

### Test 1: Types compile

```bash
pnpm tsc --noEmit
```

Expected: No errors

### Test 2: Schema validates correct data

Temporarily add to `src/App.tsx`:

```tsx
import { formulationSchema, defaultFormValues } from '@/lib/schemas';

function App() {
  const result = formulationSchema.safeParse(defaultFormValues);
  console.log('Valid:', result.success);
  
  return (
    <div className="min-h-screen gradient-surface molecular-pattern p-8">
      <h1 className="text-3xl font-bold">FLONP</h1>
      <p>Schema validation: {result.success ? '✅ Pass' : '❌ Fail'}</p>
    </div>
  );
}

export default App;
```

### Test 3: Schema rejects invalid values

Test in browser console:

```javascript
// Out of range
formulationSchema.safeParse({...defaultFormValues, lipidConcentration: 999})
// → success: false, error message about 50.0

// Negative payload (edge case)
formulationSchema.safeParse({...defaultFormValues, payloadConcentration: -0.1})
// → success: false

// Zero payload (should pass - control experiment)
formulationSchema.safeParse({...defaultFormValues, payloadConcentration: 0.0})
// → success: true
```

---

## Acceptance Criteria

- [ ] `pnpm tsc --noEmit` passes
- [ ] `formulationSchema.safeParse(defaultFormValues)` returns `{ success: true }`
- [ ] `payloadConcentration: 0.0` is accepted (control experiment case)
- [ ] Invalid values produce correct error messages
- [ ] All constants export correctly
- [ ] Types importable via `@/types/formulation`

---

## Next Phase

Proceed to **FRD-F3: UI Components**
