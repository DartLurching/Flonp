# FLONP — API Specification

## Overview

The FLONP API provides a single endpoint that accepts lipid nanoparticle formulation parameters and returns AI-generated optimization recommendations for microfluidic synthesis.

## Document Metadata

| Attribute | Value |
|-----------|-------|
| **Version** | 1.0.0 |
| **Status** | MVP - Vertical Slice |
| **API Base URL (Dev)** | `http://localhost:8000` |
| **API Base URL (Prod)** | `https://flonp-api.railway.app` |
| **Authentication** | None (MVP) |
| **Content-Type** | `application/json` |

---

### Key Characteristics

- **Stateless**: No session management or data persistence
- **Synchronous**: Request blocks until AI processing completes
- **Single Endpoint**: `POST /optimize`
- **Response Time SLA**: < 5 seconds (95th percentile)
- **Error Format**: Standardized JSON structure across all errors

---

## POST /optimize

**Purpose**: Generate optimized flow parameters and predictions for LNP synthesis based on user-provided formulation inputs.

**Endpoint**: `/optimize`

**Method**: `POST`

**Content-Type**: `application/json`

**Authentication**: None (MVP)

---

### Request Specification

#### Request Headers

**Headers**

| Header | Value | Required |
|--------|-------|----------|
| `Content-Type` | `application/json` | Yes |

#### Request Body

**JSON Schema**
```json
{
  "lipid_composition": "string (enum)",
  "lipid_concentration": "number (float)",
  "solvent_type": "string (literal)",
  "payload_type": "string (enum)",
  "payload_concentration": "number (float)",
  "buffer_type": "string (enum)",
  "target_np_ratio": "integer"
}
```

#### Field Definitions

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `lipid_composition` | `string` | ✅ Yes | `['SM-102', 'DOTAP/Chol', 'Custom']` | Lipid formulation type |
| `lipid_concentration` | `float` | ✅ Yes | `10.0` ≤ value ≤ `50.0` | Lipid concentration in millimolar (mM) |
| `solvent_type` | `string` | ✅ Yes | Must be `'Ethanol 99%'` | Organic solvent (fixed for MVP) |
| `payload_type` | `string` | ✅ Yes | `['mRNA', 'siRNA', 'pDNA', 'Empty']` | Type of nucleic acid payload |
| `payload_concentration` | `float` | ✅ Yes | `0.05` ≤ value ≤ `1.0` | Payload concentration in mg/mL |
| `buffer_type` | `string` | ✅ Yes | `['Citrate pH 4.0', 'Acetate pH 5.0', 'PBS pH 7.4']` | Aqueous phase buffer |
| `target_np_ratio` | `integer` | ✅ Yes | `4` ≤ value ≤ `20` | Target nitrogen-to-phosphate ratio |

#### Pydantic Model Reference (Backend Implementation)

```python
from pydantic import BaseModel, Field
from typing import Literal

class FormulationRequest(BaseModel):
    lipid_composition: Literal['SM-102', 'DOTAP/Chol', 'Custom']
    lipid_concentration: float = Field(ge=10.0, le=50.0)
    solvent_type: Literal['Ethanol 99%']
    payload_type: Literal['mRNA', 'siRNA', 'pDNA', 'Empty']
    payload_concentration: float = Field(ge=0.05, le=1.0)
    buffer_type: Literal['Citrate pH 4.0', 'Acetate pH 5.0', 'PBS pH 7.4']
    target_np_ratio: int = Field(ge=4, le=20)
```

#### TypeScript Types (Frontend Implementation)

**Constants and Types**

```typescript
// Constrained field options — single source of truth
export const LIPID_COMPOSITIONS = ['SM-102', 'DOTAP/Chol', 'Custom'] as const;
export const PAYLOAD_TYPES = ['mRNA', 'siRNA', 'pDNA', 'Empty'] as const;
export const BUFFER_TYPES = ['Citrate pH 4.0', 'Acetate pH 5.0', 'PBS pH 7.4'] as const;
export const SOLVENT_TYPE = 'Ethanol 99%' as const;

// Derived types
export type LipidComposition = typeof LIPID_COMPOSITIONS[number];
export type PayloadType = typeof PAYLOAD_TYPES[number];
export type BufferType = typeof BUFFER_TYPES[number];
```

**Request Interface**

```typescript
export interface FormulationInput {
  lipidComposition: LipidComposition;
  lipidConcentration: number;
  solventType: typeof SOLVENT_TYPE;
  payloadType: PayloadType;
  payloadConcentration: number;
  bufferType: BufferType;
  targetNpRatio: number;
}
```

#### Zod Zod Schema (Frontend Validation)

