# FRD-F5: API Client + Results

## Phase Overview

| Attribute | Value |
|-----------|-------|
| **Phase** | F5 |
| **Depends On** | F2 (Types), F3 (UI), F4 (Form) |
| **Blocks** | F6 |
| **Estimated Time** | 25 minutes |

---

## Objective

Create the API client for backend communication and the `ResultsCard` component to display AI-generated recommendations.

---

## Source Documentation

**READ THESE FILES for exact specifications:**

| Document | Path | What to Extract |
|----------|------|-----------------|
| API Specification | `docs-source/API_SPECIFICATION.md` | Endpoint URL, request/response formats, error codes, timeout values |
| Error Handling | `docs-source/ERROR_HANDLING.md` | Error codes, user-facing messages, error response format |
| Frontend Architecture | `docs-source/FRONTEND_ARCHITECTURE.md` | API client responsibilities, ResultsCard sections |

---

## Tasks

### Task 5.1: Create API Client

**File:** `src/lib/api.ts`

**Instructions:**

1. Read `docs-source/API_SPECIFICATION.md` sections:
   - "Document Metadata" for API Base URL (Dev): `http://localhost:8000`
   - "Timeout Configuration" for Frontend fetch timeout: `30 seconds`
   - "Request Specification" for endpoint path: `/optimize`
   - "Response Specification" for success response structure
   - "Error Responses" for error format: `{ error, message, details }`

2. Read `docs-source/ERROR_HANDLING.md` section "User-Facing Messages" for error message mapping

3. Implement the following:

```typescript
import { FormulationResult, ApiError } from '@/types/formulation';
import { FormulationSchemaType } from '@/lib/schemas';

// =============================================================================
// CONFIGURATION
// Read from docs-source/API_SPECIFICATION.md → Document Metadata
// =============================================================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Read from docs-source/API_SPECIFICATION.md → Timeout Configuration
// Frontend fetch timeout: 30 seconds
const TIMEOUT_MS = 30000;

// =============================================================================
// CASE CONVERSION UTILITIES
// Frontend uses camelCase, Backend uses snake_case
// =============================================================================

/**
 * Convert camelCase to snake_case for API request
 */
function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = obj[key];
  }
  return result;
}

/**
 * Convert snake_case to camelCase for API response
 */
function toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

// =============================================================================
// ERROR HANDLING
// Error codes from docs-source/ERROR_HANDLING.md
// =============================================================================

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public errorCode?: string,
    public details?: ApiError['details']
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

/**
 * Parse error response from API
 * Error format from docs-source/API_SPECIFICATION.md → Error Responses
 */
async function handleErrorResponse(response: Response): Promise<never> {
  let errorData: ApiError;
  
  try {
    errorData = await response.json();
  } catch {
    throw new ApiRequestError(
      'Unable to connect to server',
      response.status
    );
  }

  // Use message from API response
  const message = errorData.message || 'An error occurred';
  throw new ApiRequestError(
    message,
    response.status,
    errorData.error,
    errorData.details
  );
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Call POST /optimize endpoint
 * Endpoint spec from docs-source/API_SPECIFICATION.md → POST /optimize
 */
export async function optimizeFormulation(
  input: FormulationSchemaType
): Promise<FormulationResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // Convert camelCase to snake_case for backend
    const requestBody = toSnakeCase(input as unknown as Record<string, unknown>);

    const response = await fetch(`${API_URL}/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    if (!response.ok) {
      await handleErrorResponse(response);
    }

    const data = await response.json();
    
    // Convert snake_case to camelCase for frontend
    return toCamelCase(data) as unknown as FormulationResult;

  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }
    
    if (error instanceof Error) {
      // AbortError = timeout
      // Message from docs-source/ERROR_HANDLING.md → User-Facing Messages
      if (error.name === 'AbortError') {
        throw new ApiRequestError(
          'Request timed out. Please try again.',
          408
        );
      }
      
      // Network error
      // Message from docs-source/ERROR_HANDLING.md → User-Facing Messages
      throw new ApiRequestError(
        'Unable to connect to server.',
        0
      );
    }
    
    throw new ApiRequestError('An unexpected error occurred', 500);
    
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Check API health
 * Endpoint spec from docs-source/API_SPECIFICATION.md → GET /health
 */
export async function checkHealth(): Promise<{ status: string; version: string }> {
  const response = await fetch(`${API_URL}/health`);
  
  if (!response.ok) {
    throw new Error('Health check failed');
  }
  
  return response.json();
}
```

---

### Task 5.2: Create ResultsCard Component

**File:** `src/components/ResultsCard.tsx`

**Instructions:**

1. Read `docs-source/FRONTEND_ARCHITECTURE.md` section "Component: ResultsCard.tsx" for:
   - Props interface
   - Display sections structure

2. Read `docs-source/API_SPECIFICATION.md` section "Response Specification → Field Definitions" for:
   - Field names (camelCase in frontend)
   - Units for each field
   - Value formatting requirements

3. Use the Lovable styling patterns from F3 (gradient header, result items, etc.)

```tsx
import { FormulationResult } from '@/types/formulation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Beaker, Activity, Droplets, FlaskConical, Info } from 'lucide-react';

