# FRD-F4: Form Implementation

## Phase Overview

| Attribute | Value |
|-----------|-------|
| **Phase** | F4 |
| **Depends On** | F2, F3 |
| **Blocks** | F5, F6 |

---

## Objective

Create the `FormulationForm` component with React Hook Form, Zod validation, and all three input sections.

---

## Source Documents

| Document | What to Extract |
|----------|-----------------|
| `/docs-source/FRONTEND_ARCHITECTURE.md` | Component structure, form fields, state management |
| `/docs-source/API_SPECIFICATION.md` | Field names and labels |

---

## Form Structure (from FRONTEND_ARCHITECTURE.md)

```
FormulationForm
├── OrganicPhaseSection (Lipid Formulation)
│   ├── LipidCompositionSelect
│   ├── LipidConcentrationInput
│   └── SolventTypeDisplay (read-only)
├── AqueousPhaseSection (Payload)
│   ├── PayloadTypeSelect
│   ├── PayloadConcentrationInput
│   └── BufferTypeSelect
├── ProcessTargetSection (Target Parameters)
│   └── NpRatioInput
└── SubmitButton
```

---

## Tasks

### Task 4.1: Create FormulationForm Component

**File: `src/components/FormulationForm.tsx`**

```tsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Beaker, Dna, Target, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { FormSection } from '@/components/FormSection';
import { FormField } from '@/components/FormField';

import { formulationSchema, FormulationSchemaType, defaultFormValues } from '@/lib/schemas';
import { 
  LIPID_COMPOSITIONS, 
  PAYLOAD_TYPES, 
  BUFFER_TYPES, 
  SOLVENT_TYPE,
} from '@/types/formulation';

interface FormulationFormProps {
  onSubmit: (data: FormulationSchemaType) => Promise<void>;
  isLoading: boolean;
  children?: React.ReactNode;
}

export function FormulationForm({ 
  onSubmit, 
  isLoading, 
  children 
}: FormulationFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormulationSchemaType>({
    resolver: zodResolver(formulationSchema),
    defaultValues: defaultFormValues,
  });

  const handleFormSubmit = async (data: FormulationSchemaType) => {
    await onSubmit(data);
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Form Sections */}
          <div className="space-y-6">
            {/* Section 1: Lipid Formulation */}
            <FormSection
              title="Lipid Formulation"
              description="Configure lipid composition and concentration"
              icon={<Beaker className="w-5 h-5" />}
              delay={0}
            >
              <FormField 
                label="Lipid Composition" 
                error={errors.lipidComposition?.message}
              >
                <Controller
                  name="lipidComposition"
                  control={control}
                  render={({ field }) => (
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select composition" />
                      </SelectTrigger>
                      <SelectContent>
                        {LIPID_COMPOSITIONS.map((composition) => (
                          <SelectItem key={composition} value={composition}>
                            {composition}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              <FormField 
                label="Lipid Concentration" 
                unit="mM"
                error={errors.lipidConcentration?.message}
              >
                <Input
                  type="number"
                  step="0.1"
                  placeholder="10.0 - 50.0"
                  {...register('lipidConcentration', { valueAsNumber: true })}
                />
              </FormField>

              <FormField label="Solvent Type">
                <Input
                  value={SOLVENT_TYPE}
                  disabled
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
              </FormField>
            </FormSection>

            {/* Section 2: Payload */}
            <FormSection
              title="Payload"
              description="Define payload type and concentration"
              icon={<Dna className="w-5 h-5" />}
              delay={100}
            >
              <FormField 
                label="Payload Type" 
                error={errors.payloadType?.message}
              >
                <Controller
                  name="payloadType"
                  control={control}
                  render={({ field }) => (
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payload type" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYLOAD_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              <FormField 
                label="Payload Concentration" 
                unit="mg/mL"
                error={errors.payloadConcentration?.message}
              >
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.0 - 1.0"
                  {...register('payloadConcentration', { valueAsNumber: true })}
                />
              </FormField>

              <FormField 
                label="Buffer Type" 
                error={errors.bufferType?.message}
              >
                <Controller
                  name="bufferType"
                  control={control}
                  render={({ field }) => (
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select buffer type" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUFFER_TYPES.map((buffer) => (
                          <SelectItem key={buffer} value={buffer}>
                            {buffer}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
            </FormSection>

            {/* Section 3: Target Parameters */}
            <FormSection
              title="Target Parameters"
              description="Set optimization targets"
              icon={<Target className="w-5 h-5" />}
              delay={200}
            >
              <FormField 
                label="Target N/P Ratio" 
                error={errors.targetNpRatio?.message}
              >
                <Input
                  type="number"
                  step="1"
                  placeholder="4 - 20"
                  {...register('targetNpRatio', { valueAsNumber: true })}
                />
              </FormField>
            </FormSection>

            {/* Submit Button */}
            <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
              <Button 
                type="submit" 
                variant="scientific" 
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Optimizing...
                  </>
                ) : (
                  'Calculate Optimal Parameters'
                )}
              </Button>
            </div>
          </div>

          {/* Right Column: Results (passed as children) */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            {children}
          </div>
        </div>
      </form>
    </div>
  );
}
```

---

## Verification

Update `src/App.tsx`:

```tsx
import { useState } from 'react';
import { Header } from '@/components/Header';
import { FormulationForm } from '@/components/FormulationForm';
import { EmptyState } from '@/components/EmptyState';
import { FormulationSchemaType } from '@/lib/schemas';

function App() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: FormulationSchemaType) => {
    console.log('Form submitted:', data);
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen gradient-surface molecular-pattern">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-10 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            LNP Formulation Optimizer
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            AI-powered flow parameter recommendations for lipid nanoparticle synthesis.
          </p>
        </div>

        <FormulationForm onSubmit={handleSubmit} isLoading={isLoading}>
          <EmptyState />
        </FormulationForm>
      </main>
    </div>
  );
}

export default App;
```

Run `pnpm dev` and verify:

1. ✅ Three sections display with correct icons
2. ✅ All 7 fields render
3. ✅ Dropdowns show correct options
4. ✅ Solvent field is disabled
5. ✅ Validation errors appear on invalid input
6. ✅ Submit button shows loading state
7. ✅ Form data logs to console

### Validation Test Cases

| Test | Input | Expected Error |
|------|-------|----------------|
| Lipid concentration too low | 5 | "Must be at least 10.0 mM" |
| Lipid concentration too high | 60 | "Must be at most 50.0 mM" |
| N/P ratio not integer | 4.5 | "Must be a whole number" |
| N/P ratio too low | 2 | "Must be at least 4" |
| N/P ratio too high | 25 | "Must be at most 20" |
| Payload concentration negative | -0.1 | "Must be at least 0.0 mg/mL" |
| Payload concentration zero | 0.0 | **No error** (valid for control) |

---

## Acceptance Criteria

- [ ] Form has 3 sections with Beaker, Dna, Target icons
- [ ] All 7 fields render with labels and units
- [ ] Dropdowns show options from constants
- [ ] Solvent field is disabled, shows "Ethanol 99%"
- [ ] Validation errors display inline
- [ ] Submit button shows loading state
- [ ] `payloadConcentration: 0.0` is accepted
- [ ] No TypeScript errors

---

## Files Created

| File | Purpose |
|------|---------|
| `src/components/FormulationForm.tsx` | Main form component |

---

## Next Phase

Proceed to **FRD-F5: API Client + Results**