```typescript
import { z } from 'zod';
import {
  LIPID_COMPOSITIONS,
  PAYLOAD_TYPES,
  BUFFER_TYPES,
  SOLVENT_TYPE,
} from '@/types/formulation';

export const formulationSchema = z.object({
  lipidComposition: z.enum(LIPID_COMPOSITIONS),
  lipidConcentration: z
    .number()
    .min(10.0, 'Lipid concentration must be at least 10.0 mM')
    .max(50.0, 'Lipid concentration must be at most 50.0 mM'),
  solventType: z.literal(SOLVENT_TYPE),
  payloadType: z.enum(PAYLOAD_TYPES),
  payloadConcentration: z
    .number()
    .min(0.05, 'Payload concentration must be at least 0.05 mg/mL')
    .max(1.0, 'Payload concentration must be at most 1.0 mg/mL'),
  bufferType: z.enum(BUFFER_TYPES),
  targetNpRatio: z
    .number()
    .int('N/P ratio must be a whole number')
    .min(4, 'N/P ratio must be at least 4')
    .max(20, 'N/P ratio must be at most 20'),
});

export type FormulationSchema = z.infer<typeof formulationSchema>;
```

---

### Response Specification

#### Success Response (200 OK)

```json
{
  "flow_rate_ratio": "number (float)",
  "total_flow_rate": "number (float)",
  "particle_predicted_size": "number (float)",
  "pdi": "number (float)",
  "encapsulation_efficiency": "number (float)",
  "post_process": "string",
  "reasoning": "string"
}
```

#### Field Definitions

| Field | Type | Unit | Constraints | Description |
|-------|------|------|-------------|-------------|
| `flow_rate_ratio` | `float` | ratio | `1.0` ≤ value ≤ `10.0` | Aqueous-to-organic flow ratio (e.g., `3.0` = "3:1") |
| `total_flow_rate` | `float` | mL/min | `1.0` ≤ value ≤ `30.0` | Combined volumetric flow rate |
| `particle_predicted_size` | `float` | nm | `30.0` ≤ value ≤ `300.0` | Expected hydrodynamic diameter |
| `pdi` | `float` | index | `0.01` ≤ value ≤ `0.50` | Polydispersity index (uniformity) |
| `encapsulation_efficiency` | `float` | % | `50.0` ≤ value ≤ `100.0` | Predicted RNA loading efficiency |
| `post_process` | `string` | text | 50-500 characters | Dialysis/buffer exchange instructions |
| `reasoning` | `string` | text | 100-1000 characters | Scientific justification for parameters |

#### Pydantic Model Reference (Backend Implementation)

```python
from pydantic import BaseModel, Field

class FormulationResponse(BaseModel):
    flow_rate_ratio: float = Field(ge=1.0, le=10.0, description="Aqueous:Organic ratio")
    total_flow_rate: float = Field(ge=1.0, le=30.0, description="Combined flow in mL/min")
    particle_predicted_size: float = Field(ge=30.0, le=300.0, description="Diameter in nm")
    pdi: float = Field(ge=0.01, le=0.50, description="Polydispersity index")
    encapsulation_efficiency: float = Field(ge=50.0, le=100.0, description="Percentage")
    post_process: str = Field(min_length=50, max_length=500)
    reasoning: str = Field(min_length=100, max_length=1000)
```

#### TypeScript Types (Frontend Implementation)

**Response Interface**

```typescript
export interface FormulationResult {
  flowRateRatio: number;
  totalFlowRate: number;
  particlePredictedSize: number;
  pdi: number;
  encapsulationEfficiency: number;
  postProcess: string;
  reasoning: string;
}
```

---

### Error Responses

All error responses follow this standardized structure:

```json
{
  "error": "string (error_code)",
  "message": "string (human-readable)",
  "details": {} // Optional, context-specific
}
```

#### Error Response Table

| Status Code | `error` Code | Condition | `message` Example | `details` Example |
|-------------|--------------|-----------|-------------------|-------------------|
| **400** | `INVALID_REQUEST` | Malformed JSON or missing required fields | `"Request body must be valid JSON"` | `{}` |
| **422** | `VALIDATION_ERROR` | Field value violates constraints | `"Validation failed for one or more fields"` | `{"field": "lipid_concentration", "constraint": "Must be between 10.0 and 50.0", "value": 55.0}` |
| **500** | `AI_PROCESSING_ERROR` | LLM failed to generate valid response | `"AI processing failed. Please try again."` | `{}` |
| **504** | `AI_TIMEOUT` | LLM request exceeded timeout (60s) | `"AI processing timed out. Please try again."` | `{}` |

#### Detailed Error Scenarios