interface ResultsCardProps {
  result: FormulationResult;
}

interface ResultItemProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  highlight?: boolean;
}

function ResultItem({ label, value, unit, icon, highlight }: ResultItemProps) {
  return (
    <div className={`flex items-center gap-3 p-4 rounded-lg transition-all duration-200 ${
      highlight ? 'bg-accent/50 border border-accent-foreground/10' : 'bg-muted/50'
    }`}>
      <div className="flex-shrink-0 w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <p className="text-lg font-semibold font-mono text-value truncate">
          {typeof value === 'number' ? value.toFixed(2) : value}
          {unit && (
            <span className="text-sm font-normal text-muted-foreground ml-1">
              {unit}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

/**
 * ResultsCard displays AI-generated formulation recommendations
 * 
 * Display sections from docs-source/FRONTEND_ARCHITECTURE.md:
 * - Flow Parameters: flowRateRatio (formatted as "X:1"), totalFlowRate (mL/min)
 * - Predicted Characteristics: particlePredictedSize (nm), pdi, encapsulationEfficiency (%)
 * - Post-Processing Instructions: postProcess
 * - Scientific Reasoning: reasoning
 */
export function ResultsCard({ result }: ResultsCardProps) {
  return (
    <Card className="shadow-elevated animate-fade-in overflow-hidden">
      <CardHeader className="gradient-header text-primary-foreground pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <FlaskConical className="w-5 h-5" />
          Optimization Results
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Primary Results Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Flow Rate Ratio - formatted as "X:1" per docs */}
          <ResultItem
            label="Flow Rate Ratio"
            value={`${result.flowRateRatio}:1`}
            icon={<Droplets className="w-4 h-4" />}
            highlight
          />
          {/* Total Flow Rate - unit: mL/min per docs */}
          <ResultItem
            label="Total Flow Rate"
            value={result.totalFlowRate}
            unit="mL/min"
            icon={<Activity className="w-4 h-4" />}
            highlight
          />
          {/* Particle Size - unit: nm per docs */}
          <ResultItem
            label="Predicted Size"
            value={result.particlePredictedSize}
            unit="nm"
            icon={<Beaker className="w-4 h-4" />}
          />
          {/* PDI - no unit, index value per docs */}
          <ResultItem
            label="PDI"
            value={result.pdi}
            icon={<Activity className="w-4 h-4" />}
          />
        </div>

        {/* Encapsulation Efficiency - unit: % per docs */}
        <div className="p-4 rounded-lg bg-accent/30 border border-accent-foreground/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Encapsulation Efficiency
            </span>
            <span className="text-2xl font-bold font-mono text-primary">
              {result.encapsulationEfficiency.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className="h-full gradient-header rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.min(result.encapsulationEfficiency, 100)}%` }}
            />
          </div>
        </div>

        {/* Post-Process Recommendation */}
        <div className="p-4 rounded-lg bg-surface-sunken border border-border">
          <h4 className="text-sm font-semibold text-foreground mb-2">
            Post-Process Recommendation
          </h4>
          <p className="text-sm text-muted-foreground font-mono">
            {result.postProcess}
          </p>
        </div>

        {/* AI Reasoning */}
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-start gap-2 mb-2">
            <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <h4 className="text-sm font-semibold text-foreground">
              Scientific Reasoning
            </h4>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed pl-6">
            {result.reasoning}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### Task 5.3: Update App.tsx with Full Integration

**File:** `src/App.tsx`

**Instructions:**

1. Read `docs-source/FRONTEND_ARCHITECTURE.md` section "State Management" for:
   - State variables: `result`, `error`, `isLoading`
   - State types and initial values

2. Read `docs-source/FRONTEND_ARCHITECTURE.md` section "App.tsx" for:
   - Component behavior
   - How to handle submit, errors, and results

```tsx
import { useState } from 'react';
import { Header } from '@/components/Header';
import { FormulationForm } from '@/components/FormulationForm';
import { ResultsCard } from '@/components/ResultsCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { optimizeFormulation, ApiRequestError } from '@/lib/api';
import { FormulationSchemaType } from '@/lib/schemas';
import { FormulationResult } from '@/types/formulation';

/**
 * Root component - orchestrates application state and layout
 * State management from docs-source/FRONTEND_ARCHITECTURE.md
 */
function App() {
  // State from docs-source/FRONTEND_ARCHITECTURE.md → State Management
  const [result, setResult] = useState<FormulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handle form submission
   * Behavior from docs-source/FRONTEND_ARCHITECTURE.md → App.tsx → Behavior
   */
  const handleSubmit = async (data: FormulationSchemaType) => {
    // Clear previous result/error when new submission starts
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await optimizeFormulation(data);
      setResult(response);
    } catch (err) {
      // Catch API errors and set appropriate error message
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-surface molecular-pattern">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-10 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            LNP Formulation Optimizer
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            AI-powered flow parameter recommendations for lipid nanoparticle synthesis. 
            Configure your formulation and receive optimized microfluidic settings.
          </p>
        </div>

        {/* Error Display - shown when error state is not null */}
        {error && (
          <div className="max-w-6xl mx-auto mb-6">
            <ErrorDisplay message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        {/* Form with Results slot */}
        <FormulationForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          result={result}
        >
          {result ? (
            <ResultsCard result={result} />
          ) : (
            <EmptyState />
          )}
        </FormulationForm>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2024 FLONP. For research use only.</p>
            <p className="font-mono text-xs">v1.0.0-beta</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
```

---

### Task 5.4: Update main.tsx

**File:** `src/main.tsx`

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

---

## Verification

### Test 1: TypeScript compiles

```bash
pnpm tsc --noEmit
```

Expected: No errors

### Test 2: ResultsCard renders with mock data

Temporarily add mock to `handleSubmit` in App.tsx:

```typescript
const handleSubmit = async (data: FormulationSchemaType) => {
  setIsLoading(true);
  setError(null);
  
  // Mock for testing without backend
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Example response from docs-source/API_SPECIFICATION.md
  setResult({
    flowRateRatio: 3.0,
    totalFlowRate: 12.0,
    particlePredictedSize: 80.0,
    pdi: 0.15,
    encapsulationEfficiency: 92.0,
    postProcess: 'Dialyze against PBS pH 7.4 for 2 hours to remove ethanol and exchange buffer. Use 100 kDa MWCO dialysis cassette. Final pH should be 7.4.',
    reasoning: 'For SM-102 at pH 4.0 with mRNA, a 3:1 FRR provides optimal ionization for electrostatic complexation. The 12 mL/min TFR ensures rapid mixing (millisecond timescale) which produces uniform 80nm particles.',
  });
  
  setIsLoading(false);
};
```

Verify in browser:
- [ ] ResultsCard has teal gradient header with "Optimization Results"
- [ ] Flow Rate Ratio shows "3.00:1"
- [ ] Total Flow Rate shows "12.00 mL/min"
- [ ] Predicted Size shows "80.00 nm"
- [ ] PDI shows "0.15"
- [ ] Encapsulation Efficiency shows "92.0%" with progress bar at ~92%
- [ ] Post-Process section shows full text in monospace
- [ ] Scientific Reasoning section shows text with info icon

### Test 3: Error handling works

Modify to simulate error:

```typescript
const handleSubmit = async () => {
  setIsLoading(true);
  setError(null);
  await new Promise(resolve => setTimeout(resolve, 500));
  setError('Unable to connect to server.');
  setIsLoading(false);
};
```

Verify:
- [ ] Error displays in red box above form
- [ ] Dismiss button (X) removes error when clicked

### Test 4: With real backend (if available)

1. Start backend: `cd ../backend && uv run uvicorn app.main:app --reload`
2. Submit form with valid values
3. Verify real AI response displays in ResultsCard

---

## Acceptance Criteria

- [ ] API client handles successful responses (200)
- [ ] API client handles error responses (400, 422, 500, 504)
- [ ] API client handles network errors
- [ ] API client handles timeout (30 seconds)
- [ ] Case conversion works correctly (camelCase ↔ snake_case)
- [ ] ResultsCard displays all 7 response fields with correct formatting
- [ ] Progress bar width matches encapsulation efficiency percentage
- [ ] Styling matches Lovable reference
- [ ] No TypeScript errors

---

## Files Created

| File | Purpose |
|------|---------|
| `src/lib/api.ts` | API client with error handling |
| `src/components/ResultsCard.tsx` | Results display component |
| `src/App.tsx` | Updated with full integration |
| `src/main.tsx` | Simplified entry point |

---

## Field Mapping Reference

Read `docs-source/API_SPECIFICATION.md` for authoritative field names.

| Backend (snake_case) | Frontend (camelCase) | Unit | Display Format |
|----------------------|----------------------|------|----------------|
| `flow_rate_ratio` | `flowRateRatio` | ratio | "X:1" |
| `total_flow_rate` | `totalFlowRate` | mL/min | "X.XX mL/min" |
| `particle_predicted_size` | `particlePredictedSize` | nm | "X.XX nm" |
| `pdi` | `pdi` | index | "X.XX" |
| `encapsulation_efficiency` | `encapsulationEfficiency` | % | "X.X%" |
| `post_process` | `postProcess` | text | Full text |
| `reasoning` | `reasoning` | text | Full text |

---

## Next Phase

Proceed to **FRD-F6: Integration Testing** for final verification.