**400 Bad Request**
```json
{
  "error": "INVALID_REQUEST",
  "message": "Request body must be valid JSON",
  "details": {}
}
```

**Trigger**: Client sends malformed JSON or missing `Content-Type: application/json` header.

---

**422 Unprocessable Entity** (Example 1: Out-of-Range Value)
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Validation failed for one or more fields",
  "details": {
    "field": "lipid_concentration",
    "constraint": "Must be between 10.0 and 50.0",
    "value": 55.0
  }
}
```

**Trigger**: `lipid_concentration` is outside valid range.

---

**422 Unprocessable Entity** (Example 2: Invalid Enum)
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Validation failed for one or more fields",
  "details": {
    "field": "buffer_type",
    "constraint": "Must be one of: ['Citrate pH 4.0', 'Acetate pH 5.0', 'PBS pH 7.4']",
    "value": "Tris-HCl pH 8.0"
  }
}
```

**Trigger**: `buffer_type` not in allowed enum values.

---

**500 Internal Server Error**
```json
{
  "error": "AI_PROCESSING_ERROR",
  "message": "AI processing failed. Please try again.",
  "details": {}
}
```

**Trigger**: LLM returns unparseable response after retry with `OutputFixingParser`.

---

**504 Gateway Timeout**
```json
{
  "error": "AI_TIMEOUT",
  "message": "AI processing timed out. Please try again.",
  "details": {}
}
```

**Trigger**: LLM request exceeds 60-second timeout.

---

## GET /health

Health check endpoint for monitoring and deployment verification.

### Request

No body required.

### Response

**Success (200 OK)**
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

---

## Domain Validation Rules

Beyond schema validation, the following domain-specific rules should be applied:

### Input Validation

| Rule ID | Field(s) | Logic | Error Response |
|---------|----------|-------|----------------|
| `DV-001` | `lipid_composition`, `buffer_type` | If `lipid_composition == 'SM-102'` and `buffer_type != 'Citrate pH 4.0'`, log warning (don't block) | None (warning only) |
| `DV-002` | `target_np_ratio` | If `target_np_ratio > 15`, log warning "High N/P may increase cytotoxicity" | None (warning only) |
| `DV-003` | `payload_type` | If `payload_type == 'Empty'`, ensure `payload_concentration == 0.0` | `422` with `details: {"field": "payload_concentration", "constraint": "Must be 0.0 when payload_type is 'Empty'"}` |

### Output Validation

The AI-generated response must satisfy:

| Rule ID | Field | Logic | Action if Violated |
|---------|-------|-------|---------------------|
| `OV-001` | `flow_rate_ratio` | Must be between 1.0 and 10.0 | Retry AI call once; if still invalid, return `500` |
| `OV-002` | `particle_predicted_size` | Target range 50-120 nm for most applications | Log warning if outside; do not block |
| `OV-003` | `pdi` | Should be < 0.3 for acceptable quality | Log warning if > 0.3; do not block |
| `OV-004` | All fields | Must match Pydantic schema exactly | Return `500` with `AI_PROCESSING_ERROR` |

---

## Complete Request/Response Examples

### Example 1: Successful mRNA Formulation

**Request**
```bash
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
```

**Response (200 OK)**
```json
{
  "flow_rate_ratio": 3.0,
  "total_flow_rate": 12.0,
  "particle_predicted_size": 80.0,
  "pdi": 0.15,
  "encapsulation_efficiency": 92.0,
  "post_process": "Dialyze against PBS pH 7.4 for 2 hours to remove ethanol and exchange buffer. Use 100 kDa MWCO dialysis cassette. Final pH should be 7.4.",
  "reasoning": "For SM-102 at pH 4.0 with mRNA, a 3:1 FRR provides optimal ionization for electrostatic complexation. The 12 mL/min TFR ensures rapid mixing (millisecond timescale) which produces uniform 80nm particles. The N/P ratio of 6 balances encapsulation efficiency (~92%) with minimal excess lipid, reducing potential cytotoxicity while maintaining structural integrity."
}
```

---

### Example 2: Validation Error (Out-of-Range Concentration)

**Request**
```bash
curl -X POST http://localhost:8000/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "lipid_composition": "SM-102",
    "lipid_concentration": 55.0,
    "solvent_type": "Ethanol 99%",
    "payload_type": "mRNA",
    "payload_concentration": 0.1,
    "buffer_type": "Citrate pH 4.0",
    "target_np_ratio": 6
  }'
```

**Response (422 Unprocessable Entity)**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Validation failed for one or more fields",
  "details": {
    "field": "lipid_concentration",
    "constraint": "Must be between 10.0 and 50.0",
    "value": 55.0
  }
}
```

---

### Example 3: Invalid Enum Value

**Request**
```bash
curl -X POST http://localhost:8000/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "lipid_composition": "SM-102",
    "lipid_concentration": 12.5,
    "solvent_type": "Ethanol 99%",
    "payload_type": "gRNA",
    "payload_concentration": 0.1,
    "buffer_type": "Citrate pH 4.0",
    "target_np_ratio": 6
  }'
```

**Response (422 Unprocessable Entity)**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Validation failed for one or more fields",
  "details": {
    "field": "payload_type",
    "constraint": "Must be one of: ['mRNA', 'siRNA', 'pDNA', 'Empty']",
    "value": "gRNA"
  }
}
```

---

## Data Types & Enums Reference

### Enums (Exact Values)

**`lipid_composition`**
```python
['SM-102', 'DOTAP/Chol', 'Custom']
```

**`payload_type`**
```python
['mRNA', 'siRNA', 'pDNA', 'Empty']
```

**`buffer_type`**
```python
['Citrate pH 4.0', 'Acetate pH 5.0', 'PBS pH 7.4']
```

**`solvent_type`** (Literal)
```python
'Ethanol 99%'
```

### Numeric Ranges

| Field | Min | Max | Unit |
|-------|-----|-----|------|
| `lipid_concentration` | 10.0 | 50.0 | mM |
| `payload_concentration` | 0.05 | 1.0 | mg/mL |
| `target_np_ratio` | 4 | 20 | ratio |
| `flow_rate_ratio` | 1.0 | 10.0 | ratio |
| `total_flow_rate` | 1.0 | 30.0 | mL/min |
| `particle_predicted_size` | 30.0 | 300.0 | nm |
| `pdi` | 0.01 | 0.50 | index |
| `encapsulation_efficiency` | 50.0 | 100.0 | % |

---

## HTTP Status Codes Reference

| Code | Meaning | When Used |
|------|---------|-----------|
| **200** | OK | Successful AI processing, valid response returned |
| **400** | Bad Request | Malformed JSON or missing Content-Type header |
| **422** | Unprocessable Entity | Valid JSON but field validation failed |
| **500** | Internal Server Error | AI processing failed, unparseable response |
| **504** | Gateway Timeout | AI request exceeded 60-second timeout |

---

## CORS Configuration

**Allowed Origins (Development)**
```
http://localhost:5173
```

**Allowed Origins (Production)**
```
https://flonp.netlify.app
```

**Allowed Methods**
```
POST, OPTIONS
```

**Allowed Headers**
```
Content-Type
```

**Exposed Headers**
```
None
```

**Max Age**
```
3600 seconds (1 hour)
```

### Implementation (FastAPI)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
    max_age=3600,
)
```

---

## Response Time SLA

**Target**: < 5 seconds (95th percentile)

**Measurement Points**:
1. Client sends request
2. Server receives request
3. AI processing completes
4. Server sends response
5. Client receives response

**Total latency breakdown**:
- Network: ~100-300ms
- Validation: ~10-50ms
- AI Processing: ~2-4 seconds
- Response serialization: ~10-50ms

**Monitoring**: Log total request duration for all `/optimize` calls.

---

## Timeout Configuration

| Layer | Timeout | Purpose |
|-------|---------|---------|
| Frontend fetch | 30 seconds | Prevent UI hanging indefinitely |
| Backend → Anthropic | 60 seconds | Allow time for LLM processing |
| Railway container | None | Handled by application timeouts |

### Frontend Timeout Implementation
```typescript
export async function optimizeFormulation(
  input: FormulationInput
): Promise<FormulationResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${API_URL}/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(toSnakeCase(input)),
      signal: controller.signal,
    });

    // ... rest of implementation
  } finally {
    clearTimeout(timeoutId);
  }
}
```

## Rate Limiting (Future Consideration)

**Status**: Not implemented in MVP

**Planned Implementation**:
- **Rate**: 10 requests per minute per IP
- **Burst**: 3 requests in 10 seconds
- **Response**: `429 Too Many Requests`
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

**Error Response (Future)**
```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please try again later.",
  "details": {
    "retry_after": 45
  }
}
```

---

## Glossary

| Term | Definition |
|------|------------|
| **FRR** | Flow Rate Ratio - Aqueous-to-Organic volumetric ratio |
| **TFR** | Total Flow Rate - Combined flow velocity through chip |
| **N/P Ratio** | Nitrogen-to-Phosphate ratio - charge balance between lipid and RNA |
| **PDI** | Polydispersity Index - measure of particle size uniformity (0-1) |
| **EE%** | Encapsulation Efficiency - percentage of RNA loaded into particles |
| **LNP** | Lipid Nanoparticle - spherical vesicle for RNA delivery |
